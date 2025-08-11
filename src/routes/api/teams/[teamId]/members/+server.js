import { json } from '@sveltejs/kit';
import { teamMemberService } from '$lib/server/services/teamMemberService';
import { userService } from '$lib/server/services/userService';
import { requireTeamAdmin, requireTeamMember } from '$lib/server/auth/teamPermissions';
import { teamMemberSchema } from '$lib/validation/teamSchema';

export async function GET({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    await requireTeamMember(params.teamId, locals.user.id);
    const members = await teamMemberService.getTeamMembers(params.teamId);
    
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
    await requireTeamAdmin(params.teamId, locals.user.id);
    const data = await request.json();
    const validated = teamMemberSchema.parse(data);
    const member = await teamMemberService.addMember(
      params.teamId,
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
    
    const member = await teamMemberService.updateRole(
      params.teamId,
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
    
    await teamMemberService.removeMember(
      params.teamId,
      user_id,
      locals.user.id
    );
    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: error.status || 500 });
  }
}