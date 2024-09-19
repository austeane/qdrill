<script>
  // Props passed from parent component
  export let skillLevels = [];
  export let complexities = [];
  export let skillsFocusedOn = [];
  export let positionsFocusedOn = [];
  
  // Selected Filters
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

  // Toggle states for each filter
  let showSkillLevels = false;
  let showDrillComplexity = false;
  let showSkillsFocusedOn = false;
  let showPositionsFocusedOn = false;
  let showNumberOfPeople = false;
  let showSuggestedLengths = false;
  let showHasVideo = false;
  let showHasDiagrams = false;
  let showHasImages = false;
  let showHasDiagram = false;

  // Function to reset all filters
  function resetFilters() {
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
  }

  // Function to handle toggling filters
  function toggleFilter(filterName) {
    closeAllFilters();
    if (filterName === 'skillLevels') showSkillLevels = true;
    else if (filterName === 'drillComplexity') showDrillComplexity = true;
    else if (filterName === 'skillsFocusedOn') showSkillsFocusedOn = true;
    else if (filterName === 'positionsFocusedOn') showPositionsFocusedOn = true;
    else if (filterName === 'hasDiagram') selectedHasDiagram = !selectedHasDiagram;
    // ... (other filters remain the same)
  }

  function closeAllFilters() {
    showSkillLevels = false;
    showDrillComplexity = false;
    showSkillsFocusedOn = false;
    showPositionsFocusedOn = false;
    showNumberOfPeople = false;
    showSuggestedLengths = false;
    showHasVideo = false;
    showHasDiagrams = false;
    showHasImages = false;
    showHasDiagram = false;
  }
</script>

<style>
  /* Styles for filter buttons and dropdowns */
  .filter-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .filter-button {
    background-color: #f3f4f6; /* Tailwind Gray-100 */
    border: 1px solid #d1d5db; /* Tailwind Gray-300 */
    border-radius: 9999px; /* Full rounded */
    padding: 0.5rem 1rem;
    cursor: pointer;
    position: relative;
  }

  .filter-button.active {
    background-color: #e5e7eb; /* Tailwind Gray-200 */
  }

  .filter-button.selected {
    background-color: #3b82f6; /* Tailwind Blue-500 */
    color: white;
  }

  .filter-content {
    position: absolute;
    top: 100%;
    left: 0;
    background-color: white;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-top: 0.5rem;
    z-index: 10;
    max-height: 300px;
    overflow-y: auto;
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 5;
  }
</style>

<!-- Filter Buttons -->
<div class="filter-buttons">
  <!-- Skill Levels Filter -->
  <div 
    class="filter-button {showSkillLevels ? 'active' : ''}" 
    on:click={() => toggleFilter('skillLevels')} 
    on:keydown={(e) => e.key === 'Enter' && toggleFilter('skillLevels')}
    role="button" 
    tabindex="0"
    aria-expanded={showSkillLevels}
    aria-controls="skillLevels-content"
  >
    Skill Levels
    {#if selectedSkillLevels.length}
      <span class="ml-1 text-blue-500">({selectedSkillLevels.length})</span>
    {/if}
    {#if showSkillLevels}
      <div class="filter-content" id="skillLevels-content">
        {#each skillLevels as level}
          <label class="flex items-center mt-2">
            <input type="checkbox" bind:group={selectedSkillLevels} value={level} />
            <span class="ml-2">{level}</span>
          </label>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Complexities Filter -->
  <div 
    class="filter-button {showDrillComplexity ? 'active' : ''}" 
    on:click={() => toggleFilter('drillComplexity')} 
    on:keydown={(e) => e.key === 'Enter' && toggleFilter('drillComplexity')}
    role="button" 
    tabindex="0"
    aria-expanded={showDrillComplexity}
    aria-controls="drillComplexity-content"
  >
    Drill Complexity
    {#if selectedComplexities.length}
      <span class="ml-1 text-blue-500">({selectedComplexities.length})</span>
    {/if}
    {#if showDrillComplexity}
      <div class="filter-content" id="drillComplexity-content">
        {#each complexities as complexity}
          <label class="flex items-center mt-2">
            <input type="checkbox" bind:group={selectedComplexities} value={complexity} />
            <span class="ml-2">{complexity}</span>
          </label>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Skills Focused On Filter -->
  <div 
    class="filter-button {showSkillsFocusedOn ? 'active' : ''}" 
    on:click={() => toggleFilter('skillsFocusedOn')} 
    on:keydown={(e) => e.key === 'Enter' && toggleFilter('skillsFocusedOn')}
    role="button" 
    tabindex="0"
    aria-expanded={showSkillsFocusedOn}
    aria-controls="skillsFocusedOn-content"
  >
    Skills Focused On
    {#if selectedSkillsFocusedOn.length}
      <span class="ml-1 text-blue-500">({selectedSkillsFocusedOn.length})</span>
    {/if}
    {#if showSkillsFocusedOn}
      <div class="filter-content" id="skillsFocusedOn-content">
        {#each skillsFocusedOn as skill}
          <label class="flex items-center mt-2">
            <input type="checkbox" bind:group={selectedSkillsFocusedOn} value={skill} />
            <span class="ml-2">{skill}</span>
          </label>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Positions Focused On Filter -->
  <div 
    class="filter-button {showPositionsFocusedOn ? 'active' : ''}" 
    on:click={() => toggleFilter('positionsFocusedOn')} 
    on:keydown={(e) => e.key === 'Enter' && toggleFilter('positionsFocusedOn')}
    role="button" 
    tabindex="0"
    aria-expanded={showPositionsFocusedOn}
    aria-controls="positionsFocusedOn-content"
  >
    Positions Focused On
    {#if selectedPositionsFocusedOn.length}
      <span class="ml-1 text-blue-500">({selectedPositionsFocusedOn.length})</span>
    {/if}
    {#if showPositionsFocusedOn}
      <div class="filter-content" id="positionsFocusedOn-content">
        {#each positionsFocusedOn as position}
          <label class="flex items-center mt-2">
            <input type="checkbox" bind:group={selectedPositionsFocusedOn} value={position} />
            <span class="ml-2">{position}</span>
          </label>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Has Diagram Filter -->
  <div 
    class="filter-button {selectedHasDiagram ? 'selected' : ''}" 
    on:click={() => toggleFilter('hasDiagram')} 
    on:keydown={(e) => e.key === 'Enter' && toggleFilter('hasDiagram')}
    role="button" 
    tabindex="0"
  >
    Has Diagram
    {#if selectedHasDiagram}
      <span class="ml-1">✓</span>
    {/if}
  </div>

  <!-- Reset Filters Button -->
  <button class="filter-button" on:click={resetFilters}>
    Reset Filters
  </button>
</div>

<!-- Overlay to close dropdown when clicking outside -->
{#if showSkillLevels || showDrillComplexity || showSkillsFocusedOn || showPositionsFocusedOn}
  <div 
    class="overlay" 
    on:click={closeAllFilters} 
    on:keydown={(e) => e.key === 'Escape' && closeAllFilters()}
    tabindex="0"
    role="button"
    aria-label="Close filters"
  ></div>
{/if}