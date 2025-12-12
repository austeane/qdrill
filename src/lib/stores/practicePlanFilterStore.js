import { writable } from 'svelte/store';
import { FILTER_STATES } from '$lib/constants';

// Filter-related stores
export const selectedPhaseOfSeason = writable({});
export const selectedPracticeGoals = writable({});
export const selectedEstimatedParticipantsMin = writable(null); // Initialize with null or appropriate default
export const selectedEstimatedParticipantsMax = writable(null); // Initialize with null or appropriate default
export const selectedVisibility = writable('public'); // Default to public if applicable
export const selectedEditability = writable(false); // Default if applicable

// Helper function to create a handler that updates filter state (required/excluded/neutral)
export function updateFilterState(store) {
	return (value, newState) => {
		store.update((current) => {
			const updated = { ...current };
			if (newState === FILTER_STATES.NEUTRAL) {
				delete updated[value];
			} else {
				updated[value] = newState;
			}
			return updated;
		});
		// Optionally dispatch an event if needed globally, though FilterPanel already does locally
		// dispatch('filterChange');
	};
}
