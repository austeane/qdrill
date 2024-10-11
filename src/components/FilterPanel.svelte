<script>
    import RangeSlider from 'svelte-range-slider-pips';
    import {
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
    } from '$lib/stores/drillsStore';
    import { debounce } from 'lodash-es';
    import { onMount, onDestroy } from 'svelte';
  
    export let customClass = '';
    export let filterType = 'drills'; // New prop to determine filter context
    export let selectedDrills = [];
    export let onDrillSelect = () => {};
    export let onDrillRemove = () => {};
  
    // Drills Filters
    export let skillLevels = [];
    export let complexities = [];
    export let skillsFocusedOn = [];
    export let positionsFocusedOn = [];
    export let numberOfPeopleOptions = { min: 0, max: 100 };
    export let suggestedLengths = { min: 0, max: 120 };
  
    // Practice Plans Filters
    export let phaseOfSeasonOptions = [];
    export let practiceGoalsOptions = [];
    export let selectedPhaseOfSeason = [];
    export let selectedPracticeGoals = [];
    export let selectedEstimatedParticipantsMin = null;
    export let selectedEstimatedParticipantsMax = null;
  
    // Toggle states for drill filters
    let showSkillLevels = false;
    let showDrillComplexity = false;
    let showSkillsFocusedOn = false;
    let showPositionsFocusedOn = false;
    let showNumberOfPeople = false;
    let showSuggestedLengths = false;
    let showHasImages = false;
  
    // Toggle states for practice plans filters
    let showPhaseOfSeason = false;
    let showPracticeGoals = false;
    let showEstimatedParticipants = false;
    let showContainsDrill = false;
  
    // Set up variables for the sliders
    let numberOfPeopleRange = [$selectedNumberOfPeopleMin, $selectedNumberOfPeopleMax];
    let suggestedLengthsRange = [$selectedSuggestedLengthsMin, $selectedSuggestedLengthsMax];
    let estimatedParticipantsRange = [1, 100];
  
    // Variables for Contains Drill filter
    let drillSearchTerm = '';
    let drillSuggestions = [];
  
    let mounted = false;
  
    onMount(() => {
      mounted = true;
    });
  
    // Function to reset all filters
    function resetFilters() {
      selectedSkillLevels.set([]);
      selectedComplexities.set([]);
      selectedSkillsFocusedOn.set([]);
      selectedPositionsFocusedOn.set([]);
      selectedNumberOfPeopleMin.set(numberOfPeopleOptions.min);
      selectedNumberOfPeopleMax.set(numberOfPeopleOptions.max);
      selectedSuggestedLengthsMin.set(suggestedLengths.min);
      selectedSuggestedLengthsMax.set(suggestedLengths.max);
      selectedHasVideo.set(false);
      selectedHasDiagrams.set(false);
      selectedHasImages.set(false);
      if (filterType === 'practice-plans') {
        selectedPhaseOfSeason = [];
        selectedPracticeGoals = [];
        selectedEstimatedParticipantsMin = null;
        selectedEstimatedParticipantsMax = null;
        selectedDrills = [];
      }
      closeAllFilters();
    }
  
    // Function to handle toggling filters
    function toggleFilter(filterName) {
      closeAllFilters();
      switch (filterName) {
        case 'skillLevels':
          showSkillLevels = true;
          break;
        case 'drillComplexity':
          showDrillComplexity = true;
          break;
        case 'skillsFocusedOn':
          showSkillsFocusedOn = true;
          break;
        case 'positionsFocusedOn':
          showPositionsFocusedOn = true;
          break;
        case 'numberOfPeople':
          showNumberOfPeople = true;
          break;
        case 'suggestedLengths':
          showSuggestedLengths = true;
          break;
        case 'hasImages':
          showHasImages = true;
          break;
        case 'phaseOfSeason':
          if (filterType === 'practice-plans') {
            showPhaseOfSeason = true;
          }
          break;
        case 'practiceGoals':
          if (filterType === 'practice-plans') {
            showPracticeGoals = true;
          }
          break;
        case 'estimatedParticipants':
          if (filterType === 'practice-plans') {
            showEstimatedParticipants = true;
          }
          break;
        case 'containsDrill':
          if (filterType === 'practice-plans') {
            showContainsDrill = true;
          }
          break;
        default:
          break;
      }
    }
  
    function closeAllFilters() {
      // Close Drills Filters
      showSkillLevels = false;
      showDrillComplexity = false;
      showSkillsFocusedOn = false;
      showPositionsFocusedOn = false;
      showNumberOfPeople = false;
      showSuggestedLengths = false;
      showHasImages = false;
  
      // Close Practice Plans Filters
      showPhaseOfSeason = false;
      showPracticeGoals = false;
      showEstimatedParticipants = false;
      showContainsDrill = false;
    }
  
    function handleClickOutside(event) {
      // Close all filters if clicking outside
      closeAllFilters();
    }
  
    // Prevent click events from propagating to the overlay
    function handleCheckboxClick(event) {
      event.stopPropagation();
    }
  
    // Handle Escape key to close all filters
    function handleKeydown(event) {
      if (event.key === 'Escape') {
        closeAllFilters();
      }
    }
  
    // Reactive statements to initialize selectedSuggestedLengthsMin and Max
    $: if (suggestedLengths.min != null && $selectedSuggestedLengthsMin === 0) {
      selectedSuggestedLengthsMin.set(suggestedLengths.min);
    }
  
    $: if (suggestedLengths.max != null && $selectedSuggestedLengthsMax === 120) {
      selectedSuggestedLengthsMax.set(suggestedLengths.max);
    }
  
    // Subscribe to Practice Plans Filters if needed
  
    // Fetch drill suggestions
    async function fetchDrillSuggestions() {
      if (!mounted) return; // Ensure client-side execution
      try {
        const queryParam = drillSearchTerm.trim() === '' ? '' : `?query=${encodeURIComponent(drillSearchTerm)}`;
        const res = await fetch(`/api/drills/search${queryParam}`);
        if (!res.ok) {
          throw new Error('Failed to fetch drill suggestions');
        }
        const drills = await res.json();
        drillSuggestions = drills.filter(drill => !selectedDrills.some(d => d.id === drill.id));
      } catch (error) {
        console.error(error);
      }
    }

    const debouncedFetchDrillSuggestions = debounce(fetchDrillSuggestions, 300);

    onDestroy(() => {
      debouncedFetchDrillSuggestions.cancel();
    });

    function addDrillToSelected(drill) {
      onDrillSelect(drill);
      drillSearchTerm = '';
      drillSuggestions = [];
    }

    function removeDrillFromSelected(drillId) {
      onDrillRemove(drillId);
    }
