import { json } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService.js';
import { FILTER_STATES } from '$lib/constants'; // Import FILTER_STATES
import { z } from 'zod'; // Import zod
import { createPracticePlanSchema } from '$lib/validation/practicePlanSchema'; // Import Zod schema
import { AppError, DatabaseError, ValidationError, NotFoundError } from '$lib/server/errors'; // Import error types

// --- Replicated handleApiError from /api/drills --- 
// (Consider moving to a shared ../utils location)
function handleApiError(err) {
  // Handle Zod validation errors specifically
  if (err instanceof z.ZodError) {
    console.warn(`[API Warn] Validation failed:`, err.flatten());
    // Convert Zod errors to the format expected by the frontend/ValidationError
    const details = err.flatten().fieldErrors;
    const validationError = new ValidationError('Validation failed', details);
    return json({ error: { code: validationError.code, message: validationError.message, details: validationError.details } }, { status: validationError.status });
  } 
  // Handle custom AppErrors
  else if (err instanceof AppError) {
    console.warn(`[API Warn] (${err.status} ${err.code}): ${err.message}`);
    const body = { error: { code: err.code, message: err.message } };
    if (err instanceof ValidationError && err.details) {
      body.error.details = err.details;
    }
    return json(body, { status: err.status });
  } 
  // Handle generic errors
  else {
    console.error('[API Error] Unexpected error:', err);
    return json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected internal server error occurred' } }, { status: 500 });
  }
}
// --- End replicated handleApiError ---

// Custom error class for better error handling
class PracticePlanError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function GET({ url, locals }) {
  const userId = locals.user?.id;
  
  // Extract query parameters
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const sortBy = url.searchParams.get('sortBy') || 'created_at';
  const sortOrder = url.searchParams.get('sortOrder') || 'desc';
  const searchQuery = url.searchParams.get('search') || '';

  // Extract filters
  const filters = {
      searchQuery: searchQuery || undefined,
      phase_of_season: extractFilterParam(url.searchParams, 'phase'),
      practice_goals: extractFilterParam(url.searchParams, 'goal'),
      min_participants: parseIntOrNull(url.searchParams.get('minP')),
      max_participants: parseIntOrNull(url.searchParams.get('maxP')),
      drill_ids: url.searchParams.getAll('drillId')
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id))
  };

  // Remove empty drill_ids array
  if (filters.drill_ids.length === 0) {
      delete filters.drill_ids;
  }

  try {
    const result = await practicePlanService.getAll({
      userId,
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
    });
    // Return the whole result object including items and pagination
    return json(result);
  } catch (err) {
    // Use the centralized error handler
    return handleApiError(err);
  }
}

/**
 * Helper to parse integer or return null
 * @param {string | null} value
 * @returns {number | null}
 */
function parseIntOrNull(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
}

/**
 * Helper to extract multi-state filter parameters
 * e.g., phase_req=Offseason&phase_exc=Mid season
 * @param {URLSearchParams} searchParams
 * @param {string} baseParamName e.g., 'phase'
 * @returns {{ required: string[], excluded: string[] } | undefined}
 */
function extractFilterParam(searchParams, baseParamName) {
    const required = searchParams.getAll(`${baseParamName}_req`);
    const excluded = searchParams.getAll(`${baseParamName}_exc`);

    if (required.length === 0 && excluded.length === 0) {
        return undefined; // No filter applied for this param
    }

    return {
        required,
        excluded
    };
}

export const POST = async ({ request, locals }) => {
  try {
    const rawData = await request.json();
    const userId = locals.user?.id;

    // Add userId before validation
    const dataWithUser = { ...rawData, created_by: userId };

    // Validate using Zod schema
    const validationResult = createPracticePlanSchema.safeParse(dataWithUser);

    if (!validationResult.success) {
      // Throw ZodError to be caught by handleApiError
      throw validationResult.error;
    }

    // Use the validated data
    const validatedData = validationResult.data;

    // Create practice plan using the service
    // Pass validated data to the service
    const result = await practicePlanService.createPracticePlan(validatedData, userId);
    
    return json(
      { id: result.id, message: 'Practice plan created successfully' }, 
      { status: 201 }
    );
  } catch (err) {
    // Use the centralized error handler
    return handleApiError(err);
  }
};
