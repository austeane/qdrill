import { json } from '@sveltejs/kit';
import { formationService } from '$lib/server/services/formationService.js';
import { authGuard } from '$lib/server/authGuard';
import { dev } from '$app/environment';
import { handleApiError } from '../utils/handleApiError.js';

/**
 * GET handler for formations
 * Supports filtering, pagination, and getting all formations
 */
export async function GET({ url, locals }) {
  try {
    const session = await locals.auth();
    const userId = session?.user?.id ?? null;
  
    // Pagination
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
  
    // Sorting
    const sortBy = url.searchParams.get('sort'); // e.g., 'name', 'created_at'
    const sortOrder = url.searchParams.get('order'); // 'asc' or 'desc'
  
    // Filters
    const tagsParam = url.searchParams.get('tags'); // Comma-separated
    const formation_type = url.searchParams.get('type');
    const searchQuery = url.searchParams.get('q');

    // Parse tags
    const tags = tagsParam ? tagsParam.split(',').map(t => t.trim()).filter(t => t) : undefined;

    // Build options objects for the service
    const filters = {};
    if (tags) filters.tags = tags;
    if (formation_type) filters.formation_type = formation_type;
    if (searchQuery) filters.searchQuery = searchQuery;

    const sortOptions = {};
    if (sortBy) sortOptions.sortBy = sortBy;
    if (sortOrder) sortOptions.sortOrder = sortOrder;

    const paginationOptions = { 
      page, 
      limit, 
      columns: ['id', 'name', 'brief_description', 'tags', 'formation_type', 'created_at'] 
    };
    
    // Add userId to filters for visibility checks
    filters.userId = userId;

    const result = await formationService.getFilteredFormations(
      filters,
      sortOptions,
      paginationOptions
    );
    
    return json(result);
  } catch (err) {
    // Use the centralized error handler
    return handleApiError(err);
  }
}

/**
 * POST handler for creating a new formation
 */
export async function POST({ request, locals }) {
  try {
    const formationData = await request.json();
    const session = await locals.auth();
    const userId = session?.user?.id || null;
  
    console.log('Creating formation with data:', JSON.stringify(formationData, null, 2));
    console.log('User ID:', userId);
  
    const newFormation = await formationService.createFormation(formationData, userId);
    return json(newFormation, { status: 201 });
  } catch (err) {
    // Use the centralized error handler
    return handleApiError(err);
  }
}

/**
 * PUT handler for updating an existing formation
 * Requires authentication and proper permissions
 */
export const PUT = authGuard(async ({ request, locals }) => {
  const formationData = await request.json();
  const session = locals.session;
  const userId = session.user.id;
  const { id } = formationData;
  
  try {
    // Check if the formation exists
    const formation = await formationService.getById(id);
    
    if (!formation) {
      return json({ error: 'Formation not found' }, { status: 404 });
    }
    
    // Check authorization only if not in dev mode
    if (!dev) {
      // Allow edit if user created the formation or if it's editable by others
      if (formation.created_by !== userId && !formation.is_editable_by_others && formation.created_by !== null) {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }
    }
    
    // If formation has no creator, assign it to the current user
    if (formation.created_by === null) {
      formationData.created_by = userId;
    }
    
    const updatedFormation = await formationService.updateFormation(id, formationData);
    return json(updatedFormation);
  } catch (error) {
    console.error('Error updating formation:', error);
    return json(
      { error: 'An error occurred while updating the formation', details: error.message },
      { status: 500 }
    );
  }
});