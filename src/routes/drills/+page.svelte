<!-- src/routes/drills/+page.svelte -->
<script>
  import FilterPanel from '$components/FilterPanel.svelte';
  import { cart } from '$lib/stores/cartStore';
  import { tick } from 'svelte';
  import { onDestroy, onMount } from 'svelte';
  import { SvelteToast, toast } from '@zerodevx/svelte-toast';

  export let data;

  // Drill data from load
  let drills = data.drills || [];

  // Available filter options from load
  const {
    skillLevels,
    complexities,
    skillsFocusedOn,
    positionsFocusedOn,
    numberOfPeopleOptions,
    suggestedLengths
  } = data.filterOptions || {};

  // Selected Filters
  let selectedSkillLevels = [];
  let selectedComplexities = [];
  let selectedSkillsFocusedOn = [];
  let selectedPositionsFocusedOn = [];
  let selectedNumberOfPeopleMin = 0;
  let selectedNumberOfPeopleMax = 30;
  let selectedSuggestedLengthsMin = 0;
  let selectedSuggestedLengthsMax = 60;
  let selectedHasVideo = false;
  let selectedHasDiagrams = false;
  let selectedHasImages = false;

  // Search Query
  let searchQuery = '';

  // Object to hold temporary button states ('added', 'removed', or null)
  let buttonStates = {};

  // Reactive set of drill IDs currently in the cart
  $: drillsInCart = new Set($cart.map(d => d.id));

  // Initialize buttonStates
  $: buttonStates = drills.reduce((acc, drill) => {
    acc[drill.id] = drillsInCart.has(drill.id) ? 'in-cart' : null;
    return acc;
  }, {});

  // Loading and Pagination States
  let isLoading = false;
  let currentPage = 1;
  const drillsPerPage = 9;
  $: totalPages = Math.ceil(filteredDrills.length / drillsPerPage);
  $: paginatedDrills = filteredDrills.slice(
    (currentPage - 1) * drillsPerPage,
    currentPage * drillsPerPage
  );

  // Functions to navigate pages
  function nextPage() {
    if (currentPage < totalPages) currentPage += 1;
  }

  function prevPage() {
    if (currentPage > 1) currentPage -= 1;
  }

  // Function to handle adding/removing drills from the cart
  async function toggleDrillInCart(drill) {
    const isInCart = drillsInCart.has(drill.id);
    if (isInCart) {
      cart.removeDrill(drill.id);
      buttonStates[drill.id] = 'removed';
      toast.push('Removed from Practice Plan', { theme: { '--toastBackground': '#f56565', '--toastColor': '#fff' } });
    } else {
      cart.addDrill(drill);
      buttonStates[drill.id] = 'added';
      toast.push('Added to Practice Plan', { theme: { '--toastBackground': '#48bb78', '--toastColor': '#fff' } });
    }

    await tick();

    setTimeout(() => {
      buttonStates[drill.id] = isInCart ? null : 'in-cart';
    }, 500);
  }

  // Helper function to parse suggested length
  function parseSuggestedLength(lengthString) {
    const match = lengthString.match(/(\d+)(?:-(\d+))?/);
    if (match) {
      return {
        min: parseInt(match[1]),
        max: parseInt(match[2] || match[1])
      };
    }
    return { min: 0, max: 0 };
  }

  // Filtering logic
  $: filteredDrills = drills.filter(drill => {
    let matches = true;
    let excludedBy = [];

    // Search filtering
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const nameMatch = drill.name.toLowerCase().includes(query);
      const briefDescMatch = drill.brief_description.toLowerCase().includes(query);
      const detailedDescMatch = drill.detailed_description
        ? drill.detailed_description.toLowerCase().includes(query)
        : false;
      if (!(nameMatch || briefDescMatch || detailedDescMatch)) {
        matches = false;
        excludedBy.push('Search Query');
      }
    }

    // Skill Levels
    if (selectedSkillLevels.length > 0) {
      if (!drill.skill_level.some(level => selectedSkillLevels.includes(level))) {
        matches = false;
        excludedBy.push('Skill Levels');
      }
    }

    // Complexities
    if (selectedComplexities.length > 0) {
      if (!selectedComplexities.includes(drill.complexity)) {
        matches = false;
        excludedBy.push('Complexities');
      }
    }

    // Skills Focused On
    if (selectedSkillsFocusedOn.length > 0) {
      if (!drill.skills_focused_on.some(skill => selectedSkillsFocusedOn.includes(skill))) {
        matches = false;
        excludedBy.push('Skills Focused On');
      }
    }

    // Positions Focused On
    if (selectedPositionsFocusedOn.length > 0) {
      if (!drill.positions_focused_on.some(pos => selectedPositionsFocusedOn.includes(pos))) {
        matches = false;
        excludedBy.push('Positions Focused On');
      }
    }

    // Number of People (Overlapping Range)
    if (selectedNumberOfPeopleMin !== null || selectedNumberOfPeopleMax !== null) {
      if (!(drill.number_of_people_max >= selectedNumberOfPeopleMin &&
            drill.number_of_people_min <= selectedNumberOfPeopleMax)) {
        matches = false;
        excludedBy.push('Number of People');
      }
    }

    // Suggested Lengths
    if (selectedSuggestedLengthsMin !== null || selectedSuggestedLengthsMax !== null) {
      const { min: drillMinLength, max: drillMaxLength } = parseSuggestedLength(drill.suggested_length);
      if (drillMaxLength < selectedSuggestedLengthsMin || drillMinLength > selectedSuggestedLengthsMax) {
        matches = false;
        excludedBy.push('Suggested Lengths');
      }
    }

    // Has Video
    if (selectedHasVideo && !drill.video_link) {
      matches = false;
      excludedBy.push('Has Video');
    }

    // Has Diagrams
    if (selectedHasDiagrams && !(Array.isArray(drill.diagrams) && drill.diagrams.length > 0)) {
      matches = false;
      excludedBy.push('Has Diagrams');
    }

    // Has Images
    if (selectedHasImages && !(Array.isArray(drill.images) && drill.images.length > 0)) {
      matches = false;
      excludedBy.push('Has Images');
    }

    if (!matches) {
      console.log(`Drill "${drill.name}" excluded due to filters: ${excludedBy.join(', ')}`);
    }

    return matches;
  });

  // Debugging logs
  $: {
    console.log("Total Drills:", drills.length);
    console.log("Filtered Drills Count:", filteredDrills.length);
    console.log("Current Filters:", {
      searchQuery,
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
      selectedHasImages
    });
  }
