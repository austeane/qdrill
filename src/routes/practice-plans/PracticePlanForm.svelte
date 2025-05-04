<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { toast } from '@zerodevx/svelte-toast';
  import { page } from '$app/stores';
  import { enhance } from '$app/forms'; // Import enhance
  import { cart } from '$lib/stores/cartStore';
  import { undo, redo, canUndo, canRedo, initializeHistory } from '$lib/stores/historyStore';
  import { authClient } from '$lib/auth-client';
  
  // Import NEW stores and utils
  import { 
    planName,
    planDescription,
    phaseOfSeason,
    estimatedNumberOfParticipants,
    practiceGoals,
    visibility,
    isEditableByOthers,
    startTime,
    errors as metadataErrors, // Rename to avoid conflict with form errors
    initializeForm, // Keep initializeForm for setting initial state
    resetForm, // Add resetForm if needed (e.g., on successful create)
    addPracticeGoal,
    removePracticeGoal,
    updatePracticeGoal
  } from '$lib/stores/practicePlanMetadataStore';
  import { formatTime } from '$lib/utils/timeUtils';
  
  import {
    sections,
    selectedItems,
    selectedSectionId,
    addSection,
    initializeSections,
    totalPlanDuration, // Moved here
    formatDrillItem,
    initializeTimelinesFromPlan,
    removeSection,
    removeItem,
    handleDurationChange,
    handleUngroup,
    getTimelineName,
    customTimelineNames,
    // handleDrillMove // Dnd logic likely uses this, ensure it's available if needed
  } from '$lib/stores/sectionsStore';
  
  // Import component modules
  import DrillSearchModal from '../../components/practice-plan/modals/DrillSearchModal.svelte';
  import TimelineSelectorModal from '../../components/practice-plan/modals/TimelineSelectorModal.svelte';
  import SectionContainer from '../../components/practice-plan/sections/SectionContainer.svelte';
  
  // Import TinyMCE editor
  let Editor;

  // Add proper prop definitions with defaults
  export let practicePlan = null;
  export let pendingPlanData = null; // New prop for data loaded server-side

  // UI state
  let showDrillSearch = false;
  let showTimelineSelector = false;
  let selectedSectionForDrill = null;
  let submitting = false; // State for progressive enhancement

  // Initialize the form when practice plan or pending data is provided
  // NOTE: Pending plan data logic might need re-evaluation after store refactor.
  // The `load` function in `create/+page.server.js` was removed.
  // For now, focus on initializing from `practicePlan` prop (for edit).
  $: {
    // Only initialize from practicePlan prop (edit mode)
    if (practicePlan) {
      console.log('[PracticePlanForm] Initializing with EXISTING plan data:', practicePlan);
      initializeForm(practicePlan);
      initializeSections(practicePlan);
       initializeHistory(); // Initialize history for existing plan too
    } else {
      // If creating a new plan (practicePlan is null), ensure form is reset
      // This might happen if navigating back/forth
      // resetForm(); // Consider if a full reset is needed or if stores default correctly
    }
  }
  
  // Update visibility based on user session
  $: {
    if (!$page.data.session) {
      visibility.set('public');
      isEditableByOthers.set(true);
    }
  }
  
  // Handle modal controls
  function handleOpenDrillSearch(event) {
    selectedSectionForDrill = event.detail;
    showDrillSearch = true;
  }
  
  function handleOpenTimelineSelector() {
    showTimelineSelector = true;
  }
  
  // Component initialization
  onMount(async () => {
    // Initialize history store regardless of data source
    // Note: If pendingPlanData exists, it will re-initialize history above in the reactive block.
    // If only practicePlan exists, it also initializes above.
    // If neither exists (fresh create), initialize here.
    if (!practicePlan) {
        initializeHistory();
    }

    // Removed pendingPlanData logic
    if (!practicePlan) {
      if ($cart.length > 0) {
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
          
          // Add cart items to sections
          if (cartItems.length > 0 && $sections.length > 0) {
            sections.update(currentSections => {
              const newSections = [...currentSections];
              
              // Add all drills to the "Skill Building" section (index 1) if it exists
              const skillBuildingIndex = newSections.findIndex(s => s.name === 'Skill Building') ?? 1; // Default to 1 if not found
              
              if (newSections[skillBuildingIndex]) {
                // Add all drills to the Skill Building section
                cartItems.forEach(item => {
                  newSections[skillBuildingIndex].items.push({
                    id: item.id,
                    type: 'drill',
                    name: item.name,
                    drill: item.drill,
                    duration: 15,
                    selected_duration: 15
                  });
                });
              } else {
                // Fallback: Add to the first section if Skill Building doesn't exist
                 cartItems.forEach(item => {
                  newSections[0].items.push({
                    id: item.id,
                    type: 'drill',
                    name: item.name,
                    drill: item.drill,
                    duration: 15,
                    selected_duration: 15
                  });
                });
              }
              
              return newSections;
            });
          }
          
          selectedItems.set(cartItems);
      }
    } else if (practicePlan) { 
        // If editing an existing plan (and not restoring pending), initialize timelines
        initializeTimelinesFromPlan(practicePlan);
    }

    // Add keyboard shortcuts
    function handleKeydown(e) {
      // Check if the active element is an input field or textarea
      const activeElement = document.activeElement;
      const isEditing = activeElement && 
                        (activeElement.tagName === 'INPUT' || 
                         activeElement.tagName === 'TEXTAREA' || 
                         activeElement.tagName === 'SELECT' ||
                         activeElement.closest('.tox-tinymce')); // Check if inside TinyMCE
      
      // Only process shortcuts if we're not in an input field
      if (!isEditing) {
        // Undo: Ctrl/Cmd + Z
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          if ($canUndo) undo();
        }
        
        // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
        if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) || 
            ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
          e.preventDefault();
          if ($canRedo) redo();
        }
      }
    }
    
    // Add event listener for keyboard shortcuts
    window.addEventListener('keydown', handleKeydown);
    
    // Load TinyMCE Editor
    try {
      console.log('[DEBUG] Loading TinyMCE editor...');
      const module = await import('@tinymce/tinymce-svelte');
      Editor = module.default;
      console.log('[DEBUG] TinyMCE editor loaded successfully');
    } catch (error) {
      console.log('[DEBUG] Error loading TinyMCE', error);
    }
    // Clean up event listener on component destruction
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      // Consider resetting form state if navigating away?
      // resetForm(); 
    };

  });

  function onRemoveSection(sectionId) {
    removeSection(sectionId);
  }

  function onRemoveItem(sectionIndex, itemIndex) {
    removeItem(sectionIndex, itemIndex);
  }

  function onDurationChange(sectionIndex, itemIndex, newDuration) {
    handleDurationChange(sectionIndex, itemIndex, newDuration);
  }

  function onUngroup(groupId) {
    handleUngroup(groupId);
  }
