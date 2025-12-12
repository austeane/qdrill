import { apiFetch } from '$lib/utils/apiFetch.js';

export async function load({ fetch }) {
	try {
		// Fetch only id/name for bulk-upload validation and mapping
		const names = await apiFetch('/api/drills/names', {}, fetch);
		return { drills: names };
	} catch (error) {
		console.error('Error fetching drills for bulk upload:', error);
		return { status: 500, error: 'Internal Server Error' };
	}
}
