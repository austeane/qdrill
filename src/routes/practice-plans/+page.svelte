<script>
    import FilterPanel from '$lib/components/FilterPanel.svelte';
    import { onDestroy, onMount, afterUpdate } from 'svelte';
    import { tick } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import debounce from 'lodash/debounce';
    import { selectedSortOption, selectedSortOrder } from '$lib/stores/sortStore';
    import UpvoteDownvote from '$lib/components/UpvoteDownvote.svelte';
    import { FILTER_STATES } from '$lib/constants';
    import {
        selectedPhaseOfSeason,
        selectedPracticeGoals,
        selectedEstimatedParticipantsMin,
        selectedEstimatedParticipantsMax
    } from '$lib/stores/practicePlanFilterStore';
    import DeletePracticePlan from '$lib/components/DeletePracticePlan.svelte';
    import Pagination from '$lib/components/Pagination.svelte';
    import { cart } from '$lib/stores/cartStore';
    import AiPlanGeneratorModal from '$lib/components/practice-plan/AiPlanGeneratorModal.svelte';

    export let data;

    // Data from load function (now contains paginated items and metadata)
    $: practicePlans = data.practicePlans || [];
    $: pagination = data.pagination;
    $: filterOptions = data.filterOptions || {};
    $: initialSelectedDrills = data.initialSelectedDrills || [];
    $: error = data.error; // Handle potential loading errors

    // --- Component State reflecting URL/Load Data --- 
    let searchQuery = data.currentSearch || ''; // Initialize from load data
    let selectedDrills = initialSelectedDrills; // Initialize from load data
    let currentSortBy = data.currentSortBy || 'created_at';
    let currentSortOrder = data.currentSortOrder || 'desc';

    let showAiModal = false;     // NEW modal state

    // --- Initialize filter stores based on URL on mount/update --- 
    function initializeFiltersFromUrl() {
        const searchParams = $page.url.searchParams;

        // Helper to parse filter params (req/exc)
        const parseFilterParam = (baseName) => {
            const state = {};
            searchParams.getAll(`${baseName}_req`).forEach(val => { state[val] = FILTER_STATES.REQUIRED; });
            searchParams.getAll(`${baseName}_exc`).forEach(val => { state[val] = FILTER_STATES.EXCLUDED; });
            return state;
        };

        selectedPhaseOfSeason.set(parseFilterParam('phase'));
        selectedPracticeGoals.set(parseFilterParam('goal'));

        selectedEstimatedParticipantsMin.set(parseInt(searchParams.get('minP') || filterOptions.estimatedParticipants?.min || '1', 10));
        selectedEstimatedParticipantsMax.set(parseInt(searchParams.get('maxP') || filterOptions.estimatedParticipants?.max || '100', 10));
        
        // Update local sort state if different from URL
        const urlSortBy = searchParams.get('sortBy') || 'created_at';
        const urlSortOrder = searchParams.get('sortOrder') || 'desc';
        if (urlSortBy !== currentSortBy) {
             currentSortBy = urlSortBy;
             selectedSortOption.set(urlSortBy);
        }
        if (urlSortOrder !== currentSortOrder) {
            currentSortOrder = urlSortOrder;
            selectedSortOrder.set(urlSortOrder);
        }
    }

    onMount(() => {
        initializeFiltersFromUrl();
    });

    // Re-initialize filters if URL changes (e.g., back/forward buttons)
    afterUpdate(() => {
         if ($page.url.searchParams.toString() !== previousSearchParams) {
            initializeFiltersFromUrl();
            searchQuery = $page.url.searchParams.get('search') || '';
            selectedDrills = initialSelectedDrills; // Re-sync selectedDrills if needed, handled by load
            previousSearchParams = $page.url.searchParams.toString();
        }
    });
    let previousSearchParams = ''; // Track search params for afterUpdate
    onMount(() => { 
        previousSearchParams = $page.url.searchParams.toString(); 
        
        // Subscribe to sort changes after mount
        let initialMount = true;
        const unsubscribeSortOption = selectedSortOption.subscribe(value => {
            if (!initialMount) {
                 currentSortBy = value;
                 updateUrlParams();
            }
        });
        const unsubscribeSortOrder = selectedSortOrder.subscribe(value => {
             if (!initialMount) {
                 currentSortOrder = value;
                 updateUrlParams();
             }
        });
        
        // Set initialMount to false after initial setup
        tick().then(() => { initialMount = false; });

        // Unsubscribe on component destroy
        return () => {
            unsubscribeSortOption();
            unsubscribeSortOrder();
        };
    });


    // --- URL Update Logic --- 
    const updateUrlParams = debounce(() => {
        const params = new URLSearchParams($page.url.searchParams);

        // Update search
        if (searchQuery) {
            params.set('search', searchQuery);
        } else {
            params.delete('search');
        }

        // Update sort
        params.set('sortBy', $selectedSortOption);
        params.set('sortOrder', $selectedSortOrder);

        // Update filters from stores
        updateFilterUrlParams(params, 'phase', $selectedPhaseOfSeason);
        updateFilterUrlParams(params, 'goal', $selectedPracticeGoals);

        // Update range filters
        if ($selectedEstimatedParticipantsMin !== (filterOptions.estimatedParticipants?.min ?? 1)) {
            params.set('minP', $selectedEstimatedParticipantsMin.toString());
        } else {
            params.delete('minP');
        }
        if ($selectedEstimatedParticipantsMax !== (filterOptions.estimatedParticipants?.max ?? 100)) {
            params.set('maxP', $selectedEstimatedParticipantsMax.toString());
        } else {
            params.delete('maxP');
        }

        // Update selected drills
        params.delete('drillId'); // Clear existing
        selectedDrills.forEach(drill => {
            params.append('drillId', drill.id.toString());
        });

        // Reset page to 1 when filters/search/sort change
        params.set('page', '1');

        goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
    }, 300); // Debounce time

    // Helper to update URL for multi-state filters
    function updateFilterUrlParams(params, baseName, filterState) {
        params.delete(`${baseName}_req`);
        params.delete(`${baseName}_exc`);
        for (const [value, state] of Object.entries(filterState)) {
            if (state === FILTER_STATES.REQUIRED) {
                params.append(`${baseName}_req`, value);
            } else if (state === FILTER_STATES.EXCLUDED) {
                params.append(`${baseName}_exc`, value);
            }
        }
    }

    function handlePageChange(event) {
        const newPage = event.detail.page;
        const params = new URLSearchParams($page.url.searchParams);
        params.set('page', newPage.toString());
        goto(`?${params.toString()}`, { keepFocus: true });
    }

    // --- Event Handlers --- 
    function handleDrillSelect(event) {
        const drill = event.detail; // Assuming FilterPanel dispatches drill object
        if (!selectedDrills.find(d => d.id === drill.id)) {
            selectedDrills = [...selectedDrills, drill];
            updateUrlParams(); // Trigger URL update
        }
    }

    function handleDrillRemove(event) {
        const drillId = event.detail; // Assuming FilterPanel dispatches drillId
        selectedDrills = selectedDrills.filter(d => d.id !== drillId);
        updateUrlParams(); // Trigger URL update
    }

    // Called when FilterPanel signals a change in its filters
    function handleFilterChange() {
        updateUrlParams();
    }

    // --- Sort Options --- 
    const sortOptions = [
      { value: 'name', label: 'Name' },
      { value: 'created_at', label: 'Date Created' },
      { value: 'estimated_number_of_participants', label: 'Estimated Participants' },
      { value: 'updated_at', label: 'Date Updated' }
    ];

    // Helper for DeletePracticePlan callback
    function onPlanDeleted(deletedPlanId) {
        practicePlans = practicePlans.filter(p => p.id !== deletedPlanId);
        // Optionally, could trigger a full reload if pagination counts change significantly
        // goto(window.location.href, { invalidateAll: true });
    }
