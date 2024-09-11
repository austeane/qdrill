<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { cart } from '$lib/stores/cartStore';
  import { dndzone } from 'svelte-dnd-action';

  let planName = writable('');
  let planDescription = writable('');
  let selectedItems = writable([]);

  onMount(() => {
    cart.loadFromStorage();
    selectedItems.set($cart.map(drill => ({ ...drill, type: 'drill' })));
  });

  function handleDndConsider(e) {
    selectedItems.set(e.detail.items);
  }

  function handleDndFinalize(e) {
    selectedItems.set(e.detail.items);
  }

  function submitPlan() {
    // Placeholder for submit logic
    console.log('Plan submitted:', {
      name: $planName,
      description: $planDescription,
      items: $selectedItems
    });
  }

  function removeItem(index) {
    selectedItems.update(items => items.filter((_, i) => i !== index));
  }

  function addBreak(index) {
    selectedItems.update(items => {
      const newItems = [...items];
      newItems.splice(index + 1, 0, { id: `break-${Date.now()}`, name: 'Break', duration: 5, type: 'break' });
      return newItems;
    });
  }

  function updateBreakDuration(index, duration) {
    selectedItems.update(items => {
      const updatedItems = [...items];
      updatedItems[index].duration = duration;
      return updatedItems;
    });
  }

  $: totalDuration = $selectedItems.reduce((total, item) => {
    return total + (item.type === 'drill' ? parseInt(item.suggested_length) : item.duration);
  }, 0);
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Create Practice Plan</h1>

  <div class="mb-4">
    <label for="planName" class="block text-sm font-medium text-gray-700">Plan Name:</label>
    <input id="planName" bind:value={$planName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
  </div>

  <div class="mb-4">
    <label for="planDescription" class="block text-sm font-medium text-gray-700">Plan Description:</label>
    <textarea id="planDescription" bind:value={$planDescription} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" rows="3"></textarea>
  </div>

  <div class="mb-4">
    <h2 class="text-xl font-semibold mb-2">Selected Drills and Breaks</h2>
    <ul class="space-y-2" use:dndzone={{items: $selectedItems}} on:consider={handleDndConsider} on:finalize={handleDndFinalize}>
      {#each $selectedItems as item, index (item.id)}
        <li>
          <div class="flex justify-between items-center bg-gray-100 p-2 rounded cursor-move">
            {#if item.type === 'drill'}
              <span>{item.name}</span>
              <span>{item.suggested_length} minutes</span>
            {:else}
              <span>Break</span>
              <input
                type="number"
                min="1"
                bind:value={item.duration}
                on:input={(e) => updateBreakDuration(index, parseInt(e.target.value))}
                class="w-16 text-right"
              /> minutes
            {/if}
            <button on:click={() => removeItem(index)} class="text-red-600 hover:text-red-800">Remove</button>
          </div>
          {#if index < $selectedItems.length - 1}
            <div class="relative">
              <hr class="my-2 border-gray-300" />
              <button
                on:click={() => addBreak(index)}
                class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                Add Break
              </button>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  </div>

  <div class="mb-4">
    <p class="text-lg font-semibold">Total Duration: {totalDuration} minutes</p>
  </div>

  <button on:click={submitPlan} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
    Create Plan
  </button>
</div>
