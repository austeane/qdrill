import { json } from '@sveltejs/kit';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';
import { query } from '$lib/server/db.js';
import { requireTeamAdmin, requireTeamMember } from '$lib/server/auth/teamPermissions.js';
import { teamMemberSchema } from '$lib/validation/teamSchema';
import { teamService } from '$lib/server/services/teamService.js';

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
    // Single join query to avoid N+1
    const rows = await query(
      `SELECT 
         m.team_id,
         m.user_id,
         m.role,
         m.created_at,
         m.updated_at,
         u.name,
         u.email,
         u.image
       FROM team_members m
       JOIN users u ON u.id = m.user_id
       WHERE m.team_id = $1
       ORDER BY (m.role = 'admin') DESC, u.name ASC`,
      [team.id]
    );
    const members = rows.rows.map((r) => ({
      team_id: r.team_id,
      user_id: r.user_id,
      role: r.role,
      created_at: r.created_at,
      updated_at: r.updated_at,
      user: { id: r.user_id, name: r.name, email: r.email, image: r.image }
    }));
    return json(members);
  } catch (error) {
    return json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function POST({ locals, params, request }) {
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
    const validated = teamMemberSchema.parse(data);
    const member = await teamMemberService.addMember(
      team.id,
      validated.user_id,
      validated.role
    );
    return json(member, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function PATCH({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const { user_id, role } = data;
    
    const team = await teamService.getBySlug(params.slug);
    if (!team) {
      return json({ error: 'Team not found' }, { status: 404 });
    }
    const member = await teamMemberService.updateRole(
      team.id,
      user_id,
      role,
      locals.user.id
    );
    return json(member);
  } catch (error) {
    return json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function DELETE({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const { user_id } = data;
    
    const team = await teamService.getBySlug(params.slug);
    if (!team) {
      return json({ error: 'Team not found' }, { status: 404 });
    }
    await teamMemberService.removeMember(
      team.id,
      user_id,
      locals.user.id
    );
    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: error.status || 500 });
  }
}
