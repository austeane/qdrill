import { writable, get } from 'svelte/store';
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

// Initialize stores based on URLSearchParams
export function initializePracticePlanFilters(searchParams, filterOptions = {}) {
        const parseFilterParam = (baseName) => {
                const state = {};
                searchParams.getAll(`${baseName}_req`).forEach((val) => {
                        state[val] = FILTER_STATES.REQUIRED;
                });
                searchParams.getAll(`${baseName}_exc`).forEach((val) => {
                        state[val] = FILTER_STATES.EXCLUDED;
                });
                return state;
        };

        selectedPhaseOfSeason.set(parseFilterParam('phase'));
        selectedPracticeGoals.set(parseFilterParam('goal'));

        selectedEstimatedParticipantsMin.set(
                parseInt(
                        searchParams.get('minP') ||
                                filterOptions.estimatedParticipants?.min ||
                                '1',
                        10
                )
        );
        selectedEstimatedParticipantsMax.set(
                parseInt(
                        searchParams.get('maxP') ||
                                filterOptions.estimatedParticipants?.max ||
                                '100',
                        10
                )
        );
}

// Serialize current filter stores into URLSearchParams
export function applyPracticePlanFilters(params, filterOptions = {}) {
        const applyFilterParam = (baseName, filterState) => {
                params.delete(`${baseName}_req`);
                params.delete(`${baseName}_exc`);
                for (const [value, state] of Object.entries(filterState)) {
                        if (state === FILTER_STATES.REQUIRED) {
                                params.append(`${baseName}_req`, value);
                        } else if (state === FILTER_STATES.EXCLUDED) {
                                params.append(`${baseName}_exc`, value);
                        }
                }
        };

        applyFilterParam('phase', get(selectedPhaseOfSeason));
        applyFilterParam('goal', get(selectedPracticeGoals));

        if (get(selectedEstimatedParticipantsMin) !== (filterOptions.estimatedParticipants?.min ?? 1)) {
                params.set('minP', get(selectedEstimatedParticipantsMin).toString());
        } else {
                params.delete('minP');
        }

        if (get(selectedEstimatedParticipantsMax) !== (filterOptions.estimatedParticipants?.max ?? 100)) {
                params.set('maxP', get(selectedEstimatedParticipantsMax).toString());
        } else {
                params.delete('maxP');
        }
}
