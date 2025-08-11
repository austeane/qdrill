## Phase 6: Propagation and Drag Re-evaluation - Implementation Ticket

### Overview
Implement template change propagation to unedited draft plans, handle season section date shifts, team default time changes, and enable drag-and-drop rescheduling of practices and sections in the season timeline. This ensures consistency across unedited drafts while preserving user edits.

### Prerequisites
- Phase 5 completed (Recurrence and batch generation working)
- Practice plans have is_edited flag and template_plan_id reference
- Season sections and timeline visualization working
- Union algorithm implemented for merging template + section data

### Database Changes

#### Migration: `migrations/[timestamp]_add_propagation_tracking.js`
```javascript
exports.up = (pgm) => {
  // Add tracking for propagation history
  pgm.createTable('propagation_logs', {
    id: { type: 'serial', primaryKey: true },
    team_id: { type: 'uuid', references: 'teams(id)', onDelete: 'CASCADE', notNull: true },
    season_id: { type: 'uuid', references: 'seasons(id)', onDelete: 'CASCADE' },
    action_type: { 
      type: 'varchar(50)', 
      notNull: true,
      check: "action_type IN ('template_update', 'section_shift', 'time_change', 'drag_reschedule')"
    },
    affected_count: { type: 'integer', notNull: true, default: 0 },
    details: { type: 'jsonb' },
    created_by: { type: 'uuid', references: 'users(id)', onDelete: 'SET NULL' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
  
  // Add indexes for queries
  pgm.createIndex('propagation_logs', 'team_id');
  pgm.createIndex('propagation_logs', 'season_id');
  pgm.createIndex('propagation_logs', 'created_at');
  
  // Add last_propagated timestamp to track changes
  pgm.addColumns('practice_plans', {
    last_propagated_at: { type: 'timestamp' },
    propagation_version: { type: 'integer', default: 0 }
  });
  
  // Add drag position tracking for sections
  pgm.addColumns('season_sections', {
    display_order: { type: 'integer' },
    date_shift_days: { type: 'integer', default: 0 }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('propagation_logs');
  pgm.dropColumns('practice_plans', ['last_propagated_at', 'propagation_version']);
  pgm.dropColumns('season_sections', ['display_order', 'date_shift_days']);
};
```

### Backend Implementation

