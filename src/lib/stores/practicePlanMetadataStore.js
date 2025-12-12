import { writable, get } from 'svelte/store';
import { practicePlanMetadataSchema } from '$lib/validation/practicePlanSchema';

// Form-related stores
export const planName = writable('');
export const planDescription = writable('');
export const phaseOfSeason = writable('');
export const estimatedNumberOfParticipants = writable('');
export const practiceGoals = writable(['']);
export const visibility = writable('public');
export const isEditableByOthers = writable(false);
export const startTime = writable('09:00'); // Default to 9 AM
export const errors = writable({}); // Form validation errors
export const formInitialized = writable(false);

// Practice goals management
export function addPracticeGoal() {
	practiceGoals.update((goals) => [...goals, '']);
}

export function removePracticeGoal(index) {
	practiceGoals.update((goals) => goals.filter((_, i) => i !== index));
}

export function updatePracticeGoal(index, value) {
	practiceGoals.update((goals) => goals.map((goal, i) => (i === index ? value : goal)));
}

// Initialize form with practice plan data (e.g., when editing)
export function initializeForm(practicePlan) {
	if (!practicePlan || get(formInitialized)) return;

	console.log('[MetadataStore] Initializing form with practice plan data', practicePlan);

	planName.set(practicePlan.name || '');
	planDescription.set(practicePlan.description || '');
	phaseOfSeason.set(practicePlan.phase_of_season || '');
	estimatedNumberOfParticipants.set(
		practicePlan.estimated_number_of_participants?.toString() || ''
	);
	// Ensure practiceGoals is always an array, even if null/undefined in DB
	practiceGoals.set(
		Array.isArray(practicePlan.practice_goals) && practicePlan.practice_goals.length > 0
			? practicePlan.practice_goals
			: ['']
	);
	visibility.set(practicePlan.visibility || 'public');
	isEditableByOthers.set(practicePlan.is_editable_by_others || false);
	startTime.set(practicePlan.start_time?.slice(0, 5) || '09:00');

	formInitialized.set(true);
	errors.set({}); // Clear errors on initialization
}

// Validate metadata fields using Zod schema
export function validateMetadataForm() {
	const formData = {
		name: get(planName),
		description: get(planDescription),
		phase_of_season: get(phaseOfSeason) || null, // Ensure null if empty string
		estimated_number_of_participants: get(estimatedNumberOfParticipants)
			? parseInt(get(estimatedNumberOfParticipants))
			: null,
		practice_goals: get(practiceGoals).filter((goal) => goal.trim() !== ''),
		visibility: get(visibility),
		is_editable_by_others: get(isEditableByOthers),
		start_time: get(startTime) ? get(startTime) + ':00' : null // Add seconds if needed by schema
	};

	const result = practicePlanMetadataSchema.safeParse(formData);

	if (!result.success) {
		const formattedErrors = result.error.flatten().fieldErrors;
		errors.set(formattedErrors);
		console.warn('[MetadataStore Validation Warn] Metadata validation failed:', formattedErrors);
		return { success: false, errors: formattedErrors, data: null };
	} else {
		errors.set({});
		return { success: true, errors: null, data: result.data };
	}
}
