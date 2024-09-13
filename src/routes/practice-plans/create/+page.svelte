<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { cart } from '$lib/stores/cartStore';
  import { dndzone } from 'svelte-dnd-action';
  import { ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon } from 'svelte-feather-icons';
  import DiagramDrawer from '../../../components/DiagramDrawer.svelte';
  import { goto } from '$app/navigation';
  import { toast } from '@zerodevx/svelte-toast';

  let planName = writable('');
  let planDescription = writable('');
  let selectedItems = writable([]);
  let estimatedTime = writable(0);
  let playerRange = writable({ min: 0, max: 0 });
  let skillLevelRange = writable({ min: 0, max: 0 });
  let complexityDistribution = writable({ low: 0, medium: 0, high: 0 });
  let currentDiagramIndex = writable({});
  let isSubmitting = writable(false);
  let errors = writable({});

  onMount(() => {
    cart.loadFromStorage();
    selectedItems.set($cart.map(drill => ({ ...drill, type: 'drill', expanded: false })));
  });

  function handleDndConsider(e) {
    selectedItems.set(e.detail.items);
  }

  function handleDndFinalize(e) {
    selectedItems.set(e.detail.items);
  }

  async function submitPlan() {
    errors.set({});
    if (!$planName) {
      errors.update(e => ({ ...e, planName: 'Plan name is required' }));
      return;
    }
    if ($selectedItems.length === 0) {
      errors.update(e => ({ ...e, selectedItems: 'At least one drill or break is required' }));
      return;
    }

    isSubmitting.set(true);
    const planData = {
      name: $planName,
      description: $planDescription,
      items: $selectedItems,
      estimatedTime: $estimatedTime,
      playerRange: $playerRange,
      skillLevelRange: $skillLevelRange,
      complexityDistribution: $complexityDistribution
    };

    try {
      const response = await fetch('/api/practice-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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

  function calculateMetrics() {
    let totalTime = 0;
    let minPlayers = Infinity;
    let maxPlayers = 0;
    let minSkillLevel = Infinity;
    let maxSkillLevel = 0;
    let complexityCount = { low: 0, medium: 0, high: 0 };
    let totalDrills = 0;

    $selectedItems.forEach(item => {
      if (item.type === 'drill') {
        const suggestedLength = parseInt(item.suggested_length.split('-')[1]) || 0;
        totalTime += suggestedLength;
        minPlayers = Math.min(minPlayers, parseInt(item.number_of_people?.min) || Infinity);
        maxPlayers = Math.max(maxPlayers, parseInt(item.number_of_people?.max) || 0);
        item.skill_level.forEach(level => {
          const levelValue = getSkillLevelValue(level);
          minSkillLevel = Math.min(minSkillLevel, levelValue);
          maxSkillLevel = Math.max(maxSkillLevel, levelValue);
        });
        complexityCount[item.complexity.toLowerCase()]++;
        totalDrills++;
      } else if (item.type === 'break') {
        totalTime += parseInt(item.duration) || 0;
      }
    });

    estimatedTime.set(totalTime);
    playerRange.set({ min: minPlayers === Infinity ? 0 : minPlayers, max: maxPlayers });
    skillLevelRange.set({ min: minSkillLevel === Infinity ? 0 : minSkillLevel, max: maxSkillLevel });
    complexityDistribution.set({
      low: totalDrills > 0 ? (complexityCount.low / totalDrills) * 100 : 0,
      medium: totalDrills > 0 ? (complexityCount.medium / totalDrills) * 100 : 0,
      high: totalDrills > 0 ? (complexityCount.high / totalDrills) * 100 : 0
    });
  }
  
  function getSkillLevelValue(level) {
  const levels = ['new to sport', 'beginner', 'intermediate', 'advanced', 'elite'];
    return levels.indexOf(level.toLowerCase());
  }

  function getSkillLevelName(value) {
    const levels = ['New to Sport', 'Beginner', 'Intermediate', 'Advanced', 'Elite'];
    return levels[value] || '';
  }

  function toggleExpand(index) {
    try {
      console.log('Toggling item:', $selectedItems[index]);
      selectedItems.update(items => {
        const updatedItems = [...items];
        updatedItems[index].expanded = !updatedItems[index].expanded;
        return updatedItems;
      });
    } catch (error) {
      console.error('Error toggling expand:', error);
    }
  }

  function nextDiagram(drillIndex) {
    currentDiagramIndex.update(indices => {
      const current = indices[drillIndex] || 0;
      const max = $selectedItems[drillIndex].diagrams.length - 1;
      indices[drillIndex] = current < max ? current + 1 : 0;
      return indices;
    });
  }

  function prevDiagram(drillIndex) {
    currentDiagramIndex.update(indices => {
      const current = indices[drillIndex] || 0;
      const max = $selectedItems[drillIndex].diagrams.length - 1;
      indices[drillIndex] = current > 0 ? current - 1 : max;
      return indices;
    });
  }

  $: {
    calculateMetrics();
  }

  $: totalDuration = $selectedItems.reduce((total, item) => {
    return total + (item.type === 'drill' ? parseInt(item.suggested_length.split('-')[1]) : item.duration);
  }, 0);
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Create Practice Plan</h1>

  <div class="mb-4">
    <label for="planName" class="block text-sm font-medium text-gray-700">Plan Name:</label>
    <input id="planName" bind:value={$planName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
    {#if $errors.planName}
      <p class="text-red-500 text-sm mt-1">{$errors.planName}</p>
    {/if}
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
              <div class="flex items-center">
                <span>{item.suggested_length} minutes</span>
                <button
                  on:click={() => toggleExpand(index)}
                  class="ml-2 p-1 rounded-full hover:bg-gray-200"
                >
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
            <div class="mt-2 p-2 bg-gray-50 rounded flex">
              <div class="flex-1">
                {#if item.brief_description}<p><strong>Brief Description:</strong> {item.brief_description}</p>{/if}
                {#if item.detailed_description}<p><strong>Detailed Description:</strong> {item.detailed_description}</p>{/if}
                {#if item.skill_level}<p><strong>Skill Level:</strong> {Array.isArray(item.skill_level) ? item.skill_level.join(', ') : item.skill_level}</p>{/if}
                {#if item.complexity}<p><strong>Complexity:</strong> {item.complexity}</p>{/if}
                {#if item.number_of_people?.min && item.number_of_people?.max}
                  <p><strong>Number of People:</strong> {item.number_of_people.min} - {item.number_of_people.max}</p>
                {/if}
                {#if item.skills_focused_on}<p><strong>Skills Focused On:</strong> {Array.isArray(item.skills_focused_on) ? item.skills_focused_on.join(', ') : item.skills_focused_on}</p>{/if}
                {#if item.positions_focused_on}<p><strong>Positions Focused On:</strong> {Array.isArray(item.positions_focused_on) ? item.positions_focused_on.join(', ') : item.positions_focused_on}</p>{/if}
                {#if item.video_link}
                  <p><strong>Video Link:</strong> <a href={item.video_link} target="_blank" rel="noopener noreferrer">Watch Video</a></p>
                {/if}
              </div>
              {#if item.diagrams && item.diagrams.length > 0}
                <div class="flex-1 ml-4">
                  <div class="relative">
                    <DiagramDrawer data={item.diagrams[$currentDiagramIndex[index] || 0]} showSaveButton={false} />
                    {#if item.diagrams.length > 1}
                      <div class="absolute top-1/2 left-0 transform -translate-y-1/2">
                        <button on:click={() => prevDiagram(index)} class="bg-gray-200 rounded-full p-1">
                          <ChevronLeftIcon size="20" />
                        </button>
                      </div>
                      <div class="absolute top-1/2 right-0 transform -translate-y-1/2">
                        <button on:click={() => nextDiagram(index)} class="bg-gray-200 rounded-full p-1">
                          <ChevronRightIcon size="20" />
                        </button>
                      </div>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          {/if}
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
    <h2 class="text-xl font-semibold mb-2">Plan Metrics</h2>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="estimatedTime" class="block text-sm font-medium text-gray-700">Estimated Time:</label>
        <input id="estimatedTime" type="text" readonly value={`${$estimatedTime} minutes`} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      <div>
        <label for="playerRange" class="block text-sm font-medium text-gray-700">Player Range:</label>
        <input id="playerRange" type="text" readonly value={`${$playerRange.min} - ${$playerRange.max}`} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      <div>
        <label for="skillLevelRange" class="block text-sm font-medium text-gray-700">Skill Level Range:</label>
        <input id="skillLevelRange" type="text" readonly value={`${getSkillLevelName($skillLevelRange.min)} - ${getSkillLevelName($skillLevelRange.max)}`} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      <div>
        <label for="complexityDistribution" class="block text-sm font-medium text-gray-700">Complexity Distribution:</label>
        <div class="flex mt-1">
          <div class="bg-green-500 h-4" style="width: {$complexityDistribution.low}%"></div>
          <div class="bg-yellow-500 h-4" style="width: {$complexityDistribution.medium}%"></div>
          <div class="bg-red-500 h-4" style="width: {$complexityDistribution.high}%"></div>
        </div>
        <div class="flex justify-between text-xs mt-1">
          <span>Low: {$complexityDistribution.low.toFixed(1)}%</span>
          <span>Medium: {$complexityDistribution.medium.toFixed(1)}%</span>
          <span>High: {$complexityDistribution.high.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  </div>

  <div class="mb-4">
    <p class="text-lg font-semibold">Total Duration: {totalDuration} minutes</p>
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