</script>

<!-- Filter Buttons -->
<div class={`flex flex-wrap gap-2 mb-4 relative ${customClass}`} on:keydown={handleKeydown}>
  <!-- Drills Filters -->
  {#if filterType === 'drills' && (skillLevels.length || complexities.length || skillsFocusedOn.length || positionsFocusedOn.length || 
        numberOfPeopleOptions.min !== null || numberOfPeopleOptions.max !== null || 
        suggestedLengths.min !== null || suggestedLengths.max !== null || 
        $selectedHasVideo || $selectedHasDiagrams || $selectedHasImages)}
    
    <!-- Skill Levels Filter -->
    {#if skillLevels.length}
        <div class="relative">
            <button 
                class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showSkillLevels ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                on:click={() => toggleFilter('skillLevels')}
                aria-expanded={showSkillLevels}
                aria-controls="skillLevels-content"
            >
                Skill Levels
                {#if $selectedSkillLevels.length > 0}
                    <span class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2">
                        ({$selectedSkillLevels.length})
                    </span>
                {/if}
            </button>
  
            {#if showSkillLevels}
                <div 
                    id="skillLevels-content"
                    class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
                    on:click|stopPropagation
                    role="menu"
                    tabindex="0"
                >
                    {#each skillLevels as level}
                        <label class="flex items-center mt-2 text-gray-700 hover:bg-gray-100 p-1 rounded">
                            <input type="checkbox" bind:group={$selectedSkillLevels} value={level} class="mr-2" on:click={handleCheckboxClick} />
                            <span>{level}</span>
                        </label>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}

    <!-- Complexity Filter -->
    {#if complexities.length}
        <div class="relative">
            <button 
                class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showDrillComplexity ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                on:click={() => toggleFilter('drillComplexity')}
                aria-expanded={showDrillComplexity}
                aria-controls="drillComplexity-content"
            >
                Complexity
                {#if $selectedComplexities.length > 0}
                    <span class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2">
                        ({$selectedComplexities.length})
                    </span>
                {/if}
            </button>
           
            {#if showDrillComplexity}
                <div 
                    id="drillComplexity-content"
                    class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
                    on:click|stopPropagation
                    role="menu"
                    tabindex="0"
                >
                    {#each complexities as complexity}
                        <label class="flex items-center mt-2 text-gray-700 hover:bg-gray-100 p-1 rounded">
                            <input type="checkbox" bind:group={$selectedComplexities} value={complexity} class="mr-2" on:click={handleCheckboxClick} />
                            <span>{complexity}</span>
                        </label>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}

    <!-- Skills Focused On Filter -->
    {#if skillsFocusedOn.length}
        <div class="relative">
            <button 
                class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showSkillsFocusedOn ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                on:click={() => toggleFilter('skillsFocusedOn')}
                aria-expanded={showSkillsFocusedOn}
                aria-controls="skillsFocusedOn-content"
            >
                Skills Focused On
                {#if $selectedSkillsFocusedOn.length > 0}
                    <span class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2">
                        ({$selectedSkillsFocusedOn.length})
                    </span>
                {/if}
            </button>
  
            {#if showSkillsFocusedOn}
                <div 
                    id="skillsFocusedOn-content"
                    class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
                    on:click|stopPropagation
                    role="menu"
                    tabindex="0"
                >
                    {#each skillsFocusedOn as skill}
                        <label class="flex items-center mt-2 text-gray-700 hover:bg-gray-100 p-1 rounded">
                            <input type="checkbox" bind:group={$selectedSkillsFocusedOn} value={skill} class="mr-2" on:click={handleCheckboxClick} />
                            <span>{skill}</span>
                        </label>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}

    <!-- Positions Focused On Filter -->
    {#if positionsFocusedOn.length}
        <div class="relative">
            <button 
                class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showPositionsFocusedOn ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                on:click={() => toggleFilter('positionsFocusedOn')}
                aria-expanded={showPositionsFocusedOn}
                aria-controls="positionsFocusedOn-content"
            >
                Positions Focused On
                {#if $selectedPositionsFocusedOn.length > 0}
                    <span class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2">
                        ({$selectedPositionsFocusedOn.length})
                    </span>
                {/if}
            </button>
           
            {#if showPositionsFocusedOn}
                <div 
                    id="positionsFocusedOn-content"
                    class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
                    on:click|stopPropagation
                    role="menu"
                    tabindex="0"
                >
                    {#each positionsFocusedOn as position}
                        <label class="flex items-center mt-2 text-gray-700 hover:bg-gray-100 p-1 rounded">
                            <input type="checkbox" bind:group={$selectedPositionsFocusedOn} value={position} class="mr-2" on:click={handleCheckboxClick} />
                            <span>{position}</span>
                        </label>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}

    <!-- Number of Participants Filter -->
    <div class="relative">
        <button 
            class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showNumberOfPeople ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            on:click={() => toggleFilter('numberOfPeople')}
            aria-expanded={showNumberOfPeople}
            aria-controls="numberOfPeople-content"
        >
            Number of Participants
            <span class="ml-2 text-sm font-semibold">
                {$selectedNumberOfPeopleMin === 0 ? 'Any' : $selectedNumberOfPeopleMin} - {$selectedNumberOfPeopleMax === 30 ? 'Any' : $selectedNumberOfPeopleMax}
            </span>
        </button>
        
        {#if showNumberOfPeople}
            <div 
                id="numberOfPeople-content"
                class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg z-10 w-64"
                on:click|stopPropagation
                role="menu"
                tabindex="0"
            >
                <label class="block text-sm font-medium text-gray-700 mb-2">Participants Range</label>
                <RangeSlider
                    bind:values={numberOfPeopleRange}
                    min={numberOfPeopleOptions.min}
                    max={numberOfPeopleOptions.max}
                    step={1}
                    float
                    pips
                    all="label"
                    first="label"
                    last="label"
                    rest="pip"
                    pipstep={5}
                    on:change={() => {
                        selectedNumberOfPeopleMin.set(numberOfPeopleRange[0]);
                        selectedNumberOfPeopleMax.set(numberOfPeopleRange[1]);
                    }}
                />
            </div>
        {/if}
    </div>

    <!-- Suggested Lengths Filter -->
    <div class="relative">
        <button 
            class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showSuggestedLengths ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            on:click={() => toggleFilter('suggestedLengths')}
            aria-expanded={showSuggestedLengths}
            aria-controls="suggestedLengths-content"
        >
            Suggested Lengths
            <span class="ml-2 text-sm font-semibold">
                {$selectedSuggestedLengthsMin === suggestedLengths.min ? 'Any' : $selectedSuggestedLengthsMin} - {$selectedSuggestedLengthsMax === suggestedLengths.max ? 'Any' : $selectedSuggestedLengthsMax} mins
            </span>
        </button>
        
        {#if showSuggestedLengths}
            <div 
                id="suggestedLengths-content"
                class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg z-10 w-64"
                on:click|stopPropagation
                role="menu"
                tabindex="0"
            >
                <label class="block text-sm font-medium text-gray-700 mb-2">Length Range (mins)</label>
                <RangeSlider
                    bind:values={suggestedLengthsRange}
                    min={suggestedLengths.min}
                    max={suggestedLengths.max}
                    step={1}
                    float
                    pips
                    all="label"
                    first="label"
                    last="label"
                    rest="pip"
                    pipstep={15}
                    on:change={() => {
                        selectedSuggestedLengthsMin.set(suggestedLengthsRange[0]);
                        selectedSuggestedLengthsMax.set(suggestedLengthsRange[1]);
                    }}
                />
            </div>
        {/if}
    </div>

    <!-- Has Video Filter -->
    <div class="relative">
        <button 
            class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${$selectedHasVideo ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            on:click={() => selectedHasVideo.update(v => !v)}
            aria-pressed={$selectedHasVideo}
        >
            Has Video
        </button>
    </div>
   
    <!-- Has Diagrams Filter -->
    <div class="relative">
        <button 
            class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${$selectedHasDiagrams ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            on:click={() => selectedHasDiagrams.update(v => !v)}
            aria-pressed={$selectedHasDiagrams}
        >
            Has Diagrams
        </button>
    </div>

    <!-- Has Images Filter -->
    <div class="relative">
        <button 
            class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${$selectedHasImages ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            on:click={() => selectedHasImages.update(v => !v)}
            aria-pressed={$selectedHasImages}
        >
            Has Images
        </button>
    </div>

    <!-- Reset Filters Button (Always visible) -->
    <button 
        class="inline-flex items-center bg-red-500 text-white border border-red-600 rounded-full px-4 py-2 cursor-pointer hover:bg-red-600 transition-colors duration-300"
        on:click={resetFilters}
    >
        Reset Filters
    </button>
{/if}

<!-- Practice Plans Filters -->
{#if filterType === 'practice-plans' && (phaseOfSeasonOptions.length || practiceGoalsOptions.length || selectedEstimatedParticipantsMin !== null || selectedEstimatedParticipantsMax !== null)}
    <!-- Phase of Season Filter -->
    {#if phaseOfSeasonOptions.length}
        <div class="relative">
            <button 
                class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showPhaseOfSeason ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                on:click={() => toggleFilter('phaseOfSeason')}
                aria-expanded={showPhaseOfSeason}
                aria-controls="phaseOfSeason-content"
            >
                Phase of Season
                {#if selectedPhaseOfSeason.length > 0}
                    <span class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2">
                        ({selectedPhaseOfSeason.length})
                    </span>
                {/if}
            </button>
  
            {#if showPhaseOfSeason}
                <div 
                    id="phaseOfSeason-content"
                    class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
                    on:click|stopPropagation
                    role="menu"
                    tabindex="0"
                >
                    {#each phaseOfSeasonOptions as phase}
                        <label class="flex items-center mt-2 text-gray-700 hover:bg-gray-100 p-1 rounded">
                            <input type="checkbox" bind:group={selectedPhaseOfSeason} value={phase} class="mr-2" on:click={handleCheckboxClick} />
                            <span>{phase}</span>
                        </label>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}

    <!-- Practice Goals Filter -->
    {#if practiceGoalsOptions.length}
        <div class="relative">
            <button 
                class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showPracticeGoals ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                on:click={() => toggleFilter('practiceGoals')}
                aria-expanded={showPracticeGoals}
                aria-controls="practiceGoals-content"
            >
                Practice Goals
                {#if selectedPracticeGoals.length > 0}
                    <span class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2">
                        ({selectedPracticeGoals.length})
                    </span>
                {/if}
            </button>
           
            {#if showPracticeGoals}
                <div 
                    id="practiceGoals-content"
                    class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
                    on:click|stopPropagation
                    role="menu"
                    tabindex="0"
                >
                    {#each practiceGoalsOptions as goal}
                        <label class="flex items-center mt-2 text-gray-700 hover:bg-gray-100 p-1 rounded">
                            <input type="checkbox" bind:group={selectedPracticeGoals} value={goal} class="mr-2" on:click={handleCheckboxClick} />
                            <span>{goal}</span>
                        </label>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
    
    <!-- Estimated Participants Filter -->
    <div class="relative">
        <button 
            class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showEstimatedParticipants ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            on:click={() => toggleFilter('estimatedParticipants')}
            aria-expanded={showEstimatedParticipants}
            aria-controls="estimatedParticipants-content"
        >
            Estimated Participants
            <span class="ml-2 text-sm font-semibold">
                {selectedEstimatedParticipantsMin || 'Any'} - {selectedEstimatedParticipantsMax || 'Any'}
            </span>
        </button>
  
        {#if showEstimatedParticipants}
            <div 
                id="estimatedParticipants-content"
                class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg z-10 w-64"
                on:click|stopPropagation
                role="menu"
                tabindex="0"
            >
                <RangeSlider
                    bind:values={estimatedParticipantsRange}
                    min={1}
                    max={100}
                    step={1}
                    float
                    pips
                    all="label"
                    first="label"
                    last="label"
                    rest="pip"
                    pipstep={10}
                    on:change={() => {
                        selectedEstimatedParticipantsMin = estimatedParticipantsRange[0];
                        selectedEstimatedParticipantsMax = estimatedParticipantsRange[1];
                    }}
                />
            </div>
        {/if}
    </div>

    <!-- Contains Drill Filter -->
    <div class="relative">
      <button 
        class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showContainsDrill ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        on:click={() => toggleFilter('containsDrill')}
        aria-expanded={showContainsDrill}
        aria-controls="containsDrill-content"
      >
        Contains Drill
        {#if selectedDrills.length > 0}
          <span class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2">
            ({selectedDrills.length})
          </span>
        {/if}
      </button>

      {#if showContainsDrill}
        <div 
          id="containsDrill-content"
          class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg z-10 w-64"
          on:click|stopPropagation
          role="menu"
          tabindex="0"
        >
          <input
            type="text"
            placeholder="Search for drills..."
            class="w-full p-2 border border-gray-300 rounded-md mb-2"
            bind:value={drillSearchTerm}
            on:input={debouncedFetchDrillSuggestions}
          />
          {#if drillSuggestions.length > 0}
            <ul class="max-h-48 overflow-y-auto">
              {#each drillSuggestions as drill}
                <li
                  class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-100"
                  on:click={() => addDrillToSelected(drill)}
                >
                  <span class="font-normal block truncate">{drill.name}</span>
                </li>
              {/each}
            </ul>
          {/if}
          {#if drillSuggestions.length === 0 && drillSearchTerm.trim() !== ''}
            <p class="text-gray-500">No drills found.</p>
          {/if}
          {#if selectedDrills.length > 0}
            <div class="mt-2">
              <h4 class="font-semibold mb-1">Selected Drills:</h4>
              {#each selectedDrills as drill}
                <div class="flex items-center justify-between bg-blue-100 p-2 rounded mb-1">
                  <span>{drill.name}</span>
                  <button
                    class="text-red-600 hover:text-red-800"
                    on:click={() => removeDrillFromSelected(drill.id)}
                  >
                    &times;
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
{/if}

<!-- Overlay to close dropdown when clicking outside -->
{#if (filterType === 'drills' && (showSkillLevels || showDrillComplexity || showSkillsFocusedOn || showPositionsFocusedOn || 
          showNumberOfPeople || showSuggestedLengths || showHasImages)) || 
      (filterType === 'practice-plans' && (showPhaseOfSeason || showPracticeGoals || showEstimatedParticipants || showContainsDrill))}
    <div 
        class="fixed inset-0 bg-transparent z-0" 
        on:click={closeAllFilters} 
        aria-label="Close filters"
    ></div>
{/if}</div>
