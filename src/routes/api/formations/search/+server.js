import { json } from '@sveltejs/kit';
import { formationService } from '$lib/server/services/formationService.js';
import { handleApiError } from '../utils/handleApiError';

/**
 * GET handler for searching formations
 * Searches name, brief_description, and detailed_description fields
 */
export async function GET({ url }) {
  try {
    const searchTerm = url.searchParams.get('q');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const sortBy = url.searchParams.get('sort');
    const sortOrder = url.searchParams.get('order') || 'desc';

    if (!searchTerm) {
      throw new Error('Search term is required');
    }

    const result = await formationService.searchFormations(searchTerm, {
      page,
      limit,
      sortBy,
      sortOrder
    });
    
    return json(result);
  } catch (err) {
    return handleApiError(err);
  }
}