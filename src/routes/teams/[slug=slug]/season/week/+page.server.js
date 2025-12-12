import { redirect, error } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService.js';
import { query } from '$lib/server/db.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url, parent }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Get team data from parent layout
	const { team, userRole } = await parent();

	if (!userRole) {
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

		const toLocalISO = (d) => {
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		};
		const startDateStr = toLocalISO(weekStart);
		const endDateStr = toLocalISO(weekEnd);

		// Get active season for the team using server service
		const seasons = await seasonService.getTeamSeasons(team.id, locals.user.id);
		const season = seasons.find((s) => s.is_active) || seasons[0];

		if (!season) {
			return {
				season: null,
				practices: [],
				markers: [],
				currentWeek: startDateStr,
				error: 'No active season found. Please create and activate a season first.'
			};
		}

		// Get practices for the season and week
		// Non-admins should only see published practices
		const isAdmin = userRole === 'admin' || userRole === 'coach';
		let sql = `
      SELECT * FROM practice_plans
      WHERE team_id = $1 AND season_id = $2
        AND scheduled_date BETWEEN $3 AND $4`;
		const params = [team.id, season.id, startDateStr, endDateStr];
		if (!isAdmin) {
			sql += ` AND is_published = true`;
		}
		sql += ` ORDER BY scheduled_date, start_time`;

		const practicesRes = await query(sql, params);
		const practices = practicesRes.rows || [];

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
			season,
			practices,
			markers,
			currentWeek: startDateStr,
			userRole
		};
	} catch (err) {
		console.error('Failed to load week view:', err);
		if (err?.status && err?.message) {
			throw error(err.status, err.message);
		}
		throw error(500, 'Failed to load week view data');
	}
}
