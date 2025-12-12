import { error } from '@sveltejs/kit';

/**
 * Create a middleware that requires a specific role
 * @param {string} role - Required role
 * @returns {Function} Middleware function
 */
export function requireRole(role) {
	return async ({ locals }) => {
		if (!locals.user) {
			throw error(401, 'Unauthorized - Please sign in');
		}

		if (locals.user.role !== role) {
			throw error(403, `Forbidden - ${role} access required`);
		}
	};
}

/**
 * Middleware that requires admin role
 */
export const requireAdmin = requireRole('admin');

/**
 * Check if a user has a specific role
 * @param {Object} user - User object with role
 * @param {string} role - Role to check
 * @returns {boolean} True if user has role
 */
export function hasRole(user, role) {
	return user?.role === role;
}

/**
 * Check if a user is an admin
 * @param {Object} user - User object with role
 * @returns {boolean} True if user is admin
 */
export function isAdmin(user) {
	return hasRole(user, 'admin');
}
