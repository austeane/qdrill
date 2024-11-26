<script>
    import { page } from '$app/stores';
    import { slide } from 'svelte/transition';
    import { ChevronDownIcon, ChevronUpIcon } from 'svelte-feather-icons';
    import Breadcrumb from '../../../components/Breadcrumb.svelte';
    import Comments from '$components/Comments.svelte';
    import UpvoteDownvote from '$components/UpvoteDownvote.svelte';
    import ExcalidrawWrapper from '$components/ExcalidrawWrapper.svelte';
  
    export let data;
    const { practicePlan } = data;
  
    let expandedItems = {};
  
    const totalDuration = practicePlan.items.reduce((sum, item) => sum + item.duration, 0);

    function toggleExpand(index) {
        expandedItems[index] = !expandedItems[index];
        expandedItems = expandedItems;
    }

    function groupDrillsByParallel(items) {
        const timeSlots = [];
        let currentGroup = null;
        
        items.forEach(item => {
            if (item.parallel_group_id) {
                if (!currentGroup || currentGroup.groupId !== item.parallel_group_id) {
                    currentGroup = {
                        groupId: item.parallel_group_id,
                        items: [],
                        duration: item.duration
                    };
                    timeSlots.push(currentGroup);
                }
                currentGroup.items.push(item);
            } else {
                timeSlots.push({ items: [item], duration: item.duration });
            }
        });
        
        return timeSlots;
    }

    $: canEdit = $page.data.session?.user?.id === practicePlan.created_by || practicePlan.is_editable_by_others;
</script>

<Breadcrumb customSegments={[{ name: 'Practice Plans', url: '/practice-plans' }, { name: practicePlan.name }]} />

