import { error } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';

export const load = authGuard(async ({ fetch }) => {
    try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
            const userData = await response.json();
            return { userData };
        } else {
            const errorData = await response.json();
            throw error(response.status, errorData.error || 'Failed to load profile data');
        }
    } catch (err) {
        console.error('Error loading profile data:', err);
        throw error(500, 'An error occurred while loading the profile data');
    }
});
