<script>
  import { writable } from 'svelte/store';
  import { cart } from '$lib/stores/cartStore';
  import { dndzone } from 'svelte-dnd-action';
  import { ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon } from 'svelte-feather-icons';
  import DiagramDrawer from '$components/DiagramDrawer.svelte';
  import { goto } from '$app/navigation';
  import { toast } from '@zerodevx/svelte-toast';

  // Receive drills data from the server-side load function
  export let data;
  let availableDrills = data.drills || [];

  // Initialize stores
  let planName = '';
  let planDescription = '';
  let selectedItems = writable([]);
  let isSubmitting = writable(false);
  let errors = writable({});

  // Initialize selectedItems from the cart
  $: selectedItems.set(
    $cart.map(drill => ({ ...drill, type: 'drill', expanded: false }))
  );

  // Update the dndzone configuration
  let dndOptions = {
    items: $selectedItems,
    type: "column",
    flipDurationMs: 300,
    dropTargetStyle: {outline: "1px dashed #000"}
  };

  function handleDndConsider(e) {
    selectedItems.set(e.detail.items);
  }

  function handleDndFinalize(e) {
    selectedItems.set(e.detail.items);
  }

  async function submitPlan() {
    errors.set({});
    if (!planName.trim()) {
      errors.update(e => ({ ...e, planName: 'Plan name is required' }));
      return;
    }
    if ($selectedItems.length === 0) {
      errors.update(e => ({ ...e, selectedItems: 'At least one drill or break is required' }));
      return;
    }

    isSubmitting.set(true);
    const planData = {
      name: planName,
      description: planDescription,
      items: $selectedItems,
    };

    try {
      const response = await fetch('/api/practice-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.push('Practice plan created successfully');
        goto(`/practice-plans/${data.id}`);
      } else {
        const errorData = await response.json();
        errors.set(errorData.errors || { general: 'An error occurred while creating the practice plan' });
        toast.push('Failed to create practice plan', { theme: { '--toastBackground': 'red' } });
      }
    } catch (error) {
      console.error('Error submitting practice plan:', error);
      errors.set({ general: 'An unexpected error occurred' });
      toast.push('An unexpected error occurred', { theme: { '--toastBackground': 'red' } });
    } finally {
      isSubmitting.set(false);
    }
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

  function toggleExpand(index) {
    selectedItems.update(items => {
      const updatedItems = [...items];
      updatedItems[index].expanded = !updatedItems[index].expanded;
      return updatedItems;
    });
  }
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Create Practice Plan</h1>

  <div class="mb-4">
    <label for="planName" class="block text-sm font-medium text-gray-700">Plan Name:</label>
    <input id="planName" bind:value={planName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
    {#if $errors.planName}
      <p class="text-red-500 text-sm mt-1">{$errors.planName}</p>
    {/if}
  </div>

  <div class="mb-4">
    <label for="planDescription" class="block text-sm font-medium text-gray-700">Plan Description:</label>
    <textarea id="planDescription" bind:value={planDescription} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="3"></textarea>
  </div>

  <!-- Selected Drills and Breaks with drag-and-drop -->
  <div class="mb-4">
    <h2 class="text-xl font-semibold mb-2">Selected Drills and Breaks</h2>
    <ul
      use:dndzone={dndOptions}
      on:consider={handleDndConsider}
      on:finalize={handleDndFinalize}
      class="space-y-2"
    >
      {#each $selectedItems as item, index (item.id)}
        <li>
          <div class="flex justify-between items-center bg-gray-100 p-2 rounded cursor-move">
            {#if item.type === 'drill'}
              <span>{item.name}</span>
              <div class="flex items-center">
                <span>{item.suggested_length} minutes</span>
                <button on:click={() => toggleExpand(index)} class="ml-2 p-1 rounded-full hover:bg-gray-200">
                  {#if item.expanded}
                    <ChevronUpIcon size="20" />
                  {:else}
                    <ChevronDownIcon size="20" />
                  {/if}
                </button>
              </div>
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
          {#if item.type === 'drill' && item.expanded}
            <div class="mt-2 p-2 bg-gray-50 rounded">
              {#if item.brief_description}<p><strong>Brief Description:</strong> {item.brief_description}</p>{/if}
              {#if item.detailed_description}<p><strong>Detailed Description:</strong> {item.detailed_description}</p>{/if}
              {#if item.skill_level}<p><strong>Skill Level:</strong> {Array.isArray(item.skill_level) ? item.skill_level.join(', ') : item.skill_level}</p>{/if}
              {#if item.complexity}<p><strong>Complexity:</strong> {item.complexity}</p>{/if}
              {#if item.number_of_people_min && item.number_of_people_max}
                <p><strong>Number of People:</strong> {item.number_of_people_min} - {item.number_of_people_max}</p>
              {/if}
              {#if item.skills_focused_on}<p><strong>Skills Focused On:</strong> {Array.isArray(item.skills_focused_on) ? item.skills_focused_on.join(', ') : item.skills_focused_on}</p>{/if}
              {#if item.positions_focused_on}<p><strong>Positions Focused On:</strong> {Array.isArray(item.positions_focused_on) ? item.positions_focused_on.join(', ') : item.positions_focused_on}</p>{/if}
              {#if item.video_link}
                <p><strong>Video Link:</strong> <a href={item.video_link} target="_blank" rel="noopener noreferrer">Watch Video</a></p>
              {/if}
            </div>
          {/if}
          <!-- Add Break Button between items -->
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

  {#if $errors.selectedItems}
    <p class="text-red-500 text-sm mb-2">{$errors.selectedItems}</p>
  {/if}

  {#if $errors.general}
    <p class="text-red-500 text-sm mb-2">{$errors.general}</p>
  {/if}

  <button 
    on:click={submitPlan} 
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
    disabled={$isSubmitting}
  >
    {$isSubmitting ? 'Creating Plan...' : 'Create Plan'}
  </button>
</div>