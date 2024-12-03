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
   selectedSortOrder],
  ([$allDrills, $allDrillsLoaded, $selectedSkillLevels, $selectedComplexities,
    $selectedSkillsFocusedOn, $selectedPositionsFocusedOn, $selectedHasVideo,
    $selectedHasDiagrams, $selectedHasImages, $searchQuery, $selectedSortOption,
    $selectedSortOrder]) => {
    
    if (!$allDrillsLoaded) return [];

    let filtered = [...$allDrills];

    // Apply filters
    filtered = filtered.filter(drill => {
      // Skill Levels
      const skillLevelsMatch = Object.entries($selectedSkillLevels)
        .every(([level, state]) => 
          state !== FILTER_STATES.REQUIRED || 
          drill.skill_level.includes(level.toLowerCase()));

      // Complexities
      const complexityMatch = Object.entries($selectedComplexities)
        .every(([complexity, state]) =>
          state !== FILTER_STATES.REQUIRED ||
          drill.complexity?.toLowerCase() === complexity.toLowerCase());

      // Skills Focused On
      const skillsFocusedMatch = Object.entries($selectedSkillsFocusedOn)
        .every(([skill, state]) =>
          state !== FILTER_STATES.REQUIRED ||
          drill.skills_focused_on.some(s => s.toLowerCase() === skill.toLowerCase()));

      // Positions Focused On
      const positionsFocusedMatch = Object.entries($selectedPositionsFocusedOn)
        .every(([position, state]) =>
          state !== FILTER_STATES.REQUIRED ||
          drill.positions_focused_on.some(p => p.toLowerCase() === position.toLowerCase()));

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
             imagesMatch && searchMatch;
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
            comparison = (a.suggested_length || '').localeCompare(b.suggested_length || '');
            break;
          case 'date_created':
            comparison = new Date(b.date_created) - new Date(a.date_created);
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
