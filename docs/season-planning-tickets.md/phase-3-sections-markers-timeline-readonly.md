## Phase 3: Sections, Markers, and Timeline - Implementation Ticket

### Overview
Implement Season Sections (date-ranged focus areas with default practice content), Season Markers (events/milestones), and a read-only timeline visualization for team members and public viewing via token.

### Prerequisites
- Phase 2 completed (Seasons with active constraint working)
- Practice plans, drills, and formations tables exist
- Team-based permissions working

### Database Changes

#### Migration: `migrations/[timestamp]_create_season_sections_and_markers.js`
```javascript
exports.up = (pgm) => {
  // Create season_sections table
  pgm.createTable('season_sections', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    season_id: { type: 'uuid', notNull: true, references: 'seasons(id)', onDelete: 'CASCADE' },
    name: { type: 'varchar(255)', notNull: true },
    start_date: { type: 'date', notNull: true },
    end_date: { type: 'date', notNull: true },
    notes: { type: 'text' },
    overview_visible_to_members: { type: 'boolean', default: true, notNull: true },
    display_order: { type: 'integer', notNull: true, default: 0 },
    color: { type: 'varchar(50)', default: 'blue' },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
    updated_at: { type: 'timestamp', default: pgm.func('now()') }
  });
  
  // Create season_section_default_sections table (default practice plan sections)
  pgm.createTable('season_section_default_sections', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    season_section_id: { type: 'uuid', notNull: true, references: 'season_sections(id)', onDelete: 'CASCADE' },
    section_name: { type: 'varchar(255)', notNull: true },
    order: { type: 'integer', notNull: true, default: 0 },
    goals: { type: 'jsonb', default: '[]' },
    notes: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('now()') }
  });
  
  // Create season_section_drills table (linked drills/formations)
  pgm.createTable('season_section_drills', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    season_section_id: { type: 'uuid', notNull: true, references: 'season_sections(id)', onDelete: 'CASCADE' },
    type: { type: 'varchar(10)', notNull: true, check: "type IN ('drill', 'formation', 'break')" },
    drill_id: { type: 'integer', references: 'drills(id)', onDelete: 'CASCADE' },
    formation_id: { type: 'integer', references: 'formations(id)', onDelete: 'CASCADE' },
    name: { type: 'varchar(255)' }, // For custom items or breaks
    default_duration_minutes: { type: 'integer', notNull: true, default: 30 },
    order_in_section: { type: 'integer', notNull: true, default: 0 },
    default_section_id: { type: 'uuid', references: 'season_section_default_sections(id)', onDelete: 'CASCADE' },
    created_at: { type: 'timestamp', default: pgm.func('now()') }
  });
  
  // Create season_markers table
  pgm.createTable('season_markers', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    season_id: { type: 'uuid', notNull: true, references: 'seasons(id)', onDelete: 'CASCADE' },
    type: { type: 'varchar(20)', notNull: true, check: "type IN ('tournament', 'break', 'scrimmage', 'custom')" },
    title: { type: 'varchar(255)', notNull: true },
    notes: { type: 'text' },
    start_date: { type: 'date', notNull: true },
    end_date: { type: 'date' }, // Null for single-day events
    color: { type: 'varchar(50)', default: 'red' },
    visible_to_members: { type: 'boolean', default: true, notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
    updated_at: { type: 'timestamp', default: pgm.func('now()') }
  });
  
  // Indexes
  pgm.createIndex('season_sections', 'season_id');
  pgm.createIndex('season_sections', ['season_id', 'start_date']);
  pgm.createIndex('season_section_default_sections', 'season_section_id');
  pgm.createIndex('season_section_drills', 'season_section_id');
  pgm.createIndex('season_section_drills', 'default_section_id');
  pgm.createIndex('season_markers', 'season_id');
  pgm.createIndex('season_markers', ['season_id', 'start_date']);
  
  // Constraints
  pgm.addConstraint('season_section_drills', 'season_section_drills_reference_check', {
    check: "(type = 'break' OR type = 'drill' AND drill_id IS NOT NULL OR type = 'formation' AND formation_id IS NOT NULL)"
  });
};

exports.down = (pgm) => {
  pgm.dropTable('season_markers');
  pgm.dropTable('season_section_drills');
  pgm.dropTable('season_section_default_sections');
  pgm.dropTable('season_sections');
};
```

### Backend Implementation