#### 1. Extended Season Union Service (`src/lib/server/services/seasonUnionService.js`)
```javascript
import { db } from '$lib/server/db';
import { practicePlanService } from './practicePlanService';
import { seasonService } from './seasonService';
import { seasonSectionService } from './seasonSectionService';
import { ValidationError } from '$lib/server/errors';
import { BaseEntityService } from './baseEntityService';

class SeasonUnionService extends BaseEntityService {
  constructor() {
    super('propagation_logs');
  }
  
  /**
   * Propagate template updates to all unedited draft plans
   * @param {string} seasonId - Season ID
   * @param {string} templatePlanId - Template plan ID that was updated
   * @param {string} userId - User making the change
   * @returns {Object} Propagation results
   */
  async propagateTemplateUpdate(seasonId, templatePlanId, userId) {
    return await this.withTransaction(async (trx) => {
      // Get all unedited draft plans derived from this template
      const affectedPlans = await trx
        .selectFrom('practice_plans')
        .selectAll()
        .where('season_id', '=', seasonId)
        .where('template_plan_id', '=', templatePlanId)
        .where('is_edited', '=', false)
        .where('status', '=', 'draft')
        .execute();
      
      if (affectedPlans.length === 0) {
        return { affected: 0, plans: [] };
      }
      
      // Get the updated template structure
      const template = await practicePlanService.getById(templatePlanId);
      
      // Update each unedited draft plan
      const updatedPlans = [];
      for (const plan of affectedPlans) {
        // Re-run union algorithm for this plan's date
        const overlappingSections = await this.getOverlappingSections(
          seasonId, 
          plan.scheduled_date
        );
        
        const unionData = await this.buildUnionStructure(
          { id: seasonId },
          overlappingSections,
          plan.scheduled_date,
          template
        );
        
        // Update plan sections and drills
        await this.updatePlanStructure(trx, plan.id, unionData);
        
        // Update propagation tracking
        await trx
          .updateTable('practice_plans')
          .set({
            last_propagated_at: new Date(),
            propagation_version: db.raw('propagation_version + 1'),
            updated_at: new Date()
          })
          .where('id', '=', plan.id)
          .execute();
        
        updatedPlans.push(plan.id);
      }
      
      // Log the propagation
      await this.create({
        team_id: (await seasonService.getById(seasonId)).team_id,
        season_id: seasonId,
        action_type: 'template_update',
        affected_count: updatedPlans.length,
        details: {
          template_plan_id: templatePlanId,
          updated_plan_ids: updatedPlans
        },
        created_by: userId
      });
      
      return {
        affected: updatedPlans.length,
        plans: updatedPlans
      };
    });
  }
  
  /**
   * Re-evaluate drafts when a season section's dates change
   * @param {string} seasonId - Season ID
   * @param {string} sectionId - Section that changed
   * @param {Object} dateChange - Old and new date ranges
   * @param {string} userId - User making the change
   */
  async reevaluateDraftsForSectionChange(seasonId, sectionId, dateChange, userId) {
    return await this.withTransaction(async (trx) => {
      const { oldStart, oldEnd, newStart, newEnd } = dateChange;
      
      // Find all practices that were or will be affected by this section
      const affectedDateRange = {
        start: new Date(Math.min(new Date(oldStart), new Date(newStart))),
        end: new Date(Math.max(new Date(oldEnd), new Date(newEnd)))
      };
      
      const affectedPlans = await trx
        .selectFrom('practice_plans')
        .selectAll()
        .where('season_id', '=', seasonId)
        .where('is_edited', '=', false)
        .where('status', '=', 'draft')
        .where('scheduled_date', '>=', affectedDateRange.start)
        .where('scheduled_date', '<=', affectedDateRange.end)
        .execute();
      
      const updatedPlans = [];
      for (const plan of affectedPlans) {
        // Check if section overlap changed for this date
        const wasOverlapping = this.dateInRange(plan.scheduled_date, oldStart, oldEnd);
        const isOverlapping = this.dateInRange(plan.scheduled_date, newStart, newEnd);
        
        if (wasOverlapping !== isOverlapping) {
          // Overlap status changed - need full re-evaluation
          await this.recomputePlanUnion(trx, plan, seasonId);
          updatedPlans.push({
            id: plan.id,
            date: plan.scheduled_date,
            change: wasOverlapping ? 'removed' : 'added'
          });
        }
      }
      
      // Log the re-evaluation
      await this.create({
        team_id: (await seasonService.getById(seasonId)).team_id,
        season_id: seasonId,
        action_type: 'section_shift',
        affected_count: updatedPlans.length,
        details: {
          section_id: sectionId,
          date_change: dateChange,
          affected_plans: updatedPlans
        },
        created_by: userId
      });
      
      return {
        affected: updatedPlans.length,
        plans: updatedPlans
      };
    });
  }
  
  /**
   * Update start times for unedited drafts when team default changes
   * @param {string} teamId - Team ID
   * @param {string} newStartTime - New default start time (HH:MM)
   * @param {string} userId - User making the change
   */
  async updateDraftTimesForTeam(teamId, newStartTime, userId) {
    return await this.withTransaction(async (trx) => {
      // Get all unedited draft plans for this team
      const affectedPlans = await trx
        .selectFrom('practice_plans')
        .selectAll()
        .where('team_id', '=', teamId)
        .where('is_edited', '=', false)
        .where('status', '=', 'draft')
        .whereNotNull('scheduled_date')
        .execute();
      
      // Update start times
      const updatedPlans = [];
      for (const plan of affectedPlans) {
        await trx
          .updateTable('practice_plans')
          .set({
            start_time: newStartTime,
            updated_at: new Date()
          })
          .where('id', '=', plan.id)
          .execute();
        
        updatedPlans.push({
          id: plan.id,
          date: plan.scheduled_date
        });
      }
      
      // Log the time update
      await this.create({
        team_id: teamId,
        action_type: 'time_change',
        affected_count: updatedPlans.length,
        details: {
          new_start_time: newStartTime,
          updated_plans: updatedPlans
        },
        created_by: userId
      });
      
      return {
        affected: updatedPlans.length,
        plans: updatedPlans
      };
    });
  }
  
  /**
   * Handle drag-based rescheduling of practices
   * @param {string} planId - Practice plan being moved
   * @param {string} newDate - New scheduled date
   * @param {string} userId - User making the change
   */
  async reschedulePractice(planId, newDate, userId) {
    return await this.withTransaction(async (trx) => {
      const plan = await practicePlanService.getById(planId);
      
      // Check for conflicts
      const existing = await trx
        .selectFrom('practice_plans')
        .selectAll()
        .where('team_id', '=', plan.team_id)
        .where('scheduled_date', '=', newDate)
        .where('id', '!=', planId)
        .executeTakeFirst();
      
      if (existing) {
        throw new ValidationError(`A practice already exists on ${newDate}`);
      }
      
      const oldDate = plan.scheduled_date;
      
      // Update the practice date
      await trx
        .updateTable('practice_plans')
        .set({
          scheduled_date: newDate,
          updated_at: new Date()
        })
        .where('id', '=', planId)
        .execute();
      
      // If unedited, re-evaluate with new date's sections
      if (!plan.is_edited && plan.season_id) {
        await this.recomputePlanUnion(trx, { ...plan, scheduled_date: newDate }, plan.season_id);
      }
      
      // Log the reschedule
      await this.create({
        team_id: plan.team_id,
        season_id: plan.season_id,
        action_type: 'drag_reschedule',
        affected_count: 1,
        details: {
          plan_id: planId,
          old_date: oldDate,
          new_date: newDate,
          was_recomputed: !plan.is_edited
        },
        created_by: userId
      });
      
      return {
        success: true,
        oldDate,
        newDate,
        recomputed: !plan.is_edited
      };
    });
  }
  
  /**
   * Handle drag-based reordering of season sections
   * @param {string} seasonId - Season ID
   * @param {string} sectionId - Section being moved
   * @param {number} dateShiftDays - Number of days to shift (+/-)
   * @param {string} userId - User making the change
   */
  async shiftSectionDates(seasonId, sectionId, dateShiftDays, userId) {
    return await this.withTransaction(async (trx) => {
      const section = await seasonSectionService.getById(sectionId);
      
      const oldStart = section.start_date;
      const oldEnd = section.end_date;
      const newStart = new Date(oldStart);
      const newEnd = new Date(oldEnd);
      
      newStart.setDate(newStart.getDate() + dateShiftDays);
      newEnd.setDate(newEnd.getDate() + dateShiftDays);
      
      // Update section dates
      await trx
        .updateTable('season_sections')
        .set({
          start_date: newStart,
          end_date: newEnd,
          date_shift_days: dateShiftDays,
          updated_at: new Date()
        })
        .where('id', '=', sectionId)
        .execute();
      
      // Re-evaluate affected drafts
      const result = await this.reevaluateDraftsForSectionChange(
        seasonId,
        sectionId,
        {
          oldStart: oldStart.toISOString().split('T')[0],
          oldEnd: oldEnd.toISOString().split('T')[0],
          newStart: newStart.toISOString().split('T')[0],
          newEnd: newEnd.toISOString().split('T')[0]
        },
        userId
      );
      
      return {
        ...result,
        section: {
          id: sectionId,
          oldDates: { start: oldStart, end: oldEnd },
          newDates: { start: newStart, end: newEnd },
          shiftDays: dateShiftDays
        }
      };
    });
  }
  
  // Helper methods
  
  /**
   * Recompute the union for a practice plan
   */
  async recomputePlanUnion(trx, plan, seasonId) {
    const season = await seasonService.getById(seasonId);
    const template = plan.template_plan_id 
      ? await practicePlanService.getById(plan.template_plan_id)
      : null;
    
    const overlappingSections = await this.getOverlappingSections(
      seasonId,
      plan.scheduled_date
    );
    
    const unionData = await this.buildUnionStructure(
      season,
      overlappingSections,
      plan.scheduled_date,
      template
    );
    
    await this.updatePlanStructure(trx, plan.id, unionData);
    
    await trx
      .updateTable('practice_plans')
      .set({
        last_propagated_at: new Date(),
        propagation_version: db.raw('propagation_version + 1')
      })
      .where('id', '=', plan.id)
      .execute();
  }
  
  /**
   * Update plan structure with new sections and drills
   */
  async updatePlanStructure(trx, planId, unionData) {
    // Remove existing sections and drills
    await trx
      .deleteFrom('practice_plan_sections')
      .where('practice_plan_id', '=', planId)
      .execute();
    
    // Insert new sections with their drills
    for (const section of unionData.sections) {
      const insertedSection = await trx
        .insertInto('practice_plan_sections')
        .values({
          practice_plan_id: planId,
          name: section.name,
          order_index: section.order_index,
          duration: section.duration
        })
        .returning('id')
        .executeTakeFirst();
      
      // Insert drills for this section
      if (section.drills && section.drills.length > 0) {
        const drillInserts = section.drills.map((drill, idx) => ({
          practice_plan_id: planId,
          section_id: insertedSection.id,
          drill_id: drill.drill_id,
          order_index: idx,
          duration: drill.duration,
          notes: drill.notes
        }));
        
        await trx
          .insertInto('practice_plan_drills')
          .values(drillInserts)
          .execute();
      }
    }
  }
  
  /**
   * Check if a date is within a range
   */
  dateInRange(date, start, end) {
    const d = new Date(date);
    const s = new Date(start);
    const e = new Date(end);
    return d >= s && d <= e;
  }
  
  /**
   * Get minimal delta for smart propagation
   */
  async getOverlapDelta(seasonId, oldSections, newSections) {
    // Compare section overlaps to determine minimal changes
    const changes = {
      added: [],
      removed: [],
      unchanged: []
    };
    
    const oldIds = new Set(oldSections.map(s => s.id));
    const newIds = new Set(newSections.map(s => s.id));
    
    for (const section of newSections) {
      if (!oldIds.has(section.id)) {
        changes.added.push(section);
      } else {
        changes.unchanged.push(section);
      }
    }
    
    for (const section of oldSections) {
      if (!newIds.has(section.id)) {
        changes.removed.push(section);
      }
    }
    
    return changes;
  }
}

export const seasonUnionService = new SeasonUnionService();
```

