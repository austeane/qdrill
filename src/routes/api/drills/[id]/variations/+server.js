import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService';

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
  const { id } = params;
  console.log('[Variations API] Fetching variations for drill:', id);

  try {
    const drill = await drillService.getById(id);
    
    if (!drill) {
      return errorResponse(ERROR_MESSAGES.NOT_FOUND, null, 404);
    }
    
    // Handle parent drill case
    if (!drill.parent_drill_id) {
      // This is a parent drill, get the full drill with variations
      const drillWithVariations = await drillService.getDrillWithVariations(id);
      
      if (!drillWithVariations.variations) {
        return json([drill]);
      }
      
      return json([drill, ...drillWithVariations.variations]);
    } 
    
    // Handle child drill case
    const parentId = drill.parent_drill_id;
    const parentDrill = await drillService.getById(parentId);
    
    if (!parentDrill) {
      return json([drill]); // Return only this drill if parent not found
    }
    
    // Get all siblings
    const drillWithVariations = await drillService.getDrillWithVariations(parentId);
    
    if (!drillWithVariations.variations) {
      return json([parentDrill, drill]);
    }
    
    // Reorder to put the current drill first after the parent
    const reorderedVariations = drillWithVariations.variations.sort((a, b) => {
      if (a.id === parseInt(id)) return -1;
      if (b.id === parseInt(id)) return 1;
      return b.upvotes - a.upvotes; // Then sort by upvotes
    });
    
    return json([parentDrill, ...reorderedVariations]);
  } catch (error) {
    return errorResponse(ERROR_MESSAGES.FETCH_FAILED, error);
  }
}

export const POST = async ({ params, request, locals }) => {
  const { id } = params;
  const session = await locals.getSession();
  const userId = session?.user?.id || null;

  try {
    // Parse the request body
    const drillData = await request.json();
    
    // Basic validation
    if (!drillData.name) {
      return errorResponse('Name is required', null, 400);
    }
    
    // Create the variation using the DrillService
    const variation = await drillService.createVariation(id, drillData, userId);
    
    return json(variation);
  } catch (error) {
    if (error.message === 'Parent drill not found') {
      return errorResponse(ERROR_MESSAGES.PARENT_NOT_FOUND, null, 404);
    }
    
    return errorResponse(ERROR_MESSAGES.CREATE_FAILED, error);
  }
}