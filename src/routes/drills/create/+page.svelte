<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  let name = writable('');
  let brief_description = writable('');
  let detailed_description = writable('');
  let skill_level = writable([]);
  let complexity = writable('');
  let suggested_length = writable('');
  let number_of_people_min = writable('');
  let number_of_people_max = writable('');
  let skills_focused_on = writable([]);
  let positions_focused_on = writable([]);
  let video_link = writable('');
  let images = writable([]);

  let errors = writable({});

  function validateForm() {
    let newErrors = {};
    if (!$name) newErrors.name = 'Name is required';
    if (!$brief_description) newErrors.brief_description = 'Brief description is required';
    if ($skill_level.length === 0) newErrors.skill_level = 'Skill level is required';
    if (!$suggested_length) newErrors.suggested_length = 'Suggested length of time is required';
    if ($skills_focused_on.length === 0) newErrors.skills_focused_on = 'Skills focused on are required';
    if ($positions_focused_on.length === 0) newErrors.positions_focused_on = 'Positions focused on are required';
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
      number_of_people: {
        min: $number_of_people_min || 0,
        max: $number_of_people_max || 99
      },
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
      <select id="skill_level" bind:value={$skill_level} multiple>
        <option value="new to sport">New to Sport</option>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
        <option value="elite">Elite</option>
      </select>
      {#if $errors.skill_level}
        <p class="error">{$errors.skill_level}</p>
      {/if}
    </div>

    <div>
      <label for="complexity">Complexity:</label>
      <select id="complexity" bind:value={$complexity}>
        <option value="">Select Complexity</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
    </div>

    <div>
      <label for="suggested_length">Suggested Length of Time:</label>
      <select id="suggested_length" bind:value={$suggested_length}>
        <option value="">Select Length of Time</option>
        <option value="0-5 minutes">0-5 minutes</option>
        <option value="5-15 minutes">5-15 minutes</option>
        <option value="15-30 minutes">15-30 minutes</option>
        <option value="30-60 minutes">30-60 minutes</option>
      </select>
      {#if $errors.suggested_length}
        <p class="error">{$errors.suggested_length}</p>
      {/if}
    </div>

    <div>
      <label for="number_of_people_min">Min Number of People:</label>
      <input id="number_of_people_min" bind:value={$number_of_people_min} />
    </div>

    <div>
      <label for="number_of_people_max">Max Number of People:</label>
      <input id="number_of_people_max" bind:value={$number_of_people_max} />
    </div>

    <div>
      <label for="skills_focused_on">Skills Focused On:</label>
      <select id="skills_focused_on" bind:value={$skills_focused_on} multiple>
        <option value="driving">Driving</option>
        <option value="decision making">Decision Making</option>
        <option value="catching">Catching</option>
        <option value="throwing">Throwing</option>
        <option value="cardio">Cardio</option>
      </select>
      {#if $errors.skills_focused_on}
        <p class="error">{$errors.skills_focused_on}</p>
      {/if}
    </div>

    <div>
      <label for="positions_focused_on">Positions Focused On:</label>
      <select id="positions_focused_on" bind:value={$positions_focused_on} multiple>
        <option value="Beater">Beater</option>
        <option value="Chaser">Chaser</option>
        <option value="Keeper">Keeper</option>
        <option value="Seeker">Seeker</option>
      </select>
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
  textarea,
  select {
    padding: 0.5rem;
    font-size: 1rem;
    width: 100%;
  }

  select[multiple] {
    border: 2px solid blue;
  }

  select:not([multiple]) {
    border: 2px solid green;
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
