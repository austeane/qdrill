export class SortStore {
	selectedSortOption = $state('date_created');
	selectedSortOrder = $state('desc');

	setSort(option) {
		this.selectedSortOption = option;
	}

	setOrder(order) {
		this.selectedSortOrder = order;
	}

	toggleOrder() {
		this.selectedSortOrder = this.selectedSortOrder === 'asc' ? 'desc' : 'asc';
	}
}

export const sortStore = new SortStore();
