import { error } from '@sveltejs/kit';
import { teamService } from '$lib/server/services/teamService.js';
import { getTeamRole } from '$lib/server/auth/teamPermissions.js';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ params, locals }) {
	// Resolve team from slug only
	const team = await teamService.getBySlug(params.slug).catch(() => null);
	if (!team) {
		throw error(404, 'Team not found');
	}

	let userRole = null;
	if (locals.user) {
		userRole = await getTeamRole(team.id, locals.user.id);
	}

	return { team, userRole };
}
