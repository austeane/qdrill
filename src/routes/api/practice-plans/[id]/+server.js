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

// Wrap PUT handler with authGuard
export const PUT = authGuard(async ({ params, request, locals }) => {
  const { id } = params;
  const plan = await request.json();
  const session = locals.session;
  const userId = session?.user?.id; // authGuard ensures session and user exist

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
});

// Define the core deletion logic as a separate async function
const handleDelete = async ({ params, locals }) => {
  const { id } = params;
  const session = locals.session;
  const userId = session?.user?.id;

  try {
    const result = await practicePlanService.deletePracticePlan(id, userId);
    return json({ success: true, message: 'Practice plan deleted successfully' });
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
};

// Export the DELETE handler
export const DELETE = async (event) => {
  // In development mode, bypass the authGuard entirely
  if (dev) {
    console.log('[DEV MODE BYPASS] Allowing practice plan deletion without auth guard.');
    // Directly call the core logic, but still need user ID for the service
    const { params, locals } = event;
    const id = params.id;
    const userId = locals.session?.user?.id; // Still pass userId if available, service might use it

    try {
      // Note: The service *itself* might still enforce ownership unless bypassed there too.
      // For now, we are just bypassing the authGuard wrapper.
      await practicePlanService.deletePracticePlan(id, userId);
      return json({ success: true, message: 'Practice plan deleted successfully (dev bypass)' });
    } catch (error) {
      console.error('[DEV MODE] Error deleting practice plan:', error);
      if (error.message === 'Practice plan not found') {
        return json({ error: error.message }, { status: 404 });
      }
      // Handle other potential errors even in dev mode
      return json(
        { error: 'Failed to delete practice plan (dev mode)', details: error.toString() },
        { status: 500 }
      );
    }
  } else {
    // In production, use the authGuard
    const guardedDelete = authGuard(handleDelete);
    return guardedDelete(event);
  }
};
