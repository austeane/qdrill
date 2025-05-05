<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import UpvoteDownvote from '$lib/components/UpvoteDownvote.svelte';
    import Comments from '$lib/components/Comments.svelte';

    export let data;
    const { userData } = data;

    // Utility functions to categorize votes
    function getLikedDrills(votes) {
        return votes.filter(vote => vote.type === 'drill');
    }

    function getLikedPracticePlans(votes) {
        return votes.filter(vote => vote.type === 'practice_plan');
    }

    // Add user info from Google
    $: userEmail = $page.data.session?.user?.email;
    $: userName = $page.data.session?.user?.name;
    $: userImage = $page.data.session?.user?.image;
</script>

<div class="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
    <!-- User Profile Header -->
    <header class="flex flex-col sm:flex-row items-center gap-4 p-6 bg-white rounded-lg shadow-sm">
        <img 
            src={userImage} 
            alt={userName} 
            class="w-24 h-24 rounded-full shadow-md"
        />
        <div class="text-center sm:text-left">
            <h1 class="text-2xl sm:text-3xl font-bold">{userName}</h1>
            <p class="text-gray-600">{userEmail}</p>
        </div>
    </header>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {#each [
            { label: 'Drills Created', value: userData.drills.length },
            { label: 'Practice Plans', value: userData.practicePlans.length },
            { label: 'Likes Given', value: userData.votes.length },
            { label: 'Comments Made', value: userData.comments.length }
        ] as stat}
            <div class="bg-white p-4 rounded-lg shadow-sm text-center">
                <p class="text-2xl font-bold" style="color: var(--color-theme-1)">{stat.value}</p>
                <p class="text-gray-600">{stat.label}</p>
            </div>
        {/each}
    </div>

    <!-- Content Sections -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left Column -->
        <div class="space-y-6">
            <!-- Drills Created -->
            <section class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-xl font-semibold mb-4">Drills I've Created</h2>
                {#if userData.drills.length > 0}
                    <ul class="divide-y">
                        {#each userData.drills as drill}
                            <li class="py-4 first:pt-0 last:pb-0">
                                <h3 class="text-lg font-bold">
                                    <a href={`/drills/${drill.id}`} 
                                       class="text-theme-1 hover:underline">{drill.name}</a>
                                </h3>
                                <p class="text-gray-600 text-sm mt-1">{drill.brief_description}</p>
                                <div class="mt-2">
                                    <UpvoteDownvote drillId={drill.id} />
                                </div>
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <p class="text-gray-500 italic">You haven't created any drills yet.</p>
                {/if}
            </section>

            <!-- Practice Plans Created -->
            <section class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-xl font-semibold mb-4">Practice Plans I've Created</h2>
                {#if userData.practicePlans.length > 0}
                    <ul class="divide-y">
                        {#each userData.practicePlans as plan}
                            <li class="py-4 first:pt-0 last:pb-0">
                                <h3 class="text-lg font-bold">
                                    <a href={`/practice-plans/${plan.id}`} 
                                       class="text-theme-1 hover:underline">{plan.name}</a>
                                </h3>
                                <p class="text-gray-600 text-sm mt-1">{plan.description}</p>
                                <!-- Optional: Add Upvote/Downvote or other relevant info here if needed -->
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <p class="text-gray-500 italic">You haven't created any practice plans yet.</p>
                {/if}
            </section>
        </div>

        <!-- Right Column -->
        <div class="space-y-6">
            <!-- Liked Content -->
            <section class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-xl font-semibold mb-4">Content I've Liked</h2>
                <div class="space-y-4">
                    <!-- Liked Drills -->
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Drills</h3>
                        {#if getLikedDrills(userData.votes).length > 0}
                            <ul class="divide-y">
                                {#each getLikedDrills(userData.votes) as vote}
                                    <li class="py-3 first:pt-0 last:pb-0 flex justify-between items-center">
                                        <a href={`/drills/${vote.drill_id}`} 
                                           class="text-theme-1 hover:underline">{vote.item_name}</a>
                                        <UpvoteDownvote drillId={vote.drill_id} />
                                    </li>
                                {/each}
                            </ul>
                        {:else}
                            <p class="text-gray-500 italic">No liked drills yet</p>
                        {/if}
                    </div>
                    
                    <!-- Liked Practice Plans -->
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Practice Plans</h3>
                        {#if getLikedPracticePlans(userData.votes).length > 0}
                            <ul class="divide-y">
                                {#each getLikedPracticePlans(userData.votes) as vote}
                                    <li class="py-3 first:pt-0 last:pb-0 flex justify-between items-center">
                                        <a href={`/practice-plans/${vote.practice_plan_id}`} 
                                           class="text-theme-1 hover:underline">{vote.item_name}</a>
                                        <!-- Assuming Upvote/Downvote is not directly applicable here unless you have a specific ID -->
                                        <!-- Maybe just show the name -->
                                    </li>
                                {/each}
                            </ul>
                        {:else}
                            <p class="text-gray-500 italic">No liked practice plans yet</p>
                        {/if}
                    </div>
                </div>
            </section>

            <!-- Comments -->
            <section class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-xl font-semibold mb-4">Recent Comments</h2>
                {#if userData.comments.length > 0}
                    <ul class="divide-y">
                        {#each userData.comments as comment}
                            <li class="py-4 first:pt-0 last:pb-0">
                                <p class="text-gray-800">{comment.content}</p>
                                <div class="mt-2 text-sm text-gray-500 flex flex-wrap gap-2">
                                    <span>On {comment.type === 'drill' ? 'Drill' : 'Practice Plan'}:</span>
                                    {#if comment.type === 'drill'}
                                        <a href={`/drills/${comment.drill_id}`} 
                                           class="text-theme-1 hover:underline">{comment.drill_name}</a>
                                    {:else}
                                        <a href={`/practice-plans/${comment.practice_plan_id}`} 
                                           class="text-theme-1 hover:underline">{comment.practice_plan_name}</a>
                                    {/if}
                                    <span class="ml-auto">{new Date(comment.created_at).toLocaleDateString()}</span>
                                </div>
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <p class="text-gray-500 italic">No comments yet</p>
                {/if}
            </section>
        </div>
    </div>
</div>

<style>
    /* Optional: Add some spacing and styling */
</style>