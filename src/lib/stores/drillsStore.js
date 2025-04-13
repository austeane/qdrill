import { writable, derived } from 'svelte/store';
import { PREDEFINED_SKILLS } from '$lib/constants/skills';
import { selectedSortOption, selectedSortOrder } from './sortStore.js';
import { FILTER_STATES } from '$lib/constants';

// Pagination stores
export const currentPage = writable(1);
export const totalPages = writable(1);
export const totalItems = writable(0);
export const drillsPerPage = writable(10);
export const isLoading = writable(false);

// Data stores
export const drills = writable([]);

// Filter stores
export const selectedSkillLevels = writable({});
export const selectedComplexities = writable({});
export const selectedSkillsFocusedOn = writable({});
export const selectedPositionsFocusedOn = writable({});
export const selectedNumberOfPeopleMin = writable(null);
export const selectedNumberOfPeopleMax = writable(null);
export const selectedSuggestedLengthsMin = writable(null);
export const selectedSuggestedLengthsMax = writable(null);
export const selectedHasVideo = writable(null);
export const selectedHasDiagrams = writable(null);
export const selectedHasImages = writable(null);
export const searchQuery = writable('');
export const selectedDrillTypes = writable({});

// Skills store
export const allSkills = writable(PREDEFINED_SKILLS);
export const sortedSkills = derived(allSkills, $allSkills => [...$allSkills].sort((a, b) => a.name.localeCompare(b.name)));

// Function to initialize drills data
export function initializeDrills(data) {
  if (!data) {
    console.warn('initializeDrills called with null or undefined data');
    drills.set([]);
    currentPage.set(1);
    totalPages.set(1);
    totalItems.set(0);
    return;
  }
  
  drills.set(data.items || []);
  if (data.pagination) {
    currentPage.set(data.pagination.page || 1);
    totalPages.set(data.pagination.totalPages || 1);
    totalItems.set(data.pagination.totalItems || 0);
  } else {
    currentPage.set(1);
    totalPages.set(1);
    totalItems.set(0);
  }
}

// Optional: Helper function to reset all filter states
export function resetDrillFilters() {
  selectedSkillLevels.set({});
  selectedComplexities.set({});
  selectedSkillsFocusedOn.set({});
  selectedPositionsFocusedOn.set({});
  selectedNumberOfPeopleMin.set(null);
  selectedNumberOfPeopleMax.set(null);
  selectedSuggestedLengthsMin.set(null);
  selectedSuggestedLengthsMax.set(null);
  selectedHasVideo.set(null);
  selectedHasDiagrams.set(null);
  selectedHasImages.set(null);
  searchQuery.set('');
  selectedDrillTypes.set({});
}
