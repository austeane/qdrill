import { error } from '@sveltejs/kit';
import { kyselyDb } from '$lib/server/db.js';

/**
 * Public view of a season calendar
 * Accessible with share token
 */
export async function load({ params, url }) {
	const { seasonId } = params;
	const token = url.searchParams.get('token');

	if (!token) {
		throw error(401, 'Access token required');
	}

	try {
		// Validate token and get season
		const season = await kyselyDb
			.selectFrom('seasons as s')
			.innerJoin('teams as t', 's.team_id', 't.id')
			.selectAll('s')
			.select(['t.name as team_name', 't.timezone', 't.default_start_time'])
			.where('s.id', '=', seasonId)
			.where('s.public_view_token', '=', token)
			.executeTakeFirst();

		if (!season) {
			throw error(404, 'Season not found or invalid token');
		}

		// Get published practices only
		const practices = await kyselyDb
			.selectFrom('practice_plans')
			.selectAll()
			.where('season_id', '=', seasonId)
			.where('is_published', '=', true)
			.orderBy('scheduled_date', 'asc')
			.orderBy('start_time', 'asc')
			.execute();

		// Get markers
		const markers = await kyselyDb
			.selectFrom('season_markers')
			.selectAll()
			.where('season_id', '=', seasonId)
			.orderBy('start_date', 'asc')
			.execute();

		// Get sections
		const sections = await kyselyDb
			.selectFrom('season_sections')
			.selectAll()
			.where('season_id', '=', seasonId)
			.orderBy('start_date', 'asc')
			.orderBy('end_date', 'asc')
			.execute();

		return {
			season,
			practices,
			markers,
			sections,
			isPublicView: true,
			icsUrl: `/api/seasons/${seasonId}/calendar.ics?token=${season.ics_token}`
		};
	} catch (err) {
		console.error('Error loading public season view:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, 'Failed to load season');
	}
}
