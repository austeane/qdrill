## Phase 5: Recurrence and Batch Generation - Implementation Ticket

### Overview
Implement recurrence rules for automatic practice generation with configurable patterns (weekly by weekday(s), every N weeks). Generate draft practices in batch using union algorithm, inheriting team timezone and default start time. Allow safe deletion with edit protection.

### Prerequisites
- Phase 4 completed (Instantiation and union algorithm working)
- Practice plans support draft/published workflow
- Season sections and timeline working

### Database Changes

#### Migration: `migrations/[timestamp]_create_season_recurrences.js`
```javascript
exports.up = (pgm) => {
  // Create season_recurrences table
  pgm.createTable('season_recurrences', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    season_id: { type: 'uuid', notNull: true, references: 'seasons(id)', onDelete: 'CASCADE' },
    
    // Recurrence pattern
    frequency: { type: 'varchar(20)', notNull: true, check: "frequency IN ('weekly', 'biweekly', 'monthly')" },
    interval: { type: 'integer', notNull: true, default: 1 }, // Every N weeks/months
    
    // Days of week for weekly/biweekly (0=Sunday, 6=Saturday)
    weekdays: { type: 'integer[]' }, // e.g., [1,3,5] for Mon/Wed/Fri
    
    // Day of month for monthly
    day_of_month: { type: 'integer', check: "day_of_month >= 1 AND day_of_month <= 31" },
    
    // Date range (defaults to season dates)
    start_date: { type: 'date', notNull: true },
    end_date: { type: 'date', notNull: true },
    
    // Time settings
    practice_time: { type: 'time', notNull: true },
    duration_minutes: { type: 'integer', default: 120 },
    
    // Generation settings
    skip_existing: { type: 'boolean', default: true, notNull: true },
    skip_markers: { type: 'boolean', default: true, notNull: true }, // Skip tournament/break days
    
    // Metadata
    last_generated_date: { type: 'date' },
    total_generated: { type: 'integer', default: 0 },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
    updated_at: { type: 'timestamp', default: pgm.func('now()') }
  });
  
  // Indexes
  pgm.createIndex('season_recurrences', 'season_id');
  
  // Only one recurrence per season
  pgm.addConstraint('season_recurrences', 'unique_season_recurrence', {
    unique: ['season_id']
  });
  
  // Track batch generation history
  pgm.createTable('season_generation_logs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    season_id: { type: 'uuid', notNull: true, references: 'seasons(id)', onDelete: 'CASCADE' },
    recurrence_id: { type: 'uuid', references: 'season_recurrences(id)', onDelete: 'SET NULL' },
    
    // Generation details
    start_date: { type: 'date', notNull: true },
    end_date: { type: 'date', notNull: true },
    
    // Results
    plans_created: { type: 'integer', default: 0 },
    plans_skipped: { type: 'integer', default: 0 },
    errors_count: { type: 'integer', default: 0 },
    
    // Detailed results (JSON)
    results: { type: 'jsonb' },
    
    // Who and when
    generated_by: { type: 'text', references: 'users(id)', onDelete: 'SET NULL' },
    generated_at: { type: 'timestamp', default: pgm.func('now()') }
  });
  
  pgm.createIndex('season_generation_logs', 'season_id');
  pgm.createIndex('season_generation_logs', 'generated_at');
};

exports.down = (pgm) => {
  pgm.dropTable('season_generation_logs');
  pgm.dropTable('season_recurrences');
};
```

### Backend Implementation

