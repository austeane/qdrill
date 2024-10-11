import { writable, derived } from 'svelte/store';
import { PREDEFINED_SKILLS } from '$lib/constants/skills';

// Data Store
export const drills = writable([]);

// Filter Option Stores
export const selectedSkillLevels = writable([]);
export const selectedComplexities = writable([]);
export const selectedSkillsFocusedOn = writable([]);
export const selectedPositionsFocusedOn = writable([]);
export const selectedNumberOfPeopleMin = writable(0);
export const selectedNumberOfPeopleMax = writable(100);
export const selectedSuggestedLengthsMin = writable(0);
export const selectedSuggestedLengthsMax = writable(120);
export const selectedHasVideo = writable(false);
export const selectedHasDiagrams = writable(false);
export const selectedHasImages = writable(false);
export const searchQuery = writable('');
export const selectedDrillTypes = writable([]);

// Derived Store for Filtered Drills
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
    return $drills.filter(drill => {
      let matches = true;

      // Search Query
      if ($searchQuery.trim() !== '') {
        const query = $searchQuery.trim().toLowerCase();
        if (
          !drill.name.toLowerCase().includes(query) &&
          !drill.brief_description.toLowerCase().includes(query) &&
          !drill.detailed_description.toLowerCase().includes(query)
        ) {
          matches = false;
        }
      }

      // Skill Levels
      if ($selectedSkillLevels.length > 0) {
        if (!drill.skill_level.some(level => $selectedSkillLevels.includes(level))) {
          matches = false;
        }
      }

      // Complexities
      if ($selectedComplexities.length > 0) {
        if (!$selectedComplexities.includes(drill.complexity)) {
          matches = false;
        }
      }

      // Skills Focused On
      if ($selectedSkillsFocusedOn.length > 0) {
        if (!drill.skills_focused_on.some(skill => $selectedSkillsFocusedOn.includes(skill))) {
          matches = false;
        }
      }

      // Positions Focused On
      if ($selectedPositionsFocusedOn.length > 0) {
        if (!drill.positions_focused_on.some(pos => $selectedPositionsFocusedOn.includes(pos))) {
          matches = false;
        }
      }

      // Number of People: Check for any overlap
      if (
        drill.number_of_people_min > $selectedNumberOfPeopleMax ||
        drill.number_of_people_max < $selectedNumberOfPeopleMin
      ) {
        matches = false;
      }

      // Suggested Lengths: Check for any overlap
      if (
        drill.suggested_length > $selectedSuggestedLengthsMax ||
        drill.suggested_length < $selectedSuggestedLengthsMin
      ) {
        matches = false;
      }

      // Has Video
      if ($selectedHasVideo && !drill.video_link) {
        matches = false;
      }

      // Has Diagrams
      if ($selectedHasDiagrams && (!drill.diagrams || drill.diagrams.length === 0)) {
        matches = false;
      }

      // Has Images
      if ($selectedHasImages && (!drill.images || drill.images.length === 0)) {
        matches = false;
      }

      // Filter by Drill Types
      if ($selectedDrillTypes.length > 0 && (!drill.drill_type || !drill.drill_type.some(type => $selectedDrillTypes.includes(type)))) {
        matches = false;
      }

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
  [filteredDrills, currentPage, drillsPerPage],
  ([$filteredDrills, $currentPage, $drillsPerPage]) => {
    const start = ($currentPage - 1) * $drillsPerPage;
    const end = $currentPage * $drillsPerPage;
    return $filteredDrills.slice(start, end);
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
