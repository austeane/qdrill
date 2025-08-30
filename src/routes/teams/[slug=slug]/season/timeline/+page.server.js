import { redirect, error } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService.js';

export async function load({ locals, parent }) {
  if (!locals.user) {
    throw redirect(302, '/login');
  }
  
  try {
    // Get team data from parent layout
    const { team, userRole } = await parent();
    
    if (!userRole) {
      throw redirect(302, '/teams');
    }
    
    // Get seasons for this team
    const seasons = await seasonService.getTeamSeasons(team.id, locals.user.id);
    
    // Find active season or use the first one
    const activeSeason = seasons.find(s => s.is_active) || seasons[0];
    
    return {
      season: activeSeason || null
    };
  } catch (err) {
    console.error('Failed to load timeline data:', err);
    if (err.status) throw err;
    throw error(500, 'Failed to load timeline data');
  }
}
