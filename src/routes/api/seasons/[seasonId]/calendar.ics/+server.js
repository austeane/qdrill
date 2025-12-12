import { error } from '@sveltejs/kit';
import { icsService } from '$lib/server/services/icsService.js';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';
import { query } from '$lib/server/db.js';

/**
 * GET /api/seasons/[seasonId]/calendar.ics
 * Generate and serve ICS calendar feed for a season
 *
 * Query params:
 * - token: Share token for public access
 *
 * Without token: Requires authenticated user with team membership
 * With token: Public access if token is valid
 */
export async function GET({ params, url, locals }) {
	const { seasonId } = params;
	const token = url.searchParams.get('token');

	// Validate seasonId is a UUID to prevent type errors with PostgreSQL
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(seasonId)) {
		throw error(400, 'Invalid season ID format');
	}

	try {
		// Get season to check team
		const seasonResult = await query('SELECT team_id FROM seasons WHERE id = $1', [seasonId]);

		if (seasonResult.rows.length === 0) {
			throw error(404, 'Season not found');
		}

		const teamId = seasonResult.rows[0].team_id;
		let includeUnpublished = false;

		// Check authorization
		if (token) {
			// Public access with token
			const isValid = await icsService.validateShareToken(seasonId, token);
			if (!isValid) {
				throw error(401, 'Invalid or expired share token');
			}
			// Public access only sees published practices
			includeUnpublished = false;
		} else if (locals.user) {
			// Authenticated user access
			const member = await teamMemberService.getMember(teamId, locals.user.id);
			if (!member) {
				throw error(403, 'You must be a team member to access this calendar');
			}
			// Admins and coaches can see unpublished practices
			includeUnpublished = member.role === 'admin' || member.role === 'coach';
		} else {
			throw error(401, 'Authentication required');
		}

		// Get season data and generate ICS
		const data = await icsService.getSeasonDataForIcs(seasonId, includeUnpublished);
		const icsContent = icsService.generateIcs(data);

		// Return ICS file
		return new Response(icsContent, {
			headers: {
				'Content-Type': 'text/calendar; charset=utf-8',
				'Content-Disposition': `attachment; filename="${data.season.name.replace(/[^a-z0-9]/gi, '_')}_calendar.ics"`,
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				Pragma: 'no-cache',
				Expires: '0'
			}
		});
	} catch (err) {
		console.error('Error generating ICS feed:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, 'Failed to generate calendar feed');
	}
}
