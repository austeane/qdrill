export class FormationsStore {
	// Pagination
	currentPage = $state(1);
	formationsPerPage = $state(10);
	totalPages = $state(1);
	totalItems = $state(0);
	isLoading = $state(false);

	// Data
	formations = $state([]);

	// Filters
	selectedTags = $state({});
	searchQuery = $state('');
	selectedFormationType = $state(null);

	// Sorting
	selectedSortOption = $state('created_at');
	selectedSortOrder = $state('desc');

	initialize(data) {
		if (!data) {
			console.warn('initializeFormations called with null or undefined data');
			this.formations = [];
			this.currentPage = 1;
			this.totalPages = 1;
			this.totalItems = 0;
			return;
		}

		this.formations = data.items || [];

		if (data.pagination) {
			this.currentPage = data.pagination.page || 1;
			this.totalPages = data.pagination.totalPages || 1;
			this.totalItems = data.pagination.totalItems || 0;
		} else {
			this.currentPage = 1;
			this.totalPages = 1;
			this.totalItems = 0;
		}
	}

	resetFilters() {
		this.selectedTags = {};
		this.searchQuery = '';
		this.selectedFormationType = null;
	}
}

export const formationsStore = new FormationsStore();

