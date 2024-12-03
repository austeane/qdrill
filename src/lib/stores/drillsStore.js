import { writable, derived } from 'svelte/store';
import { PREDEFINED_SKILLS } from '$lib/constants/skills';
import { selectedSortOption, selectedSortOrder } from './sortStore.js';
import { FILTER_STATES } from '$lib/constants';

// Pagination stores
export const currentPage = writable(1);
export const drillsPerPage = writable(9);
export const totalPages = writable(1);
export const isLoading = writable(false);

// Data store
export const drills = writable([]);

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

// Function to fetch drills with pagination
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

// Function to initialize drills data
export function initializeDrills(data) {
  drills.set(data.drills || []);
  if (data.pagination) {
    currentPage.set(data.pagination.page);
    totalPages.set(data.pagination.totalPages);
  }
}

// Keep other existing store functions
