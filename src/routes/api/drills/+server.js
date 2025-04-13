import { json } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import { drillService } from '$lib/server/services/drillService';

export const GET = async ({ url, locals }) => {
  // Get session info to pass userId for filtering
  const session = await locals.getSession();
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
  } catch (error) {
    console.error('[API Error] Fetching drills:', error);
    return json({ error: 'An error occurred while fetching drills', details: error.toString() }, { status: 500 });
  }
}

export const POST = async (event) => {
  try {
    const drillData = await event.request.json();
    const session = await event.locals.getSession();
    const userId = session?.user?.id || null;
    
    // Use the DrillService to create the drill
    const drill = await drillService.createDrill(drillData, userId);
    
    return json(drill);
  } catch (error) {
    console.error('Error occurred while creating drill:', error);
    return json({ error: 'An error occurred while creating the drill', details: error.toString() }, { status: 500 });
  }
};

export const PUT = authGuard(async ({ request, locals }) => {
  try {
    const drillData = await request.json();
    const session = await locals.getSession();
    const userId = session.user.id;
    
    // Use the DrillService to update the drill
    const updatedDrill = await drillService.updateDrill(drillData.id, drillData, userId);
    
    return json(updatedDrill);
  } catch (error) {
    // Handle specific error types
    if (error.message === 'Unauthorized to edit this drill') {
      return json({ error: 'Unauthorized' }, { status: 403 });
    } else if (error.message.includes('not found')) {
      return json({ error: 'Drill not found' }, { status: 404 });
    }
    
    console.error('Error updating drill:', error);
    return json({ error: 'An error occurred while updating the drill', details: error.toString() }, { status: 500 });
  }
});

export const DELETE = authGuard(async ({ params, request, locals }) => {
  // In SvelteKit, for API routes with dynamic parameters, the parameter comes from params.id 
  const id = params.id;
  const session = await locals.getSession();
  const userId = session.user.id;

  try {
    // Use the DrillService to delete the drill
    const result = await drillService.deleteDrill(id, userId);
    
    if (!result) {
      return json({ error: 'Drill not found' }, { status: 404 });
    }
    
    return json({ message: 'Drill deleted successfully' });
  } catch (error) {
    // Handle unauthorized error
    if (error.message === 'Unauthorized to delete this drill') {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    console.error(`[Delete Error] Drill ${id}:`, error);
    return json({ error: 'An error occurred while deleting the drill', details: error.toString() }, { status: 500 });
  }
});