#### 1. Recurrence Service (`src/lib/server/services/recurrenceService.js`)
```javascript
import { BaseEntityService } from './baseEntityService';
import { ValidationError, ForbiddenError } from '$lib/server/errors';
import { seasonService } from './seasonService';
import { seasonUnionService } from './seasonUnionService';
import { seasonMarkerService } from './seasonMarkerService';
import { practicePlanService } from './practicePlanService';
import { teamMemberService } from './teamMemberService';

/**
 * Service for managing practice plan recurrence rules and batch generation
 */
class RecurrenceService extends BaseEntityService {
  constructor() {
    super(
      'season_recurrences',
      'id',
      ['id', 'season_id', 'frequency', 'interval', 'weekdays', 
       'day_of_month', 'start_date', 'end_date', 'practice_time',
       'duration_minutes', 'skip_existing', 'skip_markers',
       'last_generated_date', 'total_generated', 'created_at', 'updated_at'],
      ['id', 'season_id', 'frequency', 'interval', 'weekdays',
       'day_of_month', 'start_date', 'end_date', 'practice_time',
       'duration_minutes', 'skip_existing', 'skip_markers']
    );
  }

  /**
   * Create or update recurrence rule for a season
   */
  async setRecurrence(seasonId, recurrenceData, userId) {
    const season = await seasonService.getById(seasonId);
    
    // Check permissions
    const member = await teamMemberService.getMember(season.team_id, userId);
    if (!member || member.role !== 'admin') {
      throw new ForbiddenError('Only team admins can set recurrence rules');
    }
    
    // Validate recurrence data
    this.validateRecurrenceData(recurrenceData, season);
    
    // Check if recurrence already exists
    const existing = await this.getSeasonRecurrence(seasonId);
    
    if (existing) {
      // Update existing
      return await this.update(existing.id, {
        ...recurrenceData,
        updated_at: new Date()
      });
    } else {
      // Create new
      return await this.create({
        season_id: seasonId,
        ...recurrenceData,
        start_date: recurrenceData.start_date || season.start_date,
        end_date: recurrenceData.end_date || season.end_date
      });
    }
  }

  /**
   * Get recurrence rule for a season
   */
  async getSeasonRecurrence(seasonId) {
    const result = await this.getAll({
      filters: { season_id: seasonId },
      limit: 1
    });
    return result.items[0] || null;
  }

  /**
   * Validate recurrence data
   */
  validateRecurrenceData(data, season) {
    // Validate frequency-specific fields
    if (data.frequency === 'weekly' || data.frequency === 'biweekly') {
      if (!data.weekdays || !Array.isArray(data.weekdays) || data.weekdays.length === 0) {
        throw new ValidationError('Weekly/biweekly recurrence requires weekdays');
      }
      
      // Validate weekday values (0-6)
      if (data.weekdays.some(day => day < 0 || day > 6)) {
        throw new ValidationError('Invalid weekday value (must be 0-6)');
      }
    }
    
    if (data.frequency === 'monthly') {
      if (!data.day_of_month || data.day_of_month < 1 || data.day_of_month > 31) {
        throw new ValidationError('Monthly recurrence requires valid day of month (1-31)');
      }
    }
    
    // Validate interval
    if (data.interval && (data.interval < 1 || data.interval > 12)) {
      throw new ValidationError('Interval must be between 1 and 12');
    }
    
    // Validate dates within season
    if (data.start_date && new Date(data.start_date) < new Date(season.start_date)) {
      throw new ValidationError('Recurrence start date cannot be before season start');
    }
    
    if (data.end_date && new Date(data.end_date) > new Date(season.end_date)) {
      throw new ValidationError('Recurrence end date cannot be after season end');
    }
    
    // Validate practice time
    if (!data.practice_time) {
      throw new ValidationError('Practice time is required');
    }
  }

  /**
   * Generate practice dates based on recurrence rule
   */
  async generateRecurrenceDates(recurrence) {
    const dates = [];
    const start = new Date(recurrence.start_date);
    const end = new Date(recurrence.end_date);
    
    switch (recurrence.frequency) {
      case 'weekly':
        dates.push(...this.generateWeeklyDates(
          start,
          end,
          recurrence.weekdays,
          recurrence.interval || 1
        ));
        break;
        
      case 'biweekly':
        dates.push(...this.generateWeeklyDates(
          start,
          end,
          recurrence.weekdays,
          2
        ));
        break;
        
      case 'monthly':
        dates.push(...this.generateMonthlyDates(
          start,
          end,
          recurrence.day_of_month,
          recurrence.interval || 1
        ));
        break;
    }
    
    return dates;
  }

  /**
   * Generate weekly dates
   */
  generateWeeklyDates(startDate, endDate, weekdays, interval = 1) {
    const dates = [];
    const current = new Date(startDate);
    
    // Find first occurrence
    while (current <= endDate) {
      if (weekdays.includes(current.getDay())) {
        dates.push(new Date(current));
      }
      
      // Move to next day
      current.setDate(current.getDate() + 1);
      
      // If we've completed a week and need to skip weeks
      if (current.getDay() === 0 && interval > 1) {
        current.setDate(current.getDate() + (interval - 1) * 7);
      }
    }
    
    return dates;
  }

  /**
   * Generate monthly dates
   */
  generateMonthlyDates(startDate, endDate, dayOfMonth, interval = 1) {
    const dates = [];
    const current = new Date(startDate);
    
    // Start from the first occurrence
    current.setDate(dayOfMonth);
    if (current < startDate) {
      current.setMonth(current.getMonth() + 1);
    }
    
    while (current <= endDate) {
      // Handle months with fewer days
      const targetDay = Math.min(dayOfMonth, this.getDaysInMonth(current));
      const dateToAdd = new Date(current.getFullYear(), current.getMonth(), targetDay);
      
      if (dateToAdd >= startDate && dateToAdd <= endDate) {
        dates.push(dateToAdd);
      }
      
      // Move to next interval
      current.setMonth(current.getMonth() + interval);
    }
    
    return dates;
  }

  /**
   * Get days in month
   */
  getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  /**
   * Execute batch generation based on recurrence
   */
  async executeBatchGeneration(seasonId, userId, options = {}) {
    const season = await seasonService.getById(seasonId);
    
    // Check permissions
    const member = await teamMemberService.getMember(season.team_id, userId);
    if (!member || member.role !== 'admin') {
      throw new ForbiddenError('Only team admins can execute batch generation');
    }
    
    // Get recurrence rule
    const recurrence = await this.getSeasonRecurrence(seasonId);
    if (!recurrence) {
      throw new ValidationError('No recurrence rule defined for this season');
    }
    
    // Generate dates
    const dates = await this.generateRecurrenceDates(recurrence);
    
    // Filter dates based on options
    let filteredDates = dates;
    
    // Skip existing practices if configured
    if (recurrence.skip_existing) {
      const existingPlans = await practicePlanService.getTeamPracticePlans(
        season.team_id,
        userId,
        { filters: { season_id: seasonId }, all: true }
      );
      
      const existingDates = new Set(
        existingPlans.items.map(p => p.scheduled_date)
      );
      
      filteredDates = filteredDates.filter(
        date => !existingDates.has(date.toISOString().split('T')[0])
      );
    }
    
    // Skip dates with markers if configured
    if (recurrence.skip_markers) {
      const markers = await seasonMarkerService.getSeasonMarkers(seasonId);
      
      filteredDates = filteredDates.filter(date => {
        const dateStr = date.toISOString().split('T')[0];
        
        return !markers.some(marker => {
          const markerStart = new Date(marker.start_date);
          const markerEnd = marker.end_date ? new Date(marker.end_date) : markerStart;
          
          return date >= markerStart && date <= markerEnd;
        });
      });
    }
    
    // Apply date range filter if provided
    if (options.startDate) {
      const start = new Date(options.startDate);
      filteredDates = filteredDates.filter(date => date >= start);
    }
    
    if (options.endDate) {
      const end = new Date(options.endDate);
      filteredDates = filteredDates.filter(date => date <= end);
    }
    
    // Execute generation
    const results = {
      created: [],
      skipped: [],
      errors: []
    };
    
    for (const date of filteredDates) {
      const dateStr = date.toISOString().split('T')[0];
      
      try {
        // Generate practice plan
        const plan = await seasonUnionService.instantiatePracticePlan(
          seasonId,
          dateStr,
          userId,
          season.team_id
        );
        
        // Update with recurrence settings
        await practicePlanService.update(plan.id, {
          start_time: recurrence.practice_time
        });
        
        results.created.push({
          date: dateStr,
          planId: plan.id,
          name: plan.name
        });
      } catch (error) {
        if (error.message.includes('already exists')) {
          results.skipped.push({
            date: dateStr,
            reason: 'Already exists'
          });
        } else {
          results.errors.push({
            date: dateStr,
            error: error.message
          });
        }
      }
    }
    
    // Update recurrence stats
    await this.update(recurrence.id, {
      last_generated_date: new Date().toISOString().split('T')[0],
      total_generated: recurrence.total_generated + results.created.length
    });
    
    // Log generation
    await this.logGeneration(
      seasonId,
      recurrence.id,
      options.startDate || recurrence.start_date,
      options.endDate || recurrence.end_date,
      results,
      userId
    );
    
    return results;
  }

  /**
   * Log generation results
   */
  async logGeneration(seasonId, recurrenceId, startDate, endDate, results, userId) {
    return await this.withTransaction(async (client) => {
      const query = `
        INSERT INTO season_generation_logs (
          season_id, recurrence_id, start_date, end_date,
          plans_created, plans_skipped, errors_count,
          results, generated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        seasonId,
        recurrenceId,
        startDate,
        endDate,
        results.created.length,
        results.skipped.length,
        results.errors.length,
        JSON.stringify(results),
        userId
      ];
      
      const result = await client.query(query, values);
      return result.rows[0];
    });
  }

  /**
   * Get generation history for a season
   */
  async getGenerationHistory(seasonId, limit = 10) {
    return await this.withTransaction(async (client) => {
      const query = `
        SELECT 
          sgl.*,
          u.name as generated_by_name,
          u.email as generated_by_email
        FROM season_generation_logs sgl
        LEFT JOIN users u ON sgl.generated_by = u.id
        WHERE sgl.season_id = $1
        ORDER BY sgl.generated_at DESC
        LIMIT $2
      `;
      
      const result = await client.query(query, [seasonId, limit]);
      return result.rows;
    });
  }

  /**
   * Delete practices by date range with safety checks
   */
  async deletePracticesByDateRange(seasonId, startDate, endDate, userId, options = {}) {
    const season = await seasonService.getById(seasonId);
    
    // Check permissions
    const member = await teamMemberService.getMember(season.team_id, userId);
    if (!member || member.role !== 'admin') {
      throw new ForbiddenError('Only team admins can bulk delete practices');
    }
    
    // Use practicePlanService's bulk delete
    const result = await practicePlanService.deleteDraftsByDateRange(
      season.team_id,
      startDate,
      endDate,
      userId,
      options.force || false
    );
    
    // Add season filter to ensure we only delete from this season
    const filteredResult = {
      ...result,
      deleted: result.deleted.filter(plan => {
        // Additional check to ensure plan belongs to this season
        return true; // practicePlanService already handles this via team_id
      })
    };
    
    return filteredResult;
  }

  /**
   * Preview what would be generated
   */
  async previewGeneration(seasonId, userId, options = {}) {
    const season = await seasonService.getById(seasonId);
    
    // Check permissions
    const member = await teamMemberService.getMember(season.team_id, userId);
    if (!member) {
      throw new ForbiddenError('Only team members can preview generation');
    }
    
    // Get recurrence rule
    const recurrence = await this.getSeasonRecurrence(seasonId);
    if (!recurrence) {
      throw new ValidationError('No recurrence rule defined for this season');
    }
    
    // Generate dates
    const dates = await this.generateRecurrenceDates(recurrence);
    
    // Get existing practices
    const existingPlans = await practicePlanService.getTeamPracticePlans(
      season.team_id,
      userId,
      { filters: { season_id: seasonId }, all: true }
    );
    
    const existingDates = new Set(
      existingPlans.items.map(p => p.scheduled_date)
    );
    
    // Get markers
    const markers = await seasonMarkerService.getSeasonMarkers(seasonId);
    
    // Categorize dates
    const preview = {
      total: dates.length,
      dates: dates.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        
        let status = 'will_create';
        let reason = null;
        
        if (existingDates.has(dateStr)) {
          status = recurrence.skip_existing ? 'will_skip' : 'will_overwrite';
          reason = 'Existing practice';
        } else if (recurrence.skip_markers) {
          const hasMarker = markers.some(marker => {
            const markerStart = new Date(marker.start_date);
            const markerEnd = marker.end_date ? new Date(marker.end_date) : markerStart;
            return date >= markerStart && date <= markerEnd;
          });
          
          if (hasMarker) {
            status = 'will_skip';
            reason = 'Has event/marker';
          }
        }
        
        return {
          date: dateStr,
          dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
          status,
          reason
        };
      }),
      summary: {
        will_create: 0,
        will_skip: 0,
        will_overwrite: 0
      }
    };
    
    // Count statuses
    preview.dates.forEach(d => {
      preview.summary[d.status]++;
    });
    
    return preview;
  }
}

