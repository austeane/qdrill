import { redirect, error } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService.js';

export async function load({ locals, parent }) {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const { team, userRole } = await parent();

	if (!userRole) {
		throw redirect(302, '/teams');
	}

	try {
		const seasons = await seasonService.getTeamSeasons(team.id, locals.user.id);
		return { seasons };
	} catch (err) {
		console.error('Season load error:', err);

		// If validation error about team membership, redirect
		if (err?.message?.includes('team members')) {
			throw redirect(302, '/teams');
		}

		// Pass through HTTP errors
		if (err?.status) {
			throw error(err.status, err.message || 'Failed to load seasons');
		}

		throw error(500, 'Failed to load seasons');
	}
}
