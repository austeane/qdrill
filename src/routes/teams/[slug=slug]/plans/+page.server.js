import { apiFetch } from '$lib/utils/apiFetch.js';
import { error } from '@sveltejs/kit';

export async function load({ fetch, parent }) {
	try {
		// Get team data from parent layout
		const { team } = await parent();

		// Fetch practice plans for this team (API returns { items, count })
		const res = await apiFetch(`/api/teams/${team.slug}/practice-plans`, {}, fetch);
		const practicePlans = Array.isArray(res) ? res : (res?.items ?? []);

		return {
			practicePlans: practicePlans || []
		};
	} catch (err) {
		console.error('Error loading team practice plans:', err);
		throw error(500, 'Failed to load practice plans');
	}
}
