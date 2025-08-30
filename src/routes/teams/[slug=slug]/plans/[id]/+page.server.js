import { error } from '@sveltejs/kit';
import { apiFetch } from '$lib/utils/apiFetch.js';
import { APIError } from '$lib/utils/errorHandling.js';

export async function load({ params, fetch, parent }) {
	const { id } = params;

	try {
		// Get team data from parent layout
		const { team, userRole } = await parent();
		
		// Fetch the practice plan - same as regular practice plan viewer
		const practicePlan = await apiFetch(`/api/practice-plans/${id}`, {}, fetch);
		
		// Verify the practice plan belongs to this team
		if (practicePlan.team_id && practicePlan.team_id !== team.id) {
			throw error(403, 'This practice plan does not belong to this team');
		}

		return { 
			practicePlan,
			isTeamContext: true // Flag to indicate team context
		};
	} catch (err) {
		// Check if it's an APIError with a 404 status
		if (err instanceof APIError && err.status === 404) {
			throw error(404, 'Practice plan not found');
		}
		
		// Check for other 404 indicators
		if (err.status === 404 || err.message?.includes('not found') || err.message?.includes('404')) {
			throw error(404, 'Practice plan not found');
		}
		
		// Re-throw SvelteKit errors
		if (err.status && err.body) {
			throw err;
		}
		
		// Log other errors
		console.error('Error loading team practice plan:', err);
		throw error(500, 'Failed to load practice plan');
	}
}
