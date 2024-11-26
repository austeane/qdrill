<script>
  import { writable } from 'svelte/store';
  import { cart } from '$lib/stores/cartStore';
  import { goto } from '$app/navigation';
  import { toast } from '@zerodevx/svelte-toast';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { handleDrillMove } from '$lib/stores/practicePlanStore';

  // Add proper prop definitions with defaults
  export let data = { drills: [] }; // Add default value
  export let practicePlan = null;
  console.log('[PracticePlanForm] Received practicePlan:', practicePlan);

  // Initialize stores more efficiently
  let planName = writable('');
  let planDescription = writable('');
  let phaseOfSeason = writable('');
  let estimatedNumberOfParticipants = writable('');
  let practiceGoals = writable(['']);
  let visibility = writable('public');
  let isEditableByOthers = writable(false);
  let selectedItems = writable([]);

  // Initialize drills from data
  $: availableDrills = data?.drills || [];

  // Update form data when practicePlan changes
  $: {
    console.log('[PracticePlanForm] practicePlan changed:', practicePlan);
    if (practicePlan) {
      console.log('[PracticePlanForm] Setting values from practicePlan');
      planName.set(practicePlan.name || '');
      planDescription.set(practicePlan.description || '');
      phaseOfSeason.set(practicePlan.phase_of_season || '');
      estimatedNumberOfParticipants.set(practicePlan.estimated_number_of_participants?.toString() || '');
      practiceGoals.set(practicePlan.practice_goals || ['']);
      visibility.set(practicePlan.visibility || 'public');
      isEditableByOthers.set(practicePlan.is_editable_by_others || false);
      selectedItems.set(practicePlan.items?.map(item => ({
        ...item,
        id: item.drill?.id || `${item.type}-${Date.now()}-${Math.random()}`,
        type: item.type,
        name: item.type === 'drill' ? item.drill.name : 'Break',
        expanded: false,
        diagram_data: item.diagram_data,
        selected_duration: item.duration,
        parallel_group_id: item.parallel_group_id
      })) || []);
    } else {
      console.log('[PracticePlanForm] Initializing empty form');
      planName.set('');
      planDescription.set('');
      phaseOfSeason.set('');
      estimatedNumberOfParticipants.set('');
      practiceGoals.set(['']);
      visibility.set('public');
      isEditableByOthers.set(false);
    }
  }

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

  let showEmptyCartModal = false;

  let dragStartX = 0;
  let dragStartY = 0;
  let currentDragItem = null;
  let dragThreshold = 50; // pixels to trigger horizontal drag
  let isDraggingForParallel = false;

  // Add these variables to track drag state
  let draggedItem = null;
  let dragOverItem = null;
  let dragOverPosition = null; // 'top', 'middle', or 'bottom'

  onMount(() => {
    console.log('[PracticePlanForm] Component mounted');
    console.log('[PracticePlanForm] Current store values:', {
      name: $planName,
      description: $planDescription,
      visibility: $visibility
    });
    if ($cart.length === 0) {
      showEmptyCartModal = true;
    }
    if (!practicePlan) {
      const cartItems = $cart.map(drill => ({
        id: drill.id,
        type: 'drill',
        name: drill.name,
        drill: drill,
        expanded: false,
        selected_duration: 15,
        diagram_data: null,
        parallel_group_id: null
      }));
      selectedItems.set(cartItems);
    }
  });

  function closeModal() {
    showEmptyCartModal = false;
  }

  function goToDrills() {
    goto('/drills');
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
    if ($phaseOfSeason && !phaseOfSeasonOptions.includes($phaseOfSeason)) {
      errors.update(e => ({ ...e, phaseOfSeason: 'Invalid phase of season selected' }));
      return;
    }

    // Add logging for participants validation
    console.log('Validating participants:', {
      value: $estimatedNumberOfParticipants,
      parsed: parseInt($estimatedNumberOfParticipants, 10),
      isNaN: isNaN(parseInt($estimatedNumberOfParticipants, 10)),
      isPositive: parseInt($estimatedNumberOfParticipants, 10) > 0,
      isInteger: Number.isInteger(parseFloat($estimatedNumberOfParticipants))
    });

    if ($estimatedNumberOfParticipants !== '') {  // Only validate if a value is provided
      const numParticipants = parseInt($estimatedNumberOfParticipants, 10);
      if (isNaN(numParticipants) || numParticipants <= 0 || !Number.isInteger(parseFloat($estimatedNumberOfParticipants))) {
        errors.update(e => ({ ...e, estimatedNumberOfParticipants: 'Estimated number of participants must be a positive integer' }));
        return;
      }
    }

    isSubmitting.set(true);

    const planData = {
      name: $planName,
      description: $planDescription,
      phase_of_season: $phaseOfSeason || null,
      estimated_number_of_participants: $estimatedNumberOfParticipants ? parseInt($estimatedNumberOfParticipants) : null,
      practice_goals: $practiceGoals.filter(goal => goal.trim() !== ''),
      drills: $selectedItems.map(item => ({
        id: item.id,
        type: item.type,
        duration: item.selected_duration || item.duration,
        diagram_data: item.diagram_data,
        parallel_group_id: item.parallel_group_id
      })),
      visibility: $visibility,
      is_editable_by_others: $isEditableByOthers
    };

    try {
      const url = practicePlan ? `/api/practice-plans/${practicePlan.id}` : '/api/practice-plans';
      const method = practicePlan ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });

      if (response.ok) {
        const data = await response.json();
        if (!practicePlan) {
          cart.clear(); // Only clear cart here, after successful submission
        }
        toast.push(`Practice plan ${practicePlan ? 'updated' : 'created'} successfully`);
        goto(`/practice-plans/${data.id}`);
      } else {
        const errorData = await response.json();
        errors.set(errorData.errors || { general: errorData.error || 'An error occurred while saving the practice plan' });
        toast.push('Failed to save practice plan', { theme: { '--toastBackground': 'red' } });
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

  // Update these functions for better group management
  function getExistingGroups() {
    const groups = new Map();
    $selectedItems.forEach(item => {
      if (item.parallel_group_id) {
        if (!groups.has(item.parallel_group_id)) {
          groups.set(item.parallel_group_id, {
            id: item.parallel_group_id,
            name: `Group ${groups.size + 1}`,
            items: []
          });
        }
        groups.get(item.parallel_group_id).items.push(item);
      }
    });
    return Array.from(groups.values());
  }

  function createNewGroup() {
    const groupId = `group_${Date.now()}`;
    parallelGroups.update(groups => [...groups, { id: groupId, name: `Group ${groups.length + 1}`, items: [] }]);
  }

  function removeFromGroup(itemId) {
    selectedItems.update(items => removeFromParallelGroup(itemId, items));
  }

  // Add this helper function
  function findClosestItemIndex(y) {
    const itemElements = document.querySelectorAll('.timeline-item');
    let closestIndex = -1;
    let closestDistance = Infinity;
    
    itemElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height/2 - y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    return closestIndex;
  }

  // Add this function to handle parallel group merging
  function mergeIntoParallelGroup(sourceIndex, targetIndex, items) {
    const sourceItem = items[sourceIndex];
    const targetItem = items[targetIndex];
    
    if (!sourceItem || !targetItem || sourceIndex === targetIndex) return items;
    
    // If items are already in the same group, do nothing
    if (sourceItem.parallel_group_id && sourceItem.parallel_group_id === targetItem.parallel_group_id) {
        return items;
    }
    
    const newItems = [...items];
    
    // If target is already in a group, add source to that group
    if (targetItem.parallel_group_id) {
        const groupId = targetItem.parallel_group_id;
        newItems[sourceIndex] = {
            ...sourceItem,
            parallel_group_id: groupId
        };
    } else {
        // Create new group for both items
        const groupId = `group_${Date.now()}`;
        newItems[sourceIndex] = {
            ...sourceItem,
            parallel_group_id: groupId
        };
        newItems[targetIndex] = {
            ...targetItem,
            parallel_group_id: groupId
        };
    }
    
    // Update durations for all items in the group
    const groupDuration = Math.max(
        sourceItem.selected_duration || sourceItem.duration,
        targetItem.selected_duration || targetItem.duration
    );
    
    return newItems.map(item => {
        if (item.parallel_group_id === newItems[sourceIndex].parallel_group_id) {
            return {
                ...item,
                selected_duration: groupDuration,
                duration: groupDuration
            };
        }
        return item;
    });
  }

  // Update these functions for drag handling
  function handleParallelDragStart(e, index) {
    e.preventDefault(); // Prevent default drag behavior
    isDraggingForParallel = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    currentDragItem = $selectedItems[index];
    
    const handleMouseMove = (e) => {
      if (!isDraggingForParallel) return;
      
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      
      // If horizontal drag is more significant than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > dragThreshold) {
        const targetIndex = findClosestItemIndex(e.clientY);
        if (targetIndex !== -1 && targetIndex !== index) {
          selectedItems.update(items => mergeIntoParallelGroup(index, targetIndex, items));
        }
      }
    };
    
    const handleMouseUp = () => {
      isDraggingForParallel = false;
      currentDragItem = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function removeFromParallelGroup(itemId, items) {
    return items.map(item => {
      if (item.id === itemId) {
        const { parallel_group_id, ...rest } = item;
        return rest;
      }
      return item;
    });
  }

  // Replace the existing drag handling functions with these updated versions
  function handleDragStart(e, index) {
    draggedItem = index;
    e.dataTransfer.effectAllowed = 'move';
    // Store initial coordinates for determining drag direction
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Calculate if the drag is more horizontal or vertical
    const deltaX = Math.abs(mouseX - dragStartX);
    const deltaY = Math.abs(mouseY - dragStartY);
    
    // If horizontal movement is greater, treat as grouping attempt
    if (deltaX > deltaY && deltaX > 20) { // 20px threshold
      dragOverPosition = 'middle';
      e.currentTarget.classList.remove(
        'bg-blue-100',
        'scale-95',
        'transform',
        'border-t-4',
        'border-t-blue-500',
        'border-b-4',
        'border-b-blue-500',
        'horizontal-drag'
      );
      e.currentTarget.classList.add('bg-blue-100', 'scale-95', 'transform', 'horizontal-drag');
    } else {
      // Vertical movement - treat as reordering
      const y = e.clientY - rect.top;
      const height = rect.height;
      const threshold = height / 3;

      if (y < threshold) {
        dragOverPosition = 'top';
        e.currentTarget.classList.remove(
          'bg-blue-100',
          'scale-95',
          'transform',
          'border-t-4',
          'border-t-blue-500',
          'border-b-4',
          'border-b-blue-500',
          'horizontal-drag'
        );
        e.currentTarget.classList.add('border-t-4', 'border-t-blue-500');
      } else if (y > height - threshold) {
        dragOverPosition = 'bottom';
        e.currentTarget.classList.remove(
          'bg-blue-100',
          'scale-95',
          'transform',
          'border-t-4',
          'border-t-blue-500',
          'border-b-4',
          'border-b-blue-500',
          'horizontal-drag'
        );
        e.currentTarget.classList.add('border-b-4', 'border-b-blue-500');
      } else {
        dragOverPosition = 'middle';
        e.currentTarget.classList.remove(
          'bg-blue-100',
          'scale-95',
          'transform',
          'border-t-4',
          'border-t-blue-500',
          'border-b-4',
          'border-b-blue-500',
          'horizontal-drag'
        );
        e.currentTarget.classList.add('bg-blue-100', 'scale-95');
      }
    }

    dragOverItem = index;
  }

  function handleDragLeave(e) {
    e.currentTarget.classList.remove(
      'bg-blue-100',
      'scale-95',
      'transform',
      'border-t-4',
      'border-t-blue-500',
      'border-b-4',
      'border-b-blue-500'
    );
    dragOverPosition = null;
  }

  function handleDrop(e, targetIndex) {
    e.preventDefault();
    e.currentTarget.classList.remove(
      'bg-blue-100',
      'scale-95',
      'transform',
      'border-t-4',
      'border-t-blue-500',
      'border-b-4',
      'border-b-blue-500'
    );

    if (draggedItem === null || draggedItem === targetIndex) return;

    const isGrouping = dragOverPosition === 'middle';

    // Use update function to modify only the selectedItems store
    selectedItems.update(items => {
        let newIndex = targetIndex;
        if (dragOverPosition === 'bottom') {
            newIndex++;
        }
        return handleDrillMove(draggedItem, newIndex, items, isGrouping);
    });

    // Reset drag state
    draggedItem = null;
    dragOverItem = null;
    dragOverPosition = null;
  }

  // Add this function before the existing removeFromGroup function
  function handleUngroup(itemId) {
    // Use update function to modify only the selectedItems store
    selectedItems.update(items => {
        const groupId = items.find(item => item.id === itemId)?.parallel_group_id;
        if (!groupId) return items;
        
        const groupSize = items.filter(item => item.parallel_group_id === groupId).length;
        
        if (groupSize <= 2) {
            // Remove group from all items if only 2 items in group
            return items.map(item => {
                if (item.parallel_group_id === groupId) {
                    const { parallel_group_id, ...rest } = item;
                    return rest;
                }
                return item;
            });
        } else {
            // Just remove from the one item
            return items.map(item => {
                if (item.id === itemId) {
                    const { parallel_group_id, ...rest } = item;
                    return rest;
                }
                return item;
            });
        }
    });
  }

  // Add logging to your drill addition function
  function addDrillToPlan(drill) {
    console.log('[PracticePlanForm] Adding drill to plan:', drill);
    selectedItems.update(items => {
      const newItems = [...items, {
        id: drill.id,
        type: 'drill',
        name: drill.name,
        drill: drill,
        expanded: false,
        selected_duration: 15, // default duration
        diagram_data: null,
        parallel_group_id: null
      }];
      console.log('[PracticePlanForm] Updated selectedItems:', newItems);
      return newItems;
    });
  }

  // Make sure the drills are being rendered in the template
  $: console.log('[PracticePlanForm] Current selectedItems in template:', $selectedItems);
</script>

<!-- Only show empty cart modal for new plans -->
{#if !practicePlan && showEmptyCartModal}
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
  <h1 class="text-2xl font-bold mb-4">{practicePlan ? 'Edit Practice Plan' : 'Create Practice Plan'}</h1>

  <div class="mb-4">
    <label for="planName" class="block text-sm font-medium text-gray-700">Plan Name:</label>
    <input id="planName" bind:value={$planName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
    {#if $errors.planName}
      <p class="text-red-500 text-sm mt-1">{$errors.planName}</p>
    {/if}
  </div>

  <div class="mb-4">
    <label for="planDescription" class="block text-sm font-medium text-gray-700">Plan Description:</label>
    <textarea id="planDescription" bind:value={$planDescription} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="3"></textarea>
  </div>

  <div class="mb-4">
    <label for="phaseOfSeason" class="block text-sm font-medium text-gray-700">Phase of Season:</label>
    <select id="phaseOfSeason" bind:value={$phaseOfSeason} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
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
    <input id="estimatedNumberOfParticipants" type="number" min="1" bind:value={$estimatedNumberOfParticipants} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
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
  <div class="practice-plan-timeline">
    <!-- Regular timeline items -->
    <section class="timeline-items">
      <ul class="space-y-4">
        {#each $selectedItems as item, index (item.id)}
          <!-- Only start a new group container if this is the first item of a group -->
          {#if item.parallel_group_id && 
              (!$selectedItems[index - 1]?.parallel_group_id || 
               $selectedItems[index - 1]?.parallel_group_id !== item.parallel_group_id)}
            <!-- Parallel group container -->
            <div class="parallel-group-container">
              <!-- Get all items in this specific group -->
              {#each $selectedItems.filter(i => i.parallel_group_id === item.parallel_group_id) as groupItem, groupIndex (groupItem.id)}
                <li 
                  class="timeline-item parallel-group-member relative transition-all duration-200"
                  draggable="true"
                  on:dragstart={(e) => handleDragStart(e, $selectedItems.indexOf(groupItem))}
                  on:dragover={(e) => handleDragOver(e, $selectedItems.indexOf(groupItem))}
                  on:dragleave={handleDragLeave}
                  on:drop={(e) => handleDrop(e, $selectedItems.indexOf(groupItem))}
                >
                  <div class="bg-white p-4 rounded-lg shadow-sm border border-l-4 border-l-blue-500 transition-all duration-200 hover:shadow-md">
                    <div class="flex flex-col">
                      <!-- Top row: Name and drag handle -->
                      <div class="flex items-center mb-2 pb-2 border-b">
                        <div class="mr-2 cursor-grab">⋮⋮</div>
                        <span class="font-medium">{groupItem.name}</span>
                      </div>
                      <!-- Bottom row: Duration and actions -->
                      <div class="flex justify-between items-center">
                        <span class="text-gray-600">{groupItem.selected_duration || groupItem.duration} minutes</span>
                        <div class="flex flex-col items-end space-y-1">
                          <button 
                            class="text-blue-500 hover:text-blue-700 text-sm"
                            on:click={() => handleUngroup(groupItem.id)}
                          >
                            Ungroup
                          </button>
                          <button 
                            class="text-red-500 hover:text-red-700 text-sm"
                            on:click={() => removeItem($selectedItems.indexOf(groupItem))}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              {/each}
            </div>
          <!-- Only show non-grouped items if they're not part of a group -->
          {:else if !item.parallel_group_id}
            <li 
              class="timeline-item relative transition-all duration-200"
              draggable="true"
              on:dragstart={(e) => handleDragStart(e, index)}
              on:dragover={(e) => handleDragOver(e, index)}
              on:dragleave={handleDragLeave}
              on:drop={(e) => handleDrop(e, index)}
            >
              <!-- Regular item content -->
              <div class="bg-white p-4 rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md">
                <div class="flex justify-between items-center">
                  <div class="flex items-center">
                    <div class="mr-2 cursor-grab">⋮⋮</div>
                    <span>{item.name}</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span>{item.selected_duration || item.duration} minutes</span>
                    <button 
                      class="text-red-500 hover:text-red-700 text-sm"
                      on:click={() => removeItem(index)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
          {/if}
        {/each}
      </ul>
    </section>
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
      bind:value={$visibility}
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
        bind:checked={$isEditableByOthers}
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
    {$isSubmitting ? (practicePlan ? 'Updating Plan...' : 'Creating Plan...') : (practicePlan ? 'Update Plan' : 'Create Plan')}
  </button>
</div>

<style>
  .timeline-items {
    position: relative;
    padding-left: 1rem;
  }

  .timeline-item {
    position: relative;
    transition: all 0.2s ease;
  }

  .timeline-item.drag-over {
    transform: translateX(1rem);
  }

  /* Visual feedback for parallel groups */
  .parallel-group {
    position: relative;
    margin-left: 1rem;
    padding-left: 1rem;
  }

  .parallel-group::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: theme('colors.blue.500');
  }

  /* Visual feedback styles */
  .timeline-item .border-t-4 {
    border-top-style: dashed;
  }

  .timeline-item .border-b-4 {
    border-bottom-style: dashed;
  }

  .timeline-item.bg-blue-100 {
    background-color: rgba(59, 130, 246, 0.1);
  }

  .timeline-item {
    position: relative;
    transition: all 0.2s ease;
  }

  .timeline-item.scale-95 {
    transform: scale(0.95);
  }

  .timeline-item .border-l-4 {
    border-left-width: 4px;
    transition: border-left-width 0.2s ease;
  }

  .parallel-group-indicator {
    position: absolute;
    left: -1rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: theme('colors.blue.500');
    transition: all 0.2s ease;
  }

  .timeline-item:hover .parallel-group-indicator {
    width: 4px;
  }

  /* Add these new styles */
  .parallel-group-container {
    display: flex;
    gap: 1rem;
    padding: 0.5rem;
    background-color: rgba(59, 130, 246, 0.05);
    border-radius: 0.5rem;
    border-left: 4px solid theme('colors.blue.500');
  }

  .parallel-group-member {
    flex: 1;
    min-width: 0;
  }

  /* Update existing styles */
  .timeline-item {
    position: relative;
    transition: all 0.2s ease;
  }

  .timeline-item.drag-over {
    transform: translateX(1rem);
  }

  .timeline-item.drag-group-target {
    outline: 2px dashed theme('colors.blue.500');
    outline-offset: 4px;
    background-color: rgba(59, 130, 246, 0.1);
  }

  .timeline-item.drag-group-target::after {
    content: "Group drills";
    position: absolute;
    top: -1.5rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: theme('colors.blue.500');
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
  }

  .timeline-item.horizontal-drag {
    border: 2px dashed theme('colors.blue.500');
    position: relative;
  }

  .timeline-item.horizontal-drag::after {
    content: "Release to group";
    position: absolute;
    top: -2rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: theme('colors.blue.500');
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    white-space: nowrap;
  }
</style>