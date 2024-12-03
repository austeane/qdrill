import { writable, derived } from 'svelte/store';
import { PREDEFINED_SKILLS } from '$lib/constants/skills';
import { selectedSortOption, selectedSortOrder } from './sortStore.js';
import { FILTER_STATES } from '$lib/constants';

// Pagination stores
export const currentPage = writable(1);
export const drillsPerPage = writable(9);
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

// Function to fetch all drills
export async function fetchAllDrills() {
  try {
    const response = await fetch('/api/drills?all=true');
    if (!response.ok) throw new Error('Failed to fetch all drills');
    
    const data = await response.json();
    allDrills.set(data.drills);
    allDrillsLoaded.set(true);
    
    return data;
  } catch (error) {
    console.error('Error fetching all drills:', error);
    throw error;
  }
}

// Function to fetch paginated drills
export async function fetchDrills(page = 1, limit = 9, params = new URLSearchParams()) {
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
   selectedSuggestedLengthsMin, selectedSuggestedLengthsMax],
  ([$allDrills, $allDrillsLoaded, $selectedSkillLevels, $selectedComplexities,
    $selectedSkillsFocusedOn, $selectedPositionsFocusedOn, $selectedHasVideo,
    $selectedHasDiagrams, $selectedHasImages, $searchQuery, $selectedSortOption,
    $selectedSortOrder, $selectedNumberOfPeopleMin, $selectedNumberOfPeopleMax,
    $selectedSuggestedLengthsMin, $selectedSuggestedLengthsMax]) => {
    
    if (!$allDrillsLoaded) return [];

    let filtered = [...$allDrills];

    // Apply filters
    filtered = filtered.filter(drill => {
      // Skill Levels
      const skillLevelsMatch = Object.entries($selectedSkillLevels)
        .every(([level, state]) => {
          const hasLevel = drill.skill_level.some(s => s.toLowerCase() === level.toLowerCase());
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
          const hasSkill = drill.skills_focused_on.some(s => s.toLowerCase() === skill.toLowerCase());
          return (state !== FILTER_STATES.REQUIRED || hasSkill) && 
                 (state !== FILTER_STATES.EXCLUDED || !hasSkill);
        });

      // Positions Focused On
      const positionsFocusedMatch = Object.entries($selectedPositionsFocusedOn)
        .every(([position, state]) => {
          const hasPosition = drill.positions_focused_on.some(p => p.toLowerCase() === position.toLowerCase());
          return (state !== FILTER_STATES.REQUIRED || hasPosition) && 
                 (state !== FILTER_STATES.EXCLUDED || !hasPosition);
        });

      // Number of People filter
      const numberOfPeopleMatch = (
        (drill.number_of_people_min >= $selectedNumberOfPeopleMin || !$selectedNumberOfPeopleMin) &&
        (drill.number_of_people_max <= $selectedNumberOfPeopleMax || !$selectedNumberOfPeopleMax)
      );

      // Suggested Length filter
      const suggestedLengthMatch = (
        (parseInt(drill.suggested_length) >= $selectedSuggestedLengthsMin || !$selectedSuggestedLengthsMin) &&
        (parseInt(drill.suggested_length) <= $selectedSuggestedLengthsMax || !$selectedSuggestedLengthsMax)
      );

      // Media filters
      const videoMatch = !$selectedHasVideo || drill.video_link;
      const diagramsMatch = !$selectedHasDiagrams || (drill.diagrams && drill.diagrams.length > 0);
      const imagesMatch = !$selectedHasImages || (drill.images && drill.images.length > 0);

      // Search query
      const searchMatch = !$searchQuery || 
        drill.name.toLowerCase().includes($searchQuery.toLowerCase()) ||
        drill.brief_description.toLowerCase().includes($searchQuery.toLowerCase()) ||
        drill.detailed_description?.toLowerCase().includes($searchQuery.toLowerCase());

      return skillLevelsMatch && complexityMatch && skillsFocusedMatch && 
             positionsFocusedMatch && videoMatch && diagramsMatch && 
             imagesMatch && searchMatch && numberOfPeopleMatch && 
             suggestedLengthMatch;
    });

    // Apply sorting
    if ($selectedSortOption) {
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
