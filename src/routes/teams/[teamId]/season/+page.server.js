import { redirect } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService.js';
import { getTeamRole } from '$lib/server/auth/teamPermissions.js';

export async function load({ locals, params }) {
  if (!locals.user) {
    throw redirect(302, '/login');
  }
  
  const userRole = await getTeamRole(params.teamId, locals.user.id);
  if (!userRole) {
    throw redirect(302, '/teams');
  }
  
  const seasons = await seasonService.getTeamSeasons(params.teamId, locals.user.id);
  
  return {
    seasons,
    userRole
  };
}