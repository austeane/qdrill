<script>
  import { writable } from 'svelte/store';
  import { cart } from '$lib/stores/cartStore';
  import { dndzone } from 'svelte-dnd-action';
  import { ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon } from 'svelte-feather-icons';
  import DiagramDrawer from '$components/DiagramDrawer.svelte';
  import { goto } from '$app/navigation';
  import { toast } from '@zerodevx/svelte-toast';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  // Receive drills data from the server-side load function
  export let data;
  let availableDrills = data.drills || [];

  // Initialize stores
  let planName = '';
  let planDescription = '';
  let selectedItems = writable([]);
  let isSubmitting = writable(false);
  let errors = writable({});

  // New Fields
  let phaseOfSeasonOptions = [
    'Offseason',
    'Early season, new players',
    'Mid season, skill building',
    'Tournament tuneup',
    'End of season, peaking'
  ];
  let phaseOfSeason = '';
  let estimatedNumberOfParticipants = '';
  let practiceGoals = writable(['']);

  let showEmptyCartModal = false;

  let visibility = 'public';
  let isEditableByOthers = false;

  onMount(() => {
    if ($cart.length === 0) {
      showEmptyCartModal = true;
    }
  });

  function closeModal() {
    showEmptyCartModal = false;
  }

  function goToDrills() {
    goto('/drills');
  }

  // Initialize selectedItems from the cart with duration settings
  $: {
    selectedItems.set(
      $cart.map(drill => ({
        ...drill,
        id: drill.id || `drill-${Date.now()}-${Math.random()}`, // Ensure unique id
        type: 'drill',
        expanded: false,
        diagram_data: drill.diagrams && drill.diagrams.length > 0 ? drill.diagrams[0] : null, // Initialize diagram_data
        // Initialize selected_duration to midpoint if not set
        selected_duration: drill.min_duration && drill.max_duration
          ? Math.floor((drill.min_duration + drill.max_duration) / 2)
          : drill.suggested_length || 10 // Default to suggested_length or 10 minutes
      }))
    );
  }

  // Update the dndzone configuration
  $: dndOptions = {
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
    if (phaseOfSeason && !phaseOfSeasonOptions.includes(phaseOfSeason)) {
      errors.update(e => ({ ...e, phaseOfSeason: 'Invalid phase of season selected' }));
      return;
    }
    if (estimatedNumberOfParticipants && (!Number.isInteger(+estimatedNumberOfParticipants) || +estimatedNumberOfParticipants <= 0)) {
      errors.update(e => ({ ...e, estimatedNumberOfParticipants: 'Estimated number of participants must be a positive integer' }));
      return;
    }

    isSubmitting.set(true);

    // Prepare drills data with durations and include the type and diagram_data
    const drillsData = $selectedItems.map(item => {
      if (item.type === 'drill') {
        return {
          id: item.id,
          type: 'drill',
          duration: item.selected_duration,
          diagram_data: item.diagram_data
        };
      }
      return item; // For breaks, keep as is
    });
    const planData = {
      name: planName,
      description: planDescription,
      phase_of_season: phaseOfSeason || null,
      estimated_number_of_participants: estimatedNumberOfParticipants ? parseInt(estimatedNumberOfParticipants) : null,
      practice_goals: $practiceGoals.filter(goal => goal.trim() !== ''),
      drills: drillsData,
      visibility: visibility,
      is_editable_by_others: isEditableByOthers
    };

    try {
      const response = await fetch('/api/practice-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });

      if (response.ok) {
        const data = await response.json();
        cart.clear(); // Clear the cart after successful submission
        toast.push('Practice plan created successfully');
        goto(`/practice-plans/${data.id}`);
      } else {
        const errorData = await response.json();
        errors.set(errorData.errors || { general: errorData.error || 'An error occurred while creating the practice plan' });
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
      newItems.splice(index + 1, 0, { 
        id: `break-${Date.now()}-${Math.random()}`, 
        name: 'Break', 
        duration: 5, 
        type: 'break' 
      });
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

  // Function to handle duration changes for drills
  function handleDurationChange(item, newDuration) {
    selectedItems.update(items => {
      return items.map(it => {
        if (it.id === item.id) {
          return { ...it, selected_duration: newDuration };
        }
        return it;
      });
    });
  }

  // Functions to manage Practice Goals
  function addPracticeGoal() {
    practiceGoals.update(goals => [...goals, '']);
  }

  function removePracticeGoal(index) {
    practiceGoals.update(goals => goals.filter((_, i) => i !== index));
  }

  function updatePracticeGoal(index, value) {
    practiceGoals.update(goals => goals.map((goal, i) => (i === index ? value : goal)));
  }

  // Add this function
  function updateDiagramData(index, newDiagramData) {
    selectedItems.update(items => {
      const updatedItems = [...items];
      updatedItems[index].diagram_data = newDiagramData;
      return updatedItems;
    });
  }
</script>

<!-- Add this modal at the beginning of your template -->
{#if showEmptyCartModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="my-modal">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <h3 class="text-lg leading-6 font-medium text-gray-900">No Drills in Cart</h3>
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-500">
            You need to select some drills before creating a practice plan. Would you like to browse available drills?
          </p>
        </div>
        <div class="items-center px-4 py-3">
          <button
            id="ok-btn"
            class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            on:click={goToDrills}
          >
            Go to Drills
          </button>
          <button
            id="cancel-btn"
            class="mt-3 px-4 py-2 bg-gray-100 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            on:click={closeModal}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

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

  <div class="mb-4">
    <label for="phaseOfSeason" class="block text-sm font-medium text-gray-700">Phase of Season:</label>
    <select id="phaseOfSeason" bind:value={phaseOfSeason} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
      <option value="">Select Phase</option>
      {#each phaseOfSeasonOptions as option}
        <option value={option}>{option}</option>
      {/each}
    </select>
    {#if $errors.phaseOfSeason}
      <p class="text-red-500 text-sm mt-1">{$errors.phaseOfSeason}</p>
    {/if}
  </div>

  <div class="mb-4">
    <label for="estimatedNumberOfParticipants" class="block text-sm font-medium text-gray-700">Estimated Number of Participants:</label>
    <input id="estimatedNumberOfParticipants" type="number" min="1" bind:value={estimatedNumberOfParticipants} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
    {#if $errors.estimatedNumberOfParticipants}
      <p class="text-red-500 text-sm mt-1">{$errors.estimatedNumberOfParticipants}</p>
    {/if}
  </div>

  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700">Practice Goals:</label>
    {#each $practiceGoals as goal, index}
      <div class="flex items-center mt-2">
        <input
          type="text"
          bind:value={$practiceGoals[index]}
          on:input={(e) => updatePracticeGoal(index, e.target.value)}
          placeholder="Enter practice goal"
          class="flex-1 mr-2 border-gray-300 rounded-md shadow-sm"
        />
        {#if $practiceGoals.length > 1}
          <button type="button" on:click={() => removePracticeGoal(index)} class="text-red-600 hover:text-red-800">Remove</button>
        {/if}
      </div>
    {/each}
    <button type="button" on:click={addPracticeGoal} class="mt-2 text-blue-600 hover:text-blue-800">Add Practice Goal</button>
    {#if $errors.practice_goals}
      <p class="text-red-500 text-sm mt-1">{$errors.practice_goals}</p>
    {/if}
  </div>

  <!-- Selected Drills and Breaks with drag-and-drop -->
  <div class="mb-4">
    <h2 class="text-xl font-semibold mb-2">Selected Drills and Breaks</h2>
    <ul
      use:dndzone={{...dndOptions}}
      on:consider={handleDndConsider}
      on:finalize={handleDndFinalize}
      class="space-y-2"
    >
      {#each $selectedItems as item, index (item.id)}
        <li>
          <div class="flex flex-col">
            <div class="flex justify-between items-center bg-gray-100 p-2 rounded cursor-move">
              {#if item.type === 'drill'}
                <span>{item.name}</span>
                <div class="flex items-center space-x-4">
                  <span>{item.selected_duration} minutes</span>
                  <button on:click={() => toggleExpand(index)} class="p-1 rounded-full hover:bg-gray-200">
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
                {#if item.diagram_data}
                  <DiagramDrawer 
                    data={item.diagram_data} 
                    readonly={false} 
                    showSaveButton={true}
                    on:save={(event) => updateDiagramData(index, event.detail)}
                  />
                {/if}
              </div>
            {/if}

            {#if item.type === 'drill'}
              <div class="mt-2 flex items-center space-x-4">
                <label class="w-1/4">Duration:</label>
                <input
                  type="range"
                  min="{item.min_duration}"
                  max="{item.max_duration}"
                  bind:value="{item.selected_duration}"
                  on:input={(e) => handleDurationChange(item, parseInt(e.target.value))}
                  class="flex-1"
                />
                <input
                  type="number"
                  min="{item.min_duration}"
                  max="{item.max_duration}"
                  bind:value="{item.selected_duration}"
                  on:input={(e) => handleDurationChange(item, parseInt(e.target.value))}
                  class="w-20 border-gray-300 rounded-md shadow-sm"
                /> minutes
              </div>
            {/if}

            <!-- Add Break Button between items -->
            {#if index < $selectedItems.length - 1}
              <div class="relative mt-2">
                <hr class="my-2 border-gray-300" />
                <button
                  on:click={() => addBreak(index)}
                  class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Add Break
                </button>
              </div>
            {/if}
          </div>
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

  <!-- Add this before the submit button -->
  <div class="mb-6">
    <label class="block text-gray-700 font-medium mb-1">Visibility</label>
    <select
      bind:value={visibility}
      class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring"
      disabled={!$page.data.session}
      title={!$page.data.session ? 'Log in to create private or unlisted practice plans' : ''}
    >
      <option value="public">Public - Visible to everyone</option>
      <option value="unlisted">Unlisted - Only accessible via direct link</option>
      <option value="private">Private - Only visible to you</option>
    </select>
    {#if !$page.data.session}
      <p class="text-sm text-gray-500 mt-1">Log in to create private or unlisted practice plans</p>
    {/if}
  </div>

  <div class="mb-6">
    <label class="flex items-center">
      <input
        type="checkbox"
        bind:checked={isEditableByOthers}
        disabled={!$page.data.session}
        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <span class="ml-2 text-gray-700">
        Allow others to edit this practice plan
        {#if !$page.data.session}
          <span class="text-gray-500">(required for anonymous submissions)</span>
        {/if}
      </span>
    </label>
  </div>

  <button 
    on:click={submitPlan} 
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
    disabled={$isSubmitting}
  >
    {$isSubmitting ? 'Creating Plan...' : 'Create Plan'}
  </button>
</div>

<style>
  .timeline {
    display: flex;
    flex-direction: column;
  }
  .timeline-item {
    display: flex;
    flex-direction: column;
  }
</style>