</script>

<svelte:head>
  <title>Drills - QDrill</title>
  <meta name="description" content="Browse and manage drills for your practice plans." />
</svelte:head>

<div class="max-w-7xl mx-auto p-4">
  <h1 class="text-3xl font-bold mb-6 text-center">Drills</h1>

  <!-- Create Practice Plan Button -->
  <div class="flex justify-center mb-4">
    <a
      href="/practice-plans/create"
      class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
    >
      Create Practice Plan with {$cart.length} Drill{ $cart.length !== 1 ? 's' : ''}
    </a>
  </div>

  <!-- Filter Panel -->
  <FilterPanel
    customClass="mb-6"
    {skillLevels}
    {complexities}
    {skillsFocusedOn}
    {positionsFocusedOn}
    {numberOfPeopleOptions}
    {suggestedLengths}
    bind:selectedSkillLevels
    bind:selectedComplexities
    bind:selectedSkillsFocusedOn
    bind:selectedPositionsFocusedOn
    bind:selectedNumberOfPeopleMin
    bind:selectedNumberOfPeopleMax
    bind:selectedSuggestedLengthsMin
    bind:selectedSuggestedLengthsMax
    bind:selectedHasVideo
    bind:selectedHasDiagrams
    bind:selectedHasImages
  />

  <!-- Search Input -->
  <input
    type="text"
    placeholder="Search drills..."
    class="mb-6 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    bind:value={searchQuery}
    aria-label="Search drills"
  />

  <!-- Loading and Empty States -->
  {#if isLoading}
    <p class="text-center text-gray-500">Loading drills...</p>
  {:else if paginatedDrills.length === 0}
    <p class="text-center text-gray-500">No drills match your criteria.</p>
  {:else}
    <!-- Drills Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each paginatedDrills as drill}
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
    {#if totalPages > 1}
      <div class="flex justify-center items-center mt-6 space-x-4">
        <button
          on:click={prevPage}
          disabled={currentPage === 1}
          class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors duration-300"
        >
          Previous
        </button>
        <span class="text-gray-700">Page {currentPage} of {totalPages}</span>
        <button
          on:click={nextPage}
          disabled={currentPage === totalPages}
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