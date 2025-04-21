import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService';
import { handleApiError } from '../../../utils/handleApiError.js'; // Import the helper
import { ValidationError } from '$lib/server/errors.js';
import { authGuard } from '$lib/server/authGuard.js'; // Import authGuard

// Apply authGuard to protect the route
export const PUT = authGuard(async ({ params, request, locals }) => {
  // AuthGuard ensures locals.session.user.id exists
  
  try {
    const drillId = parseInt(params.id);
    
    if (!drillId || isNaN(drillId)) {
      throw new ValidationError('Invalid Drill ID format');
    }
    
    const { parentDrillId } = await request.json();
    // Allow parentDrillId to be null or a valid number
    const parsedParentId = parentDrillId === null ? null : parseInt(parentDrillId);
    if (parentDrillId !== null && isNaN(parsedParentId)) {
      throw new ValidationError('Invalid Parent Drill ID format');
    }
    
    // Service handles the logic and throws specific errors (NotFound, Conflict)
    const result = await drillService.setVariant(drillId, parsedParentId);

    return json(result);
  } catch (err) {
    // Use the centralized error handler
    return handleApiError(err);
  }
});