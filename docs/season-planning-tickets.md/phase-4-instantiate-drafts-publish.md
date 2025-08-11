## Phase 4: Instantiation, Union Algorithm, and Publishing - Implementation Ticket

### Overview
Implement click-to-create practice plans from the season timeline using a union algorithm that combines template plan + overlapping season sections' defaults and linked drills. Implement draft/published workflow with team-scoped visibility.

### Prerequisites
- Phase 3 completed (Season sections, markers, timeline working)
- Practice plans table exists with sections and drills support
- Team-based permissions working

### Database Changes

#### Migration: `migrations/[timestamp]_add_season_planning_to_practice_plans.js`
```javascript
exports.up = (pgm) => {
  // Add columns to practice_plans for season planning
  pgm.addColumns('practice_plans', {
    team_id: { type: 'uuid', references: 'teams(id)', onDelete: 'CASCADE' },
    season_id: { type: 'uuid', references: 'seasons(id)', onDelete: 'SET NULL' },
    scheduled_date: { type: 'date' },
    status: { 
      type: 'varchar(20)', 
      default: 'draft',
      check: "status IN ('draft', 'published')"
    },
    is_template: { type: 'boolean', default: false, notNull: true },
    template_plan_id: { type: 'integer', references: 'practice_plans(id)', onDelete: 'SET NULL' },
    is_edited: { type: 'boolean', default: false, notNull: true },
    published_at: { type: 'timestamp' }
  });
  
  // Add indexes for performance
  pgm.createIndex('practice_plans', 'team_id');
  pgm.createIndex('practice_plans', 'season_id');
  pgm.createIndex('practice_plans', ['season_id', 'scheduled_date']);
  pgm.createIndex('practice_plans', ['template_plan_id', 'is_edited']);
  pgm.createIndex('practice_plans', ['team_id', 'status']);
  
  // Add unique constraint for one practice per team per date
  pgm.addConstraint('practice_plans', 'unique_team_date', {
    unique: ['team_id', 'scheduled_date']
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('practice_plans', 'unique_team_date');
  pgm.dropColumns('practice_plans', [
    'team_id', 'season_id', 'scheduled_date', 'status',
    'is_template', 'template_plan_id', 'is_edited', 'published_at'
  ]);
};
```

### Backend Implementation

