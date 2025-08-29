import { redirect, error } from '@sveltejs/kit';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';
import { seasonService } from '$lib/server/services/seasonService.js';
import { practicePlanService } from '$lib/server/services/practicePlanService.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, params, url }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const member = await teamMemberService.getMember(params.teamId, locals.user.id);
  if (!member) {
    throw redirect(303, '/');
  }

  try {
    // Determine current week from query param (YYYY-MM-DD) or default to today
    const weekParam = url.searchParams.get('week');
    const initialDate = weekParam ? new Date(weekParam) : new Date();
    const currentWeek = isNaN(initialDate.getTime()) ? new Date() : initialDate;

    // Compute week start/end boundaries (Sunday-Saturday)
    const weekStart = new Date(currentWeek);
    weekStart.setDate(currentWeek.getDate() - currentWeek.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const startDateStr = weekStart.toISOString().split('T')[0];
    const endDateStr = weekEnd.toISOString().split('T')[0];

    // Get active season for the team using server service
    const seasons = await seasonService.getTeamSeasons(params.teamId, locals.user.id);
    const season = seasons.find(s => s.is_active) || seasons[0];
    
    if (!season) {
      return {
        userRole: member.role,
        season: null,
        practices: [],
        markers: [],
        currentWeek: startDateStr,
        error: 'No active season found. Please create and activate a season first.'
      };
    }

    // Get practices for the season and week
    const practicesResult = await practicePlanService.getAll({
      filters: {
        team_id: params.teamId,
        season_id: season.id,
        scheduled_date_start: startDateStr,
        scheduled_date_end: endDateStr
      },
      limit: 100  // Get all practices for the week
    });
    
    const practices = practicesResult.plans || [];

    // Get markers for the season
    let markers = [];
    try {
      const { seasonMarkerService } = await import('$lib/server/services/seasonMarkerService.js');
      const allMarkers = await seasonMarkerService.getSeasonMarkers(season.id);
      // Filter to current week
      markers = allMarkers.filter((m) => {
        const start = m.start_date || m.date;
        const end = m.end_date || m.start_date || m.date;
        return !(end < startDateStr || start > endDateStr);
      });
    } catch (err) {
      console.log('Markers service not available');
    }

    return {
      userRole: member.role,
      season,
      practices,
      markers,
      currentWeek: startDateStr
    };
  } catch (err) {
    console.error('Failed to load week view:', err);
    if (err.status) throw err;
    throw error(500, 'Failed to load week view data');
  }
}