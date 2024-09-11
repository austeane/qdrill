<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { cart } from '$lib/stores/cartStore';
  import { dndzone } from 'svelte-dnd-action';

  let planName = writable('');
  let planDescription = writable('');
  let selectedDrills = writable([]);

  onMount(() => {
    cart.loadFromStorage();
    selectedDrills.set($cart.map(drill => ({ ...drill, type: 'drill' })));
  });

  function handleDndConsider(e) {
    selectedDrills.set(e.detail.items);
  }

  function handleDndFinalize(e) {
    selectedDrills.set(e.detail.items);
  }

  function submitPlan() {
    // Placeholder for submit logic
    console.log('Plan submitted:', {
      name: $planName,
      description: $planDescription,
      drills: $selectedDrills
    });
  }

  function removeDrill(index) {
    selectedDrills.update(drills => drills.filter((_, i) => i !== index));
  }

  function addBreak() {
    selectedDrills.update(drills => [...drills, { id: `break-${Date.now()}`, name: 'Break', duration: 5, type: 'break' }]);
  }

  function updateBreakDuration(index, duration) {
    selectedDrills.update(drills => {
      drills[index].duration = duration;
      return drills;
    });
  }
</script>

<svelte:head>
  <title>Create Practice Plan</title>
  <meta name="description" content="Create a new practice plan" />
</svelte:head>

<section class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Create Practice Plan</h1>

  <div class="mb-4">
    <label for="planName" class="block text-sm font-medium text-gray-700">Plan Name:</label>
    <input id="planName" type="text" bind:value={$planName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
  </div>

  <div class="mb-4">
    <label for="planDescription" class="block text-sm font-medium text-gray-700">Plan Description:</label>
    <textarea id="planDescription" bind:value={$planDescription} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" rows="3"></textarea>
  </div>

  <div class="mb-4">
    <h2 class="text-xl font-semibold mb-2">Selected Drills and Breaks</h2>
    <ul class="space-y-2" use:dndzone={{items: $selectedDrills}} on:consider={handleDndConsider} on:finalize={handleDndFinalize}>
      {#each $selectedDrills as item, index (item.id)}
        <li class="flex justify-between items-center bg-gray-100 p-2 rounded cursor-move">
          {#if item.type === 'drill'}
            <span>{item.name}</span>
            <button on:click={() => removeDrill(index)} class="text-red-600 hover:text-red-800">Remove</button>
          {:else}
            <span>Break</span>
            <input
              type="number"
              min="1"
              bind:value={item.duration}
              on:input={(e) => updateBreakDuration(index, parseInt(e.target.value))}
              class="w-16 text-right"
            /> minutes
            <button on:click={() => removeDrill(index)} class="text-red-600 hover:text-red-800">Remove</button>
          {/if}
        </li>
      {/each}
    </ul>
    <button on:click={addBreak} class="mt-2 bg-green-500 text-white py-1 px-2 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
      Add Break
    </button>
  </div>

  <button on:click={submitPlan} class="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
    Submit Plan
  </button>
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
