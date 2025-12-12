import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import { userService } from '$lib/server/services/userService';

export async function load({ locals }) {
	// Check if user is authenticated
	if (!locals.user) {
		throw error(401, 'Unauthorized - Please sign in');
	}

	// Check if user is admin
	const isAdmin = await userService.isAdmin(locals.user.id);

	// Allow access if in dev mode OR if user is admin
	if (!dev && !isAdmin) {
		throw error(403, 'Forbidden - Admin access required');
	}

	return {
		isAdmin,
		isDev: dev
	};
}
