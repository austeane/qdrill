import { apiFetch } from '$lib/utils/apiFetch.js';

export async function load({ params, fetch }) {
	const { id } = params;

	try {
		const drill = await apiFetch(`/api/drills/${id}?includeVariants=true`, {}, fetch);
		return { drill };
	} catch (error) {
		console.error('[Page Server] Error:', error);
		return { status: 500, error: 'Internal Server Error' };
	}
}
