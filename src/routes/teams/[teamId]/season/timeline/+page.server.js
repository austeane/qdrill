import { apiFetch } from '$lib/utils/apiFetch.js';
import { error } from '@sveltejs/kit';

export async function load({ params, locals }) {
  const { teamId } = params;
  
  try {
    // Get team info
    const team = await apiFetch(`/api/teams/${teamId}`, {
      headers: { 'auth-token': locals.token }
    });
    
    if (!team) {
      throw error(404, 'Team not found');
    }
    
    // Get seasons for this team
    const seasons = await apiFetch(`/api/teams/${teamId}/seasons`, {
      headers: { 'auth-token': locals.token }
    });
    
    // Find active season
    const activeSeason = seasons.find(s => s.is_active);
    
    return {
      team,
      season: activeSeason,
      userRole: locals.userRole || 'viewer'
    };
  } catch (err) {
    console.error('Failed to load timeline data:', err);
    throw error(500, 'Failed to load timeline data');
  }
}