#### 2. API Routes

##### Propagate Template Updates
`src/routes/api/seasons/[seasonId]/propagate-template/+server.js`
```javascript
import { json } from '@sveltejs/kit';
import { seasonUnionService } from '$lib/server/services/seasonUnionService';
import { requireAuth, requireTeamRole } from '$lib/server/auth';

export async function POST({ params, request, locals }) {
  const { seasonId } = params;
  const { templatePlanId } = await request.json();
  
  // Require admin role for propagation
  const userId = await requireAuth(locals);
  await requireTeamRole(locals, seasonId, 'admin');
  
  try {
    const result = await seasonUnionService.propagateTemplateUpdate(
      seasonId,
      templatePlanId,
      userId
    );
    
    return json({
      success: true,
      ...result
    });
  } catch (error) {
    return json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
```

##### Re-evaluate for Section Changes
`src/routes/api/seasons/[seasonId]/sections/[sectionId]/reevaluate/+server.js`
```javascript
import { json } from '@sveltejs/kit';
import { seasonUnionService } from '$lib/server/services/seasonUnionService';
import { requireAuth, requireTeamRole } from '$lib/server/auth';

export async function POST({ params, request, locals }) {
  const { seasonId, sectionId } = params;
  const { dateChange } = await request.json();
  
  const userId = await requireAuth(locals);
  await requireTeamRole(locals, seasonId, 'admin');
  
  try {
    const result = await seasonUnionService.reevaluateDraftsForSectionChange(
      seasonId,
      sectionId,
      dateChange,
      userId
    );
    
    return json({
      success: true,
      ...result
    });
  } catch (error) {
    return json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
```

