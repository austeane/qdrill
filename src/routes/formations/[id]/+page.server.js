import { error } from '@sveltejs/kit';
import { formationService } from '$lib/server/services/formationService.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals }) {
	try {
		const session = locals.session;
		const userId = session?.user?.id;

		const formationId = parseInt(params.id);
		if (isNaN(formationId)) {
			throw error(400, 'Invalid Formation ID');
		}

		const formation = await formationService.getById(formationId, ['*'], userId);

		if (!formation) {
			throw error(404, 'Formation not found');
		}

		return {
			formation
		};
	} catch (err) {
		console.error('Error loading formation:', err);
		if (err.status) {
			throw error(err.status, err.body?.message || 'Error loading data');
		}
		throw error(500, err.message || 'Error loading formation data');
	}
}
