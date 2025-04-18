import { json } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService.js';

/**
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ params, request, locals }) {
  const parentId = params.id; 
  const { childId, associationType } = await request.json();
  const session = locals.session;
  const userId = session?.user?.id;

  if (!userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const planId = parseInt(parentId);

  if (isNaN(planId)) {
    return json({ error: 'Invalid Practice Plan ID' }, { status: 400 });
  }

  try {
    const updatedPlan = await practicePlanService.associatePracticePlan(planId, userId);
    return json(updatedPlan, { status: 200 });
  } catch (error) {
    console.error(`Error associating practice plan ${planId} with user ${userId}:`, error);
    if (error.message === 'Practice plan not found') {
      return json({ error: 'Practice plan not found' }, { status: 404 });
    }
    // Handle case where plan might already be owned
    if (error.message === 'Practice plan already has an owner') {
        const plan = await practicePlanService.getById(planId);
        return json(plan, { status: 200 });
    }
    return json({ error: 'Failed to associate practice plan' }, { status: 500 });
  }
} 