import { error, redirect } from '@sveltejs/kit';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';
import { seasonService } from '$lib/server/services/seasonService.js';
import { seasonMarkerService } from '$lib/server/services/seasonMarkerService.js';
import { teamService } from '$lib/server/services/teamService.js';

export async function load({ params, locals }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const { teamId } = params;

	const team = await teamService.getById(teamId);

	// Get team member info
	const member = await teamMemberService.getMember(team.id, locals.user.id);
	if (!member) {
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
		team: { id: team.id, role: member.role },
		season: activeSeason,
		markers,
		canEdit: member.role === 'admin' || member.role === 'owner'
	};
}
