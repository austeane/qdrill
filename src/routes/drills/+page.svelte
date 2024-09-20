<script>
  import FilterPanel from '$components/FilterPanel.svelte';
  import { cart } from '$lib/stores/cartStore';
  import { tick } from 'svelte';
  import { onDestroy } from 'svelte';

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
  let selectedNumberOfPeople = { min: null, max: null };
  let selectedSuggestedLengths = { min: null, max: null };
  let selectedHasVideo = null;
  let selectedHasDiagrams = null;
  let selectedHasImages = null;
  let selectedHasDiagram = false;

  // Search Query
  let searchQuery = '';

  // Object to hold temporary button states ('added', 'removed', or null)
  let buttonStates = {};

  // Reactive set of drill IDs currently in the cart
  $: drillsInCart = new Set($cart.map(d => d.id));

  // Function to handle adding/removing drills from the cart
  async function toggleDrillInCart(drill) {
    const isInCart = drillsInCart.has(drill.id);
    if (isInCart) {
      cart.removeDrill(drill.id);
      buttonStates[drill.id] = 'removed';
    } else {
      cart.addDrill(drill);
      buttonStates[drill.id] = 'added';
    }

    // Wait for the store to update
    await tick();

    // After a short delay, reset the button state
    setTimeout(() => {
      buttonStates[drill.id] = null;
    }, 500);
  }

  // Filtering logic
  $: filteredDrills = drills.filter(drill => {
    let matches = true;

    // Search filtering
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const nameMatch = drill.name.toLowerCase().includes(query);
      const briefDescMatch = drill.brief_description.toLowerCase().includes(query);
      const detailedDescMatch = drill.detailed_description
        ? drill.detailed_description.toLowerCase().includes(query)
        : false;
      matches = matches && (nameMatch || briefDescMatch || detailedDescMatch);
    }

    // Skill Levels
    if (selectedSkillLevels.length > 0) {
      matches =
        matches &&
        drill.skill_level.some(level => selectedSkillLevels.includes(level));
    }

    // Complexities
    if (selectedComplexities.length > 0) {
      matches = matches && selectedComplexities.includes(drill.complexity);
    }

    // Skills Focused On
    if (selectedSkillsFocusedOn.length > 0) {
      matches =
        matches &&
        drill.skills_focused_on.some(skill =>
          selectedSkillsFocusedOn.includes(skill)
        );
    }

    // Positions Focused On
    if (selectedPositionsFocusedOn.length > 0) {
      matches =
        matches &&
        drill.positions_focused_on.some(pos =>
          selectedPositionsFocusedOn.includes(pos)
        );
    }

    // Number of People
    if (selectedNumberOfPeople.min !== null) {
      matches = matches && drill.number_of_people_min >= selectedNumberOfPeople.min;
    }
    if (selectedNumberOfPeople.max !== null) {
      matches = matches && drill.number_of_people_max <= selectedNumberOfPeople.max;
    }

    // Suggested Lengths
    if (selectedSuggestedLengths.min !== null) {
      matches = matches && drill.suggested_length >= selectedSuggestedLengths.min;
    }
    if (selectedSuggestedLengths.max !== null) {
      matches = matches && drill.suggested_length <= selectedSuggestedLengths.max;
    }

    // Has Video
    if (selectedHasVideo !== null) {
      matches =
        matches &&
        ((selectedHasVideo && drill.video_link) ||
          (!selectedHasVideo && !drill.video_link));
    }

    // Has Diagrams
    if (selectedHasDiagrams !== null) {
      const hasDiagrams =
        Array.isArray(drill.diagrams) && drill.diagrams.length > 0;
      matches =
        matches &&
        ((selectedHasDiagrams && hasDiagrams) ||
          (!selectedHasDiagrams && !hasDiagrams));
    }

    // Has Images
    if (selectedHasImages !== null) {
      const hasImages = Array.isArray(drill.images) && drill.images.length > 0;
      matches =
        matches &&
        ((selectedHasImages && hasImages) ||
          (!selectedHasImages && !hasImages));
    }

    // Has Diagram
    if (selectedHasDiagram) {
      matches =
        matches &&
        Array.isArray(drill.diagrams) &&
        drill.diagrams.length > 0;
    }

    return matches;
  });
</script>

<div class="max-w-7xl mx-auto p-4">
  <h1 class="text-3xl font-bold mb-6">Drills</h1>

  <!-- Create practice plan button -->
  <a
    href="/practice-plans/create"
    class="inline-block mb-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
  >
    Create Practice Plan with {$cart.length} Drill{ $cart.length !== 1 ? 's' : ''}
  </a>

  <FilterPanel
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
    bind:selectedNumberOfPeople
    bind:selectedSuggestedLengths
    bind:selectedHasVideo
    bind:selectedHasDiagrams
    bind:selectedHasImages
    bind:selectedHasDiagram
  />

  <input
    type="text"
    placeholder="Search drills..."
    class="mb-6 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    bind:value={searchQuery}
  />

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each filteredDrills as drill}
      <div
        class="border border-gray-200 p-6 bg-white rounded-lg shadow-md transition-transform transform hover:-translate-y-1 cursor-pointer relative"
      >
        <h2 class="text-xl font-bold text-gray-800 mb-2">
          <a
            href="/drills/{drill.id}"
            class="underline text-blue-600 hover:text-blue-800"
            on:click|stopPropagation
          >
            {drill.name}
          </a>
        </h2>
        <p class="text-gray-600 mb-2">{drill.brief_description}</p>
        <p class="text-sm text-gray-500 mb-1">
          <strong>Skill Levels:</strong> {drill.skill_level.join(', ')}
        </p>
        <p class="text-sm text-gray-500 mb-1">
          <strong>Complexity:</strong> {drill.complexity}
        </p>
        <p class="text-sm text-gray-500 mb-1">
          <strong>Suggested Length:</strong> {drill.suggested_length} minutes
        </p>
        <p class="text-sm text-gray-500 mb-4">
          <strong>Number of People:</strong> {drill.number_of_people_min} - {drill.number_of_people_max}
        </p>

        <!-- Add to practice plan button -->
        <button
          class="w-full py-2 px-4 rounded-md font-semibold text-white transition-colors duration-300 {
            buttonStates[drill.id] === 'added' ? 'bg-green-500 hover:bg-green-600' :
            buttonStates[drill.id] === 'removed' ? 'bg-red-500 hover:bg-red-600' :
            drillsInCart.has(drill.id) ? 'bg-red-500 hover:bg-red-600' :
            'bg-blue-500 hover:bg-blue-600'
          }"
          on:click={() => toggleDrillInCart(drill)}
        >
          {#if buttonStates[drill.id] === 'added'}
            Added
          {:else if buttonStates[drill.id] === 'removed'}
            Removed
          {:else if drillsInCart.has(drill.id)}
            Remove from Practice Plan
          {:else}
            Add to Practice Plan
          {/if}
        </button>
      </div>
    {/each}
  </div>
</div>