import { json } from '@sveltejs/kit';
import { formationService } from '$lib/server/services/formationService';
import { handleApiError } from '../../../utils/handleApiError.js';

/**
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ params, locals }) {
	try {
		const { id } = params;
		const session = await locals.auth();

		// Validate ID
		const formationId = parseInt(id);
		if (isNaN(formationId)) {
			return json({ error: 'Invalid formation ID' }, { status: 400 });
		}

		// User must be logged in to associate
		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const userId = session.user.id;
		// Service method handles NotFoundError and ConflictError
		const updatedFormation = await formationService.associateFormation(formationId, userId);

		return json(updatedFormation);
	} catch (err) {
		// Use the centralized error handler
		return handleApiError(err);
	}
}
