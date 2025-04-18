import { json } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import { dev } from '$app/environment';
import { practicePlanService } from '$lib/server/services/practicePlanService.js';

export async function GET({ params, locals }) {
  const id = params.id;
  const session = locals.session;
  const userId = session?.user?.id;

  try {
    const practicePlan = await practicePlanService.getPracticePlanById(id, userId);
    return json(practicePlan);
  } catch (error) {
    console.error('[API] Error fetching practice plan:', error);
    
    if (error.message === 'Practice plan not found') {
      return json({ error: error.message }, { status: 404 });
    }
    
    if (error.message === 'Unauthorized') {
      return json({ error: error.message }, { status: 403 });
    }
    
    return json(
      { error: 'Failed to retrieve practice plan', details: error.toString() },
      { status: 500 }
    );
  }
}

export const PUT = async ({ params, request, locals }) => {
  const { id } = params;
  const plan = await request.json();
  const session = locals.session;
  const userId = session?.user?.id;

  try {
    const updatedPlan = await practicePlanService.updatePracticePlan(id, plan, userId);
    return json(updatedPlan);
  } catch (error) {
    console.error('[API] Error updating practice plan:', error);
    
    if (error.message === 'Practice plan not found') {
      return json({ error: error.message }, { status: 404 });
    }
    
    if (error.message === 'Unauthorized to edit this practice plan' || 
        error.message === 'Unauthorized') {
      return json({ error: error.message }, { status: 403 });
    }
    
    return json(
      { error: 'Failed to update practice plan', details: error.toString() },
      { status: 500 }
    );
  }
};

export const DELETE = authGuard(async ({ params, locals }) => {
  const { id } = params;
  const session = locals.session;
  const userId = session?.user?.id;

  try {
    // In development mode, we'll allow all users to delete plans
    if (dev) {
      const result = await practicePlanService.deletePracticePlan(id, userId);
      return json({ success: true, message: 'Practice plan deleted successfully' });
    } else {
      // In production, enforce permissions
      const result = await practicePlanService.deletePracticePlan(id, userId);
      return json({ success: true, message: 'Practice plan deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting practice plan:', error);
    
    if (error.message === 'Practice plan not found') {
      return json({ error: error.message }, { status: 404 });
    }
    
    if (error.message === 'Unauthorized to delete this practice plan') {
      return json({ error: error.message }, { status: 403 });
    }
    
    return json(
      { error: 'Failed to delete practice plan', details: error.toString() },
      { status: 500 }
    );
  }
});
