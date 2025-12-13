<script>
	import { getGroupColor } from '$lib/utils/groupColors.js';
	import { getAvailableGroupFilters } from '$lib/utils/groupFilter.js';

	let {
		sections = [],
		selectedFilter = $bindable('All Groups'),
		onFilterChange
	} = $props();

	const availableFilters = $derived(getAvailableGroupFilters(sections));

	function handleFilterChange(filter) {
		selectedFilter = filter;
		onFilterChange?.({ filter });
	}

	function formatFilterName(filter) {
		if (filter === 'All Groups') return filter;
		return filter.charAt(0) + filter.slice(1).toLowerCase();
	}

	$effect(() => {
		if (availableFilters.length > 0 && !availableFilters.includes(selectedFilter)) {
			selectedFilter = 'All Groups';
		}
	});
</script>

{#if availableFilters.length > 1}
	<div class="group-filter">
		{#each availableFilters as filter (filter)}
			<button
				class="filter-btn {selectedFilter === filter ? 'active' : ''}"
				onclick={() => handleFilterChange(filter)}
				style="--filter-color: {getGroupColor(filter)}"
			>
				{formatFilterName(filter)}
			</button>
		{/each}
	</div>
{/if}

<style>
	.group-filter {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.filter-btn {
		padding: 0.5rem 1rem;
		border: 2px solid var(--filter-color);
		border-radius: 0.375rem;
		background: white;
		color: var(--filter-color);
		font-weight: 500;
	}

	.filter-btn.active {
		background: var(--filter-color);
		color: white;
	}
</style>
