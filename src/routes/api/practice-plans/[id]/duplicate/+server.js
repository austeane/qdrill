import { json } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService';
import { handleApiError } from '../../../utils/handleApiError.js';

export async function POST({ params, locals }) {
	try {
		const { id } = params;
		const session = await locals.auth();
		const userId = session?.user?.id ?? null;

		const planId = parseInt(id);
		if (isNaN(planId)) {
			return json({ error: 'Invalid practice plan ID' }, { status: 400 });
		}

		const newPlan = await practicePlanService.duplicatePracticePlan(planId, userId);

		return json(newPlan, { status: 201 });
	} catch (err) {
		return handleApiError(err);
	}
}
