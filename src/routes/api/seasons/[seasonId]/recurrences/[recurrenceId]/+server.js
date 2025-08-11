import { json } from '@sveltejs/kit';
import { recurrenceService } from '$lib/server/services/recurrenceService.js';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';
import { seasonService } from '$lib/server/services/seasonService.js';
import { z } from 'zod';

const updateRecurrenceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  pattern: z.enum(['weekly', 'biweekly', 'monthly', 'custom']).optional(),
  day_of_week: z.array(z.number().min(0).max(6)).optional(),
  day_of_month: z.array(z.number().min(1).max(31)).optional(),
  time_of_day: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  duration_minutes: z.number().min(15).max(480).optional(),
  template_plan_id: z.number().nullable().optional(),
  skip_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  skip_markers: z.boolean().optional(),
  is_active: z.boolean().optional()
});

// GET - Get a specific recurrence pattern
export async function GET({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const recurrence = await recurrenceService.getById(params.recurrenceId);
    if (!recurrence) {
      return json({ error: 'Recurrence pattern not found' }, { status: 404 });
    }

    // Get season to find team
    const season = await seasonService.getById(recurrence.season_id);
    if (!season) {
      return json({ error: 'Season not found' }, { status: 404 });
    }

    // Verify user has access to team
    const member = await teamMemberService.getMember(season.team_id, locals.user.id);
    if (!member) {
      return json({ error: 'Not a team member' }, { status: 403 });
    }

    // Get generation history
    const history = await recurrenceService.getGenerationHistory(params.recurrenceId);
    
    return json({ ...recurrence, history });
  } catch (error) {
    console.error('Error fetching recurrence:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a recurrence pattern
export async function PUT({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    const recurrence = await recurrenceService.getById(params.recurrenceId);
    if (!recurrence) {
      return json({ error: 'Recurrence pattern not found' }, { status: 404 });
    }

    // Get season to find team
    const season = await seasonService.getById(recurrence.season_id);
    if (!season) {
      return json({ error: 'Season not found' }, { status: 404 });
    }

    // Verify user is team admin
    const member = await teamMemberService.getMember(season.team_id, locals.user.id);
    if (!member || member.role !== 'admin') {
      return json({ error: 'Only team admins can update recurrence patterns' }, { status: 403 });
    }

    const validated = updateRecurrenceSchema.parse(data);
    
    const updated = await recurrenceService.update(params.recurrenceId, validated, locals.user.id);

    return json(updated);
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error updating recurrence:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a recurrence pattern
export async function DELETE({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const recurrence = await recurrenceService.getById(params.recurrenceId);
    if (!recurrence) {
      return json({ error: 'Recurrence pattern not found' }, { status: 404 });
    }

    // Get season to find team
    const season = await seasonService.getById(recurrence.season_id);
    if (!season) {
      return json({ error: 'Season not found' }, { status: 404 });
    }

    // Verify user is team admin
    const member = await teamMemberService.getMember(season.team_id, locals.user.id);
    if (!member || member.role !== 'admin') {
      return json({ error: 'Only team admins can delete recurrence patterns' }, { status: 403 });
    }

    await recurrenceService.delete(params.recurrenceId);

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting recurrence:', error);
    return json({ error: error.message }, { status: 500 });
  }
}