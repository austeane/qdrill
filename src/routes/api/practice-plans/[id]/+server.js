import { json } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import { dev } from '$app/environment';
import { practicePlanService } from '$lib/server/services/practicePlanService.js';
import { handleApiError } from '../../utils/handleApiError.js';

export async function GET({ params, locals }) {
  const id = params.id;
  const session = locals.session;
  const userId = session?.user?.id;

  try {
    const practicePlan = await practicePlanService.getPracticePlanById(id, userId);
    return json(practicePlan);
  } catch (err) {
    return handleApiError(err);
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
  } catch (err) {
    return handleApiError(err);
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
  } catch (err) {
    return handleApiError(err);
  }
};

// Export the DELETE handler
// Wrap DELETE handler with authGuard for consistent authentication
export const DELETE = authGuard(async ({ params, locals }) => {
  const { id } = params;
  // Get session and userId from locals, populated by authGuard
  const session = locals.session;
  // Assuming authGuard ensures session and session.user exist, similar to PUT handler
  const userId = session?.user?.id;

  try {
    // Validate ID
    const planId = parseInt(id);
    if (isNaN(planId)) {
      return json({ error: 'Invalid practice plan ID' }, { status: 400 });
    }

    // Authentication check is now handled by authGuard, so the explicit 'if (!userId)' is removed.
    // authGuard is expected to ensure userId is valid or deny access.

    // Perform deletion
    await practicePlanService.deletePracticePlan(planId, userId);
    // Return 204 No Content on successful deletion
    return new Response(null, { status: 204 });

  } catch (err) {
    // Log the error in dev mode for debugging
    if (dev) {
      console.error('[API Delete Error]', err);
    }
    // Use the centralized error handler for all errors
    return handleApiError(err);
  }
});

// Dev-only delete handler (remove or secure properly)
// Note: This was likely for testing and should not exist in production.
// Keeping it commented out for now, but should be removed.
/*
const deleteHandlerDevOnly = async ({ params }) => {
  if (dev) {
    try {
      const id = parseInt(params.id);
      if (isNaN(id)) {
        return json({ error: 'Invalid practice plan ID (dev bypass)' }, { status: 400 });
      }
      // Bypass user check in dev
      await practicePlanService.deletePracticePlan(id, null); // DANGEROUS: using null user ID
      return new Response(null, { status: 204 }); // Consistent 204
    } catch (err) {
      console.error('[DEV MODE] Error deleting practice plan:', err);
      return handleApiError(err); // Use error handler here too
    }
  } else {
    // In production, this endpoint should not exist or return 404/403
    return json({ error: 'Not Found' }, { status: 404 });
  }
};
*/
