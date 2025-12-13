import { FILTER_STATES } from '$lib/constants';

export class PracticePlanFilterStore {
	// Filters
	selectedPhaseOfSeason = $state({});
	selectedPracticeGoals = $state({});
	selectedEstimatedParticipantsMin = $state(null);
	selectedEstimatedParticipantsMax = $state(null);
	selectedVisibility = $state('public');
	selectedEditability = $state(false);

	reset() {
		this.selectedPhaseOfSeason = {};
		this.selectedPracticeGoals = {};
		this.selectedEstimatedParticipantsMin = null;
		this.selectedEstimatedParticipantsMax = null;
		this.selectedVisibility = 'public';
		this.selectedEditability = false;
	}
}

export const practicePlanFilterStore = new PracticePlanFilterStore();

// Helper function to create a handler that updates filter state (required/excluded/neutral)
// Usage: const updatePhase = updateFilterState('selectedPhaseOfSeason')
export function updateFilterState(field) {
	return (value, newState) => {
		const current = practicePlanFilterStore[field] || {};
		const updated = { ...current };
		if (newState === FILTER_STATES.NEUTRAL) {
			delete updated[value];
		} else {
			updated[value] = newState;
		}
		practicePlanFilterStore[field] = updated;
	};
}
