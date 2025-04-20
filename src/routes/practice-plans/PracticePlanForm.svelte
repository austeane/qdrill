<script>
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { toast } from '@zerodevx/svelte-toast';
  import { page } from '$app/stores';
  import { cart } from '$lib/stores/cartStore';
  import { undo, redo, canUndo, canRedo, initializeHistory } from '$lib/stores/historyStore';
  import { authClient } from '$lib/auth-client';
  
  // Import stores
  import { 
    planName,
    planDescription,
    phaseOfSeason,
    estimatedNumberOfParticipants,
    practiceGoals,
    visibility,
    isEditableByOthers,
    startTime,
    errors,
    isSubmitting,
    phaseOfSeasonOptions,
    initializeForm,
    submitPracticePlan,
    addPracticeGoal,
    removePracticeGoal,
    updatePracticeGoal,
    totalPlanDuration,
    formatTime
  } from '$lib/stores/practicePlanStore';
  
  import {
    sections,
    selectedItems,
    selectedSectionId,
    addSection,
    initializeSections,
    formatDrillItem,
    initializeTimelinesFromPlan
  } from '$lib/stores/sectionsStore';
  
  // Import component modules
  import EmptyCartModal from '../../components/practice-plan/modals/EmptyCartModal.svelte';
  import DrillSearchModal from '../../components/practice-plan/modals/DrillSearchModal.svelte';
  import TimelineSelectorModal from '../../components/practice-plan/modals/TimelineSelectorModal.svelte';
  import SectionContainer from '../../components/practice-plan/sections/SectionContainer.svelte';
  
  // Import TinyMCE editor
  let Editor;

  // Add proper prop definitions with defaults
  export let practicePlan = null;

  // UI state
  let showEmptyCartModal = false;
  let showDrillSearch = false;
  let showTimelineSelector = false;
  let selectedSectionForDrill = null;

  // Initialize the form when practice plan is provided
  $: {
    if (practicePlan) {
      initializeForm(practicePlan);
      initializeSections(practicePlan);
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
  
  // Handle form submission
  async function handleSubmit() {
    // Check if logged in before potentially saving state
    if (!$page.data.session && $visibility !== 'public') {
      const confirmed = confirm(
        `Log in to create a ${$visibility} practice plan.\n\n` +
        'Click OK to log in with Google\n' +
        'Click Cancel to create as public instead'
      );

      if (confirmed) {
        // Store form data in sessionStorage
        const formData = {
          name: $planName,
          description: $planDescription,
          practice_goals: $practiceGoals,
          phase_of_season: $phaseOfSeason,
          estimated_number_of_participants: $estimatedNumberOfParticipants,
          is_editable_by_others: $isEditableByOthers,
          visibility: $visibility,
          sections: $sections, // Include sections and items
          start_time: $startTime
        };
        console.log('Storing pending practice plan data:', formData);
        sessionStorage.setItem('pendingPracticePlanData', JSON.stringify(formData));
        await authClient.signIn.social({ provider: 'google' });
        return;
      } else {
        visibility.set('public');
        isEditableByOthers.set(true); // Ensure editable if becoming public
      }
    }

    // If not logged in after the check, ensure settings are correct
    if (!$page.data.session) {
      visibility.set('public');
      isEditableByOthers.set(true);
    }

    // Call the existing submit function (now assuming logged in or public/editable)
    const resultPlanId = await submitPracticePlan($sections, practicePlan);
    
    if (resultPlanId) {
      // After successful submission for non-logged in users
      if (!$page.data.session) {
        const confirmedAssociate = confirm(
          'Would you like to log in so that you can own this practice plan?\n\n' +
          'Click OK to log in with Google\n' +
          'Click Cancel to continue without logging in'
        );

        if (confirmedAssociate) {
          console.log('Setting practicePlanToAssociate:', resultPlanId);
          sessionStorage.setItem('practicePlanToAssociate', resultPlanId);
          await authClient.signIn.social({ provider: 'google' });
          return; // Stop further execution, redirecting to login
        }
      }

      // If not associating or already logged in, clear cart and navigate
      if (!practicePlan) { // Only clear cart on create
        cart.clear();
      }
      goto(`/practice-plans/${resultPlanId}`);
    }
  }
  
  // Component initialization
  onMount(async () => {
    initializeHistory();
    
    // Restore pending data if it exists
    const pendingData = sessionStorage.getItem('pendingPracticePlanData');
    if (pendingData) {
      try {
        const data = JSON.parse(pendingData);
        console.log('Restoring pending practice plan data:', data);
        
        // Restore simple fields
        planName.set(data.name);
        planDescription.set(data.description);
        practiceGoals.set(data.practice_goals);
        phaseOfSeason.set(data.phase_of_season);
        estimatedNumberOfParticipants.set(data.estimated_number_of_participants);
        isEditableByOthers.set(data.is_editable_by_others);
        visibility.set(data.visibility);
        startTime.set(data.start_time);
        
        // Restore sections and items (might need careful handling)
        if (data.sections) {
          // Assuming initializeSections can handle this structure
          initializeSections({ sections: data.sections }); 
          // OR manually update the sections store:
          // sections.set(data.sections);
        }

        // Re-initialize history after restoring state
        initializeHistory();

        // Clear the stored data
        sessionStorage.removeItem('pendingPracticePlanData');
        await tick(); // Wait for updates
        console.log('Pending practice plan data restored and removed.');

      } catch (e) {
        console.error('Error restoring pending practice plan data:', e);
        sessionStorage.removeItem('pendingPracticePlanData'); // Clear corrupted data
      }
    } else {
      // Original onMount logic if no pending data
      if ($cart.length === 0 && !practicePlan) {
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
          
          // Add cart items to sections
          if (cartItems.length > 0 && $sections.length > 0) {
            sections.update(currentSections => {
              const newSections = [...currentSections];
              
              // Add all drills to the "Skill Building" section (index 1)
              const skillBuildingIndex = 1;
              
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
              
              return newSections;
            });
          }
          
          selectedItems.set(cartItems);
      } else {
        // If editing an existing plan, initialize timelines
        initializeTimelinesFromPlan(practicePlan);
      }
    }

    // Add keyboard shortcuts
    function handleKeydown(e) {
      // Check if the active element is an input field or textarea
      const isEditing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      
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
    };

  });
</script>

<div class="container mx-auto p-4">
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
    <input id="planName" bind:value={$planName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
    {#if $errors.planName}
      <p class="text-red-500 text-sm mt-1">{$errors.planName}</p>
    {/if}
  </div>

  <div class="mb-4">
    <label for="planDescription" class="block text-sm font-medium text-gray-700">Plan Description:</label>
    {#if Editor}
      <div class="min-h-[300px]">
        <svelte:component 
          this={Editor}
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
    <label for="startTime" class="block text-sm font-medium text-gray-700">Practice Start Time:</label>
    <input 
      id="startTime" 
      type="time" 
      bind:value={$startTime}
      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
    />
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

  <!-- Practice Plan Sections -->
  <div class="practice-plan-sections mb-6">
    {#each $sections as section, sectionIndex}
      <SectionContainer 
        {section} 
        {sectionIndex}
        on:openDrillSearch={handleOpenDrillSearch}
        on:openTimelineSelector={handleOpenTimelineSelector}
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

  {#if $errors.selectedItems}
    <p class="text-red-500 text-sm mb-2">{$errors.selectedItems}</p>
  {/if}

  {#if $errors.general}
    <p class="text-red-500 text-sm mb-2">{$errors.general}</p>
  {/if}

  <!-- Visibility settings -->
  <div class="mb-6">
    <label class="block text-gray-700 font-medium mb-1">Visibility</label>
    <select
      bind:value={$visibility}
      class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring"
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
    on:click={handleSubmit} 
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
    disabled={$isSubmitting}
  >
    {$isSubmitting ? (practicePlan ? 'Updating Plan...' : 'Creating Plan...') : (practicePlan ? 'Update Plan' : 'Create Plan')}
  </button>
</div>

<!-- Modals -->
<EmptyCartModal bind:show={showEmptyCartModal} />
<DrillSearchModal 
  bind:show={showDrillSearch} 
  bind:selectedSectionId={selectedSectionForDrill} 
/>
<TimelineSelectorModal bind:show={showTimelineSelector} />