#### 1. Season Union Service (`src/lib/server/services/seasonUnionService.js`)
```javascript
import { practicePlanService } from './practicePlanService';
import { seasonService } from './seasonService';
import { seasonSectionService } from './seasonSectionService';
import { ValidationError } from '$lib/server/errors';

/**
 * Service for handling the union algorithm that combines:
 * 1. Season template practice plan
 * 2. Overlapping season sections' default sections
 * 3. Overlapping season sections' linked drills/formations
 */
class SeasonUnionService {
  /**
   * Create a draft practice plan for a specific date using the union algorithm
   * @param {string} seasonId - Season ID
   * @param {string} scheduledDate - Date for the practice (YYYY-MM-DD)
   * @param {string} userId - User creating the plan
   * @param {string} teamId - Team ID
   * @returns {Object} Created practice plan with sections and drills
   */
  async instantiatePracticePlan(seasonId, scheduledDate, userId, teamId) {
    // Validate date is within season
    const season = await seasonService.getById(seasonId);
    const practiceDate = new Date(scheduledDate);
    
    if (practiceDate < new Date(season.start_date) || 
        practiceDate > new Date(season.end_date)) {
      throw new ValidationError('Practice date must be within season dates');
    }
    
    // Check if practice already exists for this date
    const existing = await practicePlanService.getByTeamAndDate(teamId, scheduledDate);
    if (existing) {
      throw new ValidationError('A practice plan already exists for this date');
    }
    
    // Get overlapping season sections
    const overlappingSections = await this.getOverlappingSections(seasonId, scheduledDate);
    
    // Build the union structure
    const unionData = await this.buildUnionStructure(
      season,
      overlappingSections,
      scheduledDate,
      teamId
    );
    
    // Create the practice plan with all content
    const practicePlan = await practicePlanService.createWithContent(unionData, userId);
    
    return practicePlan;
  }
  
  /**
   * Get all season sections that overlap with the given date
   */
  async getOverlappingSections(seasonId, date) {
    const sections = await seasonSectionService.getSeasonSections(seasonId);
    
    return sections.filter(section => {
      const practiceDate = new Date(date);
      const sectionStart = new Date(section.start_date);
      const sectionEnd = new Date(section.end_date);
      
      return practiceDate >= sectionStart && practiceDate <= sectionEnd;
    });
  }
  
  /**
   * Build the union structure combining template and section data
   */
  async buildUnionStructure(season, overlappingSections, scheduledDate, teamId) {
    const unionData = {
      team_id: teamId,
      season_id: season.id,
      scheduled_date: scheduledDate,
      status: 'draft',
      is_template: false,
      template_plan_id: season.template_practice_plan_id,
      is_edited: false,
      name: `Practice - ${new Date(scheduledDate).toLocaleDateString()}`,
      description: `Generated practice plan for ${new Date(scheduledDate).toLocaleDateString()}`,
      start_time: season.default_start_time || '09:00:00',
      visibility: 'private', // Team practices are private by default
      sections: [],
      drills: []
    };
    
    // Step 1: Start with template plan if exists
    if (season.template_practice_plan_id) {
      const template = await practicePlanService.getByIdWithContent(
        season.template_practice_plan_id
      );
      
      if (template) {
        unionData.sections = this.cloneSections(template.sections);
        unionData.drills = this.cloneDrills(template.drills);
        unionData.name = template.name + ` - ${new Date(scheduledDate).toLocaleDateString()}`;
        unionData.description = template.description;
        unionData.practice_goals = template.practice_goals;
        unionData.phase_of_season = template.phase_of_season;
        unionData.estimated_number_of_participants = template.estimated_number_of_participants;
      }
    }
    
    // Step 2: Add/merge default sections from overlapping season sections
    for (const section of overlappingSections) {
      const defaultSections = await seasonSectionService.getDefaultSections(section.id);
      
      for (const defaultSection of defaultSections) {
        // Check if section already exists (by name)
        const existingIndex = unionData.sections.findIndex(
          s => s.name.toLowerCase() === defaultSection.section_name.toLowerCase()
        );
        
        if (existingIndex === -1) {
          // Add new section
          unionData.sections.push({
            name: defaultSection.section_name,
            order: defaultSection.order ?? unionData.sections.length,
            goals: defaultSection.goals || [],
            notes: defaultSection.notes || `From season section: ${section.name}`
          });
        } else {
          // Merge goals and notes
          const existing = unionData.sections[existingIndex];
          existing.goals = [...new Set([
            ...(existing.goals || []),
            ...(defaultSection.goals || [])
          ])];
          
          if (defaultSection.notes) {
            existing.notes = existing.notes 
              ? `${existing.notes}\n${defaultSection.notes}`
              : defaultSection.notes;
          }
        }
      }
    }
    
    // Step 3: Add linked drills/formations from overlapping season sections
    const drillsToAdd = [];
    
    for (const section of overlappingSections) {
      const linkedDrills = await seasonSectionService.getLinkedDrills(section.id);
      
      for (const linkedDrill of linkedDrills) {
        const drillData = {
          type: linkedDrill.type,
          drill_id: linkedDrill.drill_id,
          formation_id: linkedDrill.formation_id,
          name: linkedDrill.name || linkedDrill.drill_name || linkedDrill.formation_name,
          duration: linkedDrill.default_duration_minutes || 30,
          order_in_plan: drillsToAdd.length + unionData.drills.length,
          section_id: null // Will be assigned based on default_section_id
        };
        
        // If linked to a default section, find the matching section
        if (linkedDrill.default_section_id) {
          const defaultSection = defaultSections.find(
            ds => ds.id === linkedDrill.default_section_id
          );
          
          if (defaultSection) {
            const targetSection = unionData.sections.find(
              s => s.name.toLowerCase() === defaultSection.section_name.toLowerCase()
            );
            
            if (targetSection) {
              drillData.section_name = targetSection.name;
            }
          }
        }
        
        drillsToAdd.push(drillData);
      }
    }
    
    // Merge drills, avoiding exact duplicates
    for (const drill of drillsToAdd) {
      const isDuplicate = unionData.drills.some(existing => 
        existing.type === drill.type &&
        existing.drill_id === drill.drill_id &&
        existing.formation_id === drill.formation_id
      );
      
      if (!isDuplicate) {
        unionData.drills.push(drill);
      }
    }
    
    // Step 4: Sort sections and drills by order
    unionData.sections.sort((a, b) => (a.order || 0) - (b.order || 0));
    unionData.drills.sort((a, b) => (a.order_in_plan || 0) - (b.order_in_plan || 0));
    
    return unionData;
  }
  
  /**
   * Clone sections for union (deep copy)
   */
  cloneSections(sections) {
    return sections.map(section => ({
      name: section.name,
      order: section.order,
      goals: [...(section.goals || [])],
      notes: section.notes
    }));
  }
  
  /**
   * Clone drills for union (deep copy)
   */
  cloneDrills(drills) {
    return drills.map(drill => ({
      type: drill.type,
      drill_id: drill.drill_id,
      formation_id: drill.formation_id,
      name: drill.name,
      duration: drill.duration || drill.selected_duration || 30,
      order_in_plan: drill.order_in_plan,
      section_id: drill.section_id,
      parallel_group_id: drill.parallel_group_id,
      parallel_timeline: drill.parallel_timeline,
      group_timelines: drill.group_timelines ? [...drill.group_timelines] : null
    }));
  }
  
  /**
   * Batch generate practice plans for a date range
   */
  async batchGeneratePractices(seasonId, startDate, endDate, userId, teamId) {
    const results = {
      created: [],
      skipped: [],
      errors: []
    };
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      try {
        // Check if already exists
        const existing = await practicePlanService.getByTeamAndDate(teamId, dateStr);
        if (existing) {
          results.skipped.push({
            date: dateStr,
            reason: 'Already exists',
            planId: existing.id
          });
          continue;
        }
        
        // Check if any sections overlap this date
        const overlapping = await this.getOverlappingSections(seasonId, dateStr);
        if (overlapping.length === 0) {
          results.skipped.push({
            date: dateStr,
            reason: 'No overlapping sections'
          });
          continue;
        }
        
        // Generate the practice
        const plan = await this.instantiatePracticePlan(
          seasonId,
          dateStr,
          userId,
          teamId
        );
        
        results.created.push({
          date: dateStr,
          planId: plan.id,
          name: plan.name
        });
      } catch (error) {
        results.errors.push({
          date: dateStr,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

export const seasonUnionService = new SeasonUnionService();
```

