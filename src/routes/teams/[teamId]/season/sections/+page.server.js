import { error, redirect } from '@sveltejs/kit';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';
import { seasonService } from '$lib/server/services/seasonService.js';
import { seasonSectionService } from '$lib/server/services/seasonSectionService.js';

export async function load({ params, locals }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const { teamId } = params;

	// Get team member info
	const member = await teamMemberService.getMember(teamId, locals.user.id);
	if (!member) {
		throw redirect(303, '/');
	}

    // Get active season
    const activeSeason = await seasonService.getActiveSeason(teamId);

	if (!activeSeason) {
		throw error(404, 'No active season found');
	}

    // Get sections for the season
    const sections = await seasonSectionService.getSeasonSections(activeSeason.id, locals.user.id);

	return {
		team: { id: teamId, role: member.role },
		season: activeSeason,
		sections,
		canEdit: member.role === 'admin' || member.role === 'owner'
	};
}