##### Update Team Draft Times
`src/routes/api/teams/[teamId]/update-draft-times/+server.js`
```javascript
import { json } from '@sveltejs/kit';
import { seasonUnionService } from '$lib/server/services/seasonUnionService';
import { requireAuth, requireTeamRole } from '$lib/server/auth';

export async function POST({ params, request, locals }) {
  const { teamId } = params;
  const { startTime } = await request.json();
  
  const userId = await requireAuth(locals);
  await requireTeamRole(locals, teamId, 'admin');
  
  try {
    const result = await seasonUnionService.updateDraftTimesForTeam(
      teamId,
      startTime,
      userId
    );
    
    return json({
      success: true,
      ...result
    });
  } catch (error) {
    return json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
```

##### Reschedule Practice
`src/routes/api/practice-plans/[planId]/reschedule/+server.js`
```javascript
import { json } from '@sveltejs/kit';
import { seasonUnionService } from '$lib/server/services/seasonUnionService';
import { requireAuth, requirePlanAccess } from '$lib/server/auth';

export async function PATCH({ params, request, locals }) {
  const { planId } = params;
  const { newDate } = await request.json();
  
  const userId = await requireAuth(locals);
  await requirePlanAccess(locals, planId, 'edit');
  
  try {
    const result = await seasonUnionService.reschedulePractice(
      planId,
      newDate,
      userId
    );
    
    return json({
      success: true,
      ...result
    });
  } catch (error) {
    return json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
```

### Frontend Implementation

