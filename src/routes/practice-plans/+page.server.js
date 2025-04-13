import { json } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService.js';
import { drillService } from '$lib/server/services/drillService.js';

/**
 * Parses the URL query parameters to extract drill IDs.
 * Supports multiple drillIds, e.g., ?drillId=61&drillId=62
 * @param {URLSearchParams} searchParams 
 * @returns {number[]} Array of drill IDs
 */
function getSelectedDrillIds(searchParams) {
  const drillIds = searchParams.getAll('drillId');
  // Convert to numbers and filter out invalid entries
  return drillIds
    .map(id => parseInt(id, 10))
    .filter(id => !isNaN(id));
}

export async function load({ fetch, url, locals }) {
  // Fetch practice plans directly from the service
  const userId = locals.user?.id;
  const result = await practicePlanService.getAll({ userId });
  const practicePlans = result.items; // Assuming service returns { items: [...] }

  // Define filter options directly in the server-side code
  const filterOptions = {
    phaseOfSeason: [
      'Offseason',
      'Early season, new players',
      'Mid season, skill building',
      'Tournament tuneup',
      'End of season, peaking'
    ],
    estimatedParticipants: { min: 1, max: 100 },
    practiceGoals: [
      'Conditioning',
      'Skill development',
      'Team strategy',
      'Game preparation',
      'Recovery'
    ]
  };

  // Extract selectedDrillIds from URL query parameters
  const selectedDrillIds = getSelectedDrillIds(url.searchParams);
  let initialSelectedDrills = [];

  // If there are drill IDs in the URL, fetch their names server-side
  if (selectedDrillIds.length > 0) {
    try {
      // Assuming drillService has a method to get multiple drills by ID
      // or we fetch them individually (less efficient but works)
      initialSelectedDrills = await Promise.all(
        selectedDrillIds.map(async (id) => {
          try {
            const drill = await drillService.getById(id, ['id', 'name']); // Fetch only id and name
            return drill ? { id: drill.id, name: drill.name } : null;
          } catch (drillError) {
            console.warn(`Failed to fetch drill name for ID ${id}:`, drillError);
            return null; // Return null if a specific drill fetch fails
          }
        })
      );
      // Filter out any null results from failed fetches
      initialSelectedDrills = initialSelectedDrills.filter(drill => drill !== null);
    } catch (error) {
      console.error('Error fetching initial selected drill names:', error);
      // Handle error, maybe return empty array or log
      initialSelectedDrills = []; 
    }
  }

  return {
    practicePlans,
    filterOptions,
    initialSelectedDrills
  };
}