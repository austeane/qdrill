<script>
    import { timeline, basicInfo } from '$lib/stores/wizardStore';
    import { validationErrors, getFieldError } from '$lib/stores/wizardValidation';
    import { scheduleAutoSave } from '$lib/stores/wizardStore';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { replaceState } from '$app/navigation';

    // Props from server
    export let data;

    // Current section being edited - initialize from URL param if available
    let currentSectionIndex = 0;
    $: {
        const sectionParam = $page.url.searchParams.get('section');
        if (sectionParam) {
            const parsedIndex = parseInt(sectionParam);
            if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < $timeline.sections.length) {
                currentSectionIndex = parsedIndex;
            }
        }
    }
    $: currentSection = $timeline.sections[currentSectionIndex];

    // Filter state - make reactive to basicInfo and currentSection changes
    $: filters = {
        search: '',
        skillLevel: $basicInfo.skillLevel,
        minParticipants: $basicInfo.participants,
        maxParticipants: $basicInfo.participants,
        duration: currentSection?.duration || 15
    };

    // Update URL when section changes - wrap in browser check
    $: {
        if (typeof window !== 'undefined') {  // Only run in browser
            const url = new URL(window.location);
            url.searchParams.set('section', currentSectionIndex.toString());
            window.history.replaceState({}, '', url);
        }
    }

    // Filtered drills - add null check
    $: filteredDrills = data?.drills?.filter(drill => {
        if (filters.search && !drill.name.toLowerCase().includes(filters.search.toLowerCase())) {
            return false;
        }
        if (filters.skillLevel && !drill.skill_level.includes(filters.skillLevel)) {
            return false;
        }
        // Convert to numbers for proper comparison
        const minParticipants = parseInt(filters.minParticipants) || 0;
        const maxParticipants = parseInt(filters.maxParticipants) || 0;
        
        if (minParticipants && drill.min_participants > minParticipants) {
            return false;
        }
        if (maxParticipants && drill.max_participants < maxParticipants) {
            return false;
        }
        return true;
    }) ?? [];

    // Handle adding a drill to the section
    function addDrill(drill) {
        timeline.update(current => {
            const updated = { ...current };
            const section = updated.sections[currentSectionIndex];
            
            if (!section.drills) {
                section.drills = [];
            }
            
            const totalDrillTime = getTotalDrillTime(section);
            const remainingTime = Math.max(0, section.duration - totalDrillTime);
            
            // Don't add if no time remains
            if (remainingTime <= 0) {
                return current;
            }
            
            const defaultDuration = drill.duration || 15;
            const adjustedDuration = Math.min(defaultDuration, remainingTime);
            
            // Only add if we can allocate at least 1 minute
            if (adjustedDuration >= 1) {
                section.drills.push({
                    id: drill.id,
                    name: drill.name,
                    duration: adjustedDuration,
                    drill: drill
                });
            }
            
            return updated;
        });
        scheduleAutoSave();
    }

    // Handle removing a drill from the section
    function removeDrill(drillIndex) {
        timeline.update(current => {
            const updated = { ...current };
            const section = updated.sections[currentSectionIndex];
            section.drills.splice(drillIndex, 1);
            return updated;
        });
        scheduleAutoSave();
    }

    // Handle drill duration change
    function handleDrillDurationChange(drillIndex, newDuration) {
        touched.drills[`${currentSectionIndex}_${drillIndex}`] = true;
        timeline.update(current => {
            const updated = { ...current };
            const section = updated.sections[currentSectionIndex];
            
            // Calculate total time excluding current drill
            const otherDrillsTime = section.drills.reduce((total, drill, idx) => 
                idx === drillIndex ? total : total + (drill.duration || 0), 0);
            
            // Calculate maximum allowed duration for this drill
            const maxAllowedDuration = section.duration - otherDrillsTime;
            
            // Ensure duration is at least 1 minute and doesn't exceed available time
            const parsedDuration = parseInt(newDuration) || 0;
            const validatedDuration = Math.max(1, Math.min(parsedDuration, maxAllowedDuration));
            
            section.drills[drillIndex].duration = validatedDuration;
            
            return updated;
        });
        scheduleAutoSave();
    }

    // Calculate total time used by drills in a section
    function getTotalDrillTime(section) {
        return (section.drills || []).reduce((total, drill) => total + (drill.duration || 0), 0);
    }

    // Format time for display
    function formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
    }

    // Navigation between sections
    function nextSection() {
        if (currentSectionIndex < $timeline.sections.length - 1) {
            currentSectionIndex++;
        }
    }

    function prevSection() {
        if (currentSectionIndex > 0) {
            currentSectionIndex--;
        }
    }

    // Add touched state tracking
    let touched = {
        drills: {}  // Will store touched state for each section's drills
    };
