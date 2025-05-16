import { writable, derived } from 'svelte/store';

// Pagination stores
export const currentPage = writable(1);
export const formationsPerPage = writable(10);
export const totalPages = writable(1);
export const totalItems = writable(0);
export const isLoading = writable(false);

// Data stores
export const formations = writable([]);

// Filter stores
export const selectedTags = writable({});
export const searchQuery = writable('');
export const selectedFormationType = writable(null);

// Sort stores
export const selectedSortOption = writable('created_at');
export const selectedSortOrder = writable('desc');

// Function to initialize formations data
export function initializeFormations(data) {
	if (!data) {
		console.warn('initializeFormations called with null or undefined data');
		formations.set([]);
		currentPage.set(1);
		totalPages.set(1);
		totalItems.set(0);
		return;
	}

	formations.set(data.items || []);
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
export function resetFormationFilters() {
	selectedTags.set({});
	searchQuery.set('');
	selectedFormationType.set(null);
}
