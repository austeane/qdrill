import { json } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService.js';
import { handleApiError } from '../../utils/handleApiError.js';
import { authGuard } from '$lib/server/authGuard.js';

export const POST = authGuard(async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { practicePlanId, practicePlanItemId, newDrillId } = body;
    const userId = locals.session?.user?.id;

    if (!practicePlanId || !practicePlanItemId || !newDrillId) {
      return json({ error: 'Missing required fields: practicePlanId, practicePlanItemId, newDrillId' }, { status: 400 });
    }

    // Convert IDs to integers
    const planId = parseInt(practicePlanId);
    const itemId = parseInt(practicePlanItemId);
    const drillId = parseInt(newDrillId);

    if (isNaN(planId) || isNaN(itemId) || isNaN(drillId)) {
      return json({ error: 'Invalid IDs provided. Must be integers.' }, { status: 400 });
    }

    const updatedItem = await practicePlanService.linkPracticePlanItemToDrill(itemId, drillId, planId, userId);
    
    return json(updatedItem, { status: 200 });

  } catch (err) {
    return handleApiError(err);
  }
}); 