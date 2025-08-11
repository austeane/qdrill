import { json } from '@sveltejs/kit';
import { teamService } from '$lib/server/services/teamService';
import { createTeamSchema } from '$lib/validation/teamSchema';

export async function GET({ locals, url }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  const teams = await teamService.getUserTeams(locals.user.id);
  return json(teams);
}

export async function POST({ locals, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const validated = createTeamSchema.parse(data);
    const team = await teamService.create(validated, locals.user.id);
    return json(team, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.status || 500 });
  }
}