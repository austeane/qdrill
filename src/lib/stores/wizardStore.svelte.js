import { practicePlanBasicInfoSchema } from '$lib/validation/practicePlanSchema';
import { apiFetch } from '$lib/utils/apiFetch.js';

export const maxSteps = 5;

export class WizardStore {
	basicInfo = $state({
		name: '',
		description: '',
		participants: '',
		phaseOfSeason: null,
		practiceGoals: [''],
		visibility: 'public',
		isEditableByOthers: false,
		// Wizard-only field used by the timeline step
		totalTime: 120
	});

	timeline = $state({
		sections: [],
		totalTime: 0
	});

	currentStep = $state(1);
	draftId = $state(null);
	lastSaved = $state(null);
	validationErrors = $state({});
	formInteracted = $state(false);

	#autoSaveTimeout = null;

	// Pure check used for disabling navigation, avoids mutating state during render.
	canProceedToNextStep() {
		switch (this.currentStep) {
			case 1:
				return this.isBasicInfoValid();
			default:
				return true;
		}
	}

	isBasicInfoValid() {
		return practicePlanBasicInfoSchema.safeParse(this.basicInfo).success;
	}

	validateBasicInfo() {
		const result = practicePlanBasicInfoSchema.safeParse(this.basicInfo);

		if (!result.success) {
			const errors = result.error.flatten().fieldErrors;
			this.validationErrors = errors;
			console.warn('[Wizard Validation Warn] Basic info validation failed:', errors);
			return false;
		}

		this.validationErrors = {};
		return true;
	}

	scheduleAutoSave() {
		if (this.#autoSaveTimeout) clearTimeout(this.#autoSaveTimeout);

		this.#autoSaveTimeout = setTimeout(async () => {
			const state = {
				basicInfo: this.basicInfo,
				timeline: this.timeline,
				currentStep: this.currentStep,
				draftId: this.draftId
			};

			try {
				const formData = new FormData();
				formData.append('data', JSON.stringify(state));

				const data = await apiFetch('/practice-plans/wizard?/saveDraft', {
					method: 'POST',
					body: formData
				});

				this.draftId = data.id;
				this.lastSaved = new Date();
			} catch (error) {
				console.error('Failed to auto-save wizard state:', error);
			}
		}, 5000);
	}
}

export const wizardStore = new WizardStore();

