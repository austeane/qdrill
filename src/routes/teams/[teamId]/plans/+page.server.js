import { apiFetch } from '$lib/utils/apiFetch.js';
import { error } from '@sveltejs/kit';

export async function load({ params, fetch, locals }) {
	const { teamId } = params;

	try {
		// Fetch team data
		const team = await apiFetch(`/api/teams/${teamId}`, {}, fetch);
		
		// Fetch practice plans for this team
		const practicePlans = await apiFetch(`/api/teams/${teamId}/practice-plans`, {}, fetch);
		
		// Check if user is a team member
		const userId = locals.session?.user?.id;
		const teamMember = team.members?.find(m => m.user_id === userId);
		const userRole = teamMember?.role || 'viewer';

		return {
			team,
			practicePlans: practicePlans || [],
			userRole
		};
	} catch (err) {
		console.error('Error loading team practice plans:', err);
		throw error(500, 'Failed to load practice plans');
	}
}