</script>

<div class="max-w-7xl mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Practice Plans</h1>
        <div class="flex gap-2 relative">
            {#if $page.data.session}
                {#if $cart.length > 0}
                    <a
                        href="/practice-plans/create" 
                        class="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300"
                    >
                        Create Plan from Cart ({$cart.length} Drill{$cart.length !== 1 ? 's' : ''})
                    </a>
                    <button
                        type="button"
                        on:click={() => (showAiModal = true)}
                        class="relative inline-block px-6 py-3 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg font-semibold hover:bg-gray-200 transition-colors duration-300"
                    >
                        Create Plan with AI
                        <span class="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">Beta</span>
                    </button>
                {:else}
                    <a
                        href="/drills" 
                        class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
                    >
                        Go to Drills
                    </a>
                    <button
                        type="button"
                        on:click={() => (showAiModal = true)}
                        class="relative inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
                    >
                        Create Plan with AI
                        <span class="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">Beta</span>
                    </button>
                {/if}
            {:else}
                <a
                    href="/signin"
                    class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
                >
                    Sign in to Create Plans
                </a>
            {/if}
        </div>
    </div>

    <!-- Filter Panel -->
    <FilterPanel
        filterType="practice-plans"
        phaseOfSeasonOptions={filterOptions.phaseOfSeason}
        practiceGoalsOptions={filterOptions.practiceGoals}
        bind:selectedDrills={selectedDrills} 
        on:drillSelect={handleDrillSelect}
        on:drillRemove={handleDrillRemove}
        on:filterChange={handleFilterChange}
        {sortOptions}
        bind:selectedSortOption={$selectedSortOption}
        bind:selectedSortOrder={$selectedSortOrder}
    />

    <!-- Search input -->
    <input
        type="text"
        placeholder="Search practice plans..."
        class="mb-6 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        bind:value={searchQuery}
        on:input={updateUrlParams} 
    />

    <!-- Display Error Message -->
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline"> {error}</span>
      </div>
    {/if}

    <!-- Practice Plans Grid -->
    {#if practicePlans.length > 0}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Use practicePlans directly (already paginated and sorted by server) -->
            {#each practicePlans as plan (plan.id)}
                <div class="border border-gray-200 p-6 bg-white rounded-lg shadow-md transition-transform transform hover:-translate-y-1">
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
                            <!-- UpvoteDownvote component usage remains the same -->
                            <UpvoteDownvote practicePlanId={plan.id} /> 
                        </div>
                    </div>

                    <!-- Rest of the card content remains the same -->
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
                    {#if plan.practice_goals && plan.practice_goals.length > 0}
                        <p class="text-sm text-gray-500 mb-1">
                            <strong>Practice Goals:</strong> {plan.practice_goals.join(', ')}
                        </p>
                    {/if}
                    
                    <div class="flex justify-between items-center mt-4">
                        <a 
                            href="/practice-plans/{plan.id}" 
                            class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
                        >
                            View Practice Plan
                        </a>
                        <!-- Pass callback to handle deletion in the current list -->
                        <DeletePracticePlan 
                            planId={plan.id} 
                            createdBy={plan.created_by}
                            on:delete={() => onPlanDeleted(plan.id)} 
                        />
                    </div>
                </div>
            {/each}
        </div>

        <!-- Pagination Controls -->
        {#if pagination && pagination.totalPages > 1}
            <Pagination 
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                on:pageChange={handlePageChange}
            />
        {/if}
    {:else if !error}
        <p class="text-center text-gray-500 mt-8">No practice plans found matching your criteria.</p>
    {/if}

    <!-- Mount the modal -->
    <AiPlanGeneratorModal
        bind:isOpen={showAiModal}
        skillOptions={data.skillOptions ?? []}
        focusAreaOptions={data.focusAreaOptions ?? []}
    />
</div>
