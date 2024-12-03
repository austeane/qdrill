import { writable } from 'svelte/store';

export const selectedSortOption = writable('date_created');
export const selectedSortOrder = writable('desc');

