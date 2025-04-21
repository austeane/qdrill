import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService';
import { handleApiError } from '../../../utils/handleApiError.js';
import { authGuard } from '$lib/server/authGuard.js';
import { ValidationError, NotFoundError } from '$lib/server/errors.js';

const ERROR_MESSAGES = {
  NOT_FOUND: 'Drill not found',
  PARENT_NOT_FOUND: 'Parent drill not found',
  FETCH_FAILED: 'Failed to fetch variations',
  CREATE_FAILED: 'Failed to create variation'
};

// Helper function for consistent error responses
function errorResponse(message, details = null, status = 500) {
  console.error(`[Variations Error] ${message}`, details ? `: ${details}` : '');
  return json({ 
    error: message,
    ...(details && { details: details.toString() })
  }, { status });
}

export const GET = async ({ params }) => {
  try {
    const drillId = parseInt(params.id);
    if (!params.id || isNaN(drillId)) {
      throw new ValidationError('Invalid Drill ID format');
    }

    // Service methods handle not found errors internally
    const drill = await drillService.getById(drillId);

    // Handle parent drill case
    if (!drill.parent_drill_id) {
      const drillWithVariations = await drillService.getDrillWithVariations(drillId);
      return json([drillWithVariations, ...(drillWithVariations.variations || [])]);
    }

    // Handle child drill case
    const parentId = drill.parent_drill_id;
    let parentDrill;
    try {
      parentDrill = await drillService.getById(parentId);
    } catch (err) {
      if (err instanceof NotFoundError) {
        console.warn(`Parent drill ID ${parentId} not found for variation ${drillId}. Returning only child.`);
        return json([drill]); // Return only this drill if parent not found
      } 
      throw err; // Re-throw other errors
    }

    // Get all siblings
    const drillWithVariations = await drillService.getDrillWithVariations(parentId);

    // Reorder to put the current drill first after the parent
    const otherVariations = (drillWithVariations.variations || []).filter(v => v.id !== drillId);
    const allDrills = [parentDrill, drill, ...otherVariations];

    return json(allDrills);

  } catch (err) {
    return handleApiError(err);
  }
}

// Apply authGuard to POST
export const POST = authGuard(async ({ params, request, locals }) => {
  const session = locals.session;
  const userId = session?.user?.id; // Guard ensures userId exists

  try {
    const parentId = parseInt(params.id);
    if (!params.id || isNaN(parentId)) {
      throw new ValidationError('Invalid Parent Drill ID format');
    }

    // Parse the request body
    const drillData = await request.json();

    // Basic validation
    if (!drillData.name || !drillData.brief_description) {
      throw new ValidationError('Required fields missing: name, brief_description');
    }

    // Service handles NotFoundError for parent drill
    const variation = await drillService.createVariation(parentId, drillData, userId);

    return json(variation, { status: 201 }); // Return 201 Created

  } catch (err) {
    return handleApiError(err);
  }
});