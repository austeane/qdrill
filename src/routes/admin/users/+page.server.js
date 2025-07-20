import { userService } from '$lib/server/services/userService';
import { fail } from '@sveltejs/kit';

export async function load() {
	try {
		// Get all users with their roles
		const users = await userService.getAll({
			columns: ['id', 'name', 'email', 'role', 'created_at'],
			orderBy: 'created_at',
			orderDirection: 'DESC'
		});

		return {
			users
		};
	} catch (error) {
		console.error('Error loading users:', error);
		return {
			users: []
		};
	}
}

export const actions = {
	updateRole: async ({ request, locals }) => {
		// Check if current user is admin
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const isAdmin = await userService.isAdmin(locals.user.id);
		if (!isAdmin) {
			return fail(403, { error: 'Forbidden - Admin access required' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId');
		const role = formData.get('role');

		if (!userId || !role) {
			return fail(400, { error: 'Missing required fields' });
		}

		try {
			await userService.setUserRole(userId, role);
			return { success: true };
		} catch (error) {
			console.error('Error updating user role:', error);
			return fail(500, { error: error.message });
		}
	}
};