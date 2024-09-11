<script>
  import { writable } from 'svelte/store';

  let planName = writable('');
  let planDescription = writable('');
  let selectedDrills = writable([]);

  function submitPlan() {
    // Placeholder for submit logic
    console.log('Plan submitted:', {
      name: $planName,
      description: $planDescription,
      drills: $selectedDrills
    });
  }
</script>

<svelte:head>
  <title>Create Practice Plan</title>
  <meta name="description" content="Create a new practice plan" />
</svelte:head>

<section>
  <h1>Create Practice Plan</h1>

  <div>
    <label for="planName">Plan Name:</label>
    <input id="planName" type="text" bind:value={$planName} />
  </div>

  <div>
    <label for="planDescription">Plan Description:</label>
    <textarea id="planDescription" bind:value={$planDescription}></textarea>
  </div>

  <div>
    <h2>Selected Drills</h2>
    <ul>
      {#each $selectedDrills as drill}
        <li>{drill.name}</li>
      {/each}
    </ul>
  </div>

  <button on:click={submitPlan}>Submit Plan</button>
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
    display: block;
    margin-bottom: 0.5rem;
  }

  input, textarea {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
  }

  button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
  }
</style>
