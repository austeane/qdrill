<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import UpvoteDownvote from '$components/UpvoteDownvote.svelte';
    import Comments from '$components/Comments.svelte';

    export let data;
    const { userData } = data;

    // Utility functions to categorize votes
    function getLikedDrills(votes) {
        return votes.filter(vote => vote.type === 'drill');
    }

    function getLikedPracticePlans(votes) {
        return votes.filter(vote => vote.type === 'practice_plan');
    }
</script>

<div class="max-w-7xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">My Profile</h1>

    <!-- Drills Created -->
    <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Drills I've Created</h2>
        {#if userData.drills.length > 0}
            <ul class="space-y-4">
                {#each userData.drills as drill}
                    <li class="p-4 border rounded-lg shadow-sm">
                        <h3 class="text-lg font-bold"><a href={`/drills/${drill.id}`} class="text-blue-600 hover:underline">{drill.name}</a></h3>
                        <p class="text-gray-600">{drill.brief_description}</p>
                        <div class="mt-2">
                            <UpvoteDownvote drillId={drill.id} />
                        </div>
                    </li>
                {/each}
            </ul>
        {:else}
            <p>You haven't created any drills yet.</p>
        {/if}
    </section>

    <!-- Practice Plans Created -->
    <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Practice Plans I've Created</h2>
        {#if userData.practicePlans.length > 0}
            <ul class="space-y-4">
                {#each userData.practicePlans as plan}
                    <li class="p-4 border rounded-lg shadow-sm">
                        <h3 class="text-lg font-bold"><a href={`/practice-plans/${plan.id}`} class="text-blue-600 hover:underline">{plan.name}</a></h3>
                        <p class="text-gray-600">{plan.description}</p>
                        <div class="mt-2">
                            <UpvoteDownvote practicePlanId={plan.id} />
                        </div>
                    </li>
                {/each}
            </ul>
        {:else}
            <p>You haven't created any practice plans yet.</p>
        {/if}
    </section>

    <!-- Drills/Practice Plans Liked -->
    <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Drills/Practice Plans I've Liked</h2>
        {#if userData.votes.length > 0}
            <div class="space-y-6">
                <div>
                    <h3 class="text-xl font-semibold mb-2">Liked Drills</h3>
                    {#if getLikedDrills(userData.votes).length > 0}
                        <ul class="space-y-4">
                            {#each getLikedDrills(userData.votes) as vote}
                                <li class="p-4 border rounded-lg shadow-sm flex justify-between items-center">
                                    <a href={`/drills/${vote.drill_id}`} class="text-blue-600 hover:underline">
                                        {vote.item_name}
                                    </a>
                                    <UpvoteDownvote drillId={vote.drill_id} />
                                </li>
                            {/each}
                        </ul>
                    {:else}
                        <p>You haven't liked any drills yet.</p>
                    {/if}
                </div>

                <div>
                    <h3 class="text-xl font-semibold mb-2">Liked Practice Plans</h3>
                    {#if getLikedPracticePlans(userData.votes).length > 0}
                        <ul class="space-y-4">
                            {#each getLikedPracticePlans(userData.votes) as vote}
                                <li class="p-4 border rounded-lg shadow-sm flex justify-between items-center">
                                    <a href={`/practice-plans/${vote.practice_plan_id}`} class="text-blue-600 hover:underline">
                                        {vote.item_name}
                                    </a>
                                    <UpvoteDownvote practicePlanId={vote.practice_plan_id} />
                                </li>
                            {/each}
                        </ul>
                    {:else}
                        <p>You haven't liked any practice plans yet.</p>
                    {/if}
                </div>
            </div>
        {:else}
            <p>You haven't liked any drills or practice plans yet.</p>
        {/if}
    </section>

    <!-- Comments Made -->
    <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Comments I've Made</h2>
        {#if userData.comments.length > 0}
            <ul class="space-y-4">
                {#each userData.comments as comment}
                    <li class="p-4 border rounded-lg shadow-sm">
                        <p class="text-gray-800">{comment.content}</p>
                        <p class="text-sm text-gray-500">
                            On {comment.type === 'drill' ? 'Drill' : 'Practice Plan'}: 
                            {#if comment.type === 'drill'}
                                <a href={`/drills/${comment.drill_id}`} class="text-blue-600 hover:underline">{comment.drill_name}</a>
                            {:else}
                                <a href={`/practice-plans/${comment.practice_plan_id}`} class="text-blue-600 hover:underline">{comment.practice_plan_name}</a>
                            {/if}
                            <span class="ml-2">{new Date(comment.created_at).toLocaleString()}</span>
                        </p>
                    </li>
                {/each}
            </ul>
        {:else}
            <p>You haven't made any comments yet.</p>
        {/if}
    </section>
</div>

<style>
    /* Optional: Add some spacing and styling */
</style>