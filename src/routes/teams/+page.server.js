import { redirect } from '@sveltejs/kit';
import { teamService } from '$lib/server/services/teamService';

export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(302, '/');
  }
  
  const teams = await teamService.getUserTeams(locals.user.id);
  
  return {
    teams
  };
}