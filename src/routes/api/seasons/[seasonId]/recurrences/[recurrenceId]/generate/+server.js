import { json } from '@sveltejs/kit';
import { recurrenceService } from '$lib/server/services/recurrenceService.js';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';
import { seasonService } from '$lib/server/services/seasonService.js';
import { z } from 'zod';

const generateSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

// POST - Generate practices from recurrence pattern
export async function POST({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const validated = generateSchema.parse(data);
    
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
      return json({ error: 'Only team admins can generate practices' }, { status: 403 });
    }

    // Validate dates are within season range
    const startDate = new Date(validated.start_date);
    const endDate = new Date(validated.end_date);
    const seasonStart = new Date(season.start_date);
    const seasonEnd = new Date(season.end_date);

    if (startDate < seasonStart || endDate > seasonEnd) {
      return json({ 
        error: 'Date range must be within season dates',
        seasonStart: season.start_date,
        seasonEnd: season.end_date
      }, { status: 400 });
    }

    const result = await recurrenceService.batchGenerate(
      params.recurrenceId,
      validated.start_date,
      validated.end_date,
      locals.user.id,
      season.team_id
    );

    return json(result, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error generating practices:', error);
    return json({ error: error.message }, { status: 500 });
  }
}