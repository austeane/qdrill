import { redirect } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService.js';
import { getTeamRole } from '$lib/server/auth/teamPermissions.js';
import { teamService } from '$lib/server/services/teamService.js';

export async function load({ locals, params }) {
  if (!locals.user) {
    throw redirect(302, '/login');
  }
  
  const team = await teamService.getById(params.teamId);
  const userRole = await getTeamRole(team.id, locals.user.id);
  if (!userRole) {
    throw redirect(302, '/teams');
  }
  
  const seasons = await seasonService.getTeamSeasons(team.id, locals.user.id);
  
  return {
    seasons,
    team,
    userRole
  };
}
