import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService';

export const GET = async (event) => {
  const session = await event.locals.getSession();
  const userId = session?.user?.id;

  try {
    // Get drill names, filtered by visibility in the service
    const result = await drillService.getFilteredDrills({
      userId: userId // Pass userId for filtering
    }, {
      limit: 1000, // Fetch a large number, consider pagination if this grows
      sortBy: 'name', // Sort alphabetically by name
      sortOrder: 'asc',
      // Select only necessary columns (handled by service now)
      columns: ['id', 'name']
    });

    if (!result || !result.items) {
      return json([]);
    }

    // Return the items directly as they only contain id and name
    return json(result.items);
  } catch (error) {
    console.error('[Names Error] Fetching drill names:', error);
    return json({ error: 'Failed to fetch drill names', details: error.toString() }, { status: 500 });
  }
};