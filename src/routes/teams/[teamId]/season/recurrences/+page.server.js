import { redirect } from '@sveltejs/kit';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';
import { teamService } from '$lib/server/services/teamService.js';

export async function load({ locals, params }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const team = await teamService.getById(params.teamId);
  const member = await teamMemberService.getMember(team.id, locals.user.id);
  if (!member) {
    throw redirect(303, '/');
  }

  return {
    team,
    userRole: member.role
  };
}
