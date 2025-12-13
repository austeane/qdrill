export { FormationsStore, formationsStore } from './formationsStore.svelte.js';

export function initializeFormations(data) {
	formationsStore.initialize(data);
}

export function resetFormationFilters() {
	formationsStore.resetFilters();
}
