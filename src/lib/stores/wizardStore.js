export { maxSteps, wizardStore } from './wizardStore.svelte.js';

export function validateBasicInfo() {
	return wizardStore.validateBasicInfo();
}

export function scheduleAutoSave() {
	return wizardStore.scheduleAutoSave();
}

export function canProceedToNextStep() {
	return wizardStore.canProceedToNextStep();
}