#### 2. Extended Practice Plan Service (`src/lib/server/services/practicePlanService.js` additions)
```javascript
// Add these methods to the existing PracticePlanService class

async getByTeamAndDate(teamId, scheduledDate) {
  const result = await this.getAll({
    filters: { 
      team_id: teamId,
      scheduled_date: scheduledDate
    },
    limit: 1
  });
  return result.items[0] || null;
}

async getByIdWithContent(planId) {
  return await this.withTransaction(async (client) => {
    // Get plan
    const planQuery = 'SELECT * FROM practice_plans WHERE id = $1';
    const planResult = await client.query(planQuery, [planId]);
    if (planResult.rows.length === 0) return null;
    
    const plan = planResult.rows[0];
    
    // Get sections
    const sectionsQuery = `
      SELECT * FROM practice_plan_sections 
      WHERE practice_plan_id = $1 
      ORDER BY "order"
    `;
    const sectionsResult = await client.query(sectionsQuery, [planId]);
    plan.sections = sectionsResult.rows;
    
    // Get drills with details
    const drillsQuery = `
      SELECT 
        ppd.*,
        d.name as drill_name,
        d.brief_description as drill_description,
        f.name as formation_name,
        f.brief_description as formation_description,
        pps.name as section_name
      FROM practice_plan_drills ppd
      LEFT JOIN drills d ON ppd.drill_id = d.id
      LEFT JOIN formations f ON ppd.formation_id = f.id
      LEFT JOIN practice_plan_sections pps ON ppd.section_id = pps.id
      WHERE ppd.practice_plan_id = $1
      ORDER BY ppd.order_in_plan
    `;
    const drillsResult = await client.query(drillsQuery, [planId]);
    plan.drills = drillsResult.rows;
    
    return plan;
  });
}

async createWithContent(data, userId) {
  return await this.withTransaction(async (client) => {
    // Create the practice plan
    const planData = {
      name: data.name,
      description: data.description,
      practice_goals: data.practice_goals || [],
      phase_of_season: data.phase_of_season,
      estimated_number_of_participants: data.estimated_number_of_participants,
      created_by: userId,
      visibility: data.visibility || 'private',
      is_editable_by_others: false,
      start_time: data.start_time,
      team_id: data.team_id,
      season_id: data.season_id,
      scheduled_date: data.scheduled_date,
      status: data.status || 'draft',
      is_template: data.is_template || false,
      template_plan_id: data.template_plan_id,
      is_edited: data.is_edited || false
    };
    
    const planQuery = `
      INSERT INTO practice_plans (
        name, description, practice_goals, phase_of_season,
        estimated_number_of_participants, created_by, visibility,
        is_editable_by_others, start_time, team_id, season_id,
        scheduled_date, status, is_template, template_plan_id, is_edited
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *
    `;
    
    const planResult = await client.query(planQuery, [
      planData.name,
      planData.description,
      planData.practice_goals,
      planData.phase_of_season,
      planData.estimated_number_of_participants,
      planData.created_by,
      planData.visibility,
      planData.is_editable_by_others,
      planData.start_time,
      planData.team_id,
      planData.season_id,
      planData.scheduled_date,
      planData.status,
      planData.is_template,
      planData.template_plan_id,
      planData.is_edited
    ]);
    
    const plan = planResult.rows[0];
    
    // Create sections
    const sectionMap = {};
    for (const section of data.sections || []) {
      const sectionQuery = `
        INSERT INTO practice_plan_sections (
          practice_plan_id, name, "order", goals, notes
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const sectionResult = await client.query(sectionQuery, [
        plan.id,
        section.name,
        section.order || 0,
        JSON.stringify(section.goals || []),
        section.notes
      ]);
      
      sectionMap[section.name] = sectionResult.rows[0].id;
    }
    
    // Create drills
    for (const drill of data.drills || []) {
      const sectionId = drill.section_name ? sectionMap[drill.section_name] : drill.section_id;
      
      const drillQuery = `
        INSERT INTO practice_plan_drills (
          practice_plan_id, drill_id, formation_id, type, name,
          duration, order_in_plan, section_id, parallel_group_id,
          parallel_timeline, group_timelines
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
      
      await client.query(drillQuery, [
        plan.id,
        drill.drill_id,
        drill.formation_id,
        drill.type,
        drill.name,
        drill.duration || 30,
        drill.order_in_plan || 0,
        sectionId,
        drill.parallel_group_id,
        drill.parallel_timeline,
        drill.group_timelines
      ]);
    }
    
    return await this.getByIdWithContent(plan.id);
  });
}

async updatePracticePlan(planId, data, userId) {
  const plan = await this.getById(planId);
  
  // Check permissions
  if (plan.created_by !== userId && !plan.is_editable_by_others) {
    // Check if user is team admin
    if (plan.team_id) {
      const member = await teamMemberService.getMember(plan.team_id, userId);
      if (!member || member.role !== 'admin') {
        throw new ForbiddenError('Only the creator or team admins can edit this plan');
      }
    } else {
      throw new ForbiddenError('Only the creator can edit this plan');
    }
  }
  
  // If this is a template-linked plan and content is being edited, mark as edited
  if (plan.template_plan_id && !plan.is_edited) {
    const contentFields = ['name', 'description', 'practice_goals', 'sections', 'drills'];
    const hasContentChange = contentFields.some(field => data[field] !== undefined);
    
    if (hasContentChange) {
      data.is_edited = true;
    }
  }
  
  return await super.update(planId, data);
}

async publishPracticePlan(planId, userId) {
  const plan = await this.getById(planId);
  
  // Check permissions - must be team admin or creator
  if (plan.team_id) {
    const member = await teamMemberService.getMember(plan.team_id, userId);
    if (!member || (member.role !== 'admin' && plan.created_by !== userId)) {
      throw new ForbiddenError('Only team admins or the creator can publish plans');
    }
  } else if (plan.created_by !== userId) {
    throw new ForbiddenError('Only the creator can publish this plan');
  }
  
  // Update status to published
  return await this.withTransaction(async (client) => {
    const query = `
      UPDATE practice_plans 
      SET status = 'published', 
          published_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await client.query(query, [planId]);
    return result.rows[0];
  });
}

