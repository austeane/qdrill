import { maxSteps, wizardStore } from './wizardStore.svelte.js';

export { maxSteps, wizardStore };

export function validateBasicInfo() {
	return wizardStore.validateBasicInfo();
}

export function scheduleAutoSave() {
	return wizardStore.scheduleAutoSave();
}

export function canProceedToNextStep() {
	return wizardStore.canProceedToNextStep();
}
