export { FormationsStore, formationsStore } from './formationsStore.svelte';

export function initializeFormations(data) {
	formationsStore.initialize(data);
}

export function resetFormationFilters() {
	formationsStore.resetFilters();
}
