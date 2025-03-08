import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService';

export const GET = async (event) => {
  const session = await event.locals.getSession();
  const userId = session?.user?.id;

  try {
    // Get all drill names using the DrillService
    const drills = await drillService.getFilteredDrills({}, {
      all: true,
      columns: ['id', 'name', 'visibility', 'created_by', 'parent_drill_id']
    });

    if (!drills || !drills.items) {
      return json([]);
    }

    // Filter based on visibility and user permissions
    const filteredDrills = drills.items.filter(drill => {
      const visibility = drill.visibility || 'public'; // Default to public if not specified
      
      if (visibility === 'public') {
        return true;
      } else if (visibility === 'unlisted') {
        return true;
      } else if (visibility === 'private') {
        return drill.created_by === userId;
      }
      return false;
    });

    return json(filteredDrills);
  } catch (error) {
    console.error('[Names Error] Fetching drill names:', error);
    return json({ error: 'Failed to fetch drill names', details: error.toString() }, { status: 500 });
  }
};