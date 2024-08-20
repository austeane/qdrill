<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  let name = writable('');
  let brief_description = writable('');
  let detailed_description = writable('');
  let skill_level = writable('');
  let complexity = writable('');
  let suggested_length = writable('');
  let number_of_people = writable('');
  let skills_focused_on = writable('');
  let positions_focused_on = writable('');
  let video_link = writable('');
  let images = writable([]);

  let errors = writable({});

  function validateForm() {
    let newErrors = {};
    if (!$name) newErrors.name = 'Name is required';
    if (!$brief_description) newErrors.brief_description = 'Brief description is required';
    if (!$skill_level) newErrors.skill_level = 'Skill level is required';
    if (!$suggested_length) newErrors.suggested_length = 'Suggested length of time is required';
    if (!$skills_focused_on) newErrors.skills_focused_on = 'Skills focused on are required';
    if (!$positions_focused_on) newErrors.positions_focused_on = 'Positions focused on are required';
    errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    const drill = {
      name: $name,
      brief_description: $brief_description,
      detailed_description: $detailed_description,
      skill_level: $skill_level,
      complexity: $complexity,
      suggested_length: $suggested_length,
      number_of_people: $number_of_people,
      skills_focused_on: $skills_focused_on,
      positions_focused_on: $positions_focused_on,
      video_link: $video_link,
      images: $images
    };

    console.log('Drill object:', drill);

    const response = await fetch('/api/drills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(drill)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response body:', data);
      // Handle successful submission
    } else {
      console.log('Response status:', response.status);
      const errorData = await response.json();
      console.log('Response body:', errorData);
      // Handle error
    }
  }
</script>

<svelte:head>
  <title>Create Drill</title>
  <meta name="description" content="Create a new drill" />
</svelte:head>

<section>
  <h1>Create Drill</h1>

  <form on:submit|preventDefault={handleSubmit}>
    <div>
      <label for="name">Name:</label>
      <input id="name" bind:value={$name} />
      {#if $errors.name}
        <p class="error">{$errors.name}</p>
      {/if}
    </div>

    <div>
      <label for="brief_description">Brief Description:</label>
      <input id="brief_description" bind:value={$brief_description} />
      {#if $errors.brief_description}
        <p class="error">{$errors.brief_description}</p>
      {/if}
    </div>

    <div>
      <label for="detailed_description">Detailed Description:</label>
      <textarea id="detailed_description" bind:value={$detailed_description}></textarea>
    </div>

    <div>
      <label for="skill_level">Skill Level:</label>
      <input id="skill_level" bind:value={$skill_level} />
      {#if $errors.skill_level}
        <p class="error">{$errors.skill_level}</p>
      {/if}
    </div>

    <div>
      <label for="complexity">Complexity:</label>
      <input id="complexity" bind:value={$complexity} />
    </div>

    <div>
      <label for="suggested_length">Suggested Length of Time:</label>
      <input id="suggested_length" bind:value={$suggested_length} />
      {#if $errors.suggested_length}
        <p class="error">{$errors.suggested_length}</p>
      {/if}
    </div>

    <div>
      <label for="number_of_people">Number of People Required:</label>
      <input id="number_of_people" bind:value={$number_of_people} />
    </div>

    <div>
      <label for="skills_focused_on">Skills Focused On:</label>
      <input id="skills_focused_on" bind:value={$skills_focused_on} />
      {#if $errors.skills_focused_on}
        <p class="error">{$errors.skills_focused_on}</p>
      {/if}
    </div>

    <div>
      <label for="positions_focused_on">Positions Focused On:</label>
      <input id="positions_focused_on" bind:value={$positions_focused_on} />
      {#if $errors.positions_focused_on}
        <p class="error">{$errors.positions_focused_on}</p>
      {/if}
    </div>

    <div>
      <label for="video_link">Video Link:</label>
      <input id="video_link" bind:value={$video_link} />
    </div>

    <div>
      <label for="images">Images:</label>
      <input id="images" type="file" multiple on:change={e => images.set(Array.from(e.target.files))} />
    </div>

    <button type="submit">Create Drill</button>
  </form>
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

  form {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 600px;
  }

  div {
    margin: 1rem 0;
  }

  label {
    margin-right: 0.5rem;
  }

  input,
  textarea {
    padding: 0.5rem;
    font-size: 1rem;
    width: 100%;
  }

  button {
    padding: 0.5rem;
    font-size: 1rem;
    background-color: var(--color-theme-1);
    color: white;
    border: none;
    cursor: pointer;
  }

  button:hover {
    background-color: var(--color-theme-2);
  }

  .error {
    color: red;
    font-size: 0.8rem;
  }
</style>
