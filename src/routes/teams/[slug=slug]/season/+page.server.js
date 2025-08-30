import { redirect, error } from '@sveltejs/kit';
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

  try {
    const seasons = await seasonService.getTeamSeasons(team.id, locals.user.id);
    return { seasons };
  } catch (err) {
    // Normalize service-layer errors to SvelteKit HttpErrors
    if (err?.status && err?.message) {
      // If not a member, send them back to teams list
      if (err.code === 'VALIDATION_ERROR' || /team members/i.test(err.message)) {
        throw redirect(302, '/teams');
      }
      throw error(err.status, err.message);
    }
    throw error(500, 'Failed to load seasons');
  }
}
