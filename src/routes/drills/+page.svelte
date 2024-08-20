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

<section>
  <h1>Drill Listing</h1>

  <div>
    <label for="skillLevel">Filter by Skill Level:</label>
    <select id="skillLevel" bind:value={$selectedSkillLevel}>
      <option value="">All</option>
      {#each $skillLevels as skillLevel}
        <option value={skillLevel}>{skillLevel}</option>
      {/each}
    </select>
  </div>

  <div>
    <label for="position">Filter by Position:</label>
    <select id="position" bind:value={$selectedPosition}>
      <option value="">All</option>
      {#each $positions as position}
        <option value={position}>{position}</option>
      {/each}
    </select>
  </div>

  <ul>
    {#each filterDrills($drills, $selectedSkillLevel, $selectedPosition) as drill}
      <li>
        <a href={`/drills/${drill.id}`}>{drill.name}</a>
        <p>{drill.brief_description}</p>
      </li>
    {/each}
  </ul>
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
