import { writable } from 'svelte/store';
import { FILTER_STATES } from '$lib/constants';

// Filter-related stores
export const selectedPhaseOfSeason = writable({});
export const selectedPracticeGoals = writable({});
export const selectedEstimatedParticipantsMin = writable(null); // Initialize with null or appropriate default
export const selectedEstimatedParticipantsMax = writable(null); // Initialize with null or appropriate default
export const selectedVisibility = writable('public'); // Default to public if applicable
export const selectedEditability = writable(false); // Default if applicable

// Helper function to update filter state (required/excluded/neutral)
export function updateFilterState(store, value, newState) {
    store.update(current => {
        const updated = { ...current };
        if (newState === FILTER_STATES.NEUTRAL) {
            delete updated[value];
        } else {
            updated[value] = newState;
        }
        return updated;
    });
}

// Function to reset all practice plan filters
export function resetPracticePlanFilters() {
    selectedPhaseOfSeason.set({});
    selectedPracticeGoals.set({});
    // Reset range filters - get defaults from where they are defined (e.g., component or constants)
    // Assuming default range 1-100 for participants for now
    selectedEstimatedParticipantsMin.set(1);
    selectedEstimatedParticipantsMax.set(100);
    // Reset other filters as needed
    selectedVisibility.set('public');
    selectedEditability.set(false);
} 