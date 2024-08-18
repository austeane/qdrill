<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  let name = writable('');
  let briefDescription = writable('');
  let detailedDescription = writable('');
  let skillLevel = writable('');
  let complexity = writable('');
  let suggestedLength = writable('');
  let numberOfPeople = writable('');
  let skillsFocusedOn = writable('');
  let positionsFocusedOn = writable('');
  let videoLink = writable('');
  let images = writable([]);

  let errors = writable({});

  function validateForm() {
    let newErrors = {};
    if (!$name) newErrors.name = 'Name is required';
    if (!$briefDescription) newErrors.briefDescription = 'Brief description is required';
    if (!$skillLevel) newErrors.skillLevel = 'Skill level is required';
    if (!$suggestedLength) newErrors.suggestedLength = 'Suggested length of time is required';
    if (!$skillsFocusedOn) newErrors.skillsFocusedOn = 'Skills focused on are required';
    if (!$positionsFocusedOn) newErrors.positionsFocusedOn = 'Positions focused on are required';
    errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    const drill = {
      name: $name,
      briefDescription: $briefDescription,
      detailedDescription: $detailedDescription,
      skillLevel: $skillLevel,
      complexity: $complexity,
      suggestedLength: $suggestedLength,
      numberOfPeople: $numberOfPeople,
      skillsFocusedOn: $skillsFocusedOn,
      positionsFocusedOn: $positionsFocusedOn,
      videoLink: $videoLink,
      images: $images
    };

    const response = await fetch('/api/drills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(drill)
    });

    if (response.ok) {
      // Handle successful submission
    } else {
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
      <label for="briefDescription">Brief Description:</label>
      <input id="briefDescription" bind:value={$briefDescription} />
      {#if $errors.briefDescription}
        <p class="error">{$errors.briefDescription}</p>
      {/if}
    </div>

    <div>
      <label for="detailedDescription">Detailed Description:</label>
      <textarea id="detailedDescription" bind:value={$detailedDescription}></textarea>
    </div>

    <div>
      <label for="skillLevel">Skill Level:</label>
      <input id="skillLevel" bind:value={$skillLevel} />
      {#if $errors.skillLevel}
        <p class="error">{$errors.skillLevel}</p>
      {/if}
    </div>

    <div>
      <label for="complexity">Complexity:</label>
      <input id="complexity" bind:value={$complexity} />
    </div>

    <div>
      <label for="suggestedLength">Suggested Length of Time:</label>
      <input id="suggestedLength" bind:value={$suggestedLength} />
      {#if $errors.suggestedLength}
        <p class="error">{$errors.suggestedLength}</p>
      {/if}
    </div>

    <div>
      <label for="numberOfPeople">Number of People Required:</label>
      <input id="numberOfPeople" bind:value={$numberOfPeople} />
    </div>

    <div>
      <label for="skillsFocusedOn">Skills Focused On:</label>
      <input id="skillsFocusedOn" bind:value={$skillsFocusedOn} />
      {#if $errors.skillsFocusedOn}
        <p class="error">{$errors.skillsFocusedOn}</p>
      {/if}
    </div>

    <div>
      <label for="positionsFocusedOn">Positions Focused On:</label>
      <input id="positionsFocusedOn" bind:value={$positionsFocusedOn} />
      {#if $errors.positionsFocusedOn}
        <p class="error">{$errors.positionsFocusedOn}</p>
      {/if}
    </div>

    <div>
      <label for="videoLink">Video Link:</label>
      <input id="videoLink" bind:value={$videoLink} />
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
