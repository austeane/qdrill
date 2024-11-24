import { writable, derived } from 'svelte/store';
import { PREDEFINED_SKILLS } from '$lib/constants/skills';
import { selectedSortOption, selectedSortOrder } from './sortStore.js';
import { FILTER_STATES } from '$lib/constants';

// Data Store
export const drills = writable([]);

// Filter Option Stores - Changed to objects for three-state filtering
export const selectedSkillLevels = writable({});
export const selectedComplexities = writable({});
export const selectedSkillsFocusedOn = writable({});
export const selectedPositionsFocusedOn = writable({});
export const selectedNumberOfPeopleMin = writable(0);
export const selectedNumberOfPeopleMax = writable(100);
export const selectedSuggestedLengthsMin = writable(0);
export const selectedSuggestedLengthsMax = writable(120);
export const selectedHasVideo = writable(false);
export const selectedHasDiagrams = writable(false);
export const selectedHasImages = writable(false);
export const searchQuery = writable('');
export const selectedDrillTypes = writable({});

// Helper function for three-state filtering
function filterByThreeState(itemValue, filterState, allPossibleValues) {
    if (!filterState || Object.keys(filterState).length === 0) return true;

    // Normalize the item value to lowercase for comparison
    const normalizedItemValue = itemValue?.toLowerCase?.();

    const requiredValues = [];
    const excludedValues = [];

    for (const [value, state] of Object.entries(filterState)) {
        // Normalize the filter value to lowercase
        const normalizedValue = value.toLowerCase();
        if (state === FILTER_STATES.REQUIRED) {
            requiredValues.push(normalizedValue);
        } else if (state === FILTER_STATES.EXCLUDED) {
            excludedValues.push(normalizedValue);
        }
    }

    // 1. First check if all values are excluded
    const totalPossibleValues = allPossibleValues || [];
    const excludedAll = totalPossibleValues.length > 0 && 
                       excludedValues.length === totalPossibleValues.length;
    if (excludedAll) {
        return false;
    }

    // 2. If the item has no value, and there are required values, exclude it
    if (!normalizedItemValue && requiredValues.length > 0) {
        return false;
    }

    // 3. If there are required values, item must match one
    if (requiredValues.length > 0) {
        return requiredValues.includes(normalizedItemValue);
    }

    // 4. If the item has a value and it's in excluded values, exclude it
    if (normalizedItemValue && excludedValues.includes(normalizedItemValue)) {
        return false;
    }

    return true;
}

// Helper function for array-based three-state filtering
function filterByThreeStateArray(itemValues, filterState) {
    if (!filterState || Object.keys(filterState).length === 0) return true;

    const requiredValues = [];
    const excludedValues = [];

    for (const [value, state] of Object.entries(filterState)) {
        if (state === FILTER_STATES.REQUIRED) {
            requiredValues.push(value);
        } else if (state === FILTER_STATES.EXCLUDED) {
            excludedValues.push(value);
        }
    }

    // Ensure itemValues is an array
    const valuesArray = Array.isArray(itemValues) ? itemValues : [];

    // 1. First check if all values are excluded
    if (excludedValues.length > 0 && excludedValues.length === Object.keys(filterState).length) {
        return false;
    }

    // 2. If the item has no values and there are required values, exclude it
    if ((!valuesArray || valuesArray.length === 0) && requiredValues.length > 0) {
        return false;
    }

    // 3. If there are required values, item must have all of them
    if (requiredValues.length > 0) {
        return requiredValues.every(value => valuesArray.includes(value));
    }

    // 4. If any of the item's values are in excluded values, exclude it
    if (valuesArray.some(value => excludedValues.includes(value))) {
        return false;
    }

    return true;
}

