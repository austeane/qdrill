<script>
    import { sections, timeline, basicInfo } from '$lib/stores/wizardStore';
    import { validationErrors } from '$lib/stores/wizardValidation';
    import { scheduleAutoSave } from '$lib/stores/wizardStore';

    // Add touched state tracking
    let touched = {
        totalTime: false,
        sections: false
    };

    // Initialize timeline if empty
    $: if ($timeline.sections.length === 0 && $sections.length > 0) {
        const totalTime = $basicInfo.totalTime;
        const sectionTime = Math.floor(totalTime / $sections.length);
        
        timeline.set({
            totalTime,
            sections: $sections.map((section, index) => ({
                ...section,
                duration: sectionTime,
                startTime: index * sectionTime
            }))
        });
    }

    // Handle duration change
    function handleDurationChange(index, newDuration) {
        touched.sections = true;
        timeline.update(current => {
            const updated = { ...current };
            // Ensure duration is at least 1 minute
            updated.sections[index].duration = Math.max(1, parseInt(newDuration) || 0);
            
            // Recalculate start times
            let currentStartTime = 0;
            updated.sections = updated.sections.map((section, i) => {
                const sectionCopy = { ...section };
                sectionCopy.startTime = currentStartTime;
                currentStartTime += section.duration;
                return sectionCopy;
            });
            
            return updated;
        });
        scheduleAutoSave();
    }

    // Handle reordering
    function handleDragStart(e, index) {
        e.dataTransfer.setData('text/plain', index);
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDrop(e, targetIndex) {
        e.preventDefault();
        const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
        if (sourceIndex === targetIndex) return;

        timeline.update(current => {
            const updated = { ...current };
            const [removed] = updated.sections.splice(sourceIndex, 1);
            updated.sections.splice(targetIndex, 0, removed);
            
            // Recalculate start times
            let currentStartTime = 0;
            updated.sections = updated.sections.map(section => {
                const sectionCopy = { ...section };
                sectionCopy.startTime = currentStartTime;
                currentStartTime += section.duration;
                return sectionCopy;
            });
            
            return updated;
        });
        scheduleAutoSave();
    }

    // Calculate total time used
    $: totalTimeUsed = $timeline.sections.reduce((total, section) => total + section.duration, 0);
    $: timeRemaining = $basicInfo.totalTime - totalTimeUsed;

    // Format time for display
    function formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
    }
</script>

<div class="space-y-8">
    <div>
        <h2 class="text-lg font-medium text-gray-900">Arrange Timeline</h2>
        <p class="mt-1 text-sm text-gray-500">
            Arrange your practice sections and set their durations. Total practice time: {formatTime($basicInfo.totalTime)}
        </p>
    </div>

    <!-- Time Summary -->
    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div class="flex justify-between items-center">
            <div>
                <h3 class="text-sm font-medium text-gray-700">Time Allocation</h3>
                <p class="text-sm text-gray-500">
                    Used: {formatTime(totalTimeUsed)} / Available: {formatTime($basicInfo.totalTime)}
                </p>
            </div>
            <div class="text-sm {timeRemaining < 0 ? 'text-red-600' : 'text-green-600'}">
                {timeRemaining >= 0 ? `Remaining: ${formatTime(timeRemaining)}` : `Over by: ${formatTime(Math.abs(timeRemaining))}`}
            </div>
        </div>
        
        <!-- Progress bar -->
        <div class="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
                class="h-full {timeRemaining < 0 ? 'bg-red-500' : 'bg-blue-500'}"
                style="width: {Math.min(100, (totalTimeUsed / $basicInfo.totalTime) * 100)}%"
            ></div>
        </div>
    </div>

    <!-- Timeline -->
    <div class="space-y-4">
        {#each $timeline.sections as section, index}
            <div
                class="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                draggable="true"
                on:dragstart={(e) => handleDragStart(e, index)}
                on:dragover={handleDragOver}
                on:drop={(e) => handleDrop(e, index)}
            >
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <span class="text-xl">{section.icon}</span>
                        <div>
                            <h4 class="text-sm font-medium text-gray-900">{section.name}</h4>
                            <p class="text-xs text-gray-500">Starts at: {formatTime(section.startTime)}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <label class="flex items-center space-x-2">
                            <span class="text-sm text-gray-700">Duration:</span>
                            <input
                                type="number"
                                min="1"
                                bind:value={section.duration}
                                on:input={(e) => handleDurationChange(index, e.target.value)}
                                class="shadow-sm focus:ring-blue-500 focus:border-blue-500 w-20 sm:text-sm border-gray-300 rounded-md"
                            />
                            <span class="text-sm text-gray-500">min</span>
                        </label>
                        <div class="flex items-center">
                            <button
                                type="button"
                                class="p-1 text-gray-400 hover:text-gray-500"
                                on:click={() => handleDurationChange(index, section.duration - 5)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                class="p-1 text-gray-400 hover:text-gray-500"
                                on:click={() => handleDurationChange(index, section.duration + 5)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {#if $validationErrors.timeline?.[`section_${index}`]}
                    <p class="mt-1 text-sm text-red-600">{$validationErrors.timeline[`section_${index}`]}</p>
                {/if}
            </div>
        {/each}
    </div>

    {#if getFieldError('totalTime', touched, $validationErrors)}
        <p class="mt-1 text-sm text-red-600">{$validationErrors.timeline.totalTime}</p>
    {/if}

    {#if getFieldError('sections', touched, $validationErrors)}
        <p class="mt-1 text-sm text-red-600">{$validationErrors.timeline.sections}</p>
    {/if}
</div> 