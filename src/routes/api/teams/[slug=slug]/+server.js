import { json } from '@sveltejs/kit';
import { teamService } from '$lib/server/services/teamService';
import { requireTeamAdmin, requireTeamMember } from '$lib/server/auth/teamPermissions';
import { updateTeamSchema } from '$lib/validation/teamSchema';

export async function GET({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const team = await teamService.getBySlug(params.slug);
    if (!team) {
      return json({ error: 'Team not found' }, { status: 404 });
    }
    await requireTeamMember(team.id, locals.user.id);
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
    const team = await teamService.getBySlug(params.slug);
    if (!team) {
      return json({ error: 'Team not found' }, { status: 404 });
    }
    await requireTeamAdmin(team.id, locals.user.id);
    const data = await request.json();
    const validated = updateTeamSchema.parse(data);
    const updated = await teamService.update(team.id, validated);
    return json(updated);
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
    const team = await teamService.getBySlug(params.slug);
    if (!team) {
      return json({ error: 'Team not found' }, { status: 404 });
    }
    await requireTeamAdmin(team.id, locals.user.id);
    await teamService.delete(team.id);
    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: error.status || 500 });
  }
}
