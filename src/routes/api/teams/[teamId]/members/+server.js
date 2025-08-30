import { json } from '@sveltejs/kit';
import { teamMemberService } from '$lib/server/services/teamMemberService';
import { userService } from '$lib/server/services/userService';
import { requireTeamAdmin, requireTeamMember } from '$lib/server/auth/teamPermissions';
import { teamMemberSchema } from '$lib/validation/teamSchema';
import { teamService } from '$lib/server/services/teamService.js';

export async function GET({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const team = await teamService.getById(params.teamId);
    await requireTeamMember(team.id, locals.user.id);
    const members = await teamMemberService.getTeamMembers(team.id);
    
    // Fetch user details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const user = await userService.getById(member.user_id);
        return {
          ...member,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image
          }
        };
      })
    );
    
    return json(membersWithDetails);
  } catch (error) {
    return json({ error: error.message }, { status: error.status || 500 });
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
    
    const team = await teamService.getById(params.teamId);
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
    
    const team = await teamService.getById(params.teamId);
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