async unpublishPracticePlan(planId, userId) {
  const plan = await this.getById(planId);
  
  // Check permissions - must be team admin or creator
  if (plan.team_id) {
    const member = await teamMemberService.getMember(plan.team_id, userId);
    if (!member || (member.role !== 'admin' && plan.created_by !== userId)) {
      throw new ForbiddenError('Only team admins or the creator can unpublish plans');
    }
  } else if (plan.created_by !== userId) {
    throw new ForbiddenError('Only the creator can unpublish this plan');
  }
  
  // Update status back to draft
  return await this.withTransaction(async (client) => {
    const query = `
      UPDATE practice_plans 
      SET status = 'draft',
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await client.query(query, [planId]);
    return result.rows[0];
  });
}

async getTeamPracticePlans(teamId, userId, options = {}) {
  // Check team membership
  const member = await teamMemberService.getMember(teamId, userId);
  if (!member) {
    throw new ForbiddenError('Only team members can view team practice plans');
  }
  
  const filters = {
    ...options.filters,
    team_id: teamId
  };
  
  // Members can only see published plans (unless they're the creator)
  if (member.role !== 'admin') {
    filters['$or'] = [
      { status: 'published' },
      { created_by: userId }
    ];
  }
  
  return await this.getAll({
    ...options,
    filters,
    userId // For visibility checks
  });
}

async deleteDraftsByDateRange(teamId, startDate, endDate, userId, force = false) {
  // Check permissions - must be team admin
  const member = await teamMemberService.getMember(teamId, userId);
  if (!member || member.role !== 'admin') {
    throw new ForbiddenError('Only team admins can bulk delete practice plans');
  }
  
  return await this.withTransaction(async (client) => {
    // Build query based on force flag
    let query = `
      DELETE FROM practice_plans
      WHERE team_id = $1
        AND scheduled_date >= $2
        AND scheduled_date <= $3
        AND status = 'draft'
    `;
    
    const params = [teamId, startDate, endDate];
    
    // Only delete unedited plans unless force is true
    if (!force) {
      query += ' AND is_edited = false';
    }
    
    query += ' RETURNING id, name, scheduled_date';
    
    const result = await client.query(query, params);
    
    return {
      deleted: result.rows,
      count: result.rowCount
    };
  });
}
```

#### 3. Validation Schemas (`src/lib/validation/practicePlanSchema.ts` additions)
```typescript
export const instantiatePlanSchema = z.object({
  season_id: z.string().uuid(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  team_id: z.string().uuid()
});

export const batchGenerateSchema = z.object({
  season_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  team_id: z.string().uuid()
}).refine(data => {
  return new Date(data.start_date) <= new Date(data.end_date);
}, {
  message: "Start date must be before or equal to end date",
  path: ["end_date"]
});

export const bulkDeleteSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  force: z.boolean().default(false)
}).refine(data => {
  return new Date(data.start_date) <= new Date(data.end_date);
}, {
  message: "Start date must be before or equal to end date",
  path: ["end_date"]
});
```

### API Routes

#### 1. Instantiate Practice Plan (`src/routes/api/seasons/[seasonId]/instantiate/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { seasonUnionService } from '$lib/server/services/seasonUnionService';
import { teamMemberService } from '$lib/server/services/teamMemberService';
import { seasonService } from '$lib/server/services/seasonService';
import { instantiatePlanSchema } from '$lib/validation/practicePlanSchema';

export async function POST({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    
    // Get season to find team
    const season = await seasonService.getById(params.seasonId);
    
    // Verify user is team admin
    const member = await teamMemberService.getMember(season.team_id, locals.user.id);
    if (!member || member.role !== 'admin') {
      return json({ error: 'Only team admins can create practice plans' }, { status: 403 });
    }
    
    const validated = instantiatePlanSchema.parse({
      season_id: params.seasonId,
      scheduled_date: data.scheduled_date,
      team_id: season.team_id
    });
    
    const practicePlan = await seasonUnionService.instantiatePracticePlan(
      validated.season_id,
      validated.scheduled_date,
      locals.user.id,
      validated.team_id
    );
    
    return json(practicePlan, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

#### 2. Batch Generate Plans (`src/routes/api/seasons/[seasonId]/generate-drafts/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { seasonUnionService } from '$lib/server/services/seasonUnionService';
import { teamMemberService } from '$lib/server/services/teamMemberService';
import { seasonService } from '$lib/server/services/seasonService';
import { batchGenerateSchema } from '$lib/validation/practicePlanSchema';

export async function POST({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    
    // Get season to find team
    const season = await seasonService.getById(params.seasonId);
    
    // Verify user is team admin
    const member = await teamMemberService.getMember(season.team_id, locals.user.id);
    if (!member || member.role !== 'admin') {
      return json({ error: 'Only team admins can batch generate practice plans' }, { status: 403 });
    }
    
    const validated = batchGenerateSchema.parse({
      season_id: params.seasonId,
      start_date: data.start_date,
      end_date: data.end_date,
      team_id: season.team_id
    });
    
    const results = await seasonUnionService.batchGeneratePractices(
      validated.season_id,
      validated.start_date,
      validated.end_date,
      locals.user.id,
      validated.team_id
    );
    
    return json(results);
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

#### 3. Publish/Unpublish Plan (`src/routes/api/practice-plans/[id]/publish/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService';

export async function POST({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const plan = await practicePlanService.publishPracticePlan(
      params.id,
      locals.user.id
    );
    
    return json(plan);
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function DELETE({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const plan = await practicePlanService.unpublishPracticePlan(
      params.id,
      locals.user.id
    );
    
    return json(plan);
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

#### 4. Bulk Delete Drafts (`src/routes/api/teams/[teamId]/practice-plans/bulk-delete/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService';
import { bulkDeleteSchema } from '$lib/validation/practicePlanSchema';

export async function POST({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const validated = bulkDeleteSchema.parse(data);
    
    const result = await practicePlanService.deleteDraftsByDateRange(
      params.teamId,
      validated.start_date,
      validated.end_date,
      locals.user.id,
      validated.force
    );
    
    return json(result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

### Frontend Implementation

#### 1. Updated Season Timeline with Click-to-Create (`src/lib/components/season/SeasonTimeline.svelte` updates)
```svelte
<script>
  // Add to existing script section
  import { goto } from '$app/navigation';
  
  export let onDateClick = async (date) => {
    if (!isAdmin) return;
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if practice already exists for this date
    const existing = existingPractices.find(p => p.scheduled_date === dateStr);
    
    if (existing) {
      // Navigate to existing practice
      goto(`/practice-plans/${existing.id}`);
    } else {
      // Create new practice
      try {
        const response = await fetch(`/api/seasons/${season.id}/instantiate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduled_date: dateStr })
        });
        
        if (response.ok) {
          const plan = await response.json();
          goto(`/practice-plans/${plan.id}/edit`);
        } else {
          const error = await response.json();
          alert(`Failed to create practice: ${error.error}`);
        }
      } catch (error) {
        console.error('Error creating practice:', error);
        alert('Failed to create practice plan');
      }
    }
  };
  
  // Load existing practices for the season
  let existingPractices = [];
  
  onMount(async () => {
    if (season.team_id) {
      const response = await fetch(`/api/teams/${season.team_id}/practice-plans?season_id=${season.id}`);
      if (response.ok) {
        const data = await response.json();
        existingPractices = data.items || [];
      }
    }
  });
  
  // Add visual indicators for existing practices
  function hasExistingPractice(date) {
    const dateStr = date.toISOString().split('T')[0];
    return existingPractices.some(p => p.scheduled_date === dateStr);
  }
  
  function getPracticeStatus(date) {
    const dateStr = date.toISOString().split('T')[0];
    const practice = existingPractices.find(p => p.scheduled_date === dateStr);
    return practice?.status || null;
  }
</script>

<!-- Update day markers in template to show practice indicators -->
{#each dateRange as date, i}
  {@const isWeekend = date.getDay() === 0 || date.getDay() === 6}
  {@const isToday = date.toDateString() === new Date().toDateString()}
  {@const hasPractice = hasExistingPractice(date)}
  {@const practiceStatus = getPracticeStatus(date)}
  
  <button
    class="absolute border-r border-gray-200 text-xs flex items-center justify-center
           {isWeekend ? 'bg-gray-100' : 'bg-white'}
           {isToday ? 'ring-2 ring-blue-500 z-10' : ''}
           {hasPractice ? (practiceStatus === 'published' ? 'bg-green-50' : 'bg-yellow-50') : ''}
           {isAdmin ? 'hover:bg-blue-50 cursor-pointer' : ''}"
    style="left: {i * DAY_WIDTH}px; width: {DAY_WIDTH}px; height: 30px; top: 30px;"
    on:click={() => handleDateClick(date)}
    disabled={!isAdmin}
    title={hasPractice ? `Practice (${practiceStatus})` : 'Click to create practice'}
  >
    {date.getDate()}
    {#if hasPractice}
      <span class="absolute bottom-0 left-0 right-0 h-1 
                   {practiceStatus === 'published' ? 'bg-green-500' : 'bg-yellow-500'}">
      </span>
    {/if}
  </button>
{/each}
```

#### 2. Practice Plan Editor Updates (`src/routes/practice-plans/[id]/edit/+page.svelte` additions)
```svelte
<script>
  // Add to existing script
  export let data;
  
  $: isDraft = data.plan.status === 'draft';
  $: isPublished = data.plan.status === 'published';
  $: isTeamPlan = !!data.plan.team_id;
  $: isLinkedToTemplate = !!data.plan.template_plan_id;
  $: isEdited = data.plan.is_edited;
  
  async function publishPlan() {
    if (!confirm('Are you sure you want to publish this practice plan? It will become visible to all team members.')) {
      return;
    }
    
    const response = await fetch(`/api/practice-plans/${data.plan.id}/publish`, {
      method: 'POST'
    });
    
    if (response.ok) {
      const updated = await response.json();
      data.plan = updated;
      alert('Practice plan published successfully!');
    } else {
      const error = await response.json();
      alert(`Failed to publish: ${error.error}`);
    }
  }
  
  async function unpublishPlan() {
    if (!confirm('Are you sure you want to unpublish this practice plan? It will no longer be visible to team members.')) {
      return;
    }
    
    const response = await fetch(`/api/practice-plans/${data.plan.id}/publish`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      const updated = await response.json();
      data.plan = updated;
      alert('Practice plan unpublished');
    } else {
      const error = await response.json();
      alert(`Failed to unpublish: ${error.error}`);
    }
  }
</script>

<!-- Add status indicators and publish controls to template -->
<div class="container mx-auto p-6">
  {#if isTeamPlan}
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <span class="text-sm font-medium text-gray-600">Status:</span>
          {#if isDraft}
            <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              Draft
            </span>
          {:else if isPublished}
            <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Published
            </span>
          {/if}
          
          {#if isLinkedToTemplate}
            <span class="text-sm text-gray-500">
              Linked to template #{data.plan.template_plan_id}
              {#if isEdited}
                <span class="text-orange-600">(edited)</span>
              {/if}
            </span>
          {/if}
          
          {#if data.plan.scheduled_date}
            <span class="text-sm text-gray-600">
              Scheduled: {new Date(data.plan.scheduled_date).toLocaleDateString()}
            </span>
          {/if}
        </div>
        
        <div class="flex space-x-2">
          {#if isDraft}
            <button
              on:click={publishPlan}
              class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Publish
            </button>
          {:else if isPublished}
            <button
              on:click={unpublishPlan}
              class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Unpublish
            </button>
          {/if}
        </div>
      </div>
      
      {#if isDraft}
        <p class="text-sm text-gray-500 mt-2">
          This practice plan is currently a draft and is only visible to team admins.
        </p>
      {:else if isPublished}
        <p class="text-sm text-gray-500 mt-2">
          This practice plan is published and visible to all team members.
          {#if data.plan.published_at}
            Published on {new Date(data.plan.published_at).toLocaleDateString()}
          {/if}
        </p>
      {/if}
    </div>
  {/if}
  
  <!-- Rest of existing editor content -->
</div>
```

#### 3. Batch Generation Modal (`src/lib/components/season/BatchGenerateModal.svelte`)
```svelte
<script>
  import { createEventDispatcher } from 'svelte';
  
  export let seasonId;
  export let seasonStartDate;
  export let seasonEndDate;
  
  const dispatch = createEventDispatcher();
  
  let startDate = '';
  let endDate = '';
  let isGenerating = false;
  let results = null;
  
  async function generatePractices() {
    isGenerating = true;
    results = null;
    
    try {
      const response = await fetch(`/api/seasons/${seasonId}/generate-drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_date: startDate, end_date: endDate })
      });
      
      if (response.ok) {
        results = await response.json();
        dispatch('generated', results);
      } else {
        const error = await response.json();
        alert(`Failed to generate practices: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating practices:', error);
      alert('Failed to generate practice plans');
    } finally {
      isGenerating = false;
    }
  }
  
  function close() {
    dispatch('close');
  }
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg p-6 max-w-md w-full">
    <h2 class="text-2xl font-bold mb-4">Batch Generate Practice Plans</h2>
    
    {#if !results}
      <p class="text-gray-600 mb-4">
        Generate draft practice plans for a date range based on your season sections and template.
      </p>
      
      <div class="space-y-4">
        <label class="block">
          <span class="text-gray-700">Start Date</span>
          <input
            type="date"
            bind:value={startDate}
            min={seasonStartDate}
            max={seasonEndDate}
            class="mt-1 block w-full p-2 border rounded"
            disabled={isGenerating}
          />
        </label>
        
        <label class="block">
          <span class="text-gray-700">End Date</span>
          <input
            type="date"
            bind:value={endDate}
            min={startDate || seasonStartDate}
            max={seasonEndDate}
            class="mt-1 block w-full p-2 border rounded"
            disabled={isGenerating}
          />
        </label>
      </div>
      
      <div class="mt-6 flex justify-end space-x-2">
        <button
          on:click={close}
          disabled={isGenerating}
          class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          on:click={generatePractices}
          disabled={!startDate || !endDate || isGenerating}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>
    {:else}
      <div class="space-y-4">
        <div class="bg-green-50 p-3 rounded">
          <p class="font-semibold text-green-800">
            Created: {results.created.length} practice plans
          </p>
          {#if results.created.length > 0}
            <ul class="mt-2 text-sm text-green-700">
              {#each results.created.slice(0, 5) as item}
                <li>• {item.date}: {item.name}</li>
              {/each}
              {#if results.created.length > 5}
                <li>... and {results.created.length - 5} more</li>
              {/if}
            </ul>
          {/if}
        </div>
        
        {#if results.skipped.length > 0}
          <div class="bg-yellow-50 p-3 rounded">
            <p class="font-semibold text-yellow-800">
              Skipped: {results.skipped.length} dates
            </p>
            <ul class="mt-2 text-sm text-yellow-700">
              {#each results.skipped.slice(0, 3) as item}
                <li>• {item.date}: {item.reason}</li>
              {/each}
              {#if results.skipped.length > 3}
                <li>... and {results.skipped.length - 3} more</li>
              {/if}
            </ul>
          </div>
        {/if}
        
        {#if results.errors.length > 0}
          <div class="bg-red-50 p-3 rounded">
            <p class="font-semibold text-red-800">
              Errors: {results.errors.length}
            </p>
            <ul class="mt-2 text-sm text-red-700">
              {#each results.errors as item}
                <li>• {item.date}: {item.error}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
      
      <div class="mt-6 flex justify-end">
        <button
          on:click={close}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Done
        </button>
      </div>
    {/if}
  </div>
</div>
```

### Testing

#### Union Service Test (`src/lib/server/services/__tests__/seasonUnionService.test.js`)
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { seasonUnionService } from '../seasonUnionService';
import { seasonService } from '../seasonService';
import { seasonSectionService } from '../seasonSectionService';
import { practicePlanService } from '../practicePlanService';
import { teamService } from '../teamService';

describe('SeasonUnionService', () => {
  let testTeam;
  let testSeason;
  let testSection;
  let testUserId = 'test-user-123';
  
  beforeEach(async () => {
    // Create test team, season, and section
    testTeam = await teamService.create({
      name: 'Test Team',
      timezone: 'America/New_York',
      default_start_time: '18:00:00'
    }, testUserId);
    
    testSeason = await seasonService.create({
      team_id: testTeam.id,
      name: 'Spring 2024',
      start_date: '2024-03-01',
      end_date: '2024-05-31',
      is_active: true
    }, testUserId);
    
    testSection = await seasonSectionService.create({
      season_id: testSeason.id,
      name: 'Early Season',
      start_date: '2024-03-01',
      end_date: '2024-03-31'
    }, testUserId);
    
    // Add default sections
    await seasonSectionService.setDefaultSections(testSection.id, [
      { section_name: 'Warm-up', order: 0, goals: ['Prepare body'] },
      { section_name: 'Main Work', order: 1, goals: ['Skills development'] }
    ], testUserId);
    
    // Add linked drills
    await seasonSectionService.setLinkedDrills(testSection.id, [
      { type: 'drill', drill_id: 1, default_duration_minutes: 15 },
      { type: 'break', name: 'Water', default_duration_minutes: 5 }
    ], testUserId);
  });
  
  it('should instantiate a practice plan using union algorithm', async () => {
    const plan = await seasonUnionService.instantiatePracticePlan(
      testSeason.id,
      '2024-03-15',
      testUserId,
      testTeam.id
    );
    
    expect(plan).toBeDefined();
    expect(plan.team_id).toBe(testTeam.id);
    expect(plan.season_id).toBe(testSeason.id);
    expect(plan.scheduled_date).toBe('2024-03-15');
    expect(plan.status).toBe('draft');
    expect(plan.sections).toHaveLength(2);
    expect(plan.drills).toHaveLength(2);
  });
  
  it('should find overlapping sections correctly', async () => {
    // Add another section
    await seasonSectionService.create({
      season_id: testSeason.id,
      name: 'Mid Season',
      start_date: '2024-03-15',
      end_date: '2024-04-15'
    }, testUserId);
    
    const overlapping = await seasonUnionService.getOverlappingSections(
      testSeason.id,
      '2024-03-20'
    );
    
    expect(overlapping).toHaveLength(2); // Both Early and Mid season
  });
  
  it('should merge sections from multiple overlapping periods', async () => {
    const midSection = await seasonSectionService.create({
      season_id: testSeason.id,
      name: 'Mid Season',
      start_date: '2024-03-15',
      end_date: '2024-04-15'
    }, testUserId);
    
    await seasonSectionService.setDefaultSections(midSection.id, [
      { section_name: 'Warm-up', order: 0, goals: ['Dynamic stretching'] },
      { section_name: 'Cool-down', order: 2, goals: ['Recovery'] }
    ], testUserId);
    
    const unionData = await seasonUnionService.buildUnionStructure(
      testSeason,
      [testSection, midSection],
      '2024-03-20',
      testTeam.id
    );
    
    // Should have merged Warm-up and added Cool-down
    expect(unionData.sections).toHaveLength(3);
    
    const warmup = unionData.sections.find(s => s.name === 'Warm-up');
    expect(warmup.goals).toContain('Prepare body');
    expect(warmup.goals).toContain('Dynamic stretching');
  });
  
  it('should prevent duplicate practice plans for same date', async () => {
    // Create first plan
    await seasonUnionService.instantiatePracticePlan(
      testSeason.id,
      '2024-03-15',
      testUserId,
      testTeam.id
    );
    
    // Try to create another for same date
    await expect(
      seasonUnionService.instantiatePracticePlan(
        testSeason.id,
        '2024-03-15',
        testUserId,
        testTeam.id
      )
    ).rejects.toThrow('A practice plan already exists for this date');
  });
  
  it('should batch generate practices correctly', async () => {
    const results = await seasonUnionService.batchGeneratePractices(
      testSeason.id,
      '2024-03-10',
      '2024-03-12',
      testUserId,
      testTeam.id
    );
    
    expect(results.created).toHaveLength(3);
    expect(results.skipped).toHaveLength(0);
    expect(results.errors).toHaveLength(0);
  });
  
  it('should respect edited flag when updating', async () => {
    const plan = await seasonUnionService.instantiatePracticePlan(
      testSeason.id,
      '2024-03-15',
      testUserId,
      testTeam.id
    );
    
    expect(plan.is_edited).toBe(false);
    
    // Update the plan
    const updated = await practicePlanService.updatePracticePlan(
      plan.id,
      { name: 'Custom Name' },
      testUserId
    );
    
    expect(updated.is_edited).toBe(true);
  });
});
```

### Acceptance Criteria
- [ ] Practice plans table has all season planning columns
- [ ] Unique constraint prevents multiple plans per team per date
- [ ] Union algorithm correctly combines template + sections
- [ ] Overlapping sections merge properly (goals concatenated)
- [ ] Linked drills are added without exact duplicates
- [ ] Default duration of 30 minutes applied when not specified
- [ ] Click on timeline date creates draft practice
- [ ] Draft plans only visible to admins and creators
- [ ] Published plans visible to all team members
- [ ] Edit tracking marks plans as edited when content changes
- [ ] Batch generation creates multiple drafts efficiently
- [ ] Bulk delete respects is_edited flag unless forced
- [ ] Publishing updates status and timestamp
- [ ] Tests pass for union algorithm and workflows

### Dependencies
- Phase 3 must be complete (Sections and timeline working)
- Practice plans support sections and drills
- Team permissions working

### Notes
- Union algorithm is order-dependent (template first, then sections)
- Sections with same name merge goals but keep first instance
- Draft is default status for new plans
- Published plans appear in ICS feeds (Phase 7)
- Edited flag prevents accidental deletion
- One practice per team per date enforced by database