</script>

<!-- Wrap form in <form> tag and apply enhance -->
<form method="POST" use:enhance={() => {
  submitting = true;
  return async ({ update }) => {
    // Reset submitting state after form submission completes
    submitting = false;
    await update();
    // Optional: Clear cart only on successful *create* action
    // Check $page.form?.success and if !practicePlan (create mode)
    if (!practicePlan && $page.form?.success) {
      cart.clear();
    }
    // Redirect is handled by server action
  };
}} class="container mx-auto p-4">
  
  <!-- Add hidden input to send sections data -->
  <input type="hidden" name="sections" value={JSON.stringify($sections)} />

  <h1 class="text-2xl font-bold mb-4">{practicePlan ? 'Edit Practice Plan' : 'Create Practice Plan'}</h1>

  <!-- Duration Summary -->
  <div class="bg-blue-50 p-4 mb-6 rounded-lg shadow-sm">
          <div class="flex justify-between items-center">
            <div>
        <h2 class="font-semibold text-blue-800">Practice Duration</h2>
        <p class="text-blue-600">
          Start: {formatTime($startTime)} • Total: {$totalPlanDuration} minutes
        </p>
        <p class="text-xs text-blue-500 mt-1">
          Keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Shift+Z (Redo)
        </p>
                  </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center space-x-2">
          <button
            class="p-2 rounded bg-white text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            on:click={undo}
            disabled={!$canUndo}
            title="Undo"
            aria-label="Undo"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <button
            class="p-2 rounded bg-white text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            on:click={redo}
            disabled={!$canRedo}
            title="Redo"
            aria-label="Redo"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
            </svg>
          </button>
        </div>
        <div class="text-3xl font-bold text-blue-700">{$totalPlanDuration}m</div>
      </div>
    </div>
  </div>

  <!-- Basic form fields -->
  <div class="mb-4">
    <label for="planName" class="block text-sm font-medium text-gray-700">Plan Name:</label>
    <input id="planName" name="planName" bind:value={$planName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
    <!-- Use $page.form for server-side errors -->
    {#if $page.form?.errors?.name}
      <p class="text-red-500 text-sm mt-1">{$page.form.errors.name[0]}</p>
    {:else if $metadataErrors.name?.[0]} <!-- Fallback to client-side store errors -->
       <p class="text-red-500 text-sm mt-1">{$metadataErrors.name[0]}</p>
    {/if}
  </div>

  <div class="mb-4">
    <label for="planDescription" class="block text-sm font-medium text-gray-700">Plan Description:</label>
    {#if Editor}
      <div class="min-h-[300px]">
        <svelte:component 
          this={Editor}
          name="planDescription" 
          apiKey={import.meta.env.VITE_TINY_API_KEY}
          bind:value={$planDescription}
          init={{
            height: 300,
            menubar: false,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'charmap',
              'anchor', 'searchreplace', 'visualblocks', 'code',
              'insertdatetime', 'table', 'code', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | ' +
                    'bold italic | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | help',
            content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "San Francisco", Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }',
            branding: false
          }}
        />
      </div>
    {:else}
      <textarea 
        id="planDescription" 
        bind:value={$planDescription} 
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
        rows="3"
      ></textarea>
    {/if}
    <!-- Add error display for description if needed by schema -->
    {#if $page.form?.errors?.description}
        <p class="text-red-500 text-sm mt-1">{$page.form.errors.description[0]}</p>
    {:else if $metadataErrors.description?.[0]}
        <p class="text-red-500 text-sm mt-1">{$metadataErrors.description[0]}</p>
    {/if}
  </div>

  <div class="mb-4">
    <label for="phaseOfSeason" class="block text-sm font-medium text-gray-700">Phase of Season:</label>
    <select id="phaseOfSeason" name="phaseOfSeason" bind:value={$phaseOfSeason} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
      <option value="">Select Phase</option>
      {#each phaseOfSeasonOptions as option}
        <option value={option}>{option}</option>
      {/each}
    </select>
    {#if $page.form?.errors?.phase_of_season}
      <p class="text-red-500 text-sm mt-1">{$page.form.errors.phase_of_season[0]}</p>
    {:else if $metadataErrors.phase_of_season?.[0]}
       <p class="text-red-500 text-sm mt-1">{$metadataErrors.phase_of_season[0]}</p>
    {/if}
  </div>

  <div class="mb-4">
    <label for="estimatedNumberOfParticipants" class="block text-sm font-medium text-gray-700">Estimated Number of Participants:</label>
    <input id="estimatedNumberOfParticipants" name="estimatedNumberOfParticipants" type="number" min="1" bind:value={$estimatedNumberOfParticipants} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
    {#if $page.form?.errors?.estimated_number_of_participants}
      <p class="text-red-500 text-sm mt-1">{$page.form.errors.estimated_number_of_participants[0]}</p>
    {:else if $metadataErrors.estimated_number_of_participants?.[0]}
       <p class="text-red-500 text-sm mt-1">{$metadataErrors.estimated_number_of_participants[0]}</p>
    {/if}
  </div>

  <div class="mb-4">
    <label for="startTime" class="block text-sm font-medium text-gray-700">Practice Start Time:</label>
    <input 
      id="startTime" 
      name="startTime"
      type="time" 
      bind:value={$startTime}
      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
    />
     <!-- Add error display for start_time if needed by schema -->
    {#if $page.form?.errors?.start_time}
        <p class="text-red-500 text-sm mt-1">{$page.form.errors.start_time[0]}</p>
    {:else if $metadataErrors.start_time?.[0]}
        <p class="text-red-500 text-sm mt-1">{$metadataErrors.start_time[0]}</p>
    {/if}
  </div>

  <div class="mb-4">
    <label id="practice-goals-label" class="block text-sm font-medium text-gray-700">Practice Goals:</label>
    <div role="list" aria-labelledby="practice-goals-label">
      {#each $practiceGoals as goal, index}
        <div class="flex items-center space-x-2 mt-1">
          <input
            type="text"
            name="practiceGoals[]"
            bind:value={$practiceGoals[index]}
            on:input={(e) => updatePracticeGoal(index, e.target.value)}
            placeholder="Enter practice goal"
            class="flex-1 mr-2 border-gray-300 rounded-md shadow-sm"
          />
          {#if $practiceGoals.length > 1}
            <button type="button" on:click={() => removePracticeGoal(index)} class="text-red-600 hover:text-red-800 transition-colors">Remove</button>
          {/if}
        </div>
      {/each}
    </div>
    <button type="button" on:click={addPracticeGoal} class="mt-2 text-blue-600 hover:text-blue-800 transition-colors">+ Add Practice Goal</button>
    {#if $page.form?.errors?.practice_goals}
      <p class="text-red-500 text-sm mt-1">{$page.form.errors.practice_goals[0]}</p>
    {:else if $metadataErrors.practice_goals?.[0]}
       <p class="text-red-500 text-sm mt-1">{$metadataErrors.practice_goals[0]}</p>
    {/if}
  </div>

  <!-- Practice Plan Sections -->
  <div class="practice-plan-sections mb-6">
    {#each $sections as section, sectionIndex}
      <SectionContainer 
        {section} 
        {sectionIndex}
        on:openDrillSearch={handleOpenDrillSearch}
        on:openTimelineSelector={handleOpenTimelineSelector}
        {onRemoveSection}
        {onRemoveItem}
        {onDurationChange}
        {onUngroup}
        timelineNameGetter={getTimelineName}
        customTimelineNamesData={$customTimelineNames}
      />
    {/each}

    <div class="flex gap-2">
      <button
        class="flex-1 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
        on:click={addSection}
      >
        + Add Section
      </button>
      <button
        class="flex-1 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
        on:click={() => {
          if ($sections.length === 0) {
            toast.push('Please add a section first');
            return;
          }
          selectedSectionForDrill = $sections[0].id;
          showDrillSearch = true;
        }}
      >
        + Add Drill
      </button>
    </div>
  </div>

  <!-- Visibility settings -->
  <div class="mb-6">
    <label for="visibility-select" class="block text-gray-700 font-medium mb-1">Visibility</label>
    <select
      id="visibility-select"
      bind:value={$visibility}
      class="p-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      disabled={!$page.data.session}
      title={!$page.data.session ? 'Log in to create private or unlisted practice plans' : ''}
    >
      <option value="public">Public - Visible to everyone</option>
      {#if $page.data.session}
        <option value="unlisted">Unlisted - Only accessible via direct link</option>
        <option value="private">Private - Only visible to you</option>
      {/if}
    </select>
    {#if !$page.data.session}
      <p class="text-sm text-gray-500 mt-1">Anonymous submissions are always public</p>
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

  <!-- Submit button -->
  <button 
    type="submit"
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
    disabled={submitting}
  >
    {submitting ? (practicePlan ? 'Updating Plan...' : 'Creating Plan...') : (practicePlan ? 'Update Plan' : 'Create Plan')}
  </button>
</form>

<!-- Modals -->
<DrillSearchModal 
  bind:show={showDrillSearch} 
  bind:selectedSectionId={selectedSectionForDrill} 
/>
<TimelineSelectorModal bind:show={showTimelineSelector} />

<!-- Display general form errors from server action -->
{#if $page.form?.errors?.general}
  <p class="text-red-500 text-sm mb-4 bg-red-100 p-2 rounded">{$page.form.errors.general}</p>
{/if}