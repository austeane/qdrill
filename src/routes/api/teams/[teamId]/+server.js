import { json } from '@sveltejs/kit';
import { teamService } from '$lib/server/services/teamService';
import { requireTeamAdmin, requireTeamMember } from '$lib/server/auth/teamPermissions';
import { updateTeamSchema } from '$lib/validation/teamSchema';

export async function GET({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    await requireTeamMember(params.teamId, locals.user.id);
    const team = await teamService.getById(params.teamId);
    return json(team);
  } catch (error) {
    return json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function PATCH({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    await requireTeamAdmin(params.teamId, locals.user.id);
    const data = await request.json();
    const validated = updateTeamSchema.parse(data);
    const team = await teamService.update(params.teamId, validated);
    return json(team);
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function DELETE({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    await requireTeamAdmin(params.teamId, locals.user.id);
    await teamService.delete(params.teamId);
    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: error.status || 500 });
  }
}