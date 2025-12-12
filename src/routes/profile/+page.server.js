import { error } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import { apiFetch } from '$lib/utils/apiFetch.js';

export const load = authGuard(async ({ fetch }) => {
	try {
		const userData = await apiFetch('/api/users/me', {}, fetch);
		return { userData };
	} catch (err) {
		console.error('Error loading profile data:', err);
		throw error(500, {
			message: err.message || 'Failed to load profile data',
			code: 'PROFILE_LOAD_FAILED'
		});
	}
});
