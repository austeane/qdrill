export { PracticePlanMetadataStore, practicePlanMetadataStore } from './practicePlanMetadataStore.svelte.js';

export function addPracticeGoal() {
	practicePlanMetadataStore.addPracticeGoal();
}

export function removePracticeGoal(index) {
	practicePlanMetadataStore.removePracticeGoal(index);
}

export function updatePracticeGoal(index, value) {
	practicePlanMetadataStore.updatePracticeGoal(index, value);
}

export function initializeForm(practicePlan) {
	practicePlanMetadataStore.initializeForm(practicePlan);
}

export function validateMetadataForm() {
	return practicePlanMetadataStore.validateMetadataForm();
}
