## Phase 1: Teams and Permissions - Implementation Ticket

### Overview
Implement first-class Team entities with membership roles (admin/member) and team settings (timezone, default practice start time). Teams table already exists but needs to be extended.

### Prerequisites
- Existing auth system (Better Auth) working
- User sessions available via `locals.user`
- Database connection configured

### Database Changes

#### Migration: `migrations/[timestamp]_extend_teams_add_members.js`
```javascript
exports.up = (pgm) => {
  // Extend existing teams table
  pgm.addColumns('teams', {
    slug: { type: 'varchar(255)', unique: true, notNull: true },
    default_start_time: { type: 'time', default: '09:00:00' },
    timezone: { type: 'varchar(100)', default: 'America/New_York', notNull: true },
    created_by: { type: 'text', references: 'users(id)', onDelete: 'SET NULL' }
  });
  
  // Create team_members table
  pgm.createTable('team_members', {
    team_id: { type: 'uuid', references: 'teams(id)', onDelete: 'CASCADE', notNull: true },
    user_id: { type: 'text', references: 'users(id)', onDelete: 'CASCADE', notNull: true },
    role: { type: 'varchar(20)', notNull: true, default: 'member' },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
    updated_at: { type: 'timestamp', default: pgm.func('now()') }
  });
  
  // Indexes
  pgm.createIndex('teams', 'slug');
  pgm.createIndex('team_members', 'team_id');
  pgm.createIndex('team_members', 'user_id');
  pgm.addConstraint('team_members', 'team_members_unique', {
    unique: ['team_id', 'user_id']
  });
};

exports.down = (pgm) => {
  pgm.dropTable('team_members');
  pgm.dropColumns('teams', ['slug', 'default_start_time', 'timezone', 'created_by']);
};
```

### Backend Implementation

#### 1. Team Permissions (`src/lib/server/auth/teamPermissions.js`)
```javascript
import { error } from '@sveltejs/kit';
import { teamMemberService } from '$lib/server/services/teamMemberService';

export async function requireTeamAdmin(teamId, userId) {
  if (!userId) throw error(401, 'Authentication required');
  const member = await teamMemberService.getMember(teamId, userId);
  if (!member || member.role !== 'admin') {
    throw error(403, 'Team admin access required');
  }
  return member;
}

export async function requireTeamMember(teamId, userId) {
  if (!userId) throw error(401, 'Authentication required');
  const member = await teamMemberService.getMember(teamId, userId);
  if (!member) throw error(403, 'Team member access required');
  return member;
}

export async function getTeamRole(teamId, userId) {
  if (!userId) return null;
  const member = await teamMemberService.getMember(teamId, userId);
  return member?.role || null;
}
```

#### 2. Team Service (`src/lib/server/services/teamService.js`)
```javascript
import { BaseEntityService } from './baseEntityService';
import { teamMemberService } from './teamMemberService';
import { ValidationError } from '$lib/server/errors';

class TeamService extends BaseEntityService {
  constructor() {
    super(
      'teams',
      'id',
      ['id', 'name', 'slug', 'description', 'default_start_time', 'timezone', 'created_at', 'updated_at'],
      ['id', 'name', 'slug', 'description', 'default_start_time', 'timezone', 'created_by', 'created_at', 'updated_at']
    );
  }

  async create(data, userId) {
    // Generate slug from name if not provided
    if (!data.slug) {
      data.slug = this.generateSlug(data.name);
    }
    
    // Validate slug uniqueness
    const existing = await this.getBySlug(data.slug);
    if (existing) {
      throw new ValidationError('Team slug already exists');
    }
    
    // Create team with creator as admin
    const team = await super.create({ ...data, created_by: userId });
    
    // Add creator as admin member
    await teamMemberService.addMember(team.id, userId, 'admin');
    
    return team;
  }

  async getBySlug(slug) {
    const result = await this.getAll({
      filters: { slug },
      limit: 1
    });
    return result.items[0] || null;
  }

  async getUserTeams(userId) {
    // Get all teams where user is a member
    const memberships = await teamMemberService.getUserMemberships(userId);
    const teamIds = memberships.map(m => m.team_id);
    
    if (teamIds.length === 0) return [];
    
    const result = await this.getAll({
      filters: { id__in: teamIds },
      all: true
    });
    
    // Attach role to each team
    return result.items.map(team => ({
      ...team,
      role: memberships.find(m => m.team_id === team.id)?.role
    }));
  }

  generateSlug(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }
}

export const teamService = new TeamService();
```

