import { redirect, error } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService.js';
import { teamService } from '$lib/server/services/teamService.js';
import { getTeamRole } from '$lib/server/auth/teamPermissions.js';

export async function load({ locals, params }) {
  if (!locals.user) {
    throw redirect(302, '/login');
  }
  
  const { teamId } = params;
  
  try {
    // Check team membership and get role
    const userRole = await getTeamRole(teamId, locals.user.id);
    if (!userRole) {
      throw redirect(302, '/teams');
    }
    
    // Get team info
    const team = await teamService.getById(teamId);
    if (!team) {
      throw error(404, 'Team not found');
    }
    
    // Get seasons for this team
    const seasons = await seasonService.getTeamSeasons(teamId, locals.user.id);
    
    // Find active season or use the first one
    const activeSeason = seasons.find(s => s.is_active) || seasons[0];
    
    return {
      team,
      season: activeSeason || null,
      userRole
    };
  } catch (err) {
    console.error('Failed to load timeline data:', err);
    if (err.status) throw err;
    throw error(500, 'Failed to load timeline data');
  }
}