<div class="container mx-auto p-4 sm:p-6 bg-white shadow-md rounded-lg">
    <header class="relative mb-6">
        <div class="absolute top-0 right-4">
            <UpvoteDownvote practicePlanId={practicePlan.id} />
        </div>
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-2xl font-bold">{practicePlan.name}</h1>
            {#if canEdit}
                <a 
                    href="/practice-plans/{practicePlan.id}/edit" 
                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                    Edit Plan
                </a>
            {/if}
        </div>
        
        {#if practicePlan.description}
            <p class="mt-4 text-gray-600">{practicePlan.description}</p>
        {/if}
    </header>
    
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="flex items-center p-4 bg-blue-50 rounded-lg shadow">
            <svg class="w-6 h-6 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zM12 4C7.589 4 4 7.589 4 12s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8zm0 14c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z" />
            </svg>
            <div>
                <p class="text-gray-500 text-sm">Total Duration</p>
                <p class="text-lg font-semibold text-gray-800">{totalDuration} minutes</p>
            </div>
        </div>
        
        {#if practicePlan.phase_of_season}
            <div class="flex items-center p-4 bg-green-50 rounded-lg shadow">
                <svg class="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <p class="text-gray-500 text-sm">Phase of Season</p>
                    <p class="text-lg font-semibold text-gray-800">{practicePlan.phase_of_season}</p>
                </div>
            </div>
        {/if}
        
        {#if practicePlan.estimated_number_of_participants}
            <div class="flex items-center p-4 bg-yellow-50 rounded-lg shadow">
                <svg class="w-6 h-6 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17 20h5v-5l-1.585-1.585A2 2 0 0018 12H5a2 2 0 00-1.415.585L2 14v6h5" />
                </svg>
                <div>
                    <p class="text-gray-500 text-sm">Estimated Participants</p>
                    <p class="text-lg font-semibold text-gray-800">{practicePlan.estimated_number_of_participants}</p>
                </div>
            </div>
        {/if}
        
        {#if practicePlan.practice_goals && practicePlan.practice_goals.length > 0}
            <div class="flex items-start p-4 bg-purple-50 rounded-lg shadow">
                <svg class="w-6 h-6 text-purple-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4M7.5 5h9a2.5 2.5 0 012.5 2.5v9a2.5 2.5 0 01-2.5 2.5h-9A2.5 2.5 0 015 16.5v-9A2.5 2.5 0 017.5 5z" />
                </svg>
                <div>
                    <p class="text-gray-500 text-sm">Practice Goals</p>
                    <ul class="mt-1 list-disc list-inside">
                        {#each practicePlan.practice_goals as goal}
                            <li class="text-gray-800">{goal}</li>
                        {/each}
                    </ul>
                </div>
            </div>
        {/if}
    </section>
  
    <section>
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Practice Plan Timeline</h2>
        <div class="space-y-4">
            {#each groupDrillsByParallel(practicePlan.items) as timeSlot}
                <div class="practice-slot mb-4">
                    {#if timeSlot.items.length === 1}
                        <div class="bg-white p-4 rounded-lg shadow mb-4">
                            <div class="flex justify-between items-center">
                                <h3 class="text-lg font-semibold">{timeSlot.items[0].drill.name} ({timeSlot.duration} mins)</h3>
                            </div>
                            {#if timeSlot.items[0].drill.brief_description}
                                <p class="mb-2"><strong>Brief Description:</strong> {timeSlot.items[0].drill.brief_description}</p>
                            {/if}
                            {#if timeSlot.items[0].drill.detailed_description}
                                <p class="mb-2"><strong>Detailed Description:</strong></p>
                                <p class="whitespace-pre-wrap">{timeSlot.items[0].drill.detailed_description}</p>
                            {/if}
                            {#if timeSlot.items[0].diagram_data || (timeSlot.items[0].drill.diagrams && timeSlot.items[0].drill.diagrams.length > 0)}
                                <div class="mt-4">
                                    <h4 class="text-lg font-semibold text-gray-700 mb-2">Diagram:</h4>
                                    <div class="max-w-full overflow-x-auto">
                                        {#if timeSlot.items[0].diagram_data}
                                            <ExcalidrawWrapper 
                                                data={timeSlot.items[0].diagram_data} 
                                                readonly={true} 
                                                showSaveButton={false}
                                            />
                                        {:else}
                                            {#each timeSlot.items[0].drill.diagrams as diagram}
                                                <ExcalidrawWrapper 
                                                    data={diagram} 
                                                    readonly={true} 
                                                    showSaveButton={false}
                                                />
                                            {/each}
                                        {/if}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {:else}
                        <div class="parallel-group bg-blue-50 p-4 rounded-lg">
                            <h3 class="text-lg font-semibold mb-2">Parallel Drills ({timeSlot.duration} mins)</h3>
                            <div class="grid grid-cols-1 md:grid-cols-{timeSlot.items.length} gap-4">
                                {#each timeSlot.items as item}
                                    <div class="bg-white p-4 rounded shadow">
                                        <h4 class="font-semibold">{item.drill.name}</h4>
                                        {#if item.drill.brief_description}
                                            <p class="mb-2"><strong>Brief Description:</strong> {item.drill.brief_description}</p>
                                        {/if}
                                        {#if item.drill.detailed_description}
                                            <p class="mb-2"><strong>Detailed Description:</strong></p>
                                            <p class="whitespace-pre-wrap">{item.drill.detailed_description}</p>
                                        {/if}
                                        {#if item.diagram_data || (item.drill.diagrams && item.drill.diagrams.length > 0)}
                                            <div class="mt-4">
                                                <h4 class="text-lg font-semibold text-gray-700 mb-2">Diagram:</h4>
                                                <div class="max-w-full overflow-x-auto">
                                                    {#if item.diagram_data}
                                                        <ExcalidrawWrapper 
                                                            data={item.diagram_data} 
                                                            readonly={true} 
                                                            showSaveButton={false}
                                                        />
                                                    {:else}
                                                        {#each item.drill.diagrams as diagram}
                                                            <ExcalidrawWrapper 
                                                                data={diagram} 
                                                                readonly={true} 
                                                                showSaveButton={false}
                                                            />
                                                        {/each}
                                                    {/if}
                                                </div>
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </section>
</div>

<!-- Add Comments Section -->
<Comments practicePlanId={practicePlan.id} />