// Update the filteredDrills derived store to include all dependencies
export const filteredDrills = derived(
    [
        drills,
        selectedSkillLevels,
        selectedComplexities,
        selectedSkillsFocusedOn,
        selectedPositionsFocusedOn,
        selectedNumberOfPeopleMin,
        selectedNumberOfPeopleMax,
        selectedSuggestedLengthsMin,
        selectedSuggestedLengthsMax,
        selectedHasVideo,
        selectedHasDiagrams,
        selectedHasImages,
        searchQuery,
        selectedDrillTypes
    ],
    ([
        $drills,
        $selectedSkillLevels,
        $selectedComplexities,
        $selectedSkillsFocusedOn,
        $selectedPositionsFocusedOn,
        $selectedNumberOfPeopleMin,
        $selectedNumberOfPeopleMax,
        $selectedSuggestedLengthsMin,
        $selectedSuggestedLengthsMax,
        $selectedHasVideo,
        $selectedHasDiagrams,
        $selectedHasImages,
        $searchQuery,
        $selectedDrillTypes
    ]) => {
        // Group drills logic remains the same...
        const drillGroups = $drills.reduce((groups, drill) => {
            const groupId = drill.parent_drill_id || drill.id;
            if (!groups[groupId]) {
                groups[groupId] = [];
            }
            groups[groupId].push(drill);
            return groups;
        }, {});

        let filteredDrills = Object.values(drillGroups).map(group => {
            return group.reduce((highest, current) => {
                const currentUpvotes = current.upvotes || 0;
                const highestUpvotes = (highest && highest.upvotes) || 0;
                
                if (currentUpvotes === highestUpvotes) {
                    return !current.parent_drill_id ? current : highest || current;
                }
                
                return currentUpvotes > highestUpvotes ? current : highest;
            });
        });

        return filteredDrills.filter(drill => {
            let matches = true;

            // Search Query filtering
            if ($searchQuery.trim() !== '') {
                const query = $searchQuery.trim().toLowerCase();
                if (!drill.name.toLowerCase().includes(query) &&
                    !drill.brief_description.toLowerCase().includes(query) &&
                    !drill.detailed_description.toLowerCase().includes(query)) {
                    matches = false;
                }
            }

            // Updated filtering using three-state functions
            matches = matches && filterByThreeStateArray(drill.skill_level || [], $selectedSkillLevels);
            matches = matches && filterByThreeState(drill.complexity, $selectedComplexities);
            matches = matches && filterByThreeStateArray(drill.skills_focused_on || [], $selectedSkillsFocusedOn);
            matches = matches && filterByThreeStateArray(drill.positions_focused_on || [], $selectedPositionsFocusedOn);
            matches = matches && filterByThreeStateArray(drill.drill_type || [], $selectedDrillTypes);

            // Number range filters
            if (drill.number_of_people_min > $selectedNumberOfPeopleMax ||
                drill.number_of_people_max < $selectedNumberOfPeopleMin) {
                matches = false;
            }

            // Updated Suggested Length filtering
            if (drill.suggested_length) {
                const range = drill.suggested_length.toString().split('-');
                if (range.length === 2) {
                    // If it's a range format (e.g., "5-15")
                    const [start, end] = range.map(n => parseInt(n, 10));
                    // Only filter out if the entire range is outside the selected range
                    if (end < $selectedSuggestedLengthsMin || start > $selectedSuggestedLengthsMax) {
                        matches = false;
                    }
                } else {
                    // If it's a single number
                    const length = parseInt(drill.suggested_length, 10);
                    if (!isNaN(length) && (length < $selectedSuggestedLengthsMin || length > $selectedSuggestedLengthsMax)) {
                        matches = false;
                    }
                }
            }

            // Boolean filters
            if ($selectedHasVideo && !drill.video_link) matches = false;
            if ($selectedHasDiagrams && (!drill.diagrams || drill.diagrams.length === 0)) matches = false;
            if ($selectedHasImages && (!drill.images || drill.images.length === 0)) matches = false;

            return matches;
        });
    }
);

// Pagination Store
export const currentPage = writable(1);
export const drillsPerPage = writable(9);

export const totalPages = derived(
  [filteredDrills, drillsPerPage],
  ([$filteredDrills, $drillsPerPage]) => Math.ceil($filteredDrills.length / $drillsPerPage)
);

export const paginatedDrills = derived(
  [filteredDrills, currentPage, drillsPerPage, selectedSortOption, selectedSortOrder],
  ([$filteredDrills, $currentPage, $drillsPerPage, $selectedSortOption, $selectedSortOrder]) => {
    console.log('Sort parameters:', {
      option: $selectedSortOption,
      order: $selectedSortOrder,
      firstItem: $filteredDrills[0]?.date_created
    });

    // Sort the filtered drills
    const sortedDrills = [...$filteredDrills].sort((a, b) => {
      if (!$selectedSortOption) return 0;

      // Special handling for date_created
      if ($selectedSortOption === 'date_created') {
        // Convert to timestamps and ensure they're numbers
        const aValue = new Date(a.date_created || 0).getTime();
        const bValue = new Date(b.date_created || 0).getTime();
        
        console.log('Sorting dates:', {
          a_date: a.date_created,
          b_date: b.date_created,
          a_timestamp: aValue,
          b_timestamp: bValue,
          order: $selectedSortOrder
        });

        // Direct comparison for dates
        return $selectedSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle other sorting cases...
      let aValue = a[$selectedSortOption];
      let bValue = b[$selectedSortOption];

      if ($selectedSortOption.includes('.')) {
        const keys = $selectedSortOption.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (aValue < bValue) return $selectedSortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return $selectedSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Log sorted results
    console.log('Sorted drills:', 
      sortedDrills.slice(0, 3).map(drill => ({
        name: drill.name,
        date: drill.date_created,
        timestamp: new Date(drill.date_created).getTime()
      }))
    );

    const start = ($currentPage - 1) * $drillsPerPage;
    const end = $currentPage * $drillsPerPage;
    return sortedDrills.slice(start, end);
  }
);

// Function to initialize drills data
export function initializeDrills(data) {
  drills.set(data);
  
  // Calculate the max suggested length
  const maxSuggestedLength = Math.max(...data.map(drill => drill.suggested_length.max));
  
  // Update the suggestedLengths store
  suggestedLengths.set({ min: 0, max: maxSuggestedLength });
}

// Function to reset pagination when filters change
filteredDrills.subscribe(() => {
  currentPage.set(1);
});

// Make sure you have a suggestedLengths store
export const suggestedLengths = writable({ min: 0, max: 120 });

// All Skills Store with sorting
export const allSkills = writable([]);

export const sortedSkills = derived(allSkills, $allSkills => 
  $allSkills
    .filter(skill => skill && typeof skill.skill === 'string') // Add this line
    .sort((a, b) => {
      // 1. Sort by usage_count descending
      if (b.usage_count !== a.usage_count) {
        return b.usage_count - a.usage_count;
      }
      // 2. Predefined skills first
      if (a.isPredefined !== b.isPredefined) {
        return a.isPredefined ? -1 : 1;
      }
      // 3. Alphabetical order
      return a.skill.localeCompare(b.skill);
    })
);

// Add a derived store for n counts
export const variationCounts = derived(drills, $drills => {
  return $drills.reduce((counts, drill) => {
    const groupId = drill.parent_drill_id || drill.id;
    counts[groupId] = (counts[groupId] || 0) + 1;
    return counts;
  }, {});
});
