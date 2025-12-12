import { json } from '@sveltejs/kit';
import { formationService } from '$lib/server/services/formationService';
import { handleApiError } from '../../../utils/handleApiError.js';
import { verifyClaimToken } from '$lib/server/utils/claimTokens.js';
import { ForbiddenError } from '$lib/server/errors.js';

/**
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ params, locals, request }) {
	try {
		const { id } = params;
		const session = locals.session;

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

		const body = await request.json().catch(() => ({}));
		const claimToken = body?.claimToken;

		if (!verifyClaimToken('formation', formationId, claimToken)) {
			throw new ForbiddenError('Invalid or missing claim token for formation association');
		}

		// Service method handles NotFoundError and ConflictError
		const updatedFormation = await formationService.associateFormation(formationId, userId);

		return json(updatedFormation);
	} catch (err) {
		// Use the centralized error handler
		return handleApiError(err);
	}
}
