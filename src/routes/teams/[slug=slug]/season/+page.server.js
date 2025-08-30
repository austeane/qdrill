import { redirect } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService.js';

export async function load({ locals, parent }) {
  if (!locals.user) {
    throw redirect(302, '/login');
  }
  
  // Get team and userRole from parent layout
  const { team, userRole } = await parent();
  
  if (!userRole) {
    throw redirect(302, '/teams');
  }
  
  const seasons = await seasonService.getTeamSeasons(team.id, locals.user.id);
  
  return {
    seasons
  };
}
