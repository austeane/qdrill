## Phase 2: Seasons and Active Constraint - Implementation Ticket

### Overview
Implement Season entities per team with constraint of one active season at a time. Seasons hold template practice plan reference, date ranges, and share tokens.

### Prerequisites
- Phase 1 completed (Teams and team members working)
- Practice plans table exists
- User authentication working

### Database Changes

#### Migration: `migrations/[timestamp]_create_seasons.js`
```javascript
exports.up = (pgm) => {
  // Create seasons table
  pgm.createTable('seasons', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    team_id: { type: 'uuid', notNull: true, references: 'teams(id)', onDelete: 'CASCADE' },
    name: { type: 'varchar(255)', notNull: true },
    start_date: { type: 'date', notNull: true },
    end_date: { type: 'date', notNull: true },
    is_active: { type: 'boolean', default: false, notNull: true },
    template_practice_plan_id: { type: 'integer', references: 'practice_plans(id)', onDelete: 'SET NULL' },
    public_view_token: { type: 'uuid', default: pgm.func('gen_random_uuid()') },
    ics_token: { type: 'uuid', default: pgm.func('gen_random_uuid()') },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
    updated_at: { type: 'timestamp', default: pgm.func('now()') }
  });
  
  // Indexes
  pgm.createIndex('seasons', 'team_id');
  pgm.createIndex('seasons', ['team_id', 'is_active']);
  
  // Partial unique index for one active season per team
  pgm.createIndex('seasons', 'team_id', {
    unique: true,
    where: 'is_active = true',
    name: 'seasons_one_active_per_team'
  });
  
  // Add columns to practice_plans for template support
  pgm.addColumns('practice_plans', {
    is_template: { type: 'boolean', default: false },
    team_id: { type: 'uuid', references: 'teams(id)', onDelete: 'CASCADE' }
  });
  
  pgm.createIndex('practice_plans', ['team_id', 'is_template']);
};

exports.down = (pgm) => {
  pgm.dropColumns('practice_plans', ['is_template', 'team_id']);
  pgm.dropTable('seasons');
};
```

### Backend Implementation