</script>

<div class="space-y-8">
    <div>
        <h2 class="text-lg font-medium text-gray-900">Select Drills</h2>
        <p class="mt-1 text-sm text-gray-500">
            Choose drills for each section of your practice plan.
        </p>
    </div>

    <!-- Section Navigation -->
    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div class="flex items-center justify-between">
            <button
                type="button"
                class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={currentSectionIndex === 0}
                on:click={prevSection}
            >
                Previous Section
            </button>
            <div class="text-sm text-gray-500">
                Section {currentSectionIndex + 1} of {$timeline.sections.length}
            </div>
            <button
                type="button"
                class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={currentSectionIndex === $timeline.sections.length - 1}
                on:click={nextSection}
            >
                Next Section
            </button>
        </div>
    </div>

    <!-- Current Section Info -->
    {#if currentSection}
        <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div class="flex items-center space-x-3">
                <span class="text-xl">{currentSection.icon}</span>
                <div>
                    <h3 class="text-sm font-medium text-gray-900">{currentSection.name}</h3>
                    <p class="text-sm text-gray-500">
                        Duration: {formatTime(currentSection.duration)} | 
                        Used: {formatTime(getTotalDrillTime(currentSection))} | 
                        Remaining: {formatTime(currentSection.duration - getTotalDrillTime(currentSection))}
                    </p>
                </div>
            </div>
        </div>

        <!-- Selected Drills -->
        <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-700">Selected Drills</h3>
            {#if !currentSection.drills?.length}
                <p class="text-sm text-gray-500 italic">No drills selected yet</p>
            {:else}
                <div class="space-y-2">
                    {#each currentSection.drills as drill, index}
                        <div class="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                            <div>
                                <h4 class="text-sm font-medium text-gray-900">{drill.name}</h4>
                                <p class="text-xs text-gray-500">{drill.drill.brief_description}</p>
                            </div>
                            <div class="flex items-center space-x-4">
                                <label class="flex items-center space-x-2">
                                    <span class="text-sm text-gray-700">Duration:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max={currentSection.duration}
                                        bind:value={drill.duration}
                                        on:input={(e) => handleDrillDurationChange(index, e.target.value)}
                                        class="shadow-sm focus:ring-blue-500 focus:border-blue-500 w-20 sm:text-sm border-gray-300 rounded-md"
                                    />
                                    <span class="text-sm text-gray-500">min</span>
                                </label>
                                <button
                                    type="button"
                                    on:click={() => removeDrill(index)}
                                    class="p-1 text-gray-400 hover:text-red-500"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        {#if getFieldError(`drill_${currentSectionIndex}_${index}`, touched.drills, $validationErrors)}
                            <p class="mt-1 text-sm text-red-600">
                                {$validationErrors.drills[`drill_${currentSectionIndex}_${index}`]}
                            </p>
                        {/if}
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Drill Search and Filters -->
        <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-700">Available Drills</h3>
            
            <!-- Add this note -->
            <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-blue-700">
                            In future updates, drills will be automatically suggested based on the section type and your practice goals. For now, please search for drills you'd like to include in this section.
                        </p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div class="col-span-full">
                    <input
                        type="text"
                        placeholder="Search drills..."
                        bind:value={filters.search}
                        class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                </div>
            </div>

            <!-- Drill Grid -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {#if !data?.drills}
                    <div class="col-span-full text-center py-4 text-gray-500">
                        Loading drills...
                    </div>
                {:else if filteredDrills.length === 0}
                    <div class="col-span-full text-center py-4 text-gray-500">
                        No drills match your filters
                    </div>
                {:else}
                    {#each filteredDrills as drill}
                        <button
                            type="button"
                            on:click={() => addDrill(drill)}
                            disabled={getTotalDrillTime(currentSection) >= currentSection.duration}
                            class="relative flex flex-col p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <h4 class="text-sm font-medium text-gray-900">{drill.name}</h4>
                            <p class="mt-1 text-xs text-gray-500">{drill.brief_description}</p>
                            <div class="mt-2 flex items-center text-xs text-gray-500">
                                <span class="mr-2">⏱️ {drill.duration}min</span>
                                <span>👥 {drill.min_participants}-{drill.max_participants} players</span>
                            </div>
                        </button>
                    {/each}
                {/if}
            </div>
        </div>
    {/if}
</div> 