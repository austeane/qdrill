import { apiFetch } from '$lib/utils/apiFetch.js';
import { error } from '@sveltejs/kit';

export async function load({ params, fetch, parent }) {
	try {
		// Get team data from parent layout
		const { team, userRole } = await parent();
		
		// Fetch practice plans for this team
		const practicePlans = await apiFetch(`/api/teams/${team.id}/practice-plans`, {}, fetch);

		return {
			practicePlans: practicePlans || []
		};
	} catch (err) {
		console.error('Error loading team practice plans:', err);
		throw error(500, 'Failed to load practice plans');
	}
}