#### 1. Enhanced Season Timeline with Drag-and-Drop (`src/lib/components/season/SeasonTimeline.svelte`)
```svelte
<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { seasonTimelineDragStore } from '$lib/stores/seasonTimelineDragStore';
  import { toast } from '$lib/stores/toastStore';
  import EditIndicator from './EditIndicator.svelte';
  
  export let season;
  export let sections = [];
  export let practices = [];
  export let markers = [];
  export let isAdmin = false;
  export let onPracticeMove = null;
  export let onSectionMove = null;
  
  let timelineElement;
  let isDragging = false;
  let draggedItem = null;
  let dragType = null; // 'practice' or 'section'
  let dropTarget = null;
  let dropPosition = null;
  
  // Calculate timeline dimensions
  $: startDate = new Date(season.start_date);
  $: endDate = new Date(season.end_date);
  $: totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  // Group practices by date
  $: practicesByDate = practices.reduce((acc, practice) => {
    const date = practice.scheduled_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(practice);
    return acc;
  }, {});
  
  // Drag handlers for practices
  function handlePracticeDragStart(event, practice) {
    if (!isAdmin) return;
    
    isDragging = true;
    draggedItem = practice;
    dragType = 'practice';
    
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'practice',
      id: practice.id,
      originalDate: practice.scheduled_date
    }));
    
    seasonTimelineDragStore.startDrag('practice', practice);
  }
  
  function handlePracticeDragEnd(event) {
    isDragging = false;
    draggedItem = null;
    dragType = null;
    dropTarget = null;
    dropPosition = null;
    
    seasonTimelineDragStore.endDrag();
  }
  
  function handleDayDragOver(event, date) {
    if (!isDragging || dragType !== 'practice') return;
    
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // Check if date already has a practice (excluding the dragged one)
    const existingPractices = practicesByDate[date] || [];
    const hasConflict = existingPractices.some(p => p.id !== draggedItem.id);
    
    if (hasConflict) {
      event.dataTransfer.dropEffect = 'none';
      dropTarget = null;
    } else {
      dropTarget = date;
    }
  }
  
  function handleDayDrop(event, date) {
    event.preventDefault();
    
    if (!draggedItem || dragType !== 'practice') return;
    if (draggedItem.scheduled_date === date) return; // No change
    
    // Check for conflicts
    const existingPractices = practicesByDate[date] || [];
    if (existingPractices.length > 0) {
      toast.error('A practice already exists on this date');
      return;
    }
    
    // Call parent handler or API
    if (onPracticeMove) {
      onPracticeMove(draggedItem.id, date);
    } else {
      reschedulePractice(draggedItem.id, date);
    }
    
    handlePracticeDragEnd(event);
  }
  
  // Drag handlers for sections
  function handleSectionDragStart(event, section) {
    if (!isAdmin) return;
    
    isDragging = true;
    draggedItem = section;
    dragType = 'section';
    
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'section',
      id: section.id,
      originalStart: section.start_date,
      originalEnd: section.end_date
    }));
    
    seasonTimelineDragStore.startDrag('section', section);
  }
  
  function handleSectionDragEnd(event) {
    handlePracticeDragEnd(event);
  }
  
  function handleSectionDragOver(event, targetSection) {
    if (!isDragging || dragType !== 'section') return;
    if (targetSection.id === draggedItem.id) return;
    
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // Calculate drop position
    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;
    dropPosition = y < rect.height / 2 ? 'before' : 'after';
    dropTarget = targetSection;
  }
  
  function handleSectionDrop(event, targetSection) {
    event.preventDefault();
    
    if (!draggedItem || dragType !== 'section') return;
    if (draggedItem.id === targetSection.id) return;
    
    // Calculate date shift based on drop position
    const targetStart = new Date(targetSection.start_date);
    const draggedStart = new Date(draggedItem.start_date);
    const daysDiff = Math.round((targetStart - draggedStart) / (1000 * 60 * 60 * 24));
    
    // Adjust based on drop position
    const shiftDays = dropPosition === 'before' ? daysDiff - 1 : daysDiff + 1;
    
    if (onSectionMove) {
      onSectionMove(draggedItem.id, shiftDays);
    } else {
      shiftSectionDates(draggedItem.id, shiftDays);
    }
    
    handleSectionDragEnd(event);
  }
  
  // API calls
  async function reschedulePractice(planId, newDate) {
    try {
      const response = await fetch(`/api/practice-plans/${planId}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDate })
      });
      
      if (!response.ok) throw new Error('Failed to reschedule practice');
      
      const result = await response.json();
      toast.success(`Practice moved to ${newDate}`);
      
      // Refresh the timeline
      await refreshTimeline();
      
      if (result.recomputed) {
        toast.info('Practice content updated based on new date sections');
      }
    } catch (error) {
      console.error('Error rescheduling practice:', error);
      toast.error('Failed to reschedule practice');
    }
  }
  
  async function shiftSectionDates(sectionId, shiftDays) {
    try {
      const response = await fetch(
        `/api/seasons/${season.id}/sections/${sectionId}/shift`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dateShiftDays: shiftDays })
        }
      );
      
      if (!response.ok) throw new Error('Failed to shift section dates');
      
      const result = await response.json();
      toast.success(`Section dates shifted by ${shiftDays} days`);
      
      if (result.affected > 0) {
        toast.info(`${result.affected} draft practices updated`);
      }
      
      // Refresh the timeline
      await refreshTimeline();
    } catch (error) {
      console.error('Error shifting section:', error);
      toast.error('Failed to shift section dates');
    }
  }
  
  async function refreshTimeline() {
    // Trigger parent component refresh or reload data
    const url = new URL(window.location);
    url.searchParams.set('refresh', Date.now());
    goto(url.toString(), { replaceState: true });
  }
  
  // Helper to get date display
  function getDateDisplay(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  // Helper to calculate position on timeline
  function getTimelinePosition(date) {
    const d = new Date(date);
    const dayIndex = Math.floor((d - startDate) / (1000 * 60 * 60 * 24));
    return (dayIndex / totalDays) * 100;
  }
  
  // Helper to calculate width on timeline
  function getTimelineWidth(startDateStr, endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return (days / totalDays) * 100;
  }
</script>

<div class="season-timeline" bind:this={timelineElement}>
  <div class="timeline-header">
    <h3>{season.name} Timeline</h3>
    <div class="timeline-legend">
      <span class="legend-item">
        <span class="legend-color draft"></span>
        Draft
      </span>
      <span class="legend-item">
        <span class="legend-color published"></span>
        Published
      </span>
      <span class="legend-item">
        <span class="legend-color edited"></span>
        Edited
      </span>
    </div>
  </div>
  
  <!-- Month headers -->
  <div class="timeline-months">
    {#each getMonthHeaders(startDate, endDate) as month}
      <div 
        class="month-header"
        style="left: {month.position}%; width: {month.width}%"
      >
        {month.name}
      </div>
    {/each}
  </div>
  
  <!-- Day grid -->
  <div class="timeline-days">
    {#each Array(totalDays) as _, dayIndex}
      {@const date = new Date(startDate.getTime() + dayIndex * 24 * 60 * 60 * 1000)}
      {@const dateStr = date.toISOString().split('T')[0]}
      {@const dayPractices = practicesByDate[dateStr] || []}
      
      <div 
        class="timeline-day"
        class:has-practice={dayPractices.length > 0}
        class:drop-target={dropTarget === dateStr}
        style="left: {(dayIndex / totalDays) * 100}%"
        on:dragover={(e) => handleDayDragOver(e, dateStr)}
        on:drop={(e) => handleDayDrop(e, dateStr)}
      >
        <div class="day-number">{date.getDate()}</div>
        
        {#each dayPractices as practice}
          <div 
            class="practice-marker"
            class:draft={practice.status === 'draft'}
            class:published={practice.status === 'published'}
            class:edited={practice.is_edited}
            draggable={isAdmin}
            on:dragstart={(e) => handlePracticeDragStart(e, practice)}
            on:dragend={handlePracticeDragEnd}
            title="{practice.name} - {practice.status}"
          >
            <EditIndicator isEdited={practice.is_edited} />
          </div>
        {/each}
      </div>
    {/each}
  </div>
  
  <!-- Season sections -->
  <div class="timeline-sections">
    {#each sections as section, idx}
      <div 
        class="timeline-section"
        class:dragging={draggedItem?.id === section.id}
        class:drop-before={dropTarget?.id === section.id && dropPosition === 'before'}
        class:drop-after={dropTarget?.id === section.id && dropPosition === 'after'}
        style="
          left: {getTimelinePosition(section.start_date)}%;
          width: {getTimelineWidth(section.start_date, section.end_date)}%;
          top: {20 + idx * 35}px;
        "
        draggable={isAdmin}
        on:dragstart={(e) => handleSectionDragStart(e, section)}
        on:dragend={handleSectionDragEnd}
        on:dragover={(e) => handleSectionDragOver(e, section)}
        on:drop={(e) => handleSectionDrop(e, section)}
      >
        <div class="section-content">
          <span class="section-name">{section.name}</span>
          <span class="section-dates">
            {getDateDisplay(section.start_date)} - {getDateDisplay(section.end_date)}
          </span>
        </div>
        
        {#if section.default_sections?.length > 0}
          <div class="section-defaults">
            {section.default_sections.join(', ')}
          </div>
        {/if}
      </div>
    {/each}
  </div>
  
  <!-- Markers -->
  <div class="timeline-markers">
    {#each markers as marker}
      <div 
        class="timeline-marker"
        style="left: {getTimelinePosition(marker.date)}%"
        title={marker.label}
      >
        <div class="marker-line"></div>
        <div class="marker-label">{marker.label}</div>
      </div>
    {/each}
  </div>
</div>

<style>
  .season-timeline {
    position: relative;
    min-height: 400px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
  }
  
  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .timeline-legend {
    display: flex;
    gap: 1rem;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  
  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }
  
  .legend-color.draft {
    background: #fbbf24;
  }
  
  .legend-color.published {
    background: #10b981;
  }
  
  .legend-color.edited {
    background: #3b82f6;
    border: 2px solid #1e40af;
  }
  
  .timeline-months {
    position: relative;
    height: 30px;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 1rem;
  }
  
  .month-header {
    position: absolute;
    padding: 0.25rem;
    font-weight: 600;
    font-size: 0.875rem;
    border-right: 1px solid #e5e7eb;
  }
  
  .timeline-days {
    position: relative;
    height: 60px;
    margin-bottom: 1rem;
  }
  
  .timeline-day {
    position: absolute;
    width: calc(100% / var(--total-days));
    height: 100%;
    border-right: 1px solid #f3f4f6;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.25rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .timeline-day:hover {
    background: #f9fafb;
  }
  
  .timeline-day.drop-target {
    background: #dbeafe;
    border: 2px dashed #3b82f6;
  }
  
  .day-number {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .practice-marker {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin-top: 0.25rem;
    cursor: move;
    position: relative;
  }
  
  .practice-marker.draft {
    background: #fbbf24;
  }
  
  .practice-marker.published {
    background: #10b981;
  }
  
  .practice-marker.edited {
    border: 2px solid #1e40af;
  }
  
  .timeline-sections {
    position: relative;
    min-height: 200px;
  }
  
  .timeline-section {
    position: absolute;
    background: #eff6ff;
    border: 1px solid #93c5fd;
    border-radius: 4px;
    padding: 0.5rem;
    cursor: move;
    transition: all 0.2s;
  }
  
  .timeline-section:hover {
    background: #dbeafe;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .timeline-section.dragging {
    opacity: 0.5;
  }
  
  .timeline-section.drop-before {
    border-left: 3px solid #3b82f6;
  }
  
  .timeline-section.drop-after {
    border-right: 3px solid #3b82f6;
  }
  
  .section-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  
  .section-name {
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  .section-dates {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .section-defaults {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .timeline-markers {
    position: relative;
    height: 40px;
  }
  
  .timeline-marker {
    position: absolute;
    height: 100%;
  }
  
  .marker-line {
    width: 2px;
    height: 100%;
    background: #ef4444;
  }
  
  .marker-label {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.75rem;
    color: #ef4444;
    white-space: nowrap;
    padding: 0.25rem;
  }
</style>
```

#### 2. Edit Indicator Component (`src/lib/components/season/EditIndicator.svelte`)
```svelte
<script>
  export let isEdited = false;
  export let size = 'small'; // 'small' | 'medium' | 'large'
</script>

{#if isEdited}
  <div 
    class="edit-indicator {size}"
    title="This item has been manually edited and won't receive automatic updates"
  >
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z" />
    </svg>
  </div>
{/if}

<style>
  .edit-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
    position: absolute;
    top: -4px;
    right: -4px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .edit-indicator.small {
    width: 12px;
    height: 12px;
  }
  
  .edit-indicator.medium {
    width: 16px;
    height: 16px;
  }
  
  .edit-indicator.large {
    width: 20px;
    height: 20px;
  }
  
  svg {
    width: 80%;
    height: 80%;
  }
</style>
```

#### 3. Season Timeline Drag Store (`src/lib/stores/seasonTimelineDragStore.js`)
```javascript
import { writable, derived } from 'svelte/store';

function createSeasonTimelineDragStore() {
  const { subscribe, set, update } = writable({
    isDragging: false,
    dragType: null, // 'practice' | 'section'
    draggedItem: null,
    originalData: null,
    dropTarget: null,
    dropPosition: null
  });
  
  return {
    subscribe,
    
    startDrag(type, item) {
      set({
        isDragging: true,
        dragType: type,
        draggedItem: item,
        originalData: type === 'practice' 
          ? { date: item.scheduled_date }
          : { start: item.start_date, end: item.end_date },
        dropTarget: null,
        dropPosition: null
      });
    },
    
    updateDropTarget(target, position = null) {
      update(state => ({
        ...state,
        dropTarget: target,
        dropPosition: position
      }));
    },
    
    endDrag() {
      set({
        isDragging: false,
        dragType: null,
        draggedItem: null,
        originalData: null,
        dropTarget: null,
        dropPosition: null
      });
    },
    
    reset() {
      this.endDrag();
    }
  };
}

export const seasonTimelineDragStore = createSeasonTimelineDragStore();

// Derived stores for convenience
export const isDraggingPractice = derived(
  seasonTimelineDragStore,
  $store => $store.isDragging && $store.dragType === 'practice'
);

export const isDraggingSection = derived(
  seasonTimelineDragStore,
  $store => $store.isDragging && $store.dragType === 'section'
);
```

### Testing

#### 1. Unit Tests (`src/lib/server/services/__tests__/seasonUnionService.test.js`)
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { seasonUnionService } from '../seasonUnionService';
import { db } from '$lib/server/db';

vi.mock('$lib/server/db');

describe('SeasonUnionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('propagateTemplateUpdate', () => {
    it('should update all unedited draft plans', async () => {
      const mockPlans = [
        { id: 1, is_edited: false, status: 'draft', scheduled_date: '2024-02-15' },
        { id: 2, is_edited: false, status: 'draft', scheduled_date: '2024-02-20' }
      ];
      
      db.selectFrom = vi.fn().mockReturnValue({
        selectAll: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  execute: vi.fn().mockResolvedValue(mockPlans)
                })
              })
            })
          })
        })
      });
      
      const result = await seasonUnionService.propagateTemplateUpdate(
        'season-1',
        'template-1',
        'user-1'
      );
      
      expect(result.affected).toBe(2);
      expect(result.plans).toEqual([1, 2]);
    });
    
    it('should skip edited plans', async () => {
      const mockPlans = [
        { id: 1, is_edited: true, status: 'draft' } // Should be skipped
      ];
      
      db.selectFrom = vi.fn().mockReturnValue({
        selectAll: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  execute: vi.fn().mockResolvedValue([])
                })
              })
            })
          })
        })
      });
      
      const result = await seasonUnionService.propagateTemplateUpdate(
        'season-1',
        'template-1',
        'user-1'
      );
      
      expect(result.affected).toBe(0);
    });
  });
  
  describe('reevaluateDraftsForSectionChange', () => {
    it('should re-evaluate affected practices', async () => {
      const dateChange = {
        oldStart: '2024-02-10',
        oldEnd: '2024-02-15',
        newStart: '2024-02-12',
        newEnd: '2024-02-17'
      };
      
      const mockPlans = [
        { id: 1, scheduled_date: '2024-02-11' }, // Was in, now out
        { id: 2, scheduled_date: '2024-02-16' }  // Was out, now in
      ];
      
      const result = await seasonUnionService.reevaluateDraftsForSectionChange(
        'season-1',
        'section-1',
        dateChange,
        'user-1'
      );
      
      expect(result.affected).toBeGreaterThan(0);
    });
  });
  
  describe('reschedulePractice', () => {
    it('should prevent scheduling conflicts', async () => {
      db.selectFrom = vi.fn().mockReturnValue({
        selectAll: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                executeTakeFirst: vi.fn().mockResolvedValue({
                  id: 'existing-plan'
                })
              })
            })
          })
        })
      });
      
      await expect(
        seasonUnionService.reschedulePractice('plan-1', '2024-02-15', 'user-1')
      ).rejects.toThrow('A practice already exists');
    });
    
    it('should recompute union for unedited plans', async () => {
      const mockPlan = {
        id: 'plan-1',
        is_edited: false,
        season_id: 'season-1',
        scheduled_date: '2024-02-10'
      };
      
      const recomputeSpy = vi.spyOn(seasonUnionService, 'recomputePlanUnion');
      
      await seasonUnionService.reschedulePractice(
        'plan-1',
        '2024-02-15',
        'user-1'
      );
      
      expect(recomputeSpy).toHaveBeenCalled();
    });
  });
});
```

#### 2. Integration Tests (`tests/season-propagation.test.js`)
```javascript
import { test, expect } from '@playwright/test';

test.describe('Season Plan Propagation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.click('button:has-text("Sign in with Google")');
    // Mock auth...
  });
  
  test('template changes propagate to unedited drafts', async ({ page }) => {
    await page.goto('/teams/test-team/seasons/season-1');
    
    // Edit template
    await page.click('[data-testid="edit-template"]');
    await page.fill('[name="section-name"]', 'Updated Warmup');
    await page.click('button:has-text("Save Template")');
    
    // Trigger propagation
    await page.click('[data-testid="propagate-changes"]');
    
    // Verify confirmation dialog
    await expect(page.locator('text="Update 5 draft practices?"')).toBeVisible();
    await page.click('button:has-text("Confirm")');
    
    // Check success message
    await expect(page.locator('text="5 practices updated"')).toBeVisible();
  });
  
  test('drag practice to new date', async ({ page }) => {
    await page.goto('/teams/test-team/seasons/season-1/timeline');
    
    // Find practice marker
    const practice = page.locator('[data-testid="practice-2024-02-15"]');
    const targetDay = page.locator('[data-date="2024-02-20"]');
    
    // Drag and drop
    await practice.dragTo(targetDay);
    
    // Verify moved
    await expect(page.locator('[data-date="2024-02-20"] .practice-marker')).toBeVisible();
    await expect(page.locator('[data-date="2024-02-15"] .practice-marker')).not.toBeVisible();
  });
  
  test('drag section shifts dates', async ({ page }) => {
    await page.goto('/teams/test-team/seasons/season-1/timeline');
    
    // Find section
    const section = page.locator('[data-testid="section-early-season"]');
    const dropTarget = page.locator('[data-testid="section-mid-season"]');
    
    // Drag to reorder
    await section.dragTo(dropTarget);
    
    // Verify dates shifted
    await expect(page.locator('text="3 draft practices updated"')).toBeVisible();
  });
  
  test('edited plans do not get propagated changes', async ({ page }) => {
    await page.goto('/teams/test-team/seasons/season-1/timeline');
    
    // Mark a practice as edited
    await page.click('[data-testid="practice-2024-02-15"]');
    await page.click('button:has-text("Edit Practice")');
    await page.fill('[name="drill-notes"]', 'Custom notes');
    await page.click('button:has-text("Save")');
    
    // Edit template
    await page.click('[data-testid="edit-template"]');
    await page.fill('[name="section-name"]', 'New Warmup');
    await page.click('button:has-text("Save & Propagate")');
    
    // Check that edited practice shows indicator
    const editedPractice = page.locator('[data-testid="practice-2024-02-15"]');
    await expect(editedPractice.locator('.edit-indicator')).toBeVisible();
    
    // Verify it wasn't updated
    await editedPractice.click();
    await expect(page.locator('text="Custom notes"')).toBeVisible();
    await expect(page.locator('text="New Warmup"')).not.toBeVisible();
  });
});
```

### Acceptance Criteria

1. **Template Propagation**
   - ✅ Changes to season template propagate to all unedited draft plans
   - ✅ Edited plans are excluded from propagation
   - ✅ Propagation logs are recorded for audit
   - ✅ Users see confirmation before propagating changes

2. **Section Date Changes**
   - ✅ Moving section dates triggers re-evaluation of affected practices
   - ✅ Practices gain/lose section overlaps correctly
   - ✅ Only unedited drafts are re-evaluated

3. **Team Time Updates**
   - ✅ Changing team default start time updates all unedited drafts
   - ✅ Published and edited plans retain their original times

4. **Drag-and-Drop Rescheduling**
   - ✅ Practices can be dragged to new dates on timeline
   - ✅ Conflicts are prevented (one practice per day)
   - ✅ Sections can be dragged to shift their date ranges
   - ✅ Visual feedback during drag operations

5. **Visual Indicators**
   - ✅ Edited plans show clear visual indicator
   - ✅ Draft vs published status is visible
   - ✅ Drag targets highlight appropriately

6. **Performance**
   - ✅ Propagation handles 100+ practices efficiently
   - ✅ Drag operations are smooth and responsive
   - ✅ Database queries are optimized with proper indexes

### Implementation Notes

- Use database transactions for all propagation operations to ensure consistency
- Implement optimistic UI updates for drag operations with rollback on failure
- Add WebSocket support for real-time updates when multiple admins are working
- Consider adding a "preview changes" mode before committing propagation
- Implement undo functionality for accidental drag operations
- Add keyboard shortcuts for power users (Ctrl+Z for undo, etc.)

### Next Steps

After Phase 6 is complete:
1. Move to Phase 7 - ICS calendar export and share links
2. Add batch operations UI for managing multiple practices
3. Implement conflict resolution when multiple admins edit simultaneously
4. Add propagation history viewer with rollback capability