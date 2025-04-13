<script>
    import FilterPanel from '$components/FilterPanel.svelte';
    import { onDestroy, onMount } from 'svelte';
    import { tick } from 'svelte';
    import { cart } from '$lib/stores/cartStore';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import debounce from 'lodash/debounce';
    import { selectedSortOption, selectedSortOrder } from '$lib/stores/sortStore';
    import UpvoteDownvote from '$components/UpvoteDownvote.svelte';
    import { FILTER_STATES } from '$lib/constants';
    import {
        selectedPhaseOfSeason,
        selectedPracticeGoals,
        selectedEstimatedParticipantsMin,
        selectedEstimatedParticipantsMax
    } from '$lib/stores/practicePlanStore';
    import DeletePracticePlan from '$components/DeletePracticePlan.svelte';

    export let data;

    // Practice Plans data from load with safety check
    let practicePlans = Array.isArray(data.practicePlans) ? data.practicePlans : [];

    // Available filter options from load
    const {
        phaseOfSeason,
        estimatedParticipants,
        practiceGoals
    } = data.filterOptions || {};

    // Search Query
    let searchQuery = '';

    // Selected drills for 'Contains drill' filter
    // Initialize directly from server-provided data
    let selectedDrills = data.initialSelectedDrills || [];

    function handleDrillSelect(drill) {
        if (!selectedDrills.find(d => d.id === drill.id)) {
            selectedDrills = [...selectedDrills, drill];
            updateUrlWithSelectedDrills();
        }
    }

    function handleDrillRemove(drillId) {
        selectedDrills = selectedDrills.filter(d => d.id !== drillId);
        updateUrlWithSelectedDrills();
    }

    // Debounced version of URL update to avoid rapid history changes
    const debouncedUpdateUrl = debounce(updateUrlWithSelectedDrills, 300);

    function updateUrlWithSelectedDrills() {
        const url = new URL(window.location);
        url.searchParams.delete('drillId');
        selectedDrills.forEach(drill => {
            url.searchParams.append('drillId', drill.id);
        });
        // Use replaceState to avoid adding multiple history entries during selection
        history.replaceState({}, '', url);
        // No reload needed, reactive filtering handles the update
    }

    // Helper functions for normalization
    function normalizeString(str) {
        return str?.toLowerCase().trim() || '';
    }

    function normalizeArray(arr) {
        return arr?.map(item => normalizeString(item)) || [];
    }

    // Add these helper functions before the filteredPlans reactive statement
    function filterByThreeState(planValue, filterState, allPossibleValues) {
        if (!filterState || Object.keys(filterState).length === 0) return true;

        const requiredValues = [];
        const excludedValues = [];

        for (const [value, state] of Object.entries(filterState)) {
            if (state === FILTER_STATES.REQUIRED) {
                requiredValues.push(value);
            } else if (state === FILTER_STATES.EXCLUDED) {
                excludedValues.push(value);
            }
        }

        // 1. First check if all values are excluded
        const totalPossibleValues = allPossibleValues || [];
        const excludedAll = totalPossibleValues.length > 0 && 
                           excludedValues.length === totalPossibleValues.length;
        if (excludedAll) {
            return false;
        }

        // 2. If the item has no value, and there are required values, exclude it
        if (!planValue && requiredValues.length > 0) {
            return false;
        }

        // 3. If there are required values, item must match one
        if (requiredValues.length > 0) {
            return requiredValues.includes(planValue);
        }

        // 4. If the item has a value and it's in excluded values, exclude it
        if (planValue && excludedValues.includes(planValue)) {
            return false;
        }

        return true;
    }

    // Helper function for array-based filters
    function filterByThreeStateArray(planValues, filterState, allPossibleValues) {
        if (!filterState || Object.keys(filterState).length === 0) return true;

        const requiredValues = [];
        const excludedValues = [];

        for (const [value, state] of Object.entries(filterState)) {
            if (state === FILTER_STATES.REQUIRED) {
                requiredValues.push(value);
            } else if (state === FILTER_STATES.EXCLUDED) {
                excludedValues.push(value);
            }
        }

        // Ensure planValues is an array
        const valuesArray = Array.isArray(planValues) ? planValues : [];

        // 1. First check if all values are excluded
        const totalPossibleValues = allPossibleValues || [];
        const excludedAll = totalPossibleValues.length > 0 && 
                           excludedValues.length === totalPossibleValues.length;
        if (excludedAll) {
            return false;
        }

        // 2. If the item has no values and there are required values, exclude it
        if ((!valuesArray || valuesArray.length === 0) && requiredValues.length > 0) {
            return false;
        }

        // 3. If there are required values, item must have all of them
        if (requiredValues.length > 0) {
            return requiredValues.every(value => valuesArray.includes(value));
        }

        // 4. If any of the item's values are in excluded values, exclude it
        if (valuesArray.some(value => excludedValues.includes(value))) {
            return false;
        }

        return true;
    }

    // Filtering logic with additional safety check
    $: filteredPlans = (Array.isArray(practicePlans) ? practicePlans : []).filter(plan => {
        let matches = true;

        // Search filtering
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            const nameMatch = plan.name?.toLowerCase().includes(query) || false;
            const descriptionMatch = plan.description?.toLowerCase().includes(query) || false;
            matches = matches && (nameMatch || descriptionMatch);
        }

        // Phase of Season filtering
        matches = matches && filterByThreeState(
            plan.phase_of_season,
            $selectedPhaseOfSeason,
            data.filterOptions.phaseOfSeason
        );

        // Practice Goals filtering (using array-based filter)
        matches = matches && filterByThreeStateArray(
            plan.practice_goals,
            $selectedPracticeGoals,
            data.filterOptions.practiceGoals
        );

        // Estimated Participants
        if ($selectedEstimatedParticipantsMin !== null || $selectedEstimatedParticipantsMax !== null) {
            const participants = plan.estimated_number_of_participants;
            if ($selectedEstimatedParticipantsMin !== null) {
                matches = matches && participants >= $selectedEstimatedParticipantsMin;
            }
            if ($selectedEstimatedParticipantsMax !== null) {
                matches = matches && participants <= $selectedEstimatedParticipantsMax;
            }
        }

        // Contains Drills
        if (selectedDrills.length > 0) {
            const planDrillIds = plan.drills || [];
            const selectedDrillIds = selectedDrills.map(d => d.id);
            matches = matches && selectedDrillIds.every(id => planDrillIds.includes(id));
        }

        return matches;
    });

    let showEmptyCartModal = false;

    function handleCreatePlanClick() {
        if ($cart.length === 0) {
            showEmptyCartModal = true;
        } else {
            goto('/practice-plans/create');
        }
    }

    function closeModal() {
        showEmptyCartModal = false;
    }

    function goToDrills() {
        showEmptyCartModal = false;
        goto('/drills');
    }

    // Define sort options for practice plans
    const sortOptions = [
      { value: 'name', label: 'Name' },
      { value: 'created_at', label: 'Date Created' },
      { value: 'estimated_number_of_participants', label: 'Estimated Participants' }
    ];

    // Reactive sorting
    $: sortedPlans = [...filteredPlans].sort((a, b) => {
      if (!$selectedSortOption) return 0;
      
      let aValue = a[$selectedSortOption];
      let bValue = b[$selectedSortOption];
      
      // Handle potential null/undefined values during sorting
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return $selectedSortOrder === 'asc' ? -1 : 1; // Sort nulls first or last based on order
      if (bValue == null) return $selectedSortOrder === 'asc' ? 1 : -1;

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (aValue < bValue) return $selectedSortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return $selectedSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Update practicePlans when data prop changes (e.g., after navigation)
    $: if (data.practicePlans) {
        practicePlans = Array.isArray(data.practicePlans) ? data.practicePlans : [];
    }
    // Update selectedDrills when data prop changes (e.g., after navigation)
    $: if (data.initialSelectedDrills) {
        selectedDrills = data.initialSelectedDrills || [];
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

<div class="max-w-7xl mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">Practice Plans</h1>

    <!-- Button to create a new practice plan -->
    <button
        on:click={handleCreatePlanClick}
        class="inline-block mb-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
    >
        Create a New Practice Plan
    </button>

    <!-- Filter Panel -->
    <FilterPanel
        filterType="practice-plans"
        phaseOfSeasonOptions={phaseOfSeason}
        practiceGoalsOptions={practiceGoals}
        bind:selectedDrills={selectedDrills}
        onDrillSelect={handleDrillSelect}
        onDrillRemove={handleDrillRemove}
        {sortOptions}
        onFilterChange={debouncedUpdateUrl}
    />

    <!-- Search input -->
    <input
        type="text"
        placeholder="Search practice plans..."
        class="mb-6 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        bind:value={searchQuery}
    />

    <!-- Practice Plans Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each sortedPlans as plan (plan.id)}
            <div class="border border-gray-200 p-6 bg-white rounded-lg shadow-md transition-transform transform hover:-translate-y-1 cursor-pointer">
                <!-- Header section with title and voting -->
                <div class="relative flex justify-between items-start mb-4">
                    <div class="flex-1 pr-12">
                        <h2 class="text-xl font-bold">
                            <a href="/practice-plans/{plan.id}" class="text-blue-600 hover:text-blue-800">
                                {plan.name}
                            </a>
                        </h2>
                    </div>
                    <div class="absolute right-0 top-0">
                        <UpvoteDownvote practicePlanId={plan.id} />
                    </div>
                </div>

                <!-- Rest of the card content -->
                {#if plan.phase_of_season}
                    <p class="text-sm text-gray-500 mb-1">
                        <strong>Phase of Season:</strong> {plan.phase_of_season}
                    </p>
                {/if}
                {#if plan.estimated_number_of_participants}
                    <p class="text-sm text-gray-500 mb-1">
                        <strong>Estimated Participants:</strong> {plan.estimated_number_of_participants}
                    </p>
                {/if}
                {#if plan.practice_goals}
                    <p class="text-sm text-gray-500 mb-1">
                        <strong>Practice Goals:</strong> {plan.practice_goals}
                    </p>
                {/if}
                
                <div class="flex justify-between items-center mt-4">
                    <a 
                        href="/practice-plans/{plan.id}" 
                        class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
                    >
                        View Practice Plan
                    </a>
                    <DeletePracticePlan 
                        planId={plan.id} 
                        createdBy={plan.created_by}
                        onDelete={() => {
                            practicePlans = practicePlans.filter(p => p.id !== plan.id);
                        }}
                    />
                </div>
            </div>
        {/each}
    </div>
</div>