#### 3. Team Member Service (`src/lib/server/services/teamMemberService.js`)
```javascript
import { BaseEntityService } from './baseEntityService';
import { ForbiddenError, ValidationError } from '$lib/server/errors';

class TeamMemberService extends BaseEntityService {
  constructor() {
    super(
      'team_members',
      null, // No single primary key
      ['team_id', 'user_id', 'role', 'created_at', 'updated_at'],
      ['team_id', 'user_id', 'role', 'created_at', 'updated_at']
    );
  }

  async getMember(teamId, userId) {
    const result = await this.getAll({
      filters: { team_id: teamId, user_id: userId },
      limit: 1
    });
    return result.items[0] || null;
  }

  async getTeamMembers(teamId) {
    const result = await this.getAll({
      filters: { team_id: teamId },
      all: true
    });
    return result.items;
  }

  async getUserMemberships(userId) {
    const result = await this.getAll({
      filters: { user_id: userId },
      all: true
    });
    return result.items;
  }

  async addMember(teamId, userId, role = 'member') {
    // Check if already a member
    const existing = await this.getMember(teamId, userId);
    if (existing) {
      throw new ValidationError('User is already a team member');
    }
    
    return await this.create({
      team_id: teamId,
      user_id: userId,
      role
    });
  }

  async updateRole(teamId, userId, newRole, requestingUserId) {
    // Check requester is admin
    const requester = await this.getMember(teamId, requestingUserId);
    if (!requester || requester.role !== 'admin') {
      throw new ForbiddenError('Only team admins can update roles');
    }
    
    // Can't change last admin to member
    if (userId === requestingUserId && newRole === 'member') {
      const admins = await this.getAll({
        filters: { team_id: teamId, role: 'admin' },
        all: true
      });
      if (admins.items.length === 1) {
        throw new ValidationError('Cannot remove the last admin');
      }
    }
    
    // Update role
    return await this.withTransaction(async (client) => {
      const query = `
        UPDATE team_members 
        SET role = $1, updated_at = NOW()
        WHERE team_id = $2 AND user_id = $3
        RETURNING *
      `;
      const result = await client.query(query, [newRole, teamId, userId]);
      return result.rows[0];
    });
  }

  async removeMember(teamId, userId, requestingUserId) {
    // Check requester is admin (unless removing self)
    if (userId !== requestingUserId) {
      const requester = await this.getMember(teamId, requestingUserId);
      if (!requester || requester.role !== 'admin') {
        throw new ForbiddenError('Only team admins can remove members');
      }
    }
    
    // Can't remove last admin
    const member = await this.getMember(teamId, userId);
    if (member?.role === 'admin') {
      const admins = await this.getAll({
        filters: { team_id: teamId, role: 'admin' },
        all: true
      });
      if (admins.items.length === 1) {
        throw new ValidationError('Cannot remove the last admin');
      }
    }
    
    return await this.withTransaction(async (client) => {
      const query = `
        DELETE FROM team_members
        WHERE team_id = $1 AND user_id = $2
        RETURNING team_id, user_id
      `;
      const result = await client.query(query, [teamId, userId]);
      return result.rows[0];
    });
  }
}

export const teamMemberService = new TeamMemberService();
```

#### 4. Validation Schemas (`src/lib/validation/teamSchema.ts`)
```typescript
import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(50).optional(),
  default_start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).default('09:00:00'),
  timezone: z.string().default('America/New_York')
});

export const updateTeamSchema = createTeamSchema.partial();

export const teamMemberSchema = z.object({
  user_id: z.string(),
  role: z.enum(['admin', 'member']).default('member')
});
```