#### 1. Season Section Service (`src/lib/server/services/seasonSectionService.js`)
```javascript
import { BaseEntityService } from './baseEntityService';
import { ValidationError, ForbiddenError } from '$lib/server/errors';
import { teamMemberService } from './teamMemberService';
import { seasonService } from './seasonService';

class SeasonSectionService extends BaseEntityService {
  constructor() {
    super(
      'season_sections',
      'id',
      ['id', 'season_id', 'name', 'start_date', 'end_date', 'notes', 
       'overview_visible_to_members', 'display_order', 'color', 
       'created_at', 'updated_at'],
      ['id', 'season_id', 'name', 'start_date', 'end_date', 'notes',
       'overview_visible_to_members', 'display_order', 'color']
    );
  }

  async create(data, userId) {
    // Verify user is team admin via season
    const season = await seasonService.getById(data.season_id);
    const member = await teamMemberService.getMember(season.team_id, userId);
    if (!member || member.role !== 'admin') {
      throw new ForbiddenError('Only team admins can create season sections');
    }
    
    // Validate dates
    if (new Date(data.start_date) > new Date(data.end_date)) {
      throw new ValidationError('Start date must be before or equal to end date');
    }
    
    // Check dates are within season bounds
    if (new Date(data.start_date) < new Date(season.start_date) ||
        new Date(data.end_date) > new Date(season.end_date)) {
      throw new ValidationError('Section dates must be within season dates');
    }
    
    // Auto-assign display order
    if (data.display_order === undefined) {
      const existing = await this.getSeasonSections(data.season_id);
      data.display_order = existing.length;
    }
    
    return await super.create(data);
  }

  async update(id, data, userId) {
    const section = await this.getById(id);
    const season = await seasonService.getById(section.season_id);
    
    // Verify user is team admin
    const member = await teamMemberService.getMember(season.team_id, userId);
    if (!member || member.role !== 'admin') {
      throw new ForbiddenError('Only team admins can update season sections');
    }
    
    // Validate dates if provided
    if (data.start_date || data.end_date) {
      const startDate = data.start_date || section.start_date;
      const endDate = data.end_date || section.end_date;
      
      if (new Date(startDate) > new Date(endDate)) {
        throw new ValidationError('Start date must be before or equal to end date');
      }
      
      if (new Date(startDate) < new Date(season.start_date) ||
          new Date(endDate) > new Date(season.end_date)) {
        throw new ValidationError('Section dates must be within season dates');
      }
    }
    
    return await super.update(id, data);
  }

  async getSeasonSections(seasonId, userId = null) {
    const season = await seasonService.getById(seasonId);
    
    // Check visibility permissions
    if (userId) {
      const member = await teamMemberService.getMember(season.team_id, userId);
      if (!member) {
        throw new ForbiddenError('Only team members can view season sections');
      }
    }
    
    const result = await this.getAll({
      filters: { season_id: seasonId },
      sortBy: 'display_order',
      sortOrder: 'asc',
      all: true
    });
    
    // Filter based on member visibility if not admin
    if (userId) {
      const member = await teamMemberService.getMember(season.team_id, userId);
      if (member && member.role !== 'admin') {
        result.items = result.items.filter(s => s.overview_visible_to_members);
      }
    }
    
    return result.items;
  }

  async getSectionWithDefaults(sectionId, userId = null) {
    const section = await this.getById(sectionId);
    const season = await seasonService.getById(section.season_id);
    
    // Check permissions
    if (userId) {
      const member = await teamMemberService.getMember(season.team_id, userId);
      if (!member) {
        throw new ForbiddenError('Only team members can view section details');
      }
      
      if (member.role !== 'admin' && !section.overview_visible_to_members) {
        throw new ForbiddenError('This section is not visible to members');
      }
    }
    
    // Get default sections and linked drills
    const defaultSections = await this.getDefaultSections(sectionId);
    const linkedDrills = await this.getLinkedDrills(sectionId);
    
    return {
      ...section,
      defaultSections,
      linkedDrills
    };
  }

  async getDefaultSections(sectionId) {
    return await this.withTransaction(async (client) => {
      const query = `
        SELECT * FROM season_section_default_sections
        WHERE season_section_id = $1
        ORDER BY "order" ASC
      `;
      const result = await client.query(query, [sectionId]);
      return result.rows;
    });
  }

  async setDefaultSections(sectionId, sections, userId) {
    const section = await this.getById(sectionId);
    const season = await seasonService.getById(section.season_id);
    
    // Verify admin
    const member = await teamMemberService.getMember(season.team_id, userId);
    if (!member || member.role !== 'admin') {
      throw new ForbiddenError('Only team admins can set default sections');
    }
    
    return await this.withTransaction(async (client) => {
      // Delete existing
      await client.query('DELETE FROM season_section_default_sections WHERE season_section_id = $1', [sectionId]);
      
      // Insert new
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const query = `
          INSERT INTO season_section_default_sections 
          (season_section_id, section_name, "order", goals, notes)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(query, [
          sectionId,
          section.section_name,
          section.order ?? i,
          JSON.stringify(section.goals || []),
          section.notes || null
        ]);
      }
      
      // Return updated list
      const result = await client.query(
        'SELECT * FROM season_section_default_sections WHERE season_section_id = $1 ORDER BY "order"',
        [sectionId]
      );
      return result.rows;
    });
  }

  async getLinkedDrills(sectionId) {
    return await this.withTransaction(async (client) => {
      const query = `
        SELECT 
          ssd.*,
          d.name as drill_name,
          d.brief_description as drill_description,
          f.name as formation_name,
          f.brief_description as formation_description,
          ssds.section_name as default_section_name
        FROM season_section_drills ssd
        LEFT JOIN drills d ON ssd.drill_id = d.id
        LEFT JOIN formations f ON ssd.formation_id = f.id
        LEFT JOIN season_section_default_sections ssds ON ssd.default_section_id = ssds.id
        WHERE ssd.season_section_id = $1
        ORDER BY ssd.order_in_section ASC
      `;
      const result = await client.query(query, [sectionId]);
      return result.rows;
    });
  }

  async setLinkedDrills(sectionId, drills, userId) {
    const section = await this.getById(sectionId);
    const season = await seasonService.getById(section.season_id);
    
    // Verify admin
    const member = await teamMemberService.getMember(season.team_id, userId);
    if (!member || member.role !== 'admin') {
      throw new ForbiddenError('Only team admins can set linked drills');
    }
    
    return await this.withTransaction(async (client) => {
      // Delete existing
      await client.query('DELETE FROM season_section_drills WHERE season_section_id = $1', [sectionId]);
      
      // Insert new
      for (let i = 0; i < drills.length; i++) {
        const drill = drills[i];
        
        // Validate type and references
        if (drill.type === 'drill' && !drill.drill_id) {
          throw new ValidationError(`Drill at position ${i} requires drill_id`);
        }
        if (drill.type === 'formation' && !drill.formation_id) {
          throw new ValidationError(`Formation at position ${i} requires formation_id`);
        }
        
        const query = `
          INSERT INTO season_section_drills 
          (season_section_id, type, drill_id, formation_id, name, 
           default_duration_minutes, order_in_section, default_section_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await client.query(query, [
          sectionId,
          drill.type,
          drill.drill_id || null,
          drill.formation_id || null,
          drill.name || null,
          drill.default_duration_minutes || 30,
          drill.order_in_section ?? i,
          drill.default_section_id || null
        ]);
      }
      
      // Return updated list with joins
      return await this.getLinkedDrills(sectionId);
    });
  }

  async reorderSections(seasonId, sectionIds, userId) {
    const season = await seasonService.getById(seasonId);
    
    // Verify admin
    const member = await teamMemberService.getMember(season.team_id, userId);
    if (!member || member.role !== 'admin') {
      throw new ForbiddenError('Only team admins can reorder sections');
    }
    
    return await this.withTransaction(async (client) => {
      for (let i = 0; i < sectionIds.length; i++) {
        await client.query(
          'UPDATE season_sections SET display_order = $1 WHERE id = $2 AND season_id = $3',
          [i, sectionIds[i], seasonId]
        );
      }
    });
  }
}

export const seasonSectionService = new SeasonSectionService();
```

#### 2. Season Marker Service (`src/lib/server/services/seasonMarkerService.js`)
```javascript
import { BaseEntityService } from './baseEntityService';
import { ValidationError, ForbiddenError } from '$lib/server/errors';
import { teamMemberService } from './teamMemberService';
import { seasonService } from './seasonService';

class SeasonMarkerService extends BaseEntityService {
  constructor() {
    super(
      'season_markers',
      'id',
      ['id', 'season_id', 'type', 'title', 'notes', 'start_date', 
       'end_date', 'color', 'visible_to_members', 'created_at', 'updated_at'],
      ['id', 'season_id', 'type', 'title', 'notes', 'start_date',
       'end_date', 'color', 'visible_to_members']
    );
  }

  async create(data, userId) {
    // Verify user is team admin via season
    const season = await seasonService.getById(data.season_id);
    const member = await teamMemberService.getMember(season.team_id, userId);
    if (!member || member.role !== 'admin') {
      throw new ForbiddenError('Only team admins can create season markers');
    }
    
    // Validate dates
    if (data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
      throw new ValidationError('Start date must be before or equal to end date');
    }
    
    // Check dates are within season bounds
    if (new Date(data.start_date) < new Date(season.start_date) ||
        (data.end_date && new Date(data.end_date) > new Date(season.end_date))) {
      throw new ValidationError('Marker dates must be within season dates');
    }
    
    return await super.create(data);
  }

  async update(id, data, userId) {
    const marker = await this.getById(id);
    const season = await seasonService.getById(marker.season_id);
    
    // Verify user is team admin
    const member = await teamMemberService.getMember(season.team_id, userId);
    if (!member || member.role !== 'admin') {
      throw new ForbiddenError('Only team admins can update season markers');
    }
    
    // Validate dates if provided
    if (data.start_date || data.end_date) {
      const startDate = data.start_date || marker.start_date;
      const endDate = data.end_date || marker.end_date;
      
      if (endDate && new Date(startDate) > new Date(endDate)) {
        throw new ValidationError('Start date must be before or equal to end date');
      }
      
      if (new Date(startDate) < new Date(season.start_date) ||
          (endDate && new Date(endDate) > new Date(season.end_date))) {
        throw new ValidationError('Marker dates must be within season dates');
      }
    }
    
    return await super.update(id, data);
  }

  async getSeasonMarkers(seasonId, userId = null) {
    const season = await seasonService.getById(seasonId);
    
    // Check visibility permissions
    if (userId) {
      const member = await teamMemberService.getMember(season.team_id, userId);
      if (!member) {
        throw new ForbiddenError('Only team members can view season markers');
      }
    }
    
    const result = await this.getAll({
      filters: { season_id: seasonId },
      sortBy: 'start_date',
      sortOrder: 'asc',
      all: true
    });
    
    // Filter based on member visibility if not admin
    if (userId) {
      const member = await teamMemberService.getMember(season.team_id, userId);
      if (member && member.role !== 'admin') {
        result.items = result.items.filter(m => m.visible_to_members);
      }
    }
    
    return result.items;
  }

  async getTimelineData(seasonId, userId = null) {
    const markers = await this.getSeasonMarkers(seasonId, userId);
    
    // Group markers by type for easier rendering
    return {
      tournaments: markers.filter(m => m.type === 'tournament'),
      breaks: markers.filter(m => m.type === 'break'),
      scrimmages: markers.filter(m => m.type === 'scrimmage'),
      custom: markers.filter(m => m.type === 'custom'),
      all: markers
    };
  }
}

export const seasonMarkerService = new SeasonMarkerService();
```

#### 3. Validation Schemas

##### Season Section Schema (`src/lib/validation/seasonSectionSchema.ts`)
```typescript
import { z } from 'zod';

export const createSeasonSectionSchema = z.object({
  season_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
  overview_visible_to_members: z.boolean().default(true),
  display_order: z.number().int().min(0).optional(),
  color: z.string().default('blue')
}).refine(data => {
  return new Date(data.start_date) <= new Date(data.end_date);
}, {
  message: "Start date must be before or equal to end date",
  path: ["end_date"]
});

export const updateSeasonSectionSchema = createSeasonSectionSchema.partial().omit({ season_id: true });

export const defaultSectionSchema = z.object({
  section_name: z.string().min(1).max(255),
  order: z.number().int().min(0).optional(),
  goals: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export const linkedDrillSchema = z.object({
  type: z.enum(['drill', 'formation', 'break']),
  drill_id: z.number().int().positive().nullable().optional(),
  formation_id: z.number().int().positive().nullable().optional(),
  name: z.string().optional(),
  default_duration_minutes: z.number().int().min(1).default(30),
  order_in_section: z.number().int().min(0).optional(),
  default_section_id: z.string().uuid().nullable().optional()
}).refine(data => {
  if (data.type === 'drill') return !!data.drill_id;
  if (data.type === 'formation') return !!data.formation_id;
  return true; // breaks don't need references
}, {
  message: "Drill type requires drill_id, Formation type requires formation_id"
});

export const batchDefaultSectionsSchema = z.array(defaultSectionSchema);
export const batchLinkedDrillsSchema = z.array(linkedDrillSchema);
```

##### Season Marker Schema (`src/lib/validation/seasonMarkerSchema.ts`)
```typescript
import { z } from 'zod';

export const createSeasonMarkerSchema = z.object({
  season_id: z.string().uuid(),
  type: z.enum(['tournament', 'break', 'scrimmage', 'custom']),
  title: z.string().min(1).max(255),
  notes: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  color: z.string().default('red'),
  visible_to_members: z.boolean().default(true)
}).refine(data => {
  if (!data.end_date) return true;
  return new Date(data.start_date) <= new Date(data.end_date);
}, {
  message: "Start date must be before or equal to end date",
  path: ["end_date"]
});

export const updateSeasonMarkerSchema = createSeasonMarkerSchema.partial().omit({ season_id: true });
```

### API Routes

#### 1. Season Sections List/Create (`src/routes/api/seasons/[seasonId]/sections/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { seasonSectionService } from '$lib/server/services/seasonSectionService';
import { createSeasonSectionSchema } from '$lib/validation/seasonSectionSchema';

export async function GET({ locals, params }) {
  try {
    const sections = await seasonSectionService.getSeasonSections(
      params.seasonId,
      locals.user?.id
    );
    return json(sections);
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function POST({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const validated = createSeasonSectionSchema.parse({
      ...data,
      season_id: params.seasonId
    });
    
    const section = await seasonSectionService.create(validated, locals.user.id);
    return json(section, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

#### 2. Section CRUD (`src/routes/api/seasons/[seasonId]/sections/[sectionId]/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { seasonSectionService } from '$lib/server/services/seasonSectionService';
import { updateSeasonSectionSchema } from '$lib/validation/seasonSectionSchema';

export async function GET({ locals, params }) {
  try {
    const section = await seasonSectionService.getSectionWithDefaults(
      params.sectionId,
      locals.user?.id
    );
    return json(section);
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
    const validated = updateSeasonSectionSchema.parse(data);
    const section = await seasonSectionService.update(
      params.sectionId,
      validated,
      locals.user.id
    );
    return json(section);
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
    await seasonSectionService.delete(params.sectionId, locals.user.id);
    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

#### 3. Default Sections Management (`src/routes/api/seasons/[seasonId]/sections/[sectionId]/default-sections/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { seasonSectionService } from '$lib/server/services/seasonSectionService';
import { batchDefaultSectionsSchema } from '$lib/validation/seasonSectionSchema';

export async function GET({ params }) {
  try {
    const sections = await seasonSectionService.getDefaultSections(params.sectionId);
    return json(sections);
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function PUT({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const validated = batchDefaultSectionsSchema.parse(data);
    const sections = await seasonSectionService.setDefaultSections(
      params.sectionId,
      validated,
      locals.user.id
    );
    return json(sections);
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

#### 4. Linked Drills Management (`src/routes/api/seasons/[seasonId]/sections/[sectionId]/linked-drills/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { seasonSectionService } from '$lib/server/services/seasonSectionService';
import { batchLinkedDrillsSchema } from '$lib/validation/seasonSectionSchema';

export async function GET({ params }) {
  try {
    const drills = await seasonSectionService.getLinkedDrills(params.sectionId);
    return json(drills);
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function PUT({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const validated = batchLinkedDrillsSchema.parse(data);
    const drills = await seasonSectionService.setLinkedDrills(
      params.sectionId,
      validated,
      locals.user.id
    );
    return json(drills);
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

#### 5. Season Markers (`src/routes/api/seasons/[seasonId]/markers/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { seasonMarkerService } from '$lib/server/services/seasonMarkerService';
import { createSeasonMarkerSchema } from '$lib/validation/seasonMarkerSchema';

export async function GET({ locals, params }) {
  try {
    const markers = await seasonMarkerService.getTimelineData(
      params.seasonId,
      locals.user?.id
    );
    return json(markers);
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function POST({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const validated = createSeasonMarkerSchema.parse({
      ...data,
      season_id: params.seasonId
    });
    
    const marker = await seasonMarkerService.create(validated, locals.user.id);
    return json(marker, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

#### 6. Public View Route (`src/routes/seasons/[seasonId]/view/+page.server.js`)
```javascript
import { error } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService';
import { seasonSectionService } from '$lib/server/services/seasonSectionService';
import { seasonMarkerService } from '$lib/server/services/seasonMarkerService';

export async function load({ params, url }) {
  const token = url.searchParams.get('token');
  
  if (!token) {
    throw error(401, 'Token required');
  }
  
  // Verify token and get season
  const season = await seasonService.getByPublicToken(token);
  if (!season) {
    throw error(404, 'Invalid token');
  }
  
  // Get public-visible sections and markers
  const sections = await seasonSectionService.getSeasonSections(season.id);
  const markers = await seasonMarkerService.getTimelineData(season.id);
  
  // Filter to only public-visible items
  const publicSections = sections.filter(s => s.overview_visible_to_members);
  const publicMarkers = {
    ...markers,
    all: markers.all.filter(m => m.visible_to_members)
  };
  
  return {
    season,
    sections: publicSections,
    markers: publicMarkers,
    isPublicView: true
  };
}
```

### Frontend Implementation

#### 1. Season Timeline Component (`src/lib/components/season/SeasonTimeline.svelte`)
```svelte
<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import SeasonTimelineSection from './SeasonTimelineSection.svelte';
  import SeasonTimelineMarker from './SeasonTimelineMarker.svelte';
  
  export let season;
  export let sections = [];
  export let markers = [];
  export let isAdmin = false;
  export let isPublicView = false;
  export let onDateClick = null; // Callback for date clicks (Phase 4)
  
  let timelineElement;
  let containerWidth = 0;
  let dateRange = [];
  let monthHeaders = [];
  
  const DAY_WIDTH = 30; // Pixels per day
  const HEADER_HEIGHT = 60;
  const SECTION_HEIGHT = 40;
  const MARKER_HEIGHT = 30;
  
  $: {
    if (season) {
      generateDateRange();
      generateMonthHeaders();
    }
  }
  
  function generateDateRange() {
    const start = new Date(season.start_date);
    const end = new Date(season.end_date);
    const days = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    
    dateRange = days;
    containerWidth = days.length * DAY_WIDTH;
  }
  
  function generateMonthHeaders() {
    const headers = [];
    let currentMonth = null;
    let currentMonthStart = 0;
    
    dateRange.forEach((date, index) => {
      const monthYear = `${date.getMonth()}-${date.getFullYear()}`;
      
      if (monthYear !== currentMonth) {
        if (currentMonth) {
          headers.push({
            month: currentMonth,
            start: currentMonthStart * DAY_WIDTH,
            width: (index - currentMonthStart) * DAY_WIDTH
          });
        }
        currentMonth = monthYear;
        currentMonthStart = index;
      }
    });
    
    // Add last month
    if (currentMonth) {
      headers.push({
        month: currentMonth,
        start: currentMonthStart * DAY_WIDTH,
        width: (dateRange.length - currentMonthStart) * DAY_WIDTH
      });
    }
    
    monthHeaders = headers.map(h => ({
      ...h,
      label: getMonthLabel(h.month)
    }));
  }
  
  function getMonthLabel(monthYear) {
    const [month, year] = monthYear.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month)]} ${year}`;
  }
  
  function getDatePosition(date) {
    const d = new Date(date);
    const start = new Date(season.start_date);
    const daysDiff = Math.floor((d - start) / (1000 * 60 * 60 * 24));
    return daysDiff * DAY_WIDTH;
  }
  
  function getDateWidth(startDate, endDate) {
    if (!endDate) return DAY_WIDTH;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return daysDiff * DAY_WIDTH;
  }
  
  function handleDateClick(date) {
    if (isAdmin && onDateClick) {
      onDateClick(date);
    }
  }
  
  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Group overlapping sections for display
  $: sectionRows = groupOverlappingSections(sections);
  
  function groupOverlappingSections(sections) {
    const rows = [];
    const sorted = [...sections].sort((a, b) => 
      new Date(a.start_date) - new Date(b.start_date)
    );
    
    sorted.forEach(section => {
      // Find first row where section fits
      let placed = false;
      for (let row of rows) {
        const overlaps = row.some(s => 
          !(new Date(section.end_date) < new Date(s.start_date) ||
            new Date(section.start_date) > new Date(s.end_date))
        );
        
        if (!overlaps) {
          row.push(section);
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        rows.push([section]);
      }
    });
    
    return rows;
  }
  
  // Color palette for sections
  const sectionColors = {
    blue: 'bg-blue-100 border-blue-300 text-blue-900',
    green: 'bg-green-100 border-green-300 text-green-900',
    purple: 'bg-purple-100 border-purple-300 text-purple-900',
    amber: 'bg-amber-100 border-amber-300 text-amber-900',
    rose: 'bg-rose-100 border-rose-300 text-rose-900',
    cyan: 'bg-cyan-100 border-cyan-300 text-cyan-900'
  };
  
  const markerColors = {
    red: 'bg-red-500 text-white',
    orange: 'bg-orange-500 text-white',
    yellow: 'bg-yellow-500 text-black',
    green: 'bg-green-500 text-white',
    blue: 'bg-blue-500 text-white',
    purple: 'bg-purple-500 text-white'
  };
</script>

<div class="border rounded-lg overflow-hidden bg-white">
  <div class="p-4 border-b">
    <h2 class="text-xl font-semibold">Season Timeline</h2>
    <p class="text-gray-600 text-sm mt-1">
      {formatDate(season.start_date)} - {formatDate(season.end_date)}
    </p>
  </div>
  
  <div class="relative overflow-x-auto" bind:this={timelineElement}>
    <div class="relative" style="width: {containerWidth}px; min-height: 400px;">
      <!-- Month headers -->
      <div class="sticky top-0 z-20 bg-gray-50 border-b" style="height: {HEADER_HEIGHT}px;">
        {#each monthHeaders as header}
          <div 
            class="absolute top-0 border-r border-gray-300 flex items-center justify-center font-medium"
            style="left: {header.start}px; width: {header.width}px; height: 30px;"
          >
            {header.label}
          </div>
        {/each}
        
        <!-- Day markers -->
        <div class="absolute top-30" style="height: 30px;">
          {#each dateRange as date, i}
            {@const isWeekend = date.getDay() === 0 || date.getDay() === 6}
            {@const isToday = date.toDateString() === new Date().toDateString()}
            <button
              class="absolute border-r border-gray-200 text-xs flex items-center justify-center
                     {isWeekend ? 'bg-gray-100' : 'bg-white'}
                     {isToday ? 'ring-2 ring-blue-500 z-10' : ''}
                     {isAdmin && onDateClick ? 'hover:bg-blue-50 cursor-pointer' : ''}"
              style="left: {i * DAY_WIDTH}px; width: {DAY_WIDTH}px; height: 30px; top: 30px;"
              on:click={() => handleDateClick(date)}
              disabled={!isAdmin || !onDateClick}
            >
              {date.getDate()}
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Grid lines -->
      <div class="absolute inset-0" style="top: {HEADER_HEIGHT}px;">
        {#each dateRange as date, i}
          <div 
            class="absolute border-r border-gray-100 h-full"
            style="left: {i * DAY_WIDTH}px;"
          />
        {/each}
      </div>
      
      <!-- Season sections -->
      <div class="absolute" style="top: {HEADER_HEIGHT + 20}px; left: 0; right: 0;">
        {#each sectionRows as row, rowIndex}
          <div class="relative" style="height: {SECTION_HEIGHT}px; margin-bottom: 5px;">
            {#each row as section}
              <div
                class="absolute rounded px-2 py-1 border text-xs font-medium overflow-hidden
                       {sectionColors[section.color] || sectionColors.blue}"
                style="left: {getDatePosition(section.start_date)}px; 
                       width: {getDateWidth(section.start_date, section.end_date)}px;
                       height: {SECTION_HEIGHT - 5}px;"
                title="{section.name}: {section.notes || 'No notes'}"
              >
                <span class="truncate block">{section.name}</span>
              </div>
            {/each}
          </div>
        {/each}
      </div>
      
      <!-- Markers -->
      <div class="absolute" style="top: {HEADER_HEIGHT + 20 + (sectionRows.length * (SECTION_HEIGHT + 5)) + 20}px; left: 0; right: 0;">
        <div class="text-xs font-semibold text-gray-600 mb-2">Events & Milestones</div>
        
        {#each markers.all as marker}
          {@const left = getDatePosition(marker.start_date)}
          {@const width = getDateWidth(marker.start_date, marker.end_date)}
          
          <div
            class="absolute rounded px-2 py-1 text-xs font-medium
                   {markerColors[marker.color] || markerColors.red}"
            style="left: {left}px; width: {width}px; height: {MARKER_HEIGHT}px; margin-bottom: 5px;"
            title="{marker.title}: {marker.notes || 'No notes'}"
          >
            <span class="truncate block">
              {#if marker.type === 'tournament'}🏆{/if}
              {#if marker.type === 'break'}🏖️{/if}
              {#if marker.type === 'scrimmage'}⚔️{/if}
              {marker.title}
            </span>
          </div>
        {/each}
      </div>
      
      <!-- Today line -->
      {@const today = new Date()}
      {#if today >= new Date(season.start_date) && today <= new Date(season.end_date)}
        {@const todayPosition = getDatePosition(today)}
        <div 
          class="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30"
          style="left: {todayPosition}px;"
        >
          <div class="absolute -top-2 -left-8 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
            Today
          </div>
        </div>
      {/if}
    </div>
  </div>
  
  {#if isAdmin && !isPublicView}
    <div class="p-4 border-t bg-gray-50">
      <div class="flex space-x-2">
        <a 
          href="/teams/{$page.params.teamId}/season/sections"
          class="text-blue-500 hover:underline text-sm"
        >
          Manage Sections
        </a>
        <a 
          href="/teams/{$page.params.teamId}/season/markers"
          class="text-blue-500 hover:underline text-sm"
        >
          Manage Events
        </a>
        {#if onDateClick}
          <span class="text-gray-500 text-sm">• Click any date to create a practice plan</span>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom scrollbar for timeline */
  :global(.overflow-x-auto) {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f7fafc;
  }
  
  :global(.overflow-x-auto::-webkit-scrollbar) {
    height: 8px;
  }
  
  :global(.overflow-x-auto::-webkit-scrollbar-track) {
    background: #f7fafc;
  }
  
  :global(.overflow-x-auto::-webkit-scrollbar-thumb) {
    background: #cbd5e0;
    border-radius: 4px;
  }
</style>
```

#### 2. Section Management Page (`src/routes/teams/[teamId]/season/sections/+page.svelte`)
```svelte
<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  export let data;
  
  let sections = data.sections || [];
  let showCreateModal = false;
  let showEditModal = false;
  let selectedSection = null;
  
  let newSection = {
    name: '',
    start_date: '',
    end_date: '',
    notes: '',
    overview_visible_to_members: true,
    color: 'blue'
  };
  
  async function createSection() {
    const response = await fetch(`/api/seasons/${data.season.id}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSection)
    });
    
    if (response.ok) {
      const section = await response.json();
      sections = [...sections, section].sort((a, b) => a.display_order - b.display_order);
      showCreateModal = false;
      resetForm();
    }
  }
  
  async function updateSection() {
    const response = await fetch(`/api/seasons/${data.season.id}/sections/${selectedSection.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedSection)
    });
    
    if (response.ok) {
      const updated = await response.json();
      sections = sections.map(s => s.id === updated.id ? updated : s);
      showEditModal = false;
      selectedSection = null;
    }
  }
  
  async function deleteSection(sectionId) {
    if (!confirm('Are you sure you want to delete this section?')) return;
    
    const response = await fetch(`/api/seasons/${data.season.id}/sections/${sectionId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      sections = sections.filter(s => s.id !== sectionId);
    }
  }
  
  function resetForm() {
    newSection = {
      name: '',
      start_date: '',
      end_date: '',
      notes: '',
      overview_visible_to_members: true,
      color: 'blue'
    };
  }
  
  const colors = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-100' },
    { value: 'green', label: 'Green', class: 'bg-green-100' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-100' },
    { value: 'amber', label: 'Amber', class: 'bg-amber-100' },
    { value: 'rose', label: 'Rose', class: 'bg-rose-100' },
    { value: 'cyan', label: 'Cyan', class: 'bg-cyan-100' }
  ];
</script>

<div class="container mx-auto p-6">
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold">Season Sections</h1>
      <p class="text-gray-600 mt-1">{data.season.name}</p>
    </div>
    <button
      on:click={() => showCreateModal = true}
      class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      Add Section
    </button>
  </div>
  
  <div class="space-y-4">
    {#each sections as section}
      <div class="border rounded-lg p-4 bg-white">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center space-x-2">
              <h3 class="text-lg font-semibold">{section.name}</h3>
              <span class="px-2 py-1 text-xs rounded {colors.find(c => c.value === section.color)?.class}">
                {section.color}
              </span>
              {#if !section.overview_visible_to_members}
                <span class="px-2 py-1 text-xs bg-gray-100 rounded">Admin Only</span>
              {/if}
            </div>
            <p class="text-gray-600 mt-1">
              {new Date(section.start_date).toLocaleDateString()} - 
              {new Date(section.end_date).toLocaleDateString()}
            </p>
            {#if section.notes}
              <p class="text-gray-500 text-sm mt-2">{section.notes}</p>
            {/if}
          </div>
          <div class="flex space-x-2">
            <a
              href="/teams/{$page.params.teamId}/season/sections/{section.id}"
              class="text-blue-500 hover:underline text-sm"
            >
              Configure Content
            </a>
            <button
              on:click={() => {
                selectedSection = {...section};
                showEditModal = true;
              }}
              class="text-gray-500 hover:underline text-sm"
            >
              Edit
            </button>
            <button
              on:click={() => deleteSection(section.id)}
              class="text-red-500 hover:underline text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
  
  {#if sections.length === 0}
    <p class="text-gray-500 text-center py-8">
      No sections defined yet. Create your first section to organize your season.
    </p>
  {/if}
</div>

<!-- Create Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full">
      <h2 class="text-2xl font-bold mb-4">Create Section</h2>
      
      <input
        bind:value={newSection.name}
        placeholder="Section Name"
        class="w-full p-2 border rounded mb-3"
      />
      
      <div class="grid grid-cols-2 gap-3 mb-3">
        <label>
          <span class="text-gray-700 text-sm">Start Date</span>
          <input
            type="date"
            bind:value={newSection.start_date}
            min={data.season.start_date}
            max={data.season.end_date}
            class="w-full p-2 border rounded"
          />
        </label>
        
        <label>
          <span class="text-gray-700 text-sm">End Date</span>
          <input
            type="date"
            bind:value={newSection.end_date}
            min={newSection.start_date || data.season.start_date}
            max={data.season.end_date}
            class="w-full p-2 border rounded"
          />
        </label>
      </div>
      
      <textarea
        bind:value={newSection.notes}
        placeholder="Notes (optional)"
        class="w-full p-2 border rounded mb-3"
        rows="3"
      />
      
      <label class="block mb-3">
        <span class="text-gray-700 text-sm">Color</span>
        <select bind:value={newSection.color} class="w-full p-2 border rounded">
          {#each colors as color}
            <option value={color.value}>{color.label}</option>
          {/each}
        </select>
      </label>
      
      <label class="flex items-center mb-4">
        <input
          type="checkbox"
          bind:checked={newSection.overview_visible_to_members}
          class="mr-2"
        />
        <span>Visible to team members</span>
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
          on:click={createSection}
          disabled={!newSection.name || !newSection.start_date || !newSection.end_date}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Edit Modal (similar structure, binding to selectedSection) -->
{#if showEditModal && selectedSection}
  <!-- Similar to create modal but with selectedSection bindings -->
{/if}
```

### Testing

#### Service Test (`src/lib/server/services/__tests__/seasonSectionService.test.js`)
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { seasonSectionService } from '../seasonSectionService';
import { seasonService } from '../seasonService';
import { teamService } from '../teamService';

describe('SeasonSectionService', () => {
  let testTeam;
  let testSeason;
  let testUserId = 'test-user-123';
  
  beforeEach(async () => {
    // Create test team and season
    testTeam = await teamService.create({
      name: 'Test Team',
      timezone: 'America/New_York'
    }, testUserId);
    
    testSeason = await seasonService.create({
      team_id: testTeam.id,
      name: 'Spring 2024',
      start_date: '2024-03-01',
      end_date: '2024-05-31',
      is_active: true
    }, testUserId);
  });
  
  it('should create a season section', async () => {
    const sectionData = {
      season_id: testSeason.id,
      name: 'Early Season',
      start_date: '2024-03-01',
      end_date: '2024-03-31',
      notes: 'Focus on fundamentals',
      color: 'blue'
    };
    
    const section = await seasonSectionService.create(sectionData, testUserId);
    
    expect(section.name).toBe(sectionData.name);
    expect(section.season_id).toBe(testSeason.id);
    expect(section.display_order).toBe(0);
  });
  
  it('should validate section dates within season', async () => {
    const invalidSection = {
      season_id: testSeason.id,
      name: 'Invalid Section',
      start_date: '2024-02-01', // Before season start
      end_date: '2024-03-31'
    };
    
    await expect(seasonSectionService.create(invalidSection, testUserId))
      .rejects.toThrow('Section dates must be within season dates');
  });
  
  it('should manage default sections', async () => {
    const section = await seasonSectionService.create({
      season_id: testSeason.id,
      name: 'Test Section',
      start_date: '2024-03-01',
      end_date: '2024-03-31'
    }, testUserId);
    
    const defaultSections = [
      { section_name: 'Warm-up', order: 0, goals: ['Get moving'] },
      { section_name: 'Main Work', order: 1, goals: ['Skills', 'Tactics'] },
      { section_name: 'Cool-down', order: 2, goals: ['Recovery'] }
    ];
    
    const saved = await seasonSectionService.setDefaultSections(
      section.id,
      defaultSections,
      testUserId
    );
    
    expect(saved).toHaveLength(3);
    expect(saved[0].section_name).toBe('Warm-up');
  });
  
  it('should manage linked drills', async () => {
    const section = await seasonSectionService.create({
      season_id: testSeason.id,
      name: 'Test Section',
      start_date: '2024-03-01',
      end_date: '2024-03-31'
    }, testUserId);
    
    const linkedDrills = [
      { type: 'drill', drill_id: 1, default_duration_minutes: 15 },
      { type: 'break', name: 'Water Break', default_duration_minutes: 5 },
      { type: 'formation', formation_id: 1, default_duration_minutes: 20 }
    ];
    
    const saved = await seasonSectionService.setLinkedDrills(
      section.id,
      linkedDrills,
      testUserId
    );
    
    expect(saved).toHaveLength(3);
    expect(saved[1].type).toBe('break');
    expect(saved[1].name).toBe('Water Break');
  });
  
  it('should respect visibility permissions', async () => {
    const adminSection = await seasonSectionService.create({
      season_id: testSeason.id,
      name: 'Admin Only',
      start_date: '2024-03-01',
      end_date: '2024-03-31',
      overview_visible_to_members: false
    }, testUserId);
    
    const memberSection = await seasonSectionService.create({
      season_id: testSeason.id,
      name: 'Visible to All',
      start_date: '2024-04-01',
      end_date: '2024-04-30',
      overview_visible_to_members: true
    }, testUserId);
    
    // Test as member (would need to add member and switch context)
    // This is simplified - real test would add a member user
    const sections = await seasonSectionService.getSeasonSections(testSeason.id, testUserId);
    
    // As admin, should see both
    expect(sections).toHaveLength(2);
  });
});
```

### Acceptance Criteria
- [ ] Season sections table created with proper constraints
- [ ] Season section default sections table for practice structure
- [ ] Season section drills table for linked content
- [ ] Season markers table for events/milestones
- [ ] Sections must be within season date bounds
- [ ] Sections can have default practice plan structure
- [ ] Sections can link to specific drills/formations
- [ ] Markers support single and multi-day events
- [ ] Read-only timeline visualization works
- [ ] Timeline shows sections with overlapping support
- [ ] Timeline shows markers with appropriate icons
- [ ] Member visibility flags respected
- [ ] Public view via token works
- [ ] Admin can manage sections and markers
- [ ] Tests pass for all services

### Dependencies
- Phase 2 must be complete (Seasons working)
- Practice plans, drills, formations tables exist
- Team permissions working

### Notes
- Timeline is read-only in this phase (click-to-create comes in Phase 4)
- Section colors help visual organization
- Overlapping sections stack vertically in timeline
- Default durations are 30 minutes if not specified
- Today indicator shows current position in season