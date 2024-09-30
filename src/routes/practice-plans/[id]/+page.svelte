<script>
    import DiagramDrawer from '$components/DiagramDrawer.svelte';
    import { slide } from 'svelte/transition';
    import { ChevronDownIcon, ChevronUpIcon } from 'svelte-feather-icons';
  
    export let data;
    const { practicePlan } = data;
  
    let expandedItems = {};
  
    const totalDuration = practicePlan.items.reduce((sum, item) => sum + item.duration, 0);

    function toggleExpand(index) {
        expandedItems[index] = !expandedItems[index];
        expandedItems = expandedItems;
    }
</script>

<div class="container mx-auto p-4 sm:p-6 bg-white shadow-md rounded-lg">
    <header class="mb-6">
        <h1 class="text-3xl font-extrabold text-gray-800 text-center">{practicePlan.name}</h1>
        
        {#if practicePlan.description}
            <p class="mt-2 text-gray-600 text-center">{practicePlan.description}</p>
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
            {#each practicePlan.items as item, index}
                <div
                    class="bg-gray-50 rounded-lg shadow-md overflow-hidden cursor-pointer transition-colors duration-200 hover:bg-gray-100"
                    on:click={() => toggleExpand(index)}
                >
                    <div class="p-4 sm:p-5 flex justify-between items-center">
                        <h3 class="text-xl font-semibold {item.type === 'drill' ? 'text-blue-700' : 'text-red-500'}">
                            {item.type === 'drill' ? item.drill.name : 'Break'}
                        </h3>
                        <div class="flex items-center">
                            <span class="text-gray-600 mr-2">{item.duration} mins</span>
                            {#if item.type === 'drill'}
                                {#if expandedItems[index]}
                                    <ChevronUpIcon size="20" class="text-gray-500" />
                                {:else}
                                    <ChevronDownIcon size="20" class="text-gray-500" />
                                {/if}
                            {/if}
                        </div>
                    </div>
                    
                    {#if item.type === 'drill' && expandedItems[index]}
                        <div transition:slide class="p-4 sm:p-5 bg-white border-t border-gray-200">
                            {#if item.drill.brief_description}
                                <p class="mb-2"><strong>Brief Description:</strong> {item.drill.brief_description}</p>
                            {/if}
                            {#if item.drill.detailed_description}
                                <p class="mb-2"><strong>Detailed Description:</strong></p>
                                <p class="whitespace-pre-wrap">{item.drill.detailed_description}</p>
                            {/if}
                            {#if item.drill.skill_level}
                                <p class="mb-2">
                                    <strong>Skill Level:</strong>
                                    {Array.isArray(item.drill.skill_level)
                                        ? item.drill.skill_level.join(', ')
                                        : item.drill.skill_level}
                                </p>
                            {/if}
                            {#if item.drill.complexity}
                                <p class="mb-2"><strong>Complexity:</strong> {item.drill.complexity}</p>
                            {/if}
                            {#if item.drill.number_of_people_min && item.drill.number_of_people_max}
                                <p class="mb-2">
                                    <strong>Number of People:</strong> {item.drill.number_of_people_min} - {item.drill.number_of_people_max}
                                </p>
                            {/if}
                            {#if item.drill.skills_focused_on}
                                <p class="mb-2">
                                    <strong>Skills Focused On:</strong>
                                    {Array.isArray(item.drill.skills_focused_on)
                                        ? item.drill.skills_focused_on.join(', ')
                                        : item.drill.skills_focused_on}
                                </p>
                            {/if}
                            {#if item.drill.positions_focused_on}
                                <p class="mb-2">
                                    <strong>Positions Focused On:</strong>
                                    {Array.isArray(item.drill.positions_focused_on)
                                        ? item.drill.positions_focused_on.join(', ')
                                        : item.drill.positions_focused_on}
                                </p>
                            {/if}
                            {#if item.drill.video_link}
                                <p class="mb-2">
                                    <strong>Video Link:</strong>
                                    <a href={item.drill.video_link} target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">
                                        Watch Video
                                    </a>
                                </p>
                            {/if}
                            {#if item.diagram_data || (item.drill.diagrams && item.drill.diagrams.length > 0)}
                                <div class="mt-4">
                                    <h4 class="text-lg font-semibold text-gray-700 mb-2">Diagram:</h4>
                                    <div class="max-w-full overflow-x-auto">
                                        {#if item.diagram_data}
                                            <DiagramDrawer 
                                                data={item.diagram_data} 
                                                readonly={true} 
                                                showSaveButton={false}
                                            />
                                        {:else}
                                            {#each item.drill.diagrams as diagram}
                                                <DiagramDrawer 
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
                    {/if}
                </div>
            {/each}
        </div>
    </section>
</div>
