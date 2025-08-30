import { error, redirect } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService.js';
import { seasonSectionService } from '$lib/server/services/seasonSectionService.js';

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

	// Get sections for the season
	const sections = await seasonSectionService.getSeasonSections(activeSeason.id, locals.user.id);

	return {
		season: activeSeason,
		sections,
		canEdit: userRole === 'admin' || userRole === 'owner'
	};
}
