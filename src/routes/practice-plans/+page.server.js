import { json } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService.js';
import { drillService } from '$lib/server/services/drillService.js';
import { redirect } from '@sveltejs/kit';
// Import predefined skills/focus areas - assuming this is the source
import { PREDEFINED_SKILLS } from '$lib/constants/skills.js'; 

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
  const userId = locals.user?.id;

  // --- Get parameters from URL --- 
  const page = url.searchParams.get('page') || '1';
  const limit = url.searchParams.get('limit') || '10'; // Or your preferred default
  const sortBy = url.searchParams.get('sortBy') || 'created_at';
  const sortOrder = url.searchParams.get('sortOrder') || 'desc';
  const search = url.searchParams.get('search') || '';
  // Get other filter params directly from the URL to pass to the API
  const phaseReq = url.searchParams.getAll('phase_req');
  const phaseExc = url.searchParams.getAll('phase_exc');
  const goalReq = url.searchParams.getAll('goal_req');
  const goalExc = url.searchParams.getAll('goal_exc');
  const minP = url.searchParams.get('minP');
  const maxP = url.searchParams.get('maxP');
  const drillIds = url.searchParams.getAll('drillId');

  // --- Construct API URL --- 
  const apiUrl = new URL(`${url.origin}/api/practice-plans`);
  apiUrl.searchParams.set('page', page);
  apiUrl.searchParams.set('limit', limit);
  apiUrl.searchParams.set('sortBy', sortBy);
  apiUrl.searchParams.set('sortOrder', sortOrder);
  if (search) apiUrl.searchParams.set('search', search);
  phaseReq.forEach(p => apiUrl.searchParams.append('phase_req', p));
  phaseExc.forEach(p => apiUrl.searchParams.append('phase_exc', p));
  goalReq.forEach(g => apiUrl.searchParams.append('goal_req', g));
  goalExc.forEach(g => apiUrl.searchParams.append('goal_exc', g));
  if (minP) apiUrl.searchParams.set('minP', minP);
  if (maxP) apiUrl.searchParams.set('maxP', maxP);
  drillIds.forEach(id => apiUrl.searchParams.append('drillId', id));

  // --- Fetch data from the API endpoint --- 
  let practicePlansData = { items: [], pagination: null };
  try {
      const response = await fetch(apiUrl.toString(), {
          headers: {
              // Pass cookies if necessary for auth, careful with server-side fetch
              // 'cookie': event.request.headers.get('cookie') || ''
          }
      });
      if (!response.ok) {
          console.error(`API Error: ${response.status} ${response.statusText}`);
          // Optionally handle specific errors, e.g., redirect on 401
          // Or return an error state to the page
          practicePlansData = { items: [], pagination: null, error: `Failed to load plans: ${response.statusText}` };
      } else {
          practicePlansData = await response.json();
      }
  } catch (error) {
      console.error('Fetch Error loading practice plans:', error);
      practicePlansData = { items: [], pagination: null, error: 'Could not connect to API' };
  }

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

  // --- Define options for AI Generator ---
  // Assuming a structure like { value: '...', label: '...' } for UI components
  const skillOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' },
    // Note: 'New to Sport' from bulk upload might map differently or not be used here
  ];

  // Use PREDEFINED_SKILLS for focus areas, mapping them to the expected format
  const focusAreaOptions = PREDEFINED_SKILLS.map(skill => ({ value: skill, label: skill }));

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

  // --- Return data to the page ---
  return {
    practicePlans: practicePlansData.items, // Pass items array
    pagination: practicePlansData.pagination, // Pass pagination object
    filterOptions,
    skillOptions, // Add skill options
    focusAreaOptions, // Add focus area options
    initialSelectedDrills,
    // Pass current search/sort state for potential UI binding
    currentSearch: search,
    currentSortBy: sortBy,
    currentSortOrder: sortOrder,
    error: practicePlansData.error // Pass error message if any
  };
}