import { json } from '@sveltejs/kit';
import { recurrenceService } from '$lib/server/services/recurrenceService.js';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';
import { seasonService } from '$lib/server/services/seasonService.js';
import { z } from 'zod';

const createRecurrenceSchema = z.object({
	name: z.string().min(1).max(255),
	pattern: z.enum(['weekly', 'biweekly', 'monthly', 'custom']),
	day_of_week: z.array(z.number().min(0).max(6)).optional(),
	day_of_month: z.array(z.number().min(1).max(31)).optional(),
	time_of_day: z
		.string()
		.regex(/^\d{2}:\d{2}(:\d{2})?$/)
		.optional(),
	duration_minutes: z.number().min(15).max(480).default(90),
	template_plan_id: z.number().optional(),
	skip_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).default([]),
	skip_markers: z.boolean().default(false),
	is_active: z.boolean().default(true)
});

// GET - List all recurrence patterns for a season
export async function GET({ locals, params }) {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		// Get season to find team
		const season = await seasonService.getById(params.seasonId);
		if (!season) {
			return json({ error: 'Season not found' }, { status: 404 });
		}

		// Verify user has access to team
		const member = await teamMemberService.getMember(season.team_id, locals.user.id);
		if (!member) {
			return json({ error: 'Not a team member' }, { status: 403 });
		}

		const recurrences = await recurrenceService.getBySeasonId(params.seasonId);
		return json(recurrences);
	} catch (error) {
		console.error('Error fetching recurrences:', error);
		return json({ error: error.message }, { status: 500 });
	}
}

// POST - Create a new recurrence pattern
export async function POST({ locals, params, request }) {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const data = await request.json();

		// Get season to find team
		const season = await seasonService.getById(params.seasonId);
		if (!season) {
			return json({ error: 'Season not found' }, { status: 404 });
		}

		// Verify user is team admin
		const member = await teamMemberService.getMember(season.team_id, locals.user.id);
		if (!member || member.role !== 'admin') {
			return json({ error: 'Only team admins can create recurrence patterns' }, { status: 403 });
		}

		const validated = createRecurrenceSchema.parse(data);

		const recurrence = await recurrenceService.create(
			{
				...validated,
				season_id: params.seasonId,
				team_id: season.team_id
			},
			locals.user.id
		);

		return json(recurrence, { status: 201 });
	} catch (error) {
		if (error.name === 'ZodError') {
			return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
		}
		console.error('Error creating recurrence:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
