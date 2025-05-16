import { createAuthClient } from 'better-auth/svelte';

/**
 * Better Auth client instance for use in Svelte components.
 * Provides reactive stores and functions for authentication actions.
 */
export const authClient = createAuthClient({
	// Add any client-specific configurations here if needed
	// For example, base path if your auth routes are not at the root
	// basePath: '/api/auth'
});
