import { writable, derived } from 'svelte/store';

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
    searchQuery
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
    $searchQuery
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
}

// Function to reset pagination when filters change
filteredDrills.subscribe(() => {
  currentPage.set(1);
});