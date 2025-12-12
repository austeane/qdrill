import { json } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService';
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
		const planId = parseInt(id);
		if (isNaN(planId)) {
			return json({ error: 'Invalid practice plan ID' }, { status: 400 });
		}

		// User must be logged in to associate
		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const userId = session.user.id;

		const body = await request.json().catch(() => ({}));
		const claimToken = body?.claimToken;

		if (!verifyClaimToken('practice-plan', planId, claimToken)) {
			throw new ForbiddenError('Invalid or missing claim token for practice plan association');
		}

		const updatedPlan = await practicePlanService.associatePracticePlan(planId, userId);

		return json(updatedPlan);
	} catch (err) {
		// Use the centralized error handler
		return handleApiError(err);
	}
}
