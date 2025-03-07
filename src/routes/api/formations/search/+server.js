import { json } from '@sveltejs/kit';
import { formationService } from '$lib/server/services/formationService.js';

/**
 * GET handler for searching formations
 * Searches name, brief_description, and detailed_description fields
 */
export async function GET({ url }) {
  const searchTerm = url.searchParams.get('q') || '';
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = parseInt(url.searchParams.get('limit')) || 10;
  const sortBy = url.searchParams.get('sort');
  const sortOrder = url.searchParams.get('order') || 'desc';

  if (!searchTerm) {
    return json({ 
      items: [], 
      pagination: { 
        page, 
        limit, 
        totalItems: 0, 
        totalPages: 0 
      } 
    });
  }

  try {
    const result = await formationService.searchFormations(searchTerm, {
      page,
      limit,
      sortBy,
      sortOrder
    });
    
    return json(result);
  } catch (error) {
    console.error('Error searching formations:', error);
    return json(
      { error: 'An error occurred while searching formations', details: error.message },
      { status: 500 }
    );
  }
}