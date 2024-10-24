<!-- src/routes/drills/+page.svelte -->
<script>
  import FilterPanel from '$components/FilterPanel.svelte';
  import { cart } from '$lib/stores/cartStore';
  import { tick } from 'svelte';
  import { onMount } from 'svelte';
  import { SvelteToast, toast } from '@zerodevx/svelte-toast';
  import { selectedSortOption, selectedSortOrder } from '$lib/stores/sortStore';

  // Import stores
  import {
    drills,
    filteredDrills,
    paginatedDrills,
    totalPages,
    currentPage,
    drillsPerPage,
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
    searchQuery,
    initializeDrills
  } from '$lib/stores/drillsStore';

  export let data;

  // Initialize drills data
  onMount(() => {
    initializeDrills(data.drills || []);
  });

  // Available filter options from load
  const {
    skillLevels,
    complexities,
    skillsFocusedOn,
    positionsFocusedOn,
    numberOfPeopleOptions,
    suggestedLengths,
    drillTypes
  } = data.filterOptions || {};

  // Object to hold temporary button states ('added', 'removed', or null)
  let buttonStates = {};

  // Reactive set of drill IDs currently in the cart
  $: drillsInCart = new Set($cart.map(d => d.id));

  // Initialize buttonStates
  $: buttonStates = $filteredDrills.reduce((acc, drill) => {
    acc[drill.id] = drillsInCart.has(drill.id) ? 'in-cart' : null;
    return acc;
  }, {});

  // Define sort options for drills
  const sortOptions = [
    { value: '', label: 'Default' },
    { value: 'name', label: 'Name' },
    { value: 'complexity', label: 'Complexity' },
    { value: 'suggested_length', label: 'Suggested Length' },
    { value: 'created_at', label: 'Date Created' }
  ];

  // Functions to navigate pages
  function nextPage() {
    if ($currentPage < $totalPages) {
      currentPage.update(n => n + 1);
    }
  }

  function prevPage() {
    if ($currentPage > 1) {
      currentPage.update(n => n - 1);
    }
  }

  // Function to handle adding/removing drills from the cart
  async function toggleDrillInCart(drill) {
    const isInCart = drillsInCart.has(drill.id);
    if (isInCart) {
      cart.removeDrill(drill.id);
      buttonStates = { ...buttonStates, [drill.id]: 'removed' };
      toast.push('Removed from Practice Plan', { theme: { '--toastBackground': '#f56565', '--toastColor': '#fff' } });
    } else {
      cart.addDrill(drill);
      buttonStates = { ...buttonStates, [drill.id]: 'added' };
      toast.push('Added to Practice Plan', { theme: { '--toastBackground': '#48bb78', '--toastColor': '#fff' } });
    }

    await tick();

    setTimeout(() => {
      buttonStates = { ...buttonStates, [drill.id]: isInCart ? null : 'in-cart' };
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

  function handleSortChange(event) {
    selectedSortOption.set(event.target.value);
  }

  function toggleSortOrder() {
    selectedSortOrder.update(order => order === 'asc' ? 'desc' : 'asc');
  }
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
    {skillLevels}
    {complexities}
    {skillsFocusedOn}
    {positionsFocusedOn}
    {numberOfPeopleOptions}
    {suggestedLengths}
    {drillTypes}
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
            >
              {#each sortOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
            <button
              class="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors duration-300"
              on:click={toggleSortOrder}
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
      aria-label="Search drills"
    />
  </div>

  <!-- Loading and Empty States -->
  {#if $filteredDrills === undefined}
    <p class="text-center text-gray-500">Loading drills...</p>
  {:else if $paginatedDrills.length === 0}
    <p class="text-center text-gray-500">No drills match your criteria.</p>
  {:else}
    <!-- Drills Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each $paginatedDrills as drill}
        <div
          class="border border-gray-200 p-6 bg-white rounded-lg shadow-md transition-transform transform hover:-translate-y-1 hover:shadow-lg relative cursor-pointer flex flex-col"
          on:click={() => window.location.href = `/drills/${drill.id}`}
        >
          <div>
            <h2 class="text-xl font-bold text-gray-800 mb-2">{drill.name}</h2>
            <p class="text-gray-600 mb-4">{drill.brief_description}</p>
            <p class="text-sm text-gray-500 mb-1"><strong>Skill Levels:</strong> {drill.skill_level.join(', ')}</p>
            <p class="text-sm text-gray-500 mb-1"><strong>Complexity:</strong> {drill.complexity}</p>
            <p class="text-sm text-gray-500 mb-1"><strong>Suggested Length:</strong> {drill.suggested_length} minutes</p>
            <p class="text-sm text-gray-500 mb-4"><strong>Number of People:</strong> {drill.number_of_people_min} - {drill.number_of_people_max}</p>
          </div>

          <!-- Add to practice plan button -->
          <button
            class="mt-auto py-2 px-4 rounded-md font-semibold text-white transition-colors duration-300"
            class:bg-green-500={buttonStates[drill.id] === 'added'}
            class:hover:bg-green-600={buttonStates[drill.id] === 'added'}
            class:bg-red-500={buttonStates[drill.id] === 'removed' || buttonStates[drill.id] === 'in-cart'}
            class:hover:bg-red-600={buttonStates[drill.id] === 'removed' || buttonStates[drill.id] === 'in-cart'}
            class:bg-blue-500={!drillsInCart.has(drill.id) && buttonStates[drill.id] === null}
            class:hover:bg-blue-600={!drillsInCart.has(drill.id) && buttonStates[drill.id] === null}
            on:click|stopPropagation={() => toggleDrillInCart(drill)}
            aria-label={drillsInCart.has(drill.id) ? 'Remove from Practice Plan' : 'Add to Practice Plan'}
          >
            {#if buttonStates[drill.id] === 'added'}
              Added
            {:else if buttonStates[drill.id] === 'removed'}
              Removed
            {:else if buttonStates[drill.id] === 'in-cart'}
              Remove from Practice Plan
            {:else}
              Add to Practice Plan
            {/if}
          </button>
        </div>
      {/each}
    </div>

    <!-- Pagination Controls -->
    {#if $totalPages > 1}
      <div class="flex justify-center items-center mt-6 space-x-4">
        <button
          on:click={prevPage}
          disabled={$currentPage === 1}
          class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors duration-300"
        >
          Previous
        </button>
        <span class="text-gray-700">Page {$currentPage} of {$totalPages}</span>
        <button
          on:click={nextPage}
          disabled={$currentPage === $totalPages}
          class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors duration-300"
        >
          Next
        </button>
      </div>
    {/if}
  {/if}
</div>
<!-- Toast Notifications -->
<SvelteToast />