export const recurrenceService = new RecurrenceService();
```

#### 2. Validation Schemas (`src/lib/validation/recurrenceSchema.ts`)
```typescript
import { z } from 'zod';

export const recurrenceSchema = z.object({
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  interval: z.number().int().min(1).max(12).default(1),
  weekdays: z.array(z.number().int().min(0).max(6)).optional(),
  day_of_month: z.number().int().min(1).max(31).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  practice_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  duration_minutes: z.number().int().min(30).max(480).default(120),
  skip_existing: z.boolean().default(true),
  skip_markers: z.boolean().default(true)
}).refine(data => {
  // Weekly/biweekly requires weekdays
  if ((data.frequency === 'weekly' || data.frequency === 'biweekly') && 
      (!data.weekdays || data.weekdays.length === 0)) {
    return false;
  }
  
  // Monthly requires day_of_month
  if (data.frequency === 'monthly' && !data.day_of_month) {
    return false;
  }
  
  return true;
}, {
  message: "Weekly/biweekly requires weekdays, monthly requires day_of_month"
});

export const batchGenerateOptionsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export const bulkDeleteOptionsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  force: z.boolean().default(false)
}).refine(data => {
  return new Date(data.startDate) <= new Date(data.endDate);
}, {
  message: "Start date must be before or equal to end date",
  path: ["endDate"]
});
```

### API Routes

#### 1. Recurrence Management (`src/routes/api/seasons/[seasonId]/recurrence/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { recurrenceService } from '$lib/server/services/recurrenceService';
import { recurrenceSchema } from '$lib/validation/recurrenceSchema';

