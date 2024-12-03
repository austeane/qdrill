import { writable, derived, get } from 'svelte/store';
import { PREDEFINED_SKILLS } from '$lib/constants/skills';
import { selectedSortOption, selectedSortOrder } from './sortStore.js';
import { FILTER_STATES } from '$lib/constants';

// Pagination stores
export const currentPage = writable(1);
export const drillsPerPage = writable(10);
export const totalPages = writable(1);
export const isLoading = writable(false);

// Data stores
export const drills = writable([]);
export const allDrills = writable([]);
export const allDrillsLoaded = writable(false);

// Filter stores
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

// Skills store
export const allSkills = writable(PREDEFINED_SKILLS);
export const sortedSkills = derived(allSkills, $allSkills => [...$allSkills].sort((a, b) => a.name.localeCompare(b.name)));

// Function to sort drills consistently
function sortDrills(drills, sortOption = null, sortOrder = 'desc') {
  return [...drills].sort((a, b) => {
    if (!sortOption) {
      // Default sort by date_created DESC
      return new Date(b.date_created) - new Date(a.date_created);
    }

    let comparison = 0;
    switch (sortOption) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'complexity':
        comparison = (a.complexity || '').localeCompare(b.complexity || '');
        break;
      case 'suggested_length':
        const aLength = parseInt(a.suggested_length) || 0;
        const bLength = parseInt(b.suggested_length) || 0;
        comparison = aLength - bLength;
        break;
      case 'date_created':
        comparison = new Date(a.date_created) - new Date(b.date_created);
        break;
      default:
        return new Date(b.date_created) - new Date(a.date_created);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

// Function to fetch all drills
export async function fetchAllDrills() {
  if (get(allDrillsLoaded)) return;
  
  try {
    console.log('Fetching all drills...');
    const response = await fetch('/api/drills?all=true');
    if (!response.ok) throw new Error('Failed to fetch all drills');
    
    const data = await response.json();
    
    // Sort the drills before storing them
    const sortedDrills = sortDrills(data.drills);
    console.log('All drills fetched and sorted - First 5:', sortedDrills.slice(0, 5).map(d => ({
      id: d.id,
      name: d.name,
      date_created: d.date_created
    })));
    
    allDrills.set(sortedDrills);
    allDrillsLoaded.set(true);
    
    return data;
  } catch (error) {
    console.error('Error fetching all drills:', error);
    throw error;
  }
}

// Function to fetch paginated drills
export async function fetchDrills(page = 1, limit = 10, params = new URLSearchParams()) {
  isLoading.set(true);
  try {
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    
    const response = await fetch(`/api/drills?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch drills');
    
    const data = await response.json();
    
    drills.set(data.drills);
    currentPage.set(data.pagination.page);
    totalPages.set(data.pagination.totalPages);
    
    return data;
  } catch (error) {
    console.error('Error fetching drills:', error);
    throw error;
  } finally {
    isLoading.set(false);
  }
}

// Filtered and sorted drills
export const filteredDrills = derived(
  [allDrills, allDrillsLoaded, selectedSkillLevels, selectedComplexities, 
   selectedSkillsFocusedOn, selectedPositionsFocusedOn, selectedHasVideo, 
   selectedHasDiagrams, selectedHasImages, searchQuery, selectedSortOption, 
   selectedSortOrder, selectedNumberOfPeopleMin, selectedNumberOfPeopleMax,
   selectedSuggestedLengthsMin, selectedSuggestedLengthsMax, selectedDrillTypes],
  ([$allDrills, $allDrillsLoaded, $selectedSkillLevels, $selectedComplexities,
    $selectedSkillsFocusedOn, $selectedPositionsFocusedOn, $selectedHasVideo,
    $selectedHasDiagrams, $selectedHasImages, $searchQuery, $selectedSortOption,
    $selectedSortOrder, $selectedNumberOfPeopleMin, $selectedNumberOfPeopleMax,
    $selectedSuggestedLengthsMin, $selectedSuggestedLengthsMax, $selectedDrillTypes]) => {
    
    if (!$allDrillsLoaded) return [];

    let filtered = [...$allDrills];

    // Apply filters
    filtered = filtered.filter(drill => {
      // Skill Levels
      const skillLevelsMatch = Object.entries($selectedSkillLevels)
        .every(([level, state]) => {
          const hasLevel = drill.skill_level?.some(s => s.toLowerCase() === level.toLowerCase());
          return (state !== FILTER_STATES.REQUIRED || hasLevel) && 
                 (state !== FILTER_STATES.EXCLUDED || !hasLevel);
        });

      // Complexities
      const complexityMatch = Object.entries($selectedComplexities)
        .every(([complexity, state]) => {
          const hasComplexity = drill.complexity?.toLowerCase() === complexity.toLowerCase();
          return (state !== FILTER_STATES.REQUIRED || hasComplexity) && 
                 (state !== FILTER_STATES.EXCLUDED || !hasComplexity);
        });

      // Skills Focused On
      const skillsFocusedMatch = Object.entries($selectedSkillsFocusedOn)
        .every(([skill, state]) => {
          const hasSkill = drill.skills_focused_on?.some(s => s.toLowerCase() === skill.toLowerCase());
          return (state !== FILTER_STATES.REQUIRED || hasSkill) && 
                 (state !== FILTER_STATES.EXCLUDED || !hasSkill);
        });

      // Positions Focused On
      const positionsFocusedMatch = Object.entries($selectedPositionsFocusedOn)
        .every(([position, state]) => {
          const hasPosition = drill.positions_focused_on?.some(p => p.toLowerCase() === position.toLowerCase());
          return (state !== FILTER_STATES.REQUIRED || hasPosition) && 
                 (state !== FILTER_STATES.EXCLUDED || !hasPosition);
        });

      // Drill Types
      const drillTypesMatch = Object.entries($selectedDrillTypes)
        .every(([type, state]) => {
          const hasType = drill.drill_type?.toLowerCase() === type.toLowerCase();
          return (state !== FILTER_STATES.REQUIRED || hasType) && 
                 (state !== FILTER_STATES.EXCLUDED || !hasType);
        });

      // Number of People filter
      const numberOfPeopleMatch = (
        (!$selectedNumberOfPeopleMin || drill.number_of_people_min >= $selectedNumberOfPeopleMin) &&
        (!$selectedNumberOfPeopleMax || drill.number_of_people_max <= $selectedNumberOfPeopleMax)
      );

      // Suggested Length filter
      const suggestedLengthMatch = (
        (!$selectedSuggestedLengthsMin || parseInt(drill.suggested_length) >= $selectedSuggestedLengthsMin) &&
        (!$selectedSuggestedLengthsMax || parseInt(drill.suggested_length) <= $selectedSuggestedLengthsMax)
      );

      // Media filters
      const videoMatch = !$selectedHasVideo || drill.video_link;
      const diagramsMatch = !$selectedHasDiagrams || (drill.diagrams && drill.diagrams.length > 0);
      const imagesMatch = !$selectedHasImages || (drill.images && drill.images.length > 0);

      // Search query
      const searchMatch = !$searchQuery || 
        drill.name.toLowerCase().includes($searchQuery.toLowerCase()) ||
        drill.brief_description?.toLowerCase().includes($searchQuery.toLowerCase()) ||
        drill.detailed_description?.toLowerCase().includes($searchQuery.toLowerCase());

      return skillLevelsMatch && complexityMatch && skillsFocusedMatch && 
             positionsFocusedMatch && videoMatch && diagramsMatch && 
             imagesMatch && searchMatch && numberOfPeopleMatch && 
             suggestedLengthMatch && drillTypesMatch;
    });

    // Always apply a default sort if no sort option is selected
    if (!$selectedSortOption) {
      console.log('Applying default sort (date_created DESC, id DESC)');
      filtered.sort((a, b) => {
        const dateA = new Date(a.date_created);
        const dateB = new Date(b.date_created);
        // If dates are equal, sort by ID
        if (dateA.getTime() === dateB.getTime()) {
          return b.id - a.id; // DESC order for IDs
        }
        return dateB - dateA;
      });
    } else {
      console.log('Applying selected sort:', { option: $selectedSortOption, order: $selectedSortOrder });
      filtered.sort((a, b) => {
        let comparison = 0;
        switch ($selectedSortOption) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'complexity':
            comparison = (a.complexity || '').localeCompare(b.complexity || '');
            break;
          case 'suggested_length':
            const aLength = parseInt(a.suggested_length) || 0;
            const bLength = parseInt(b.suggested_length) || 0;
            comparison = aLength - bLength;
            break;
          case 'date_created':
            comparison = new Date(a.date_created) - new Date(b.date_created);
            break;
          default:
            return 0;
        }
        // If primary sort is equal, sort by ID
        if (comparison === 0) {
          comparison = a.id - b.id;
        }
        return $selectedSortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }
);

// Function to initialize drills data
export function initializeDrills(data) {
  drills.set(data.drills || []);
  if (data.pagination) {
    currentPage.set(data.pagination.page);
    totalPages.set(data.pagination.totalPages);
  }
}
