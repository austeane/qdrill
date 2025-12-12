import { json } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService.js';
import { updateSeasonSchema } from '$lib/validation/seasonSchema.js';

export async function GET({ locals, params }) {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const season = await seasonService.getById(params.seasonId);
		if (!season) {
			return json({ error: 'Season not found' }, { status: 404 });
		}
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
		await seasonService.delete(params.seasonId, locals.user.id);
		return json({ success: true });
	} catch (error) {
		return json({ error: error.message }, { status: error.statusCode || 500 });
	}
}
