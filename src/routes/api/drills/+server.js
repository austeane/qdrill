import { json, error as svelteKitError } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import { drillService } from '$lib/server/services/drillService';
import { AppError, DatabaseError, ValidationError } from '$lib/server/errors'; // Import AppError and specific types if needed

// Helper function to convert AppError to SvelteKit error response
function handleApiError(err) {
  if (err instanceof AppError) {
    console.warn(`[API Warn] (${err.status} ${err.code}): ${err.message}`);
    // Use SvelteKit's error helper for standard errors, or json for custom structure
    // Let's stick to the custom structure: { error: { code, message } }
    const body = { error: { code: err.code, message: err.message } };
    // Add details for validation errors
    if (err instanceof ValidationError && err.details) {
      body.error.details = err.details;
    }
    return json(body, { status: err.status });
  } else {
    console.error('[API Error] Unexpected error:', err);
    // Default to 500 Internal Server Error for unknown errors
    return json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected internal server error occurred' } }, { status: 500 });
  }
}

export const GET = async ({ url, locals }) => {
  // Get session info to pass userId for filtering
  const session = locals.session;
  const userId = session?.user?.id;

  // Pagination
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');

  // Sorting
  const sortBy = url.searchParams.get('sort'); // e.g., 'name', 'date_created'
  const sortOrder = url.searchParams.get('order') || 'desc'; // 'asc' or 'desc'

  // Filters - Parse all specified filters from performance.md
  const filters = {};
  const parseCommaSeparated = (param) => 
    url.searchParams.has(param) ? url.searchParams.get(param).split(',').map(t => t.trim().toLowerCase()).filter(t => t) : undefined;

  filters.skill_level = parseCommaSeparated('skillLevel');
  filters.complexity = url.searchParams.get('complexity')?.toLowerCase();
  filters.skills_focused_on = parseCommaSeparated('skills');
  filters.positions_focused_on = parseCommaSeparated('positions');
  filters.drill_type = parseCommaSeparated('types');
  
  const minPeople = url.searchParams.get('minPeople');
  const maxPeople = url.searchParams.get('maxPeople');
  if (minPeople) filters.number_of_people_min = parseInt(minPeople);
  if (maxPeople) filters.number_of_people_max = parseInt(maxPeople);

  const minLength = url.searchParams.get('minLength');
  const maxLength = url.searchParams.get('maxLength');
  // Assuming suggested_length is stored in minutes (or some numeric unit)
  if (minLength) filters.suggested_length_min = parseInt(minLength); 
  if (maxLength) filters.suggested_length_max = parseInt(maxLength);

  const parseBooleanFilter = (param) => {
    const value = url.searchParams.get(param)?.toLowerCase();
    return value === 'true' ? true : (value === 'false' ? false : undefined);
  }
  filters.hasVideo = parseBooleanFilter('hasVideo');
  filters.hasDiagrams = parseBooleanFilter('hasDiagrams');
  filters.hasImages = parseBooleanFilter('hasImages');

  filters.searchQuery = url.searchParams.get('q');

  // Add userId to filters
  if (userId) filters.userId = userId;

  // Remove undefined filters
  Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

  // Build options objects for the service
  const options = { 
    page, 
    limit, 
    sortBy, 
    sortOrder 
  };

  try {
    // Call the enhanced getFilteredDrills method
    const result = await drillService.getFilteredDrills(filters, options);

    // Return structure matches the frontend expectation from Phase 2 plan
    return json(result); 
  } catch (err) { // Renamed variable to err
    // Use the helper function
    return handleApiError(err);
  }
}

export const POST = async (event) => {
  try {
    const drillData = await event.request.json();
    const session = event.locals.session;
    const userId = session?.user?.id || null;
    
    // Basic validation at API boundary (example)
    if (!drillData.name || !drillData.brief_description) {
      throw new ValidationError('Missing required fields: name, brief_description');
    }

    // Use the DrillService to create the drill
    const drill = await drillService.createDrill(drillData, userId);
    
    return json(drill, { status: 201 }); // Return 201 Created
  } catch (err) { // Renamed variable to err
    // Use the helper function
    return handleApiError(err);
  }
};

export const PUT = authGuard(async ({ request, locals }) => {
  try {
    const drillData = await request.json();
    const session = locals.session;
    const userId = session.user.id;
    
    // Basic validation
    if (!drillData.id) {
      throw new ValidationError('Drill ID is required for update');
    }

    // Use the DrillService to update the drill
    const updatedDrill = await drillService.updateDrill(drillData.id, drillData, userId);
    
    return json(updatedDrill);
  } catch (err) { // Renamed variable to err
    // Use the helper function
    return handleApiError(err);
  }
});

export const DELETE = authGuard(async ({ params, request, locals }) => {
  // In SvelteKit, for API routes with dynamic parameters, the parameter comes from params.id 
  // But this is the collection route, DELETE on /api/drills doesn't make sense semantically
  // It should likely be on /api/drills/[id]
  // Keeping the logic as it was, but noting this route might be incorrect
  const idParam = params.id; // This will likely be undefined here
  const { id } = await request.json(); // Assume ID comes from body for now
  
  if (!id) {
    return handleApiError(new ValidationError('Drill ID must be provided in the request body for DELETE'));
  }
  
  const session = locals.session;
  const userId = session.user.id;

  try {
    // Use the DrillService to delete the drill
    const success = await drillService.deleteDrill(id, userId, { deleteRelated: false }); // Default to not deleting related

    if (!success) {
      // If deleteDrill returns false, it means not found (based on current service logic)
      // Convert this to a NotFoundError for consistency
      return handleApiError(new NotFoundError(`Drill with ID ${id} not found for deletion.`));
    }

    return json({ message: 'Drill deleted successfully' }, { status: 200 }); // Use 200 OK or 204 No Content
  } catch (err) { // Renamed variable to err
    // Use the helper function
    return handleApiError(err);
  }
});
