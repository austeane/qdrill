import { error, redirect } from '@sveltejs/kit';
import { formationService } from '$lib/server/services/formationService.js';
import { dev } from '$app/environment';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals }) {
	const session = locals.session;
	const userId = session?.user?.id;
	const id = params.id;

	try {
		const formation = await formationService.getById(params.id);

		if (!formation) {
			throw error(404, 'Formation not found');
		}

		// Check if user has permission to edit, bypass in dev mode
		if (!dev) {
			const canEdit =
				formation.is_editable_by_others ||
				formation.created_by === userId ||
				formation.created_by === null;

			if (!canEdit) {
				// Redirect to the view page if not allowed to edit
				throw redirect(303, `/formations/${params.id}?error=unauthorized`);
			}
		}

		return { formation };
	} catch (err) {
		// Re-throw redirects
		if (err.status === 303) {
			throw err;
		}
		console.error('Error loading formation for edit:', err);
		throw error(500, 'Error loading formation');
	}
}
