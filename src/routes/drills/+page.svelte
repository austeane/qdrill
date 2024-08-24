<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  let drills = writable([]);
  let skillLevels = writable([]);
  let positions = writable([]);
  let selectedSkillLevel = writable('');
  let selectedPosition = writable('');

  onMount(async () => {
    const response = await fetch('/api/drills');
    const data = await response.json();
    if (Array.isArray(data)) {
      drills.set(data);

      const skillLevelsSet = new Set(data.map(drill => drill.skill_level));
      skillLevels.set(Array.from(skillLevelsSet));

      const positionsSet = new Set(data.map(drill => drill.positions_focused_on).flat());
      positions.set(Array.from(positionsSet));
    } else {
      console.error('Expected data to be an array');
      drills.set([]);
    }
  });

  function filterDrills(drills, skillLevel, position) {
    if (!Array.isArray(drills)) {
      console.error('Expected drills to be an array');
      return [];
    }
    return drills.filter(drill => {
      return (
        (skillLevel ? drill.skill_level === skillLevel : true) &&
        (position ? drill.positions_focused_on.includes(position) : true)
      );
    });
  }
</script>

<svelte:head>
  <title>Drill Listing</title>
  <meta name="description" content="List of all drills" />
</svelte:head>

<section class="container mx-auto p-4">
  <h1 class="text-2xl font-bold text-center mb-4">Drill Listing</h1>

  <div class="sticky top-0 bg-white z-10">
    <div class="flex overflow-x-auto space-x-4 py-2">
      <div class="flex-shrink-0">
        <label for="skillLevel" class="block text-sm font-medium text-gray-700">Filter by Skill Level:</label>
        <select id="skillLevel" bind:value={$selectedSkillLevel} class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
          <option value="">All</option>
          {#each $skillLevels as skillLevel}
            <option value={skillLevel}>{skillLevel}</option>
          {/each}
        </select>
      </div>

      <div class="flex-shrink-0">
        <label for="position" class="block text-sm font-medium text-gray-700">Filter by Position:</label>
        <select id="position" bind:value={$selectedPosition} class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
          <option value="">All</option>
          {#each $positions as position}
            <option value={position}>{position}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 overflow-y-auto">
    {#each filterDrills($drills, $selectedSkillLevel, $selectedPosition) as drill}
      <div class="bg-white shadow-md rounded-lg p-4">
        <a href={`/drills/${drill.id}`} class="text-lg font-semibold text-indigo-600 hover:underline">{drill.name}</a>
        <p class="mt-2 text-gray-600">{drill.brief_description}</p>
      </div>
    {/each}
  </div>
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }

  h1 {
    width: 100%;
    text-align: center;
  }

  div {
    margin: 1rem 0;
  }

  label {
    margin-right: 0.5rem;
  }

  select {
    padding: 0.5rem;
    font-size: 1rem;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    margin: 1rem 0;
  }

  a {
    font-weight: bold;
    text-decoration: none;
    color: var(--color-theme-1);
  }

  a:hover {
    text-decoration: underline;
  }

  p {
    margin: 0.5rem 0 0;
  }
</style>
