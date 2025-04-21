import { json } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
// import { query } from '$lib/server/db'; // Use service instead
import { drillService } from '$lib/server/services/drillService.js';
import { handleApiError } from '../../utils/handleApiError.js'; // Import the helper
import { ValidationError } from '$lib/server/errors.js';

export const POST = authGuard(async ({ request, locals }) => {
  const session = locals.session;
  const userId = session?.user?.id; // Guard ensures userId exists

  try {
    const { drillId } = await request.json();

    if (!drillId || isNaN(parseInt(drillId))) {
      throw new ValidationError('Valid Drill ID must be provided in the request body');
    }

    // Use the DrillService to associate the drill
    const updatedDrill = await drillService.associateDrill(drillId, userId);

    // Service method handles not found and already owned cases internally
    // (currently returns existing drill if already owned, throws NotFoundError if not found)

    return json({ success: true, drill: updatedDrill });
    
  } catch (err) {
    // Use the centralized error handler
    return handleApiError(err);
  }
}); 