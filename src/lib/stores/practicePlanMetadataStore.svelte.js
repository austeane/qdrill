import { practicePlanMetadataSchema } from '$lib/validation/practicePlanSchema';

export class PracticePlanMetadataStore {
	planName = $state('');
	planDescription = $state('');
	phaseOfSeason = $state('');
	estimatedNumberOfParticipants = $state('');
	practiceGoals = $state(['']);
	visibility = $state('public');
	isEditableByOthers = $state(false);
	startTime = $state('09:00'); // Default to 9 AM
	errors = $state({});
	formInitialized = $state(false);

	addPracticeGoal() {
		this.practiceGoals = [...this.practiceGoals, ''];
	}

	removePracticeGoal(index) {
		this.practiceGoals = this.practiceGoals.filter((_, i) => i !== index);
	}

	updatePracticeGoal(index, value) {
		this.practiceGoals = this.practiceGoals.map((goal, i) => (i === index ? value : goal));
	}

	initializeForm(practicePlan) {
		if (!practicePlan || this.formInitialized) return;

		console.log('[MetadataStore] Initializing form with practice plan data', practicePlan);

		this.planName = practicePlan.name || '';
		this.planDescription = practicePlan.description || '';
		this.phaseOfSeason = practicePlan.phase_of_season || '';
		this.estimatedNumberOfParticipants =
			practicePlan.estimated_number_of_participants?.toString() || '';

		// Ensure practiceGoals is always an array, even if null/undefined in DB
		this.practiceGoals =
			Array.isArray(practicePlan.practice_goals) && practicePlan.practice_goals.length > 0
				? practicePlan.practice_goals
				: [''];

		this.visibility = practicePlan.visibility || 'public';
		this.isEditableByOthers = practicePlan.is_editable_by_others || false;
		this.startTime = practicePlan.start_time?.slice(0, 5) || '09:00';

		this.formInitialized = true;
		this.errors = {};
	}

	validateMetadataForm() {
		const formData = {
			name: this.planName,
			description: this.planDescription,
			phase_of_season: this.phaseOfSeason || null,
			estimated_number_of_participants: this.estimatedNumberOfParticipants
				? parseInt(this.estimatedNumberOfParticipants)
				: null,
			practice_goals: this.practiceGoals.filter((goal) => goal.trim() !== ''),
			visibility: this.visibility,
			is_editable_by_others: this.isEditableByOthers,
			start_time: this.startTime ? `${this.startTime}:00` : null
		};

		const result = practicePlanMetadataSchema.safeParse(formData);

		if (!result.success) {
			const formattedErrors = result.error.flatten().fieldErrors;
			this.errors = formattedErrors;
			console.warn('[MetadataStore Validation Warn] Metadata validation failed:', formattedErrors);
			return { success: false, errors: formattedErrors, data: null };
		}

		this.errors = {};
		return { success: true, errors: null, data: result.data };
	}
}

export const practicePlanMetadataStore = new PracticePlanMetadataStore();

