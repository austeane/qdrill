<script>
    import FilterPanel from '$components/FilterPanel.svelte';
    import { onDestroy } from 'svelte';
    import { tick } from 'svelte';

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
</script>

<div class="max-w-7xl mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">Practice Plans</h1>

    <!-- Button to create a new practice plan -->
    <a
        href="/practice-plans/create"
        class="inline-block mb-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
    >
        Create a New Practice Plan
    </a>

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