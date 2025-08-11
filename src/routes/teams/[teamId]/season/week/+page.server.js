import { redirect } from '@sveltejs/kit';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, params, url, fetch }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const member = await teamMemberService.getMember(params.teamId, locals.user.id);
  if (!member) {
    throw redirect(303, '/');
  }

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

  // Fetch active season for the team
  const seasonRes = await fetch(`/api/teams/${params.teamId}/seasons/active`);
  if (seasonRes.status === 404) {
    return {
      userRole: member.role,
      season: null,
      practices: [],
      markers: [],
      currentWeek: startDateStr,
      error: 'No active season found. Please create and activate a season first.'
    };
  }
  if (!seasonRes.ok) {
    return {
      userRole: member.role,
      season: null,
      practices: [],
      markers: [],
      currentWeek: startDateStr,
      error: 'Failed to load season'
    };
  }
  const season = await seasonRes.json();

  // Fetch practices for the computed week
  const practicesRes = await fetch(
    `/api/teams/${params.teamId}/practice-plans?start_date=${startDateStr}&end_date=${endDateStr}&season_id=${season.id}`
  );
  let practices = [];
  if (practicesRes.ok) {
    const practiceData = await practicesRes.json();
    practices = practiceData.plans || practiceData || [];
  }

  // Fetch all markers for the season and filter to current week range
  const markersRes = await fetch(`/api/seasons/${season.id}/markers`);
  let markers = [];
  if (markersRes.ok) {
    const markerData = await markersRes.json();
    const allMarkers = markerData.all || markerData || [];
    markers = allMarkers.filter((m) => {
      const start = m.start_date;
      const end = m.end_date || m.start_date;
      return !(end < startDateStr || start > endDateStr);
    });
  }

  return {
    userRole: member.role,
    season,
    practices,
    markers,
    currentWeek: startDateStr
  };
}