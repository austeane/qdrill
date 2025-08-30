import { json } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService.js';
import { requireTeamAdmin, requireTeamMember } from '$lib/server/auth/teamPermissions.js';
import { createSeasonSchema } from '$lib/validation/seasonSchema.js';
import { teamService } from '$lib/server/services/teamService.js';

export async function GET({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const team = await teamService.getById(params.teamId);
    await requireTeamMember(team.id, locals.user.id);
    const seasons = await seasonService.getTeamSeasons(team.id, locals.user.id);
    return json(seasons);
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function POST({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const team = await teamService.getById(params.teamId);
    await requireTeamAdmin(team.id, locals.user.id);
    
    const data = await request.json();
    const validated = createSeasonSchema.parse({
      ...data,
      team_id: team.id
    });
    
    const season = await seasonService.create(validated, locals.user.id);
    return json(season, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
