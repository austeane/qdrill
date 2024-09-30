<script>
    import FilterPanel from '$components/FilterPanel.svelte';
    import { onDestroy } from 'svelte';
    import { tick } from 'svelte';
    import { cart } from '$lib/stores/cartStore';
    import { goto } from '$app/navigation';

    export let data;

    // Practice Plans data from load
    let practicePlans = data.practicePlans || [];

    // Available filter options from load
    const {
        phaseOfSeason,
        estimatedParticipants,
        practiceGoals
    } = data.filterOptions || {};

    // Selected Filters
    let selectedPhaseOfSeason = [];
    let selectedEstimatedParticipants = { min: null, max: null };
    let selectedPracticeGoals = [];

    // Search Query
    let searchQuery = '';

    // Filtering logic
    $: filteredPlans = practicePlans.filter(plan => {
        let matches = true;

        // Search filtering
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            const nameMatch = plan.name.toLowerCase().includes(query);
            const descriptionMatch = plan.description?.toLowerCase().includes(query) || false;
            matches = matches && (nameMatch || descriptionMatch);
        }

        // Phase of Season
        if (selectedPhaseOfSeason.length > 0) {
            matches = matches && selectedPhaseOfSeason.includes(plan.phase_of_season);
        }

        // Estimated Number of Participants
        if (selectedEstimatedParticipants.min !== null) {
            matches = matches && plan.estimated_number_of_participants >= selectedEstimatedParticipants.min;
        }
        if (selectedEstimatedParticipants.max !== null) {
            matches = matches && plan.estimated_number_of_participants <= selectedEstimatedParticipants.max;
        }

        // Practice Goals
        if (selectedPracticeGoals.length > 0) {
            const planGoals = plan.practice_goals ? plan.practice_goals.split(',').map(g => g.trim()) : [];
            matches = matches && selectedPracticeGoals.every(goal => planGoals.includes(goal));
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
        phaseOfSeasonOptions={phaseOfSeason}
        practiceGoalsOptions={practiceGoals}
        selectedPhaseOfSeason={selectedPhaseOfSeason}
        selectedPracticeGoals={selectedPracticeGoals}
        selectedEstimatedParticipants={selectedEstimatedParticipants}
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
        {#each filteredPlans as plan}
            <div
                class="border border-gray-200 p-6 bg-white rounded-lg shadow-md transition-transform transform hover:-translate-y-1 cursor-pointer"
            >
                <h2 class="text-xl font-bold text-gray-800 mb-2">
                    <a
                        href="/practice-plans/{plan.id}"
                        class="underline text-blue-600 hover:text-blue-800"
                        on:click|stopPropagation
                    >
                        {plan.name}
                    </a>
                </h2>
                <p class="text-gray-600 mb-2">{plan.description}</p>
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
                <p class="text-sm text-gray-500 mb-1">
                    <strong>Created At:</strong> {new Date(plan.created_at).toLocaleDateString()}
                </p>

                <a href="/practice-plans/{plan.id}" class="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
                    View Practice Plan
                </a>
            </div>
        {/each}
    </div>
</div>