import { redirect, error } from '@sveltejs/kit';
import { teamService } from '$lib/server/services/teamService';
import { teamMemberService } from '$lib/server/services/teamMemberService';
import { getTeamRole } from '$lib/server/auth/teamPermissions';

export async function load({ locals, params }) {
  if (!locals.user) {
    throw redirect(302, '/');
  }
  
  const team = await teamService.getById(params.teamId);
  if (!team) {
    throw error(404, 'Team not found');
  }
  
  const role = await getTeamRole(params.teamId, locals.user.id);
  if (!role) {
    throw error(403, 'You are not a member of this team');
  }
  
  if (role !== 'admin') {
    throw error(403, 'Only team admins can access settings');
  }
  
  const members = await teamMemberService.getTeamMembers(params.teamId);
  
  return {
    team,
    members,
    userRole: role
  };
}