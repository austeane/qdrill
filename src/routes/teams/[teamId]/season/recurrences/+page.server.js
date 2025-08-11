import { redirect } from '@sveltejs/kit';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';

export async function load({ locals, params }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const member = await teamMemberService.getMember(params.teamId, locals.user.id);
  if (!member) {
    throw redirect(303, '/');
  }

  return {
    userRole: member.role
  };
}