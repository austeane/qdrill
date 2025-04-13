<!-- src/routes/drills/+page.svelte -->
<script>
  import FilterPanel from '$components/FilterPanel.svelte';
  import { cart } from '$lib/stores/cartStore';
  import { onMount } from 'svelte';
  import { SvelteToast, toast } from '@zerodevx/svelte-toast';
  import { selectedSortOption, selectedSortOrder } from '$lib/stores/sortStore.js';
  import UpvoteDownvote from '$components/UpvoteDownvote.svelte';
  import { dev } from '$app/environment';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { navigating } from '$app/stores';
  
  // Import stores
  import {
    drills,
    currentPage,
    totalPages,
    totalItems,
    drillsPerPage,
    searchQuery,
    initializeDrills,
    selectedSkillLevels,
    selectedComplexities,
    selectedSkillsFocusedOn,
    selectedPositionsFocusedOn,
    selectedNumberOfPeopleMin,
    selectedNumberOfPeopleMax,
    selectedSuggestedLengthsMin,
    selectedSuggestedLengthsMax,
    selectedHasVideo,
    selectedHasDiagrams,
    selectedHasImages,
    selectedDrillTypes
  } from '$lib/stores/drillsStore';

  export let data;

  // Initialize drills data from load function result
  $: initializeDrills(data);

  // Filter options from load (ensure keys match what FilterPanel expects)
  const filterOptions = data.filterOptions || {};

  // Object to hold temporary button states ('added', 'removed', or null)
  let buttonStates = {};

  // Reactive set of drill IDs currently in the cart
  $: drillsInCart = new Set($cart.map(d => d.id));

  // Initialize buttonStates
  $: {
    if ($drills) {
      buttonStates = $drills.reduce((acc, drill) => {
        acc[drill.id] = drillsInCart.has(drill.id) ? 'in-cart' : null;
        return acc;
      }, {...buttonStates});
    }
  }

  // Functions to navigate pages
  let debounceTimer;
  function debounce(func, delay = 300) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(func, delay);
  }

  function applyFiltersAndNavigate({ resetPage = false } = {}) {
    const params = new URLSearchParams(window.location.search);

    // Pagination
    const pageToNavigate = resetPage ? 1 : $currentPage;
    params.set('page', pageToNavigate.toString());
    params.set('limit', $drillsPerPage.toString());

    // Sorting - Update or remove existing
    if ($selectedSortOption) {
        params.set('sort', $selectedSortOption);
    } else {
        params.delete('sort');
    }
    if ($selectedSortOrder) {
        params.set('order', $selectedSortOrder);
    } else {
        params.delete('order');
    }

    // Filters - Update or remove existing
    // Helper to set/delete params for comma-separated values from filter store objects
    const updateCommaSeparatedParam = (paramName, storeValue) => {
        // Adjust this logic based on how FilterPanel sets the state (e.g., true/false, REQUIRED/EXCLUDED)
        const values = Object.entries(storeValue || {})
            .filter(([, state]) => state === true || state === 'REQUIRED') // Example: only include 'true' or 'REQUIRED' states
            .map(([key]) => key);
        if (values.length > 0) {
            params.set(paramName, values.join(','));
        } else {
            params.delete(paramName);
        }
    };

    // Helper to set/delete params for simple values (null check)
    const updateSimpleParam = (paramName, value) => {
        if (value !== null && value !== undefined && value !== '') {
            params.set(paramName, value.toString());
        } else {
            params.delete(paramName);
        }
    };
    
    updateCommaSeparatedParam('skillLevel', $selectedSkillLevels);
    updateCommaSeparatedParam('complexity', $selectedComplexities);
    updateCommaSeparatedParam('skills', $selectedSkillsFocusedOn);
    updateCommaSeparatedParam('positions', $selectedPositionsFocusedOn);
    updateCommaSeparatedParam('types', $selectedDrillTypes);

    updateSimpleParam('minPeople', $selectedNumberOfPeopleMin);
    updateSimpleParam('maxPeople', $selectedNumberOfPeopleMax);
    updateSimpleParam('minLength', $selectedSuggestedLengthsMin);
    updateSimpleParam('maxLength', $selectedSuggestedLengthsMax);
    updateSimpleParam('hasVideo', $selectedHasVideo);
    updateSimpleParam('hasDiagrams', $selectedHasDiagrams);
    updateSimpleParam('hasImages', $selectedHasImages);
    updateSimpleParam('q', $searchQuery);
    
    // Remove empty query param if search is cleared
    if (!$searchQuery) {
        params.delete('q');
    }

    goto(`/drills?${params.toString()}`, { keepFocus: true, noScroll: true });
  }

  function nextPage() {
    if ($currentPage < $totalPages) {
      currentPage.update(p => p + 1);
      applyFiltersAndNavigate();
    }
  }

  function prevPage() {
    if ($currentPage > 1) {
      currentPage.update(p => p - 1);
      applyFiltersAndNavigate();
    }
  }
  
  function handleSearchInput() {
     debounce(() => applyFiltersAndNavigate({ resetPage: true }));
  }
  
  function handleSortChange(event) {
    selectedSortOption.set(event.target.value);
    applyFiltersAndNavigate({ resetPage: true });
  }

  function toggleSortOrder() {
    selectedSortOrder.update(order => order === 'asc' ? 'desc' : 'asc');
    applyFiltersAndNavigate({ resetPage: true });
  }

  // Function to handle adding/removing drills from the cart
  async function toggleDrillInCart(drill) {
    const isInCart = drillsInCart.has(drill.id);
    if (isInCart) {
      cart.removeDrill(drill.id);
      buttonStates = { ...buttonStates, [drill.id]: 'removed' };
    } else {
      cart.addDrill(drill);
      buttonStates = { ...buttonStates, [drill.id]: 'added' };
    }
    buttonStates = { ...buttonStates };
    setTimeout(() => {
      buttonStates = { ...buttonStates, [drill.id]: isInCart ? null : 'in-cart' };
      buttonStates = { ...buttonStates };
    }, 500);
  }

  import { slide } from 'svelte/transition';

  let showSortOptions = false;
  let sortOptionsRef;

  onMount(() => {
    const handleClickOutside = (event) => {
      if (sortOptionsRef && !sortOptionsRef.contains(event.target)) {
        showSortOptions = false;
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  function toggleSortOptions(event) {
    event.stopPropagation();
    showSortOptions = !showSortOptions;
  }

  async function deleteDrill(drillId, event) {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this drill? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/drills/${drillId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to delete drill');
        }

        // Remove the drill from the store
        drills.update(currentDrills => 
            currentDrills.filter(d => d.id !== drillId)
        );

        toast.push('Drill deleted successfully', {
            theme: { '--toastBackground': '#48bb78', '--toastColor': '#fff' }
        });

        // Refresh the current view by re-applying filters/pagination
        applyFiltersAndNavigate();
    } catch (error) {
        console.error('Error deleting drill:', error);
        toast.push(`Failed to delete drill: ${error.message}`, {
            theme: { '--toastBackground': '#f56565', '--toastColor': '#fff' }
        });
    }
  }

  // Define sort options for drills
  const sortOptions = [
    { value: 'date_created', label: 'Date Created' },
    { value: 'name', label: 'Name' },
    { value: 'complexity', label: 'Complexity' },
    { value: 'suggested_length', label: 'Suggested Length' },
  ];
</script>

<svelte:head>
  <title>Drills - QDrill</title>
  <meta name="description" content="Browse and manage drills for your practice plans." />
</svelte:head>

<div class="max-w-7xl mx-auto p-4">
  <div class="flex justify-between items-center mb-4">
    <h1 class="text-3xl font-bold">Drills</h1>
    <div class="flex space-x-4">
      <a href="/drills/create" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-300">
        Create Drill
      </a>
      <a href="/practice-plans/create" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-300">
        Create Practice Plan with {$cart.length} Drill{ $cart.length !== 1 ? 's' : ''}
      </a>
    </div>
  </div>

  <!-- Filter Panel -->
  <FilterPanel
    customClass="mb-6"
    filterType="drills"
    skillLevels={filterOptions.skillLevels}
    complexities={filterOptions.complexities}
    skillsFocusedOn={filterOptions.skillsFocusedOn}
    positionsFocusedOn={filterOptions.positionsFocusedOn}
    numberOfPeopleOptions={filterOptions.numberOfPeopleOptions}
    suggestedLengths={filterOptions.suggestedLengths}
    drillTypes={filterOptions.drillTypes}
    bind:selectedSkillLevels={$selectedSkillLevels}
    bind:selectedComplexities={$selectedComplexities}
    bind:selectedSkillsFocusedOn={$selectedSkillsFocusedOn}
    bind:selectedPositionsFocusedOn={$selectedPositionsFocusedOn}
    bind:selectedNumberOfPeopleMin={$selectedNumberOfPeopleMin}
    bind:selectedNumberOfPeopleMax={$selectedNumberOfPeopleMax}
    bind:selectedSuggestedLengthsMin={$selectedSuggestedLengthsMin}
    bind:selectedSuggestedLengthsMax={$selectedSuggestedLengthsMax}
    bind:selectedHasVideo={$selectedHasVideo}
    bind:selectedHasDiagrams={$selectedHasDiagrams}
    bind:selectedHasImages={$selectedHasImages}
    bind:selectedDrillTypes={$selectedDrillTypes}
    on:filterChange={() => applyFiltersAndNavigate({ resetPage: true })}
  />

  <!-- Sorting Section and Search Input -->
  <div class="mb-6 flex items-center space-x-4">
    <div class="relative">
      <button
        class="px-4 py-2 bg-gray-100 rounded-lg shadow-sm hover:bg-gray-200 transition-colors duration-300 flex items-center"
        on:click={toggleSortOptions}
      >
        <span class="font-semibold mr-2">Sort</span>
        <span class="transform transition-transform duration-300" class:rotate-180={showSortOptions}>▼</span>
      </button>
      {#if showSortOptions}
        <div 
          bind:this={sortOptionsRef}
          transition:slide="{{ duration: 300 }}" 
          class="absolute left-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm z-10"
        >
          <div class="flex flex-col space-y-2">
            <select
              class="p-2 border border-gray-300 rounded-md bg-white"
              on:change={handleSortChange}
              value={$selectedSortOption}
              data-testid="sort-select"
            >
              {#each sortOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
            <button
              class="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors duration-300"
              on:click={toggleSortOrder}
              data-testid="sort-order-toggle"
            >
              {$selectedSortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>
        </div>
      {/if}
    </div>

    <input
      type="text"
      placeholder="Search drills..."
      class="flex-grow p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      bind:value={$searchQuery}
      on:input={handleSearchInput}
      aria-label="Search drills"
      data-testid="search-input"
    />
  </div>

  <!-- Loading and Empty States -->
  {#if $navigating}
    <p class="text-center text-gray-500 py-10">Loading drills...</p>
  {:else if !$drills || $drills.length === 0}
    <p class="text-center text-gray-500 py-10">No drills match your criteria.</p>
  {:else}
    <!-- Drills Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each $drills as drill (drill.id)}
        <div 
          class="border border-gray-200 bg-white rounded-lg shadow-md transition-transform transform hover:-translate-y-1 hover:shadow-lg flex flex-col"
          data-testid="drill-card"
        >
          <div class="p-6 flex flex-col h-full relative">
            <!-- Variation badges -->
            {#if drill.variation_count > 0}
              <div class="absolute top-2 right-2">
                <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {drill.variation_count} variation{drill.variation_count !== 1 ? 's' : ''}
                </span>
              </div>
            {:else if drill.parent_drill_id}
              <div class="absolute top-2 right-2">
                <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Variant
                </span>
              </div>
            {/if}

            <!-- Main content area -->
            <div class="flex-grow mb-4">
              <!-- Title and description -->
              <div class="flex justify-between items-start mb-4">
                <div class="flex-grow mr-2">
                  <h2 class="text-xl font-bold text-gray-800 break-words" data-testid="drill-card-name">
                    <a href="/drills/{drill.id}" class="hover:text-blue-600">
                      {drill.name}
                    </a>
                  </h2>
                  <div class="prose prose-sm mt-2 text-gray-600 max-h-24 overflow-hidden">
                    {@html drill.brief_description}
                  </div>
                </div>
                {#if dev || drill.created_by === $page.data.session?.user?.id}
                    <button
                        on:click={(e) => deleteDrill(drill.id, e)}
                        class="text-gray-500 hover:text-red-500 transition-colors duration-300 flex-shrink-0"
                        title="Delete drill"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                {/if}
              </div>

              <!-- Drill details -->
              {#if drill.skill_level && drill.skill_level.length > 0}
                <p class="text-sm text-gray-500 mt-2">
                  <span class="font-medium">Skill:</span> {drill.skill_level.join(', ')}
                </p>
              {/if}
              {#if drill.complexity}
                <p class="text-sm text-gray-500 mt-1">
                  <span class="font-medium">Complexity:</span> {drill.complexity}
                </p>
              {/if}
              {#if drill.suggested_length}
                <p class="text-sm text-gray-500 mt-1" data-testid="drill-card-date">
                  <span class="font-medium">Duration:</span> {drill.suggested_length} mins
                </p>
              {/if}
              {#if drill.number_of_people_min}
                <p class="text-sm text-gray-500 mt-1">
                  <span class="font-medium">People:</span> 
                  {drill.number_of_people_min}
                  {#if drill.number_of_people_max && drill.number_of_people_max !== drill.number_of_people_min}
                   - {drill.number_of_people_max}
                  {:else if !drill.number_of_people_max}
                   +
                  {/if}
                </p>
              {/if}
            </div>

            <!-- Add to Practice Plan button -->
            <div class="mt-auto">
              <button
                class="w-full py-2 px-4 rounded-md font-semibold text-white transition-colors duration-300"
                class:bg-green-500={buttonStates[drill.id] === 'added'}
                class:hover:bg-green-600={buttonStates[drill.id] === 'added'}
                class:bg-red-500={buttonStates[drill.id] === 'removed' || buttonStates[drill.id] === 'in-cart'}
                class:hover:bg-red-600={buttonStates[drill.id] === 'removed' || buttonStates[drill.id] === 'in-cart'}
                class:bg-blue-500={!drillsInCart.has(drill.id) && buttonStates[drill.id] !== 'added' && buttonStates[drill.id] !== 'removed' && buttonStates[drill.id] !== 'in-cart'}
                class:hover:bg-blue-600={!drillsInCart.has(drill.id) && buttonStates[drill.id] !== 'added' && buttonStates[drill.id] !== 'removed' && buttonStates[drill.id] !== 'in-cart'}
                on:click|stopPropagation={() => toggleDrillInCart(drill)}
              >
                {#if buttonStates[drill.id] === 'added'} Added
                {:else if buttonStates[drill.id] === 'removed'} Removed
                {:else if buttonStates[drill.id] === 'in-cart'} Remove from Plan
                {:else} Add to Plan
                {/if}
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination Controls -->
    {#if $totalPages > 1}
      <div class="flex justify-center items-center mt-8 space-x-4" data-testid="pagination-controls">
        <button
          on:click={prevPage}
          disabled={$currentPage === 1 || $navigating}
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors duration-300"
          data-testid="pagination-prev-button"
        >
          Previous
        </button>
        <span class="text-gray-700" data-testid="pagination-current-page">Page {$currentPage} of {$totalPages}</span>
        <button
          on:click={nextPage}
          disabled={$currentPage === $totalPages || $navigating}
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors duration-300"
          data-testid="pagination-next-button"
        >
          Next
        </button>
      </div>
    {/if}
  {/if}
</div>
<!-- Toast Notifications -->
<SvelteToast />

