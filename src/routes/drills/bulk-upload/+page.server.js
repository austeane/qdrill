import { apiFetch } from '$lib/utils/apiFetch.js';

export async function load({ fetch }) {
        try {
                const drills = await apiFetch('/api/drills?all=true', {}, fetch);
                return { drills: drills.drills };
        } catch (error) {
                console.error('Error fetching drills for bulk upload:', error);
                return { status: 500, error: 'Internal Server Error' };
        }
}
