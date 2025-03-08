import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService';

export const GET = async ({ url }) => {
  const query = url.searchParams.get('query') || '';
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = parseInt(url.searchParams.get('limit')) || 10;
  const includePagination = url.searchParams.get('includePagination') === 'true';

  try {
    if (query.trim() === '') {
      // If no query is provided, just get drill names
      const drillNames = await drillService.getDrillNames();
      if (!drillNames) {
        return json([]);
      }
      
      // Limit to 50 if not otherwise specified to match previous behavior
      return json(drillNames.slice(0, url.searchParams.has('limit') ? limit : 50));
    } else {
      // If a query is provided, search for matching drills
      const results = await drillService.searchDrills(query, {
        page,
        limit,
        columns: ['id', 'name'] // Only return id and name for search results
      });
      
      if (!results) {
        return json({ items: [], pagination: { page, limit, totalItems: 0, totalPages: 0 } });
      }
      
      // Return with or without pagination info based on the request
      return includePagination ? 
        json(results) : 
        json(results.items);
    }
  } catch (error) {
    console.error('[Search Error] Fetching drill suggestions:', error);
    return json({ error: 'Error fetching drill suggestions', details: error.toString() }, { status: 500 });
  }
}