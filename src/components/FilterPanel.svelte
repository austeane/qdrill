<script>
  export let customClass = '';

  // Drills Filters
  export let skillLevels = [];
  export let complexities = [];
  export let skillsFocusedOn = [];
  export let positionsFocusedOn = [];
  export let numberOfPeopleOptions = { min: 0, max: 100 };
  export let suggestedLengths = { min: 0, max: 120 };
  export let selectedSkillLevels = [];
  export let selectedComplexities = [];
  export let selectedSkillsFocusedOn = [];
  export let selectedPositionsFocusedOn = [];
  export let selectedNumberOfPeopleMin = 0;
  export let selectedNumberOfPeopleMax = 30;
  export let selectedSuggestedLengthsMin = 0;
  export let selectedSuggestedLengthsMax = 60;
  export let selectedHasVideo = false;
  export let selectedHasDiagrams = false;
  export let selectedHasImages = false;

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

  // Function to reset all filters
  function resetFilters() {
    selectedSkillLevels = [];
    selectedComplexities = [];
    selectedSkillsFocusedOn = [];
    selectedPositionsFocusedOn = [];
    selectedNumberOfPeopleMin = numberOfPeopleOptions.min;
    selectedNumberOfPeopleMax = numberOfPeopleOptions.max;
    selectedSuggestedLengthsMin = suggestedLengths.min;
    selectedSuggestedLengthsMax = suggestedLengths.max;
    selectedHasVideo = false;
    selectedHasDiagrams = false;
    selectedHasImages = false;
    selectedPhaseOfSeason = [];
    selectedPracticeGoals = [];
    selectedEstimatedParticipantsMin = null;
    selectedEstimatedParticipantsMax = null;
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
        showPhaseOfSeason = true;
        break;
      case 'practiceGoals':
        showPracticeGoals = true;
        break;
      case 'estimatedParticipants':
        showEstimatedParticipants = true;
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
  $: if (suggestedLengths.min != null && !selectedSuggestedLengthsMin) {
    selectedSuggestedLengthsMin = suggestedLengths.min;
  }

  $: if (suggestedLengths.max != null && !selectedSuggestedLengthsMax) {
    selectedSuggestedLengthsMax = suggestedLengths.max;
  }
</script>

<!-- Filter Buttons -->
<div class={`flex flex-wrap gap-2 mb-4 relative ${customClass}`} on:keydown={handleKeydown}>
  <!-- Drills Filters -->
  {#if skillLevels.length || complexities.length || skillsFocusedOn.length || positionsFocusedOn.length || 
        numberOfPeopleOptions.min !== null || numberOfPeopleOptions.max !== null || 
        suggestedLengths.min !== null || suggestedLengths.max !== null || 
        selectedHasVideo || selectedHasDiagrams || selectedHasImages !== null}
      
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
                  {#if selectedSkillLevels.length > 0}
                      <span class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2">
                          ({selectedSkillLevels.length})
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
                              <input type="checkbox" bind:group={selectedSkillLevels} value={level} class="mr-2" on:click={handleCheckboxClick} />
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
                  {#if selectedComplexities.length > 0}
                      <span class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2">
                          ({selectedComplexities.length})
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
                              <input type="checkbox" bind:group={selectedComplexities} value={complexity} class="mr-2" on:click={handleCheckboxClick} />
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
                  {#if selectedSkillsFocusedOn.length > 0}
                      <span class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2">
                          ({selectedSkillsFocusedOn.length})
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
                              <input type="checkbox" bind:group={selectedSkillsFocusedOn} value={skill} class="mr-2" on:click={handleCheckboxClick} />
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
                  {#if selectedPositionsFocusedOn.length > 0}
                      <span class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2">
                          ({selectedPositionsFocusedOn.length})
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
                              <input type="checkbox" bind:group={selectedPositionsFocusedOn} value={position} class="mr-2" on:click={handleCheckboxClick} />
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
                  {selectedNumberOfPeopleMin === 0 ? 'Any' : selectedNumberOfPeopleMin} - {selectedNumberOfPeopleMax === Infinity ? 'Any' : selectedNumberOfPeopleMax}
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
                  <div class="relative">
                      <input 
                          type="range" 
                          min={numberOfPeopleOptions.min} 
                          max={numberOfPeopleOptions.max} 
                          bind:value={selectedNumberOfPeopleMin}
                          on:input={() => {
                              if (selectedNumberOfPeopleMin > selectedNumberOfPeopleMax) {
                                  selectedNumberOfPeopleMax = selectedNumberOfPeopleMin;
                              }
                          }}
                          class="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input 
                          type="range" 
                          min={numberOfPeopleOptions.min} 
                          max={numberOfPeopleOptions.max} 
                          bind:value={selectedNumberOfPeopleMax}
                          on:input={() => {
                              if (selectedNumberOfPeopleMax < selectedNumberOfPeopleMin) {
                                  selectedNumberOfPeopleMin = selectedNumberOfPeopleMax;
                              }
                          }}
                          class="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer"
                      />
                  </div>
                  <div class="flex justify-between mt-4 text-sm text-gray-600">
                      <span>{selectedNumberOfPeopleMin === 0 ? 'Any' : `${selectedNumberOfPeopleMin} Participants`}</span>
                      <span>{selectedNumberOfPeopleMax === Infinity ? 'Any' : `${selectedNumberOfPeopleMax} Participants`}</span>
                  </div>
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
                  {selectedSuggestedLengthsMin === 0 ? 'Any' : selectedSuggestedLengthsMin} - {selectedSuggestedLengthsMax === Infinity ? 'Any' : selectedSuggestedLengthsMax} mins
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
                  <div class="relative">
                      <input 
                          type="range" 
                          min={suggestedLengths.min} 
                          max={suggestedLengths.max} 
                          bind:value={selectedSuggestedLengthsMin}
                          on:input={() => {
                              if (selectedSuggestedLengthsMin > selectedSuggestedLengthsMax) {
                                  selectedSuggestedLengthsMax = selectedSuggestedLengthsMin;
                              }
                          }}
                          class="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input 
                          type="range" 
                          min={suggestedLengths.min} 
                          max={suggestedLengths.max} 
                          bind:value={selectedSuggestedLengthsMax}
                          on:input={() => {
                              if (selectedSuggestedLengthsMax < selectedSuggestedLengthsMin) {
                                  selectedSuggestedLengthsMin = selectedSuggestedLengthsMax;
                              }
                          }}
                          class="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer"
                      />
                  </div>
                  <div class="flex justify-between mt-4 text-sm text-gray-600">
                      <span>{selectedSuggestedLengthsMin === 0 ? 'Any' : `${selectedSuggestedLengthsMin} mins`}</span>
                      <span>{selectedSuggestedLengthsMax === Infinity ? 'Any' : `${selectedSuggestedLengthsMax} mins`}</span>
                  </div>
              </div>
          {/if}
      </div>

      <!-- Has Video Filter -->
      <div class="relative">
          <button 
              class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${selectedHasVideo ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              on:click={() => selectedHasVideo = !selectedHasVideo}
              aria-pressed={selectedHasVideo}
          >
              Has Video
          </button>
      </div>

      <!-- Has Diagrams Filter -->
      <div class="relative">
          <button 
              class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${selectedHasDiagrams ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              on:click={() => selectedHasDiagrams = !selectedHasDiagrams}
              aria-pressed={selectedHasDiagrams}
          >
              Has Diagrams
          </button>
      </div>

      <!-- Reset Filters Button -->
      <button 
          class="inline-flex items-center bg-gray-100 border border-gray-300 rounded-full px-4 py-2 cursor-pointer text-gray-700 hover:bg-gray-200 transition-colors duration-300"
          on:click={resetFilters}
      >
          Reset Filters
      </button>
  {/if}

  <!-- Practice Plans Filters -->
  {#if phaseOfSeasonOptions.length || practiceGoalsOptions.length || selectedEstimatedParticipantsMin !== null || selectedEstimatedParticipantsMax !== null}
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
                  {selectedEstimatedParticipantsMin !== null ? selectedEstimatedParticipantsMin : 'Any'} 
                  - 
                  {selectedEstimatedParticipantsMax !== null ? selectedEstimatedParticipantsMax : 'Any'}
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
                  <div class="mb-4">
                      <label class="block text-sm font-medium text-gray-700">Min Estimated Participants</label>
                      <input 
                          type="range" 
                          min="1" 
                          max="100" 
                          bind:value={selectedEstimatedParticipantsMin}
                          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div class="text-center text-sm text-gray-600">
                          {selectedEstimatedParticipantsMin !== null ? selectedEstimatedParticipantsMin : 'Any'}
                      </div>
                  </div>
                  <div>
                      <label class="block text-sm font-medium text-gray-700">Max Estimated Participants</label>
                      <input 
                          type="range" 
                          min={selectedEstimatedParticipantsMin || 1} 
                          max="100" 
                          bind:value={selectedEstimatedParticipantsMax}
                          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div class="text-center text-sm text-gray-600">
                          {selectedEstimatedParticipantsMax !== null ? selectedEstimatedParticipantsMax : 'Any'}
                      </div>
                  </div>
              </div>
          {/if}
      </div>
  {/if}

  <!-- Overlay to close dropdown when clicking outside -->
  {#if showSkillLevels || showDrillComplexity || showSkillsFocusedOn || showPositionsFocusedOn || 
        showNumberOfPeople || showSuggestedLengths || showHasImages || 
        showPhaseOfSeason || showPracticeGoals || showEstimatedParticipants}
      <div 
          class="fixed inset-0 bg-transparent z-0" 
          on:click={closeAllFilters} 
          aria-label="Close filters"
      ></div>
  {/if}
</div>
