import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService';
import { handleApiError } from '../../utils/handleApiError.js'; // Import the helper

export const GET = async (event) => {
  const session = event.locals.session;
  const userId = session?.user?.id;

  try {
    // Service method handles filtering and potential DB errors
    const result = await drillService.getFilteredDrills({
      userId: userId // Pass userId for filtering private drills
    }, {
      limit: 10000, // Increased limit, consider cursor pagination if list grows very large
      sortBy: 'name',
      sortOrder: 'asc',
      columns: ['id', 'name'] // Request only necessary columns
    });

    // Return the items directly
    return json(result?.items || []);
    
  } catch (err) {
    // Use the centralized error handler
    return handleApiError(err);
  }
};