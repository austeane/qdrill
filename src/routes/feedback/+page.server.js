// Assuming a FeedbackService exists or direct DB access / fetch is needed.
// Using fetch for now.
import { dev } from '$app/environment'; // To check if running locally for delete button
import { apiFetch } from '$lib/utils/apiFetch.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, depends }) {
	try {
		// Depend on a custom identifier for invalidation
		depends('app:feedback');

		let feedbackEntries = [];
		try {
			feedbackEntries = await apiFetch('/api/feedback', {}, fetch);
		} catch (err) {
			console.error(`Error fetching feedback:`, err);
		}

		return {
			feedbackEntries,
			isDev: dev // Pass dev environment status to page for conditional rendering (e.g., delete button)
		};
	} catch (err) {
		console.error('Error loading feedback page data:', err);
		// Return empty or throw error
		return {
			feedbackEntries: [],
			isDev: dev,
			loadError: 'Failed to load feedback data'
		};
		// throw error(500, 'Failed to load feedback data');
	}
}
