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

    const seasons = await seasonService.getTeamSeasons(team.id, locals.user.id);
    return json({ items: seasons, count: seasons.length });
  } catch (err) {
    const status = err?.status || 500;
    const message = err?.message || 'Failed to fetch seasons';
    return json({ error: message }, { status });
  }
}

export async function POST({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const team = await teamService.getBySlug(params.slug);
    if (!team) return json({ error: 'Team not found' }, { status: 404 });

    const data = await request.json();
    const payload = { ...data, team_id: team.id };

    const season = await seasonService.create(payload, locals.user.id);
    return json(season, { status: 201 });
  } catch (err) {
    const status = err?.status || 500;
    const message = err?.message || 'Failed to create season';
    return json({ error: message }, { status });
  }
}

