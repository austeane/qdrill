import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';

export function load() {
    // Only allow access in development mode
    if (!dev) {
        throw redirect(307, '/');
    }
} 