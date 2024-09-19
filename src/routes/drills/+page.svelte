<script>
  import { onMount } from 'svelte';
  import FilterPanel from '$components/FilterPanel.svelte';
  import { writable } from 'svelte/store';

  // Drill data
  let drills = writable([]);

  // Available filter options
  let skillLevels = [];
  let complexities = [];
  let skillsFocusedOn = [];
  let positionsFocusedOn = [];
  let numberOfPeopleOptions = { min: null, max: null };
  let suggestedLengths = { min: null, max: null };

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

  // Fetch drills and available filter options from the database
  onMount(async () => {
    const response = await fetch('/api/drills');
    const data = await response.json();
    drills.set(data);

    // Extracting available options for filters
    const drillsData = data; // Use data directly here

    // Initialize sets to collect unique values
    const skillLevelSet = new Set();
    const complexitySet = new Set();
    const skillsFocusedSet = new Set();
    const positionsFocusedSet = new Set();
    let minNumberOfPeople = Infinity;
    let maxNumberOfPeople = -Infinity;
    let minSuggestedLength = Infinity;
    let maxSuggestedLength = -Infinity;

    drillsData.forEach(drill => {
      // Skill Levels
      drill.skill_level.forEach(level => skillLevelSet.add(level));

      // Complexities
      if (drill.complexity) complexitySet.add(drill.complexity);

      // Skills Focused On
      if (Array.isArray(drill.skills_focused_on)) {
        drill.skills_focused_on.forEach(skill => skillsFocusedSet.add(skill));
      }

      // Positions Focused On
      if (Array.isArray(drill.positions_focused_on)) {
        drill.positions_focused_on.forEach(pos => positionsFocusedSet.add(pos));
      }

      // Number of People
      if (drill.number_of_people_min < minNumberOfPeople) {
        minNumberOfPeople = drill.number_of_people_min;
      }
      if (drill.number_of_people_max > maxNumberOfPeople) {
        maxNumberOfPeople = drill.number_of_people_max;
      }

      // Suggested Length
      const length = parseInt(drill.suggested_length, 10);
      if (!isNaN(length)) {
        if (length < minSuggestedLength) {
          minSuggestedLength = length;
        }
        if (length > maxSuggestedLength) {
          maxSuggestedLength = length;
        }
      }
    });

    // Set available options
    skillLevels = Array.from(skillLevelSet);
    complexities = Array.from(complexitySet);
    skillsFocusedOn = Array.from(skillsFocusedSet);
    positionsFocusedOn = Array.from(positionsFocusedSet);
    numberOfPeopleOptions = { min: minNumberOfPeople, max: maxNumberOfPeople };
    suggestedLengths = { min: minSuggestedLength, max: maxSuggestedLength };
  });

  // Filtering logic
  $: filteredDrills = $drills.filter(drill => {
    let matches = true;

    // Search filtering
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const nameMatch = drill.name.toLowerCase().includes(query);
      const briefDescMatch = drill.brief_description.toLowerCase().includes(query);
      const detailedDescMatch = drill.detailed_description ? drill.detailed_description.toLowerCase().includes(query) : false;
      matches = matches && (nameMatch || briefDescMatch || detailedDescMatch);
    }

    // Skill Levels
    if (selectedSkillLevels.length > 0) {
      matches = matches && drill.skill_level.some(level => selectedSkillLevels.includes(level));
    }

    // Complexities
    if (selectedComplexities.length > 0) {
      matches = matches && selectedComplexities.includes(drill.complexity);
    }

    // Skills Focused On
    if (selectedSkillsFocusedOn.length > 0) {
      matches = matches && drill.skills_focused_on.some(skill => selectedSkillsFocusedOn.includes(skill));
    }

    // Positions Focused On
    if (selectedPositionsFocusedOn.length > 0) {
      matches = matches && drill.positions_focused_on.some(pos => selectedPositionsFocusedOn.includes(pos));
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
      matches = matches && ((selectedHasVideo && drill.video_link) || (!selectedHasVideo && !drill.video_link));
    }

    // Has Diagrams
    if (selectedHasDiagrams !== null) {
      const hasDiagrams = Array.isArray(drill.diagrams) && drill.diagrams.length > 0;
      matches = matches && ((selectedHasDiagrams && hasDiagrams) || (!selectedHasDiagrams && !hasDiagrams));
    }

    // Has Images
    if (selectedHasImages !== null) {
      const hasImages = Array.isArray(drill.images) && drill.images.length > 0;
      matches = matches && ((selectedHasImages && hasImages) || (!selectedHasImages && !hasImages));
    }

    // Has Diagram
    if (selectedHasDiagram) {
      matches = matches && Array.isArray(drill.diagrams) && drill.diagrams.length > 0;
    }

    return matches;
  });
</script>

<style>
  .drills-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  .drills-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
  }
  .drill-item {
    border: 1px solid #e2e8f0;
    padding: 1.5rem;
    background-color: #fff;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease-in-out;
  }
  .drill-item:hover {
    transform: translateY(-5px);
  }
  .drill-item h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: bold;
    color: #2d3748;
  }
  .drill-item p {
    margin-bottom: 0.5rem;
    color: #4a5568;
  }
  .search-input {
    margin-bottom: 2rem;
    padding: 0.75rem;
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #e2e8f0;
    border-radius: 0.25rem;
    font-size: 1rem;
  }
  .drill-link {
    text-decoration: none;
    color: inherit;
    display: block;
  }
</style>

<div class="drills-container">
  <h1>Drills</h1>

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
    class="search-input"
    bind:value={searchQuery}
  />

  <div class="drills-list">
    {#each filteredDrills as drill}
      <a href="/drills/{drill.id}" class="drill-link">
        <div class="drill-item">
          <h2>{drill.name}</h2>
          <p>{drill.brief_description}</p>
          <p><strong>Skill Levels:</strong> {drill.skill_level.join(', ')}</p>
          <p><strong>Complexity:</strong> {drill.complexity}</p>
          <p><strong>Suggested Length:</strong> {drill.suggested_length} minutes</p>
          <p><strong>Number of People:</strong> {drill.number_of_people_min} - {drill.number_of_people_max}</p>
        </div>
      </a>
    {/each}
  </div>
</div>
