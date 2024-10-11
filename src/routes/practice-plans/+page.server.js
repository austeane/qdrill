import { createClient } from '@vercel/postgres';

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

export async function load({ fetch, url }) {
  // Fetch practice plans from your API
  const practicePlansResponse = await fetch('/api/practice-plans');
  const practicePlans = await practicePlansResponse.json();

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

  return {
    practicePlans,
    filterOptions,
    selectedDrillIds
  };
}