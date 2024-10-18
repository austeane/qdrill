import { writable } from 'svelte/store';

export const selectedSortOption = writable('');
export const selectedSortOrder = writable('asc');

