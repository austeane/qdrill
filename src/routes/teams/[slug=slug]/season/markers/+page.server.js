import { error, redirect } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService.js';
import { seasonMarkerService } from '$lib/server/services/seasonMarkerService.js';

export async function load({ locals, parent }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Get team data from parent layout
	const { team, userRole } = await parent();

	if (!userRole) {
		throw redirect(303, '/');
	}

	// Get active season
	const activeSeason = await seasonService.getActiveSeason(team.id);

	if (!activeSeason) {
		throw error(404, 'No active season found');
	}

	// Get markers for the season
	const markers = await seasonMarkerService.getSeasonMarkers(activeSeason.id, locals.user.id);

	return {
		season: activeSeason,
		markers,
		canEdit: userRole === 'admin' || userRole === 'owner'
	};
}