#### 1. Season Service (`src/lib/server/services/seasonService.js`)
```javascript
import { BaseEntityService } from './baseEntityService';
import { ValidationError, DatabaseError } from '$lib/server/errors';
import { teamMemberService } from './teamMemberService';

class SeasonService extends BaseEntityService {
  constructor() {
    super(
      'seasons',
      'id',
      ['id', 'team_id', 'name', 'start_date', 'end_date', 'is_active', 
       'template_practice_plan_id', 'public_view_token', 'ics_token', 
       'created_at', 'updated_at'],
      ['id', 'team_id', 'name', 'start_date', 'end_date', 'is_active',
       'template_practice_plan_id', 'public_view_token', 'ics_token',
       'created_at', 'updated_at']
    );
  }

  async create(data, userId) {
    // Verify user is team admin
    const member = await teamMemberService.getMember(data.team_id, userId);
    if (!member || member.role !== 'admin') {
      throw new ValidationError('Only team admins can create seasons');
    }
    
    // Validate dates
    if (new Date(data.start_date) >= new Date(data.end_date)) {
      throw new ValidationError('Start date must be before end date');
    }
    
    // If setting as active, deactivate other seasons
    if (data.is_active) {
      await this.deactivateTeamSeasons(data.team_id);
    }
    
    return await super.create(data);
  }

  async update(id, data, userId) {
    const season = await this.getById(id);
    
    // Verify user is team admin
    const member = await teamMemberService.getMember(season.team_id, userId);
    if (!member || member.role !== 'admin') {
      throw new ValidationError('Only team admins can update seasons');
    }
    
    // If setting as active, deactivate other seasons
    if (data.is_active && !season.is_active) {
      await this.deactivateTeamSeasons(season.team_id, id);
    }
    
    // Validate dates if provided
    if (data.start_date || data.end_date) {
      const startDate = data.start_date || season.start_date;
      const endDate = data.end_date || season.end_date;
      if (new Date(startDate) >= new Date(endDate)) {
        throw new ValidationError('Start date must be before end date');
      }
    }
    
    return await super.update(id, data);
  }

  async getActiveSeason(teamId) {
    const result = await this.getAll({
      filters: { team_id: teamId, is_active: true },
      limit: 1
    });
    return result.items[0] || null;
  }

  async getTeamSeasons(teamId, userId) {
    // Verify user is team member
    const member = await teamMemberService.getMember(teamId, userId);
    if (!member) {
      throw new ValidationError('Only team members can view seasons');
    }
    
    const result = await this.getAll({
      filters: { team_id: teamId },
      sortBy: 'start_date',
      sortOrder: 'desc',
      all: true
    });
    
    return result.items;
  }

  async deactivateTeamSeasons(teamId, exceptId = null) {
    return await this.withTransaction(async (client) => {
      let query = `
        UPDATE seasons 
        SET is_active = false, updated_at = NOW()
        WHERE team_id = $1 AND is_active = true
      `;
      const params = [teamId];
      
      if (exceptId) {
        query += ' AND id != $2';
        params.push(exceptId);
      }
      
      await client.query(query, params);
    });
  }

  async setActiveSeason(seasonId, userId) {
    const season = await this.getById(seasonId);
    
    // Verify user is team admin
    const member = await teamMemberService.getMember(season.team_id, userId);
    if (!member || member.role !== 'admin') {
      throw new ValidationError('Only team admins can activate seasons');
    }
    
    await this.deactivateTeamSeasons(season.team_id);
    return await super.update(seasonId, { is_active: true });
  }

  async rotatePublicToken(seasonId, userId) {
    const season = await this.getById(seasonId);
    
    // Verify user is team admin
    const member = await teamMemberService.getMember(season.team_id, userId);
    if (!member || member.role !== 'admin') {
      throw new ValidationError('Only team admins can rotate tokens');
    }
    
    return await this.withTransaction(async (client) => {
      const query = `
        UPDATE seasons 
        SET public_view_token = gen_random_uuid(), updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(query, [seasonId]);
      return result.rows[0];
    });
  }

  async rotateIcsToken(seasonId, userId) {
    const season = await this.getById(seasonId);
    
    // Verify user is team admin
    const member = await teamMemberService.getMember(season.team_id, userId);
    if (!member || member.role !== 'admin') {
      throw new ValidationError('Only team admins can rotate tokens');
    }
    
    return await this.withTransaction(async (client) => {
      const query = `
        UPDATE seasons 
        SET ics_token = gen_random_uuid(), updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(query, [seasonId]);
      return result.rows[0];
    });
  }

  async getByPublicToken(token) {
    const result = await this.getAll({
      filters: { public_view_token: token },
      limit: 1
    });
    return result.items[0] || null;
  }

  async getByIcsToken(token) {
    const result = await this.getAll({
      filters: { ics_token: token },
      limit: 1
    });
    return result.items[0] || null;
  }
}

export const seasonService = new SeasonService();
```

#### 2. Validation Schema (`src/lib/validation/seasonSchema.ts`)
```typescript
import { z } from 'zod';

export const createSeasonSchema = z.object({
  team_id: z.string().uuid(),
  name: z.string().min(3).max(100),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_active: z.boolean().default(false),
  template_practice_plan_id: z.number().nullable().optional()
}).refine(data => {
  return new Date(data.start_date) < new Date(data.end_date);
}, {
  message: "Start date must be before end date",
  path: ["end_date"]
});

export const updateSeasonSchema = createSeasonSchema.partial().omit({ team_id: true });
```

### API Routes

#### 1. Team Seasons List/Create (`src/routes/api/teams/[teamId]/seasons/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService';
import { requireTeamAdmin, requireTeamMember } from '$lib/server/auth/teamPermissions';
import { createSeasonSchema } from '$lib/validation/seasonSchema';

export async function GET({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    await requireTeamMember(params.teamId, locals.user.id);
    const seasons = await seasonService.getTeamSeasons(params.teamId, locals.user.id);
    return json(seasons);
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function POST({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    await requireTeamAdmin(params.teamId, locals.user.id);
    
    const data = await request.json();
    const validated = createSeasonSchema.parse({
      ...data,
      team_id: params.teamId
    });
    
    const season = await seasonService.create(validated, locals.user.id);
    return json(season, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

#### 2. Season CRUD (`src/routes/api/seasons/[seasonId]/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService';
import { updateSeasonSchema } from '$lib/validation/seasonSchema';

export async function GET({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const season = await seasonService.getById(params.seasonId);
    // User permission check happens in getTeamSeasons
    await seasonService.getTeamSeasons(season.team_id, locals.user.id);
    return json(season);
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function PATCH({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const validated = updateSeasonSchema.parse(data);
    const season = await seasonService.update(params.seasonId, validated, locals.user.id);
    return json(season);
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function DELETE({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const season = await seasonService.getById(params.seasonId);
    // Verify admin through service
    await seasonService.delete(params.seasonId, locals.user.id);
    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

#### 3. Season Share Tokens (`src/routes/api/seasons/[seasonId]/share/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService';

export async function GET({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const season = await seasonService.getById(params.seasonId);
    // Permission check happens in service
    return json({
      public_view_url: `/seasons/${params.seasonId}/view?token=${season.public_view_token}`,
      ics_url: `/api/seasons/${params.seasonId}/calendar.ics?token=${season.ics_token}`,
      public_view_token: season.public_view_token,
      ics_token: season.ics_token
    });
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function POST({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const { type } = await request.json();
    
    let season;
    if (type === 'public') {
      season = await seasonService.rotatePublicToken(params.seasonId, locals.user.id);
    } else if (type === 'ics') {
      season = await seasonService.rotateIcsToken(params.seasonId, locals.user.id);
    } else {
      return json({ error: 'Invalid token type' }, { status: 400 });
    }
    
    return json({
      public_view_url: `/seasons/${params.seasonId}/view?token=${season.public_view_token}`,
      ics_url: `/api/seasons/${params.seasonId}/calendar.ics?token=${season.ics_token}`,
      public_view_token: season.public_view_token,
      ics_token: season.ics_token
    });
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

### Frontend Implementation

#### 1. Season Dashboard (`src/routes/teams/[teamId]/season/+page.svelte`)
```svelte
<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import SeasonTemplatePicker from '$lib/components/season/SeasonTemplatePicker.svelte';
  
  export let data;
  
  let seasons = data.seasons || [];
  let activeSeason = seasons.find(s => s.is_active);
  let showCreateModal = false;
  let showTemplateModal = false;
  let selectedSeason = null;
  
  let newSeason = {
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
    template_practice_plan_id: null
  };
  
  async function createSeason() {
    const response = await fetch(`/api/teams/${$page.params.teamId}/seasons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSeason)
    });
    
    if (response.ok) {
      const season = await response.json();
      seasons = [...seasons, season];
      if (season.is_active) {
        activeSeason = season;
      }
      showCreateModal = false;
      resetForm();
    }
  }
  
  async function setActive(seasonId) {
    const response = await fetch(`/api/seasons/${seasonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: true })
    });
    
    if (response.ok) {
      seasons = seasons.map(s => ({
        ...s,
        is_active: s.id === seasonId
      }));
      activeSeason = seasons.find(s => s.id === seasonId);
    }
  }
  
  async function updateTemplate(seasonId, templateId) {
    const response = await fetch(`/api/seasons/${seasonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_practice_plan_id: templateId })
    });
    
    if (response.ok) {
      const updated = await response.json();
      seasons = seasons.map(s => s.id === seasonId ? updated : s);
      if (activeSeason?.id === seasonId) {
        activeSeason = updated;
      }
      showTemplateModal = false;
    }
  }
  
  function resetForm() {
    newSeason = {
      name: '',
      start_date: '',
      end_date: '',
      is_active: false,
      template_practice_plan_id: null
    };
  }
</script>

<div class="container mx-auto p-6">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Season Management</h1>
    {#if data.userRole === 'admin'}
      <button
        on:click={() => showCreateModal = true}
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Create Season
      </button>
    {/if}
  </div>
  
  {#if activeSeason}
    <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
      <div class="flex justify-between items-start">
        <div>
          <h2 class="text-xl font-semibold text-green-800">Active Season</h2>
          <p class="text-2xl font-bold mt-2">{activeSeason.name}</p>
          <p class="text-gray-600 mt-1">
            {new Date(activeSeason.start_date).toLocaleDateString()} - 
            {new Date(activeSeason.end_date).toLocaleDateString()}
          </p>
          {#if activeSeason.template_practice_plan_id}
            <p class="text-sm text-gray-500 mt-2">
              Template Plan ID: {activeSeason.template_practice_plan_id}
            </p>
          {/if}
        </div>
        {#if data.userRole === 'admin'}
          <div class="space-y-2">
            <button
              on:click={() => {
                selectedSeason = activeSeason;
                showTemplateModal = true;
              }}
              class="block w-full text-left px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50"
            >
              {activeSeason.template_practice_plan_id ? 'Change' : 'Set'} Template
            </button>
            <a
              href="/teams/{$page.params.teamId}/season/sections"
              class="block px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
            >
              Manage Sections
            </a>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <p class="text-yellow-800">No active season. Create or activate a season to get started.</p>
    </div>
  {/if}
  
  <h2 class="text-xl font-semibold mb-4">All Seasons</h2>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each seasons.filter(s => !s.is_active) as season}
      <div class="border rounded-lg p-4">
        <h3 class="font-semibold">{season.name}</h3>
        <p class="text-sm text-gray-600 mt-1">
          {new Date(season.start_date).toLocaleDateString()} - 
          {new Date(season.end_date).toLocaleDateString()}
        </p>
        {#if data.userRole === 'admin'}
          <div class="mt-4 space-x-2">
            <button
              on:click={() => setActive(season.id)}
              class="text-blue-500 hover:underline text-sm"
            >
              Set Active
            </button>
            <button
              on:click={() => {
                selectedSeason = season;
                showTemplateModal = true;
              }}
              class="text-gray-500 hover:underline text-sm"
            >
              Set Template
            </button>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<!-- Create Season Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full">
      <h2 class="text-2xl font-bold mb-4">Create Season</h2>
      
      <input
        bind:value={newSeason.name}
        placeholder="Season Name (e.g., Spring 2024)"
        class="w-full p-2 border rounded mb-3"
      />
      
      <label class="block mb-3">
        <span class="text-gray-700">Start Date</span>
        <input
          type="date"
          bind:value={newSeason.start_date}
          class="mt-1 block w-full p-2 border rounded"
        />
      </label>
      
      <label class="block mb-3">
        <span class="text-gray-700">End Date</span>
        <input
          type="date"
          bind:value={newSeason.end_date}
          class="mt-1 block w-full p-2 border rounded"
        />
      </label>
      
      <label class="flex items-center mb-4">
        <input
          type="checkbox"
          bind:checked={newSeason.is_active}
          class="mr-2"
        />
        <span>Set as active season</span>
      </label>
      
      <div class="flex justify-end space-x-2">
        <button
          on:click={() => {
            showCreateModal = false;
            resetForm();
          }}
          class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
        <button
          on:click={createSeason}
          disabled={!newSeason.name || !newSeason.start_date || !newSeason.end_date}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Template Picker Modal -->
{#if showTemplateModal && selectedSeason}
  <SeasonTemplatePicker
    seasonId={selectedSeason.id}
    currentTemplateId={selectedSeason.template_practice_plan_id}
    on:select={e => updateTemplate(selectedSeason.id, e.detail.templateId)}
    on:close={() => showTemplateModal = false}
  />
{/if}
```

#### 2. Season Page Server (`src/routes/teams/[teamId]/season/+page.server.js`)
```javascript
import { redirect } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService';
import { getTeamRole } from '$lib/server/auth/teamPermissions';

export async function load({ locals, params }) {
  if (!locals.user) {
    throw redirect(302, '/login');
  }
  
  const userRole = await getTeamRole(params.teamId, locals.user.id);
  if (!userRole) {
    throw redirect(302, '/teams');
  }
  
  const seasons = await seasonService.getTeamSeasons(params.teamId, locals.user.id);
  
  return {
    seasons,
    userRole
  };
}
```

#### 3. Template Picker Component (`src/lib/components/season/SeasonTemplatePicker.svelte`)
```svelte
<script>
  import { createEventDispatcher } from 'svelte';
  import { page } from '$app/stores';
  
  export let seasonId;
  export let currentTemplateId;
  
  const dispatch = createEventDispatcher();
  
  let templates = [];
  let selectedTemplateId = currentTemplateId;
  let loading = true;
  
  async function loadTemplates() {
    const response = await fetch(`/api/practice-plans?team_id=${$page.params.teamId}&is_template=true`);
    if (response.ok) {
      const data = await response.json();
      templates = data.items || [];
    }
    loading = false;
  }
  
  function selectTemplate() {
    dispatch('select', { templateId: selectedTemplateId });
  }
  
  function close() {
    dispatch('close');
  }
  
  loadTemplates();
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
    <h2 class="text-2xl font-bold mb-4">Select Season Template</h2>
    
    {#if loading}
      <p class="text-gray-500">Loading templates...</p>
    {:else if templates.length === 0}
      <p class="text-gray-500 mb-4">No template practice plans found.</p>
      <p class="text-sm text-gray-600">
        Create a practice plan and mark it as a template to use it here.
      </p>
    {:else}
      <div class="space-y-3 mb-6">
        <label class="block border rounded p-3 hover:bg-gray-50 cursor-pointer">
          <input
            type="radio"
            bind:group={selectedTemplateId}
            value={null}
            class="mr-2"
          />
          <span class="font-medium">No Template</span>
          <span class="text-sm text-gray-500 ml-2">(Start from scratch)</span>
        </label>
        
        {#each templates as template}
          <label class="block border rounded p-3 hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              bind:group={selectedTemplateId}
              value={template.id}
              class="mr-2"
            />
            <span class="font-medium">{template.name}</span>
            {#if template.description}
              <p class="text-sm text-gray-600 mt-1 ml-6">{template.description}</p>
            {/if}
          </label>
        {/each}
      </div>
    {/if}
    
    <div class="flex justify-end space-x-2">
      <button
        on:click={close}
        class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
      >
        Cancel
      </button>
      <button
        on:click={selectTemplate}
        disabled={loading}
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        Select
      </button>
    </div>
  </div>
</div>
```

### Testing

#### Service Test (`src/lib/server/services/__tests__/seasonService.test.js`)
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { seasonService } from '../seasonService';
import { teamService } from '../teamService';
import { teamMemberService } from '../teamMemberService';

describe('SeasonService', () => {
  let testTeam;
  let testUserId = 'test-user-123';
  
  beforeEach(async () => {
    // Create test team with user as admin
    testTeam = await teamService.create({
      name: 'Test Team',
      timezone: 'America/New_York'
    }, testUserId);
  });
  
  it('should create a season', async () => {
    const seasonData = {
      team_id: testTeam.id,
      name: 'Spring 2024',
      start_date: '2024-03-01',
      end_date: '2024-05-31',
      is_active: true
    };
    
    const season = await seasonService.create(seasonData, testUserId);
    
    expect(season.name).toBe(seasonData.name);
    expect(season.team_id).toBe(testTeam.id);
    expect(season.is_active).toBe(true);
    expect(season.public_view_token).toBeDefined();
    expect(season.ics_token).toBeDefined();
  });
  
  it('should enforce one active season per team', async () => {
    // Create first season as active
    const season1 = await seasonService.create({
      team_id: testTeam.id,
      name: 'Spring 2024',
      start_date: '2024-03-01',
      end_date: '2024-05-31',
      is_active: true
    }, testUserId);
    
    // Create second season as active
    const season2 = await seasonService.create({
      team_id: testTeam.id,
      name: 'Summer 2024',
      start_date: '2024-06-01',
      end_date: '2024-08-31',
      is_active: true
    }, testUserId);
    
    // Refresh first season
    const updated1 = await seasonService.getById(season1.id);
    
    expect(updated1.is_active).toBe(false);
    expect(season2.is_active).toBe(true);
  });
  
  it('should validate date ranges', async () => {
    await expect(seasonService.create({
      team_id: testTeam.id,
      name: 'Invalid Season',
      start_date: '2024-05-31',
      end_date: '2024-03-01',
      is_active: false
    }, testUserId)).rejects.toThrow('Start date must be before end date');
  });
  
  it('should only allow team admins to create seasons', async () => {
    const memberUserId = 'member-user-456';
    await teamMemberService.addMember(testTeam.id, memberUserId, 'member');
    
    await expect(seasonService.create({
      team_id: testTeam.id,
      name: 'Spring 2024',
      start_date: '2024-03-01',
      end_date: '2024-05-31'
    }, memberUserId)).rejects.toThrow('Only team admins can create seasons');
  });
  
  it('should rotate tokens', async () => {
    const season = await seasonService.create({
      team_id: testTeam.id,
      name: 'Spring 2024',
      start_date: '2024-03-01',
      end_date: '2024-05-31'
    }, testUserId);
    
    const originalPublicToken = season.public_view_token;
    const originalIcsToken = season.ics_token;
    
    const rotated1 = await seasonService.rotatePublicToken(season.id, testUserId);
    expect(rotated1.public_view_token).not.toBe(originalPublicToken);
    expect(rotated1.ics_token).toBe(originalIcsToken);
    
    const rotated2 = await seasonService.rotateIcsToken(season.id, testUserId);
    expect(rotated2.public_view_token).toBe(rotated1.public_view_token);
    expect(rotated2.ics_token).not.toBe(originalIcsToken);
  });
});
```

### Acceptance Criteria
- [ ] Seasons table created with proper constraints
- [ ] One active season per team constraint enforced
- [ ] Practice plans table extended with template support
- [ ] Team admins can create/update/delete seasons
- [ ] Team members can view seasons but not modify
- [ ] Seasons have unique public view and ICS tokens
- [ ] Tokens can be rotated by admins
- [ ] Date validation ensures start < end
- [ ] Active season can be switched by admins
- [ ] Template practice plan can be assigned to season
- [ ] Season dashboard shows active season prominently
- [ ] All API endpoints have proper auth checks
- [ ] Tests pass for all season operations

### Dependencies
- Phase 1 must be complete (Teams and permissions)
- Practice plans table exists
- User authentication working

### Notes
- Tokens are UUIDs generated by PostgreSQL
- Template practice plans are regular plans with is_template=true
- Only one season can be active per team at any time
- Public view and ICS implementation comes in Phase 7