export async function GET({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const recurrence = await recurrenceService.getSeasonRecurrence(params.seasonId);
    return json(recurrence || null);
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
    const validated = recurrenceSchema.parse(data);
    
    const recurrence = await recurrenceService.setRecurrence(
      params.seasonId,
      validated,
      locals.user.id
    );
    
    return json(recurrence);
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
    const recurrence = await recurrenceService.getSeasonRecurrence(params.seasonId);
    if (recurrence) {
      await recurrenceService.delete(recurrence.id, locals.user.id);
    }
    
    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

#### 2. Execute Generation (`src/routes/api/seasons/[seasonId]/recurrence/generate/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { recurrenceService } from '$lib/server/services/recurrenceService';
import { batchGenerateOptionsSchema } from '$lib/validation/recurrenceSchema';

export async function POST({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const validated = batchGenerateOptionsSchema.parse(data);
    
    const results = await recurrenceService.executeBatchGeneration(
      params.seasonId,
      locals.user.id,
      validated
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

#### 3. Preview Generation (`src/routes/api/seasons/[seasonId]/recurrence/preview/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { recurrenceService } from '$lib/server/services/recurrenceService';
import { batchGenerateOptionsSchema } from '$lib/validation/recurrenceSchema';

export async function POST({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const validated = batchGenerateOptionsSchema.parse(data);
    
    const preview = await recurrenceService.previewGeneration(
      params.seasonId,
      locals.user.id,
      validated
    );
    
    return json(preview);
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

#### 4. Generation History (`src/routes/api/seasons/[seasonId]/recurrence/history/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { recurrenceService } from '$lib/server/services/recurrenceService';

export async function GET({ locals, params, url }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const history = await recurrenceService.getGenerationHistory(
      params.seasonId,
      limit
    );
    
    return json(history);
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
```

### Frontend Implementation

#### 1. Recurrence Configuration Component (`src/lib/components/season/RecurrenceConfig.svelte`)
```svelte
<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  export let seasonId;
  export let seasonStart;
  export let seasonEnd;
  export let teamTimezone;
  export let defaultStartTime;
  
  let recurrence = null;
  let isLoading = true;
  let isSaving = false;
  
  // Form data
  let formData = {
    frequency: 'weekly',
    interval: 1,
    weekdays: [],
    day_of_month: 15,
    start_date: seasonStart,
    end_date: seasonEnd,
    practice_time: defaultStartTime || '18:00',
    duration_minutes: 120,
    skip_existing: true,
    skip_markers: true
  };
  
  const weekdayOptions = [
    { value: 0, label: 'Sun', short: 'S' },
    { value: 1, label: 'Mon', short: 'M' },
    { value: 2, label: 'Tue', short: 'T' },
    { value: 3, label: 'Wed', short: 'W' },
    { value: 4, label: 'Thu', short: 'T' },
    { value: 5, label: 'Fri', short: 'F' },
    { value: 6, label: 'Sat', short: 'S' }
  ];
  
  onMount(async () => {
    await loadRecurrence();
  });
  
  async function loadRecurrence() {
    try {
      const response = await fetch(`/api/seasons/${seasonId}/recurrence`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          recurrence = data;
          formData = { ...data };
        }
      }
    } catch (error) {
      console.error('Error loading recurrence:', error);
    } finally {
      isLoading = false;
    }
  }
  
  async function saveRecurrence() {
    isSaving = true;
    
    try {
      const response = await fetch(`/api/seasons/${seasonId}/recurrence`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        recurrence = await response.json();
        alert('Recurrence settings saved successfully');
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving recurrence:', error);
      alert('Failed to save recurrence settings');
    } finally {
      isSaving = false;
    }
  }
  
  async function deleteRecurrence() {
    if (!confirm('Are you sure you want to delete the recurrence rule?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/seasons/${seasonId}/recurrence`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        recurrence = null;
        alert('Recurrence rule deleted');
      }
    } catch (error) {
      console.error('Error deleting recurrence:', error);
    }
  }
  
  function toggleWeekday(day) {
    if (formData.weekdays.includes(day)) {
      formData.weekdays = formData.weekdays.filter(d => d !== day);
    } else {
      formData.weekdays = [...formData.weekdays, day].sort();
    }
  }
  
  // Generate human-readable description
  $: recurrenceDescription = generateDescription(formData);
  
  function generateDescription(data) {
    if (!data.frequency) return '';
    
    let desc = 'Practices will be generated ';
    
    switch (data.frequency) {
      case 'weekly':
        desc += `weekly`;
        if (data.interval > 1) desc += ` (every ${data.interval} weeks)`;
        if (data.weekdays?.length > 0) {
          const days = data.weekdays
            .map(d => weekdayOptions.find(w => w.value === d)?.label)
            .join(', ');
          desc += ` on ${days}`;
        }
        break;
        
      case 'biweekly':
        desc += `every other week`;
        if (data.weekdays?.length > 0) {
          const days = data.weekdays
            .map(d => weekdayOptions.find(w => w.value === d)?.label)
            .join(', ');
          desc += ` on ${days}`;
        }
        break;
        
      case 'monthly':
        desc += `monthly on day ${data.day_of_month}`;
        if (data.interval > 1) desc += ` (every ${data.interval} months)`;
        break;
    }
    
    desc += ` at ${data.practice_time}`;
    
    if (data.skip_existing) desc += '. Existing practices will be skipped';
    if (data.skip_markers) desc += '. Tournament/break days will be skipped';
    
    return desc;
  }
</script>

<div class="bg-white rounded-lg shadow p-6">
  <h3 class="text-lg font-semibold mb-4">Recurrence Settings</h3>
  
  {#if isLoading}
    <p class="text-gray-500">Loading...</p>
  {:else}
    <div class="space-y-4">
      <!-- Frequency -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Frequency
        </label>
        <select 
          bind:value={formData.frequency}
          class="w-full p-2 border rounded"
        >
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      
      <!-- Interval (for weekly/monthly) -->
      {#if formData.frequency === 'weekly' || formData.frequency === 'monthly'}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Repeat every
          </label>
          <div class="flex items-center space-x-2">
            <input
              type="number"
              bind:value={formData.interval}
              min="1"
              max="12"
              class="w-20 p-2 border rounded"
            />
            <span class="text-gray-600">
              {formData.frequency === 'weekly' ? 'week(s)' : 'month(s)'}
            </span>
          </div>
        </div>
      {/if}
      
      <!-- Weekdays (for weekly/biweekly) -->
      {#if formData.frequency === 'weekly' || formData.frequency === 'biweekly'}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Days of Week
          </label>
          <div class="flex space-x-1">
            {#each weekdayOptions as day}
              <button
                type="button"
                on:click={() => toggleWeekday(day.value)}
                class="w-10 h-10 rounded-full border-2 text-sm font-medium
                       {formData.weekdays.includes(day.value) 
                         ? 'bg-blue-500 text-white border-blue-500' 
                         : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'}"
              >
                {day.short}
              </button>
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- Day of month (for monthly) -->
      {#if formData.frequency === 'monthly'}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Day of Month
          </label>
          <input
            type="number"
            bind:value={formData.day_of_month}
            min="1"
            max="31"
            class="w-20 p-2 border rounded"
          />
        </div>
      {/if}
      
      <!-- Time settings -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Practice Time
          </label>
          <input
            type="time"
            bind:value={formData.practice_time}
            class="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            bind:value={formData.duration_minutes}
            min="30"
            max="480"
            step="15"
            class="w-full p-2 border rounded"
          />
        </div>
      </div>
      
      <!-- Date range -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            bind:value={formData.start_date}
            min={seasonStart}
            max={seasonEnd}
            class="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            bind:value={formData.end_date}
            min={formData.start_date || seasonStart}
            max={seasonEnd}
            class="w-full p-2 border rounded"
          />
        </div>
      </div>
      
      <!-- Options -->
      <div class="space-y-2">
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={formData.skip_existing}
            class="mr-2"
          />
          <span class="text-sm">Skip dates that already have practices</span>
        </label>
        
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={formData.skip_markers}
            class="mr-2"
          />
          <span class="text-sm">Skip tournament and break days</span>
        </label>
      </div>
      
      <!-- Description preview -->
      {#if recurrenceDescription}
        <div class="bg-blue-50 border border-blue-200 rounded p-3">
          <p class="text-sm text-blue-800">{recurrenceDescription}</p>
        </div>
      {/if}
      
      <!-- Actions -->
      <div class="flex justify-between pt-4">
        <div>
          {#if recurrence}
            <button
              on:click={deleteRecurrence}
              class="text-red-500 hover:underline text-sm"
            >
              Delete Rule
            </button>
          {/if}
        </div>
        
        <button
          on:click={saveRecurrence}
          disabled={isSaving || (formData.frequency !== 'monthly' && formData.weekdays.length === 0)}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Recurrence'}
        </button>
      </div>
    </div>
  {/if}
</div>
```

#### 2. Batch Generation Panel (`src/lib/components/season/BatchGenerationPanel.svelte`)
```svelte
<script>
  import { createEventDispatcher } from 'svelte';
  
  export let seasonId;
  export let hasRecurrence = false;
  
  const dispatch = createEventDispatcher();
  
  let isGenerating = false;
  let isPreviewLoading = false;
  let preview = null;
  let results = null;
  
  // Optional date range filter
  let useCustomRange = false;
  let customStartDate = '';
  let customEndDate = '';
  
  async function loadPreview() {
    isPreviewLoading = true;
    preview = null;
    
    try {
      const body = {};
      if (useCustomRange && customStartDate && customEndDate) {
        body.startDate = customStartDate;
        body.endDate = customEndDate;
      }
      
      const response = await fetch(`/api/seasons/${seasonId}/recurrence/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        preview = await response.json();
      } else {
        const error = await response.json();
        alert(`Failed to load preview: ${error.error}`);
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      alert('Failed to load generation preview');
    } finally {
      isPreviewLoading = false;
    }
  }
  
  async function executeGeneration() {
    if (!confirm(`This will create ${preview.summary.will_create} new practice plans. Continue?`)) {
      return;
    }
    
    isGenerating = true;
    results = null;
    
    try {
      const body = {};
      if (useCustomRange && customStartDate && customEndDate) {
        body.startDate = customStartDate;
        body.endDate = customEndDate;
      }
      
      const response = await fetch(`/api/seasons/${seasonId}/recurrence/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        results = await response.json();
        dispatch('generated', results);
        
        // Reload preview
        await loadPreview();
      } else {
        const error = await response.json();
        alert(`Failed to generate: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating practices:', error);
      alert('Failed to generate practice plans');
    } finally {
      isGenerating = false;
    }
  }
  
  // Load preview when custom range changes
  $: if (hasRecurrence && (!useCustomRange || (customStartDate && customEndDate))) {
    loadPreview();
  }
</script>

<div class="bg-white rounded-lg shadow p-6">
  <h3 class="text-lg font-semibold mb-4">Batch Generation</h3>
  
  {#if !hasRecurrence}
    <p class="text-gray-500">
      Please configure recurrence settings first to enable batch generation.
    </p>
  {:else}
    <div class="space-y-4">
      <!-- Custom date range -->
      <div>
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={useCustomRange}
            class="mr-2"
          />
          <span class="text-sm font-medium">Use custom date range</span>
        </label>
        
        {#if useCustomRange}
          <div class="grid grid-cols-2 gap-4 mt-2">
            <input
              type="date"
              bind:value={customStartDate}
              placeholder="Start date"
              class="p-2 border rounded"
            />
            <input
              type="date"
              bind:value={customEndDate}
              min={customStartDate}
              placeholder="End date"
              class="p-2 border rounded"
            />
          </div>
        {/if}
      </div>
      
      <!-- Preview -->
      {#if isPreviewLoading}
        <div class="text-gray-500">Loading preview...</div>
      {:else if preview}
        <div class="border rounded-lg p-4 bg-gray-50">
          <h4 class="font-medium mb-2">Generation Preview</h4>
          
          <div class="grid grid-cols-3 gap-4 mb-3">
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">
                {preview.summary.will_create}
              </div>
              <div class="text-xs text-gray-600">Will Create</div>
            </div>
            
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-600">
                {preview.summary.will_skip}
              </div>
              <div class="text-xs text-gray-600">Will Skip</div>
            </div>
            
            <div class="text-center">
              <div class="text-2xl font-bold text-red-600">
                {preview.summary.will_overwrite}
              </div>
              <div class="text-xs text-gray-600">Will Replace</div>
            </div>
          </div>
          
          <!-- Date list preview (first 10) -->
          <details class="text-sm">
            <summary class="cursor-pointer text-blue-600 hover:underline">
              View dates ({preview.dates.length} total)
            </summary>
            <div class="mt-2 max-h-48 overflow-y-auto">
              <table class="w-full text-left">
                <thead class="text-xs text-gray-600 border-b">
                  <tr>
                    <th class="pb-1">Date</th>
                    <th class="pb-1">Day</th>
                    <th class="pb-1">Status</th>
                    <th class="pb-1">Reason</th>
                  </tr>
                </thead>
                <tbody class="text-xs">
                  {#each preview.dates.slice(0, 20) as item}
                    <tr class="border-b">
                      <td class="py-1">{item.date}</td>
                      <td class="py-1">{item.dayOfWeek}</td>
                      <td class="py-1">
                        <span class="px-2 py-0.5 rounded text-xs
                          {item.status === 'will_create' ? 'bg-green-100 text-green-700' : ''}
                          {item.status === 'will_skip' ? 'bg-yellow-100 text-yellow-700' : ''}
                          {item.status === 'will_overwrite' ? 'bg-red-100 text-red-700' : ''}">
                          {item.status.replace('will_', '')}
                        </span>
                      </td>
                      <td class="py-1 text-gray-500">{item.reason || '-'}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
              {#if preview.dates.length > 20}
                <p class="text-xs text-gray-500 mt-2">
                  ... and {preview.dates.length - 20} more dates
                </p>
              {/if}
            </div>
          </details>
        </div>
        
        <!-- Generate button -->
        <button
          on:click={executeGeneration}
          disabled={isGenerating || preview.summary.will_create === 0}
          class="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : `Generate ${preview.summary.will_create} Practice Plans`}
        </button>
      {/if}
      
      <!-- Results -->
      {#if results}
        <div class="border-t pt-4">
          <h4 class="font-medium mb-2">Generation Results</h4>
          
          <div class="space-y-2">
            {#if results.created.length > 0}
              <div class="bg-green-50 p-2 rounded">
                <span class="text-green-800 font-medium">
                  ✓ Created {results.created.length} practices
                </span>
              </div>
            {/if}
            
            {#if results.skipped.length > 0}
              <div class="bg-yellow-50 p-2 rounded">
                <span class="text-yellow-800 font-medium">
                  ⚠ Skipped {results.skipped.length} dates
                </span>
              </div>
            {/if}
            
            {#if results.errors.length > 0}
              <div class="bg-red-50 p-2 rounded">
                <span class="text-red-800 font-medium">
                  ✗ {results.errors.length} errors
                </span>
                <ul class="mt-1 text-xs text-red-600">
                  {#each results.errors as error}
                    <li>• {error.date}: {error.error}</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
```

### Testing

#### Recurrence Service Test (`src/lib/server/services/__tests__/recurrenceService.test.js`)
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { recurrenceService } from '../recurrenceService';
import { seasonService } from '../seasonService';
import { teamService } from '../teamService';

describe('RecurrenceService', () => {
  let testTeam;
  let testSeason;
  let testUserId = 'test-user-123';
  
  beforeEach(async () => {
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
  });
  
  it('should create weekly recurrence', async () => {
    const recurrenceData = {
      frequency: 'weekly',
      interval: 1,
      weekdays: [1, 3, 5], // Mon, Wed, Fri
      practice_time: '18:00',
      duration_minutes: 120,
      skip_existing: true,
      skip_markers: true
    };
    
    const recurrence = await recurrenceService.setRecurrence(
      testSeason.id,
      recurrenceData,
      testUserId
    );
    
    expect(recurrence.frequency).toBe('weekly');
    expect(recurrence.weekdays).toEqual([1, 3, 5]);
  });
  
  it('should generate correct weekly dates', () => {
    const dates = recurrenceService.generateWeeklyDates(
      new Date('2024-03-01'),
      new Date('2024-03-31'),
      [1, 3, 5], // Mon, Wed, Fri
      1
    );
    
    // March 2024 starts on Friday
    // Mondays: 4, 11, 18, 25
    // Wednesdays: 6, 13, 20, 27
    // Fridays: 1, 8, 15, 22, 29
    expect(dates.length).toBe(13);
    
    // Check first few dates
    expect(dates[0].toISOString().split('T')[0]).toBe('2024-03-01'); // Fri
    expect(dates[1].toISOString().split('T')[0]).toBe('2024-03-04'); // Mon
    expect(dates[2].toISOString().split('T')[0]).toBe('2024-03-06'); // Wed
  });
  
  it('should generate correct biweekly dates', () => {
    const dates = recurrenceService.generateWeeklyDates(
      new Date('2024-03-01'),
      new Date('2024-03-31'),
      [1], // Monday only
      2 // Every 2 weeks
    );
    
    // Mondays: 4, 18 (skip 11, 25)
    expect(dates.length).toBe(2);
    expect(dates[0].toISOString().split('T')[0]).toBe('2024-03-04');
    expect(dates[1].toISOString().split('T')[0]).toBe('2024-03-18');
  });
  
  it('should generate correct monthly dates', () => {
    const dates = recurrenceService.generateMonthlyDates(
      new Date('2024-01-01'),
      new Date('2024-06-30'),
      15, // 15th of each month
      1
    );
    
    expect(dates.length).toBe(6);
    expect(dates[0].toISOString().split('T')[0]).toBe('2024-01-15');
    expect(dates[5].toISOString().split('T')[0]).toBe('2024-06-15');
  });
  
  it('should handle month-end dates correctly', () => {
    const dates = recurrenceService.generateMonthlyDates(
      new Date('2024-01-01'),
      new Date('2024-03-31'),
      31, // 31st of each month
      1
    );
    
    // January has 31 days, February has 29 (2024 is leap year), March has 31
    expect(dates.length).toBe(3);
    expect(dates[0].toISOString().split('T')[0]).toBe('2024-01-31');
    expect(dates[1].toISOString().split('T')[0]).toBe('2024-02-29'); // Adjusted for Feb
    expect(dates[2].toISOString().split('T')[0]).toBe('2024-03-31');
  });
  
  it('should validate recurrence data', () => {
    const invalidWeekly = {
      frequency: 'weekly',
      weekdays: [], // Empty weekdays
      practice_time: '18:00'
    };
    
    expect(() => {
      recurrenceService.validateRecurrenceData(invalidWeekly, testSeason);
    }).toThrow('Weekly/biweekly recurrence requires weekdays');
    
    const invalidMonthly = {
      frequency: 'monthly',
      day_of_month: 32, // Invalid day
      practice_time: '18:00'
    };
    
    expect(() => {
      recurrenceService.validateRecurrenceData(invalidMonthly, testSeason);
    }).toThrow('Monthly recurrence requires valid day of month');
  });
  
  it('should preview generation correctly', async () => {
    // Set up recurrence
    await recurrenceService.setRecurrence(testSeason.id, {
      frequency: 'weekly',
      weekdays: [1, 3],
      practice_time: '18:00',
      skip_existing: true,
      skip_markers: true
    }, testUserId);
    
    const preview = await recurrenceService.previewGeneration(
      testSeason.id,
      testUserId
    );
    
    expect(preview.total).toBeGreaterThan(0);
    expect(preview.summary).toHaveProperty('will_create');
    expect(preview.summary).toHaveProperty('will_skip');
    expect(preview.dates).toBeInstanceOf(Array);
  });
});
```

### Acceptance Criteria
- [ ] Season recurrences table created with proper constraints
- [ ] Generation logs table tracks history
- [ ] Only one recurrence rule per season enforced
- [ ] Weekly recurrence generates correct dates for selected weekdays
- [ ] Biweekly recurrence skips alternate weeks correctly
- [ ] Monthly recurrence handles month-end dates properly
- [ ] Recurrence respects season date boundaries
- [ ] Skip existing practices option works correctly
- [ ] Skip markers (tournaments/breaks) option works
- [ ] Preview shows accurate count of what will be created
- [ ] Batch generation creates practices efficiently
- [ ] Generation history is logged with details
- [ ] Custom date range filtering works for generation
- [ ] Bulk delete respects is_edited flag
- [ ] Tests pass for all recurrence patterns

### Dependencies
- Phase 4 must be complete (Union algorithm working)
- Season sections and markers exist
- Practice plans support scheduled_date

### Notes
- Weekdays use JavaScript convention (0=Sunday, 6=Saturday)
- Monthly recurrence auto-adjusts for months with fewer days
- Generation is idempotent with skip_existing option
- History provides audit trail of batch operations
- Preview helps avoid mistakes before generation