import { FormationsStore, formationsStore } from './formationsStore.svelte.js';

export { FormationsStore, formationsStore };

export function initializeFormations(data) {
	formationsStore.initialize(data);
}

export function resetFormationFilters() {
	formationsStore.resetFilters();
}