### API Routes

#### 1. Teams List/Create (`src/routes/api/teams/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { teamService } from '$lib/server/services/teamService';
import { createTeamSchema } from '$lib/validation/teamSchema';

export async function GET({ locals, url }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  const teams = await teamService.getUserTeams(locals.user.id);
  return json(teams);
}

export async function POST({ locals, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const validated = createTeamSchema.parse(data);
    const team = await teamService.create(validated, locals.user.id);
    return json(team, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

#### 2. Team CRUD (`src/routes/api/teams/[teamId]/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { teamService } from '$lib/server/services/teamService';
import { requireTeamAdmin, requireTeamMember } from '$lib/server/auth/teamPermissions';
import { updateTeamSchema } from '$lib/validation/teamSchema';

export async function GET({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    await requireTeamMember(params.teamId, locals.user.id);
    const team = await teamService.getById(params.teamId);
    return json(team);
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function PATCH({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    await requireTeamAdmin(params.teamId, locals.user.id);
    const data = await request.json();
    const validated = updateTeamSchema.parse(data);
    const team = await teamService.update(params.teamId, validated);
    return json(team);
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
    await requireTeamAdmin(params.teamId, locals.user.id);
    await teamService.delete(params.teamId);
    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

#### 3. Team Members (`src/routes/api/teams/[teamId]/members/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { teamMemberService } from '$lib/server/services/teamMemberService';
import { userService } from '$lib/server/services/userService';
import { requireTeamAdmin, requireTeamMember } from '$lib/server/auth/teamPermissions';
import { teamMemberSchema } from '$lib/validation/teamSchema';

export async function GET({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    await requireTeamMember(params.teamId, locals.user.id);
    const members = await teamMemberService.getTeamMembers(params.teamId);
    
    // Fetch user details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const user = await userService.getById(member.user_id);
        return {
          ...member,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image
          }
        };
      })
    );
    
    return json(membersWithDetails);
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
    const validated = teamMemberSchema.parse(data);
    const member = await teamMemberService.addMember(
      params.teamId,
      validated.user_id,
      validated.role
    );
    return json(member, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function PATCH({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const { user_id, role } = data;
    
    const member = await teamMemberService.updateRole(
      params.teamId,
      user_id,
      role,
      locals.user.id
    );
    return json(member);
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function DELETE({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const { user_id } = data;
    
    await teamMemberService.removeMember(
      params.teamId,
      user_id,
      locals.user.id
    );
    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

### Frontend Implementation

#### 1. Teams List Page (`src/routes/teams/+page.svelte`)
```svelte
<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  export let data;
  
  let teams = data.teams || [];
  let showCreateModal = false;
  let newTeam = {
    name: '',
    description: '',
    timezone: 'America/New_York',
    default_start_time: '09:00'
  };
  
  async function createTeam() {
    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTeam)
    });
    
    if (response.ok) {
      const team = await response.json();
      goto(`/teams/${team.id}/settings`);
    }
  }
</script>

<div class="container mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6">My Teams</h1>
  
  <button 
    on:click={() => showCreateModal = true}
    class="mb-6 bg-blue-500 text-white px-4 py-2 rounded"
  >
    Create Team
  </button>
  
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each teams as team}
      <div class="border rounded-lg p-4">
        <h2 class="text-xl font-semibold">{team.name}</h2>
        <p class="text-gray-600">{team.description || 'No description'}</p>
        <p class="text-sm text-gray-500 mt-2">Role: {team.role}</p>
        <div class="mt-4 space-x-2">
          <a 
            href="/teams/{team.id}/season" 
            class="text-blue-500 hover:underline"
          >
            View Season
          </a>
          {#if team.role === 'admin'}
            <a 
              href="/teams/{team.id}/settings" 
              class="text-gray-500 hover:underline"
            >
              Settings
            </a>
          {/if}
        </div>
      </div>
    {/each}
  </div>
  
  {#if teams.length === 0}
    <p class="text-gray-500">You're not a member of any teams yet.</p>
  {/if}
</div>

{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div class="bg-white rounded-lg p-6 max-w-md w-full">
      <h2 class="text-2xl font-bold mb-4">Create Team</h2>
      
      <input
        bind:value={newTeam.name}
        placeholder="Team Name"
        class="w-full p-2 border rounded mb-3"
      />
      
      <textarea
        bind:value={newTeam.description}
        placeholder="Description (optional)"
        class="w-full p-2 border rounded mb-3"
        rows="3"
      />
      
      <label class="block mb-3">
        <span class="text-gray-700">Timezone</span>
        <select 
          bind:value={newTeam.timezone}
          class="mt-1 block w-full p-2 border rounded"
        >
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="Europe/London">UK Time</option>
          <option value="Europe/Paris">Central European Time</option>
        </select>
      </label>
      
      <label class="block mb-4">
        <span class="text-gray-700">Default Practice Start Time</span>
        <input
          type="time"
          bind:value={newTeam.default_start_time}
          class="mt-1 block w-full p-2 border rounded"
        />
      </label>
      
      <div class="flex justify-end space-x-2">
        <button
          on:click={() => showCreateModal = false}
          class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
        <button
          on:click={createTeam}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create
        </button>
      </div>
    </div>
  </div>
{/if}
```

#### 2. Teams Page Server (`src/routes/teams/+page.server.js`)
```javascript
import { redirect } from '@sveltejs/kit';
import { teamService } from '$lib/server/services/teamService';

export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(302, '/login');
  }
  
  const teams = await teamService.getUserTeams(locals.user.id);
  
  return {
    teams
  };
}
```

### Testing

#### Service Test Example (`src/lib/server/services/__tests__/teamService.test.js`)
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { teamService } from '../teamService';
import { teamMemberService } from '../teamMemberService';

describe('TeamService', () => {
  const testUserId = 'test-user-123';
  
  beforeEach(async () => {
    // Clean up test data
    // Implementation depends on test database setup
  });
  
  it('should create a team with creator as admin', async () => {
    const teamData = {
      name: 'Test Team',
      description: 'A test team',
      timezone: 'America/New_York'
    };
    
    const team = await teamService.create(teamData, testUserId);
    
    expect(team.name).toBe(teamData.name);
    expect(team.slug).toBe('test-team');
    expect(team.created_by).toBe(testUserId);
    
    // Verify creator is admin
    const member = await teamMemberService.getMember(team.id, testUserId);
    expect(member.role).toBe('admin');
  });
  
  it('should generate unique slugs', () => {
    const slug1 = teamService.generateSlug('Test Team!');
    const slug2 = teamService.generateSlug('Test  Team');
    
    expect(slug1).toBe('test-team');
    expect(slug2).toBe('test-team');
  });
  
  it('should get user teams with roles', async () => {
    // Create test team
    const team = await teamService.create(
      { name: 'User Teams Test' },
      testUserId
    );
    
    const userTeams = await teamService.getUserTeams(testUserId);
    
    expect(userTeams).toHaveLength(1);
    expect(userTeams[0].id).toBe(team.id);
    expect(userTeams[0].role).toBe('admin');
  });
});
```

### Acceptance Criteria
- [ ] Teams table extended with new columns
- [ ] Team members table created with proper constraints
- [ ] Users can create teams and become admin automatically
- [ ] Team admins can add/remove members and change roles
- [ ] Team members can view team details but not modify
- [ ] Cannot remove last admin from team
- [ ] Teams have unique slugs for URL routing
- [ ] Timezone and default start time are configurable
- [ ] All API endpoints return proper error codes
- [ ] Tests pass for all services and API routes

### Notes
- Teams table already exists, only needs extension
- Use existing Better Auth session management
- Follow existing error handling patterns
- Maintain consistency with BaseEntityService patterns

