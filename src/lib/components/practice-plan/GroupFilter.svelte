<script>
  import { createEventDispatcher } from 'svelte';
  import { getGroupColor } from '$lib/utils/groupColors.js';
  import { getAvailableGroupFilters } from '$lib/utils/groupFilter.js';

  export let sections = [];
  export let selectedFilter = 'All Groups';

  const dispatch = createEventDispatcher();

  $: availableFilters = getAvailableGroupFilters(sections);

  function handleFilterChange(filter) {
    selectedFilter = filter;
    dispatch('filterChange', { filter });
  }

  function formatFilterName(filter) {
    if (filter === 'All Groups') return filter;
    return filter.charAt(0) + filter.slice(1).toLowerCase();
  }
</script>

<div class="group-filter">
  {#each availableFilters as filter}
    <button
      class="filter-btn {selectedFilter === filter ? 'active' : ''}"
      on:click={() => handleFilterChange(filter)}
      style="--filter-color: {getGroupColor(filter)}"
    >
      {formatFilterName(filter)}
    </button>
  {/each}
</div>

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
