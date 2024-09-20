<script>
    // Props for Drills Filters
    export let skillLevels = [];
    export let complexities = [];
    export let skillsFocusedOn = [];
    export let positionsFocusedOn = [];
    export let numberOfPeopleOptions = { min: null, max: null };
    export let suggestedLengths = { min: null, max: null };
    export let selectedSkillLevels = [];
    export let selectedComplexities = [];
    export let selectedSkillsFocusedOn = [];
    export let selectedPositionsFocusedOn = [];
    export let selectedNumberOfPeople = { min: null, max: null };
    export let selectedSuggestedLengths = { min: null, max: null };
    export let selectedHasVideo = null;
    export let selectedHasDiagrams = null;
    export let selectedHasImages = null;
    export let selectedHasDiagram = false;
  
    // Props for Practice Plans Filters
    export let phaseOfSeasonOptions = [];
    export let practiceGoalsOptions = [];
    export let selectedPhaseOfSeason = [];
    export let selectedPracticeGoals = [];
    export let selectedEstimatedParticipants = { min: null, max: null };
  
    // Toggle states for drill filters
    let showSkillLevels = false;
    let showDrillComplexity = false;
    let showSkillsFocusedOn = false;
    let showPositionsFocusedOn = false;
    let showNumberOfPeople = false;
    let showSuggestedLengths = false;
    let showHasVideo = false;
    let showHasDiagrams = false;
    let showHasImages = false;
  
    // Toggle states for practice plans filters
    let showPhaseOfSeason = false;
    let showPracticeGoals = false;
    let showHasDiagramDropdown = false; // Not needed, but kept for consistency
  
    // Function to reset all filters
    function resetFilters() {
      // Reset Drills Filters
      selectedSkillLevels = [];
      selectedComplexities = [];
      selectedSkillsFocusedOn = [];
      selectedPositionsFocusedOn = [];
      selectedNumberOfPeople = { min: null, max: null };
      selectedSuggestedLengths = { min: null, max: null };
      selectedHasVideo = null;
      selectedHasDiagrams = null;
      selectedHasImages = null;
      selectedHasDiagram = false;
  
      // Reset Practice Plans Filters
      selectedPhaseOfSeason = [];
      selectedPracticeGoals = [];
      selectedEstimatedParticipants = { min: null, max: null };
  
      // Close all filters
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
        case 'hasVideo':
          showHasVideo = true;
          break;
        case 'hasDiagrams':
          showHasDiagrams = true;
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
        case 'hasDiagram':
          selectedHasDiagram = !selectedHasDiagram;
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
      showHasVideo = false;
      showHasDiagrams = false;
      showHasImages = false;
  
      // Close Practice Plans Filters
      showPhaseOfSeason = false;
      showPracticeGoals = false;
    }
  
    function handleCheckboxClick(event) {
      // Stop the event from propagating up to the parent div
      event.stopPropagation();
    }
  </script>
  
  <!-- Filter Buttons -->
  <div class="flex flex-wrap gap-2 mb-4">
    <!-- Drills Filters -->
    {#if skillLevels.length || complexities.length || skillsFocusedOn.length || positionsFocusedOn.length || numberOfPeopleOptions.min || suggestedLengths.min || selectedHasVideo !== null || selectedHasDiagrams !== null || selectedHasImages !== null || selectedHasDiagram !== false}
      <!-- Skill Levels Filter -->
      {#if skillLevels.length}
        <div class="relative">
          <button 
            class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showSkillLevels ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            on:click={() => toggleFilter('skillLevels')}
            on:keydown={(e) => e.key === 'Enter' && toggleFilter('skillLevels')}
            aria-expanded={showSkillLevels}
            aria-controls="skillLevels-content"
          >
            Skill Levels
            <!-- Count Badge (Only show if selections exist) -->
            {#if selectedSkillLevels.length > 0}
              <span class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2">
                ({selectedSkillLevels.length})
              </span>
            {/if}
          </button>
  
          {#if showSkillLevels}
            <div 
              class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10" 
              on:click|stopPropagation
              on:keydown|stopPropagation
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
  
      <!-- Repeat similar structure for other filters like Complexities, Skills Focused On, Positions Focused On -->
  
      <!-- Has Video Filter -->
      <div class="relative">
        <button 
          class={`inline-flex items-center bg-gray-100 border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showHasVideo ? 'bg-gray-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
          on:click={() => toggleFilter('hasVideo')}
          on:keydown={(e) => e.key === 'Enter' && toggleFilter('hasVideo')}
          aria-expanded={showHasVideo}
          aria-controls="hasVideo-content"
        >
          Has Video
          {#if selectedHasVideo !== null}
            <span class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2">
              {selectedHasVideo ? 'Yes' : 'No'}
            </span>
          {/if}
        </button>
  
        {#if showHasVideo}
          <div 
            class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10" 
            on:click|stopPropagation
            on:keydown|stopPropagation
            role="menu"
            tabindex="0"
          >
            <label class="flex items-center mt-2 text-gray-700 hover:bg-gray-100 p-1 rounded">
              <input type="radio" bind:group={selectedHasVideo} value={true} class="mr-2" on:click={handleCheckboxClick} />
              Yes
            </label>
            <label class="flex items-center mt-2 text-gray-700 hover:bg-gray-100 p-1 rounded">
              <input type="radio" bind:group={selectedHasVideo} value={false} class="mr-2" on:click={handleCheckboxClick} />
              No
            </label>
            <button
              class="mt-4 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
              on:click={() => { selectedHasVideo = null; closeAllFilters(); }}
            >
              Clear
            </button>
          </div>
        {/if}
      </div>
  
      <!-- Has Diagram Filter as Toggle -->
      <div class="relative">
        <button 
          class={`inline-flex items-center bg-gray-100 border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${selectedHasDiagram ? 'bg-gray-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
          on:click={() => toggleFilter('hasDiagram')}
          on:keydown={(e) => e.key === 'Enter' && toggleFilter('hasDiagram')}
          aria-expanded={selectedHasDiagram}
          aria-controls="hasDiagram-content"
        >
          Has Diagram
          {#if selectedHasDiagram}
            <span class="absolute top-0 right-0 bg-gray-600 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2">
              ✓
            </span>
          {/if}
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
  
    <!-- Practice Plans Filters (similar structure) -->
    {#if phaseOfSeasonOptions.length || practiceGoalsOptions.length || selectedEstimatedParticipants.min !== null || selectedEstimatedParticipants.max !== null}
      <!-- Phase of Season Filter -->
      {#if phaseOfSeasonOptions.length}
        <div class="relative">
          <button 
            class={`inline-flex items-center bg-gray-100 border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showPhaseOfSeason ? 'bg-gray-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            on:click={() => toggleFilter('phaseOfSeason')}
            on:keydown={(e) => e.key === 'Enter' && toggleFilter('phaseOfSeason')}
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
              class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10" 
              on:click|stopPropagation
              on:keydown|stopPropagation
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
            class={`inline-flex items-center bg-gray-100 border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showPracticeGoals ? 'bg-gray-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            on:click={() => toggleFilter('practiceGoals')}
            on:keydown={(e) => e.key === 'Enter' && toggleFilter('practiceGoals')}
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
              class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10" 
              on:click|stopPropagation
              on:keydown|stopPropagation
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
          class={`inline-flex items-center bg-gray-100 border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showSuggestedLengths ? 'bg-gray-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
          on:click={() => toggleFilter('numberOfPeople')}
          on:keydown={(e) => e.key === 'Enter' && toggleFilter('numberOfPeople')}
          aria-expanded={showNumberOfPeople}
          aria-controls="numberOfPeople-content"
        >
          Number of Participants
          {#if selectedNumberOfPeople.min !== null || selectedNumberOfPeople.max !== null}
            <span class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2">
              {selectedNumberOfPeople.min !== null && selectedNumberOfPeople.max !== null
                ? `${selectedNumberOfPeople.min} - ${selectedNumberOfPeople.max}`
                : selectedNumberOfPeople.min !== null
                  ? `${selectedNumberOfPeople.min}+`
                  : selectedNumberOfPeople.max !== null
                    ? `Up to ${selectedNumberOfPeople.max}`
                    : 'Any'}
            </span>
          {/if}
        </button>
  
        {#if showNumberOfPeople}
          <div 
            class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10" 
            on:click|stopPropagation
            on:keydown|stopPropagation
            role="menu"
            tabindex="0"
          >
            <label class="block mt-2 text-gray-700">
              <span>Min:</span>
              <input 
                type="number" 
                min="1" 
                bind:value={selectedNumberOfPeople.min} 
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-gray-700"
                on:click={handleCheckboxClick}
              />
            </label>
            <label class="block mt-2 text-gray-700">
              <span>Max:</span>
              <input 
                type="number" 
                min="1" 
                bind:value={selectedNumberOfPeople.max} 
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-gray-700"
                on:click={handleCheckboxClick}
              />
            </label>
          </div>
        {/if}
      </div>
    {/if}
  
    <!-- Overlay to close dropdown when clicking outside -->
    {#if showSkillLevels || showDrillComplexity || showSkillsFocusedOn || showPositionsFocusedOn || showPhaseOfSeason || showPracticeGoals || showNumberOfPeople || showSuggestedLengths || showHasVideo || showHasDiagrams || showHasImages}
      <div 
        class="fixed inset-0 bg-transparent z-0" 
        on:click={closeAllFilters} 
        on:keydown={(e) => e.key === 'Escape' && closeAllFilters()}
        tabindex="0"
        role="button"
        aria-label="Close filters"
      ></div>
    {/if}
  </div>