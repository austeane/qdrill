import { json } from '@sveltejs/kit';
import { teamService } from '$lib/server/services/teamService.js';
import { seasonService } from '$lib/server/services/seasonService.js';

export async function GET({ locals, params }) {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const team = await teamService.getBySlug(params.slug);
		if (!team) return json({ error: 'Team not found' }, { status: 404 });

		const season = await seasonService.getActiveSeason(team.id);
		if (!season) return json({ error: 'No active season' }, { status: 404 });
		return json(season);
	} catch (err) {
		const status = err?.status || 500;
		const message = err?.message || 'Failed to fetch active season';
		return json({ error: message }, { status });
	}
}
