import { error } from '@sveltejs/kit';
import { apiFetch } from '$lib/utils/apiFetch.js';
import { APIError } from '$lib/utils/errorHandling.js';

export async function load({ params, fetch }) {
	const { id } = params;

	try {
		const practicePlan = await apiFetch(`/api/practice-plans/${id}`, {}, fetch);

		return { practicePlan };
	} catch (err) {
		// Check if it's an APIError with a 404 status
		if (err instanceof APIError && err.status === 404) {
			throw error(404, 'Practice plan not found');
		}

		// Check for other 404 indicators
		if (err.status === 404 || err.message?.includes('not found') || err.message?.includes('404')) {
			throw error(404, 'Practice plan not found');
		}

		// Log other errors
		console.error('Error loading practice plan:', err);
		throw error(500, 'Failed to load practice plan');
	}
}
