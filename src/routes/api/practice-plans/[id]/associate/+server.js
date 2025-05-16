import { json } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService';
import { handleApiError } from '../../../utils/handleApiError.js';

/**
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ params, locals }) {
	try {
		const { id } = params;
		const session = await locals.auth();

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
		const updatedPlan = await practicePlanService.associatePracticePlan(planId, userId);

		return json(updatedPlan);
	} catch (err) {
		// Use the centralized error handler
		return handleApiError(err);
	}
}
