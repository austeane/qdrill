<script>
    import { basicInfo, sections, timeline, wizardState, currentStep } from '$lib/stores/wizardStore';
    import { validationErrors } from '$lib/stores/wizardValidation';
    import { goto } from '$app/navigation';

    // Format time for display
    function formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
    }

    // Calculate total time used by drills in a section
    function getTotalDrillTime(section) {
        return (section.drills || []).reduce((total, drill) => total + (drill.duration || 0), 0);
    }

    // Handle final submission
    async function handleSubmit() {
        try {
            // Add these debug logs
            const basicInfoErrors = validateBasicInfo($basicInfo);
            const sectionsErrors = validateSections($timeline.sections);
            const timelineErrors = validateTimeline($timeline, $timeline.sections);
            const drillsErrors = validateDrills($timeline);

            console.log('Validation Errors:', {
                basicInfo: basicInfoErrors,
                sections: sectionsErrors,
                timeline: timelineErrors,
                drills: drillsErrors
            });

            const hasErrors = Object.keys(basicInfoErrors).length > 0 ||
                             Object.keys(sectionsErrors).length > 0 ||
                             Object.keys(timelineErrors).length > 0 ||
                             Object.keys(drillsErrors).length > 0;

            if (hasErrors) {
                validationErrors.set({
                    basicInfo: basicInfoErrors,
                    sections: sectionsErrors,
                    timeline: timelineErrors,
                    drills: drillsErrors
                });
                throw new Error('Please fix validation errors before submitting');
            }

            const planData = {
                name: $basicInfo.name,
                description: $basicInfo.description,
                phase_of_season: $basicInfo.phaseOfSeason,
                estimated_number_of_participants: parseInt($basicInfo.participants),
                practice_goals: $basicInfo.practiceGoals.filter(goal => goal.trim()),
                visibility: $basicInfo.visibility,
                is_editable_by_others: $basicInfo.isEditableByOthers,
                sections: $timeline.sections.map(section => ({
                    name: section.name,
                    order: section.order,
                    goals: section.goals || [],
                    notes: section.notes || '',
                    items: (section.drills || []).map(drill => ({
                        type: 'drill',
                        drill_id: drill.drill.id,
                        duration: drill.duration,
                        order_in_plan: drill.order || 0,
                        diagram_data: null,
                        parallel_group_id: null
                    }))
                }))
            };

            const response = await fetch('/api/practice-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(planData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create practice plan');
            }

            const data = await response.json();
            goto(`/practice-plans/${data.id}`);
        } catch (error) {
            console.error('Full error details:', error);
            console.error('Failed to create practice plan:', error);
            // Add proper error handling UI feedback
            validationErrors.update(current => ({
                ...current,
                submission: error.message
            }));
        }
    }

    // Navigate to edit section
    function goToSection(sectionIndex) {
        goto(`/practice-plans/wizard/drills?section=${sectionIndex}`);
    }
</script>

<div class="space-y-8">
    <div>
        <h2 class="text-lg font-medium text-gray-900">Practice Plan Overview</h2>
        <p class="mt-1 text-sm text-gray-500">
            Review your practice plan before finalizing.
        </p>
    </div>

    <!-- Basic Info Summary -->
    <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 class="text-base font-medium text-gray-900 mb-4">Basic Information</h3>
        <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
                <dt class="text-sm font-medium text-gray-500">Name</dt>
                <dd class="mt-1 text-sm text-gray-900">{$basicInfo.name}</dd>
            </div>
            <div>
                <dt class="text-sm font-medium text-gray-500">Participants</dt>
                <dd class="mt-1 text-sm text-gray-900">{$basicInfo.participants}</dd>
            </div>
            <div>
                <dt class="text-sm font-medium text-gray-500">Phase of Season</dt>
                <dd class="mt-1 text-sm text-gray-900">{$basicInfo.phaseOfSeason}</dd>
            </div>
            <div>
                <dt class="text-sm font-medium text-gray-500">Skill Level</dt>
                <dd class="mt-1 text-sm text-gray-900">{$basicInfo.skillLevel}</dd>
            </div>
            <div>
                <dt class="text-sm font-medium text-gray-500">Total Time</dt>
                <dd class="mt-1 text-sm text-gray-900">{formatTime($basicInfo.totalTime)}</dd>
            </div>
            <div class="sm:col-span-2">
                <dt class="text-sm font-medium text-gray-500">Practice Goals</dt>
                <dd class="mt-1 text-sm text-gray-900">
                    <ul class="list-disc pl-5 space-y-1">
                        {#each $basicInfo.practiceGoals.filter(goal => goal.trim()) as goal}
                            <li>{goal}</li>
                        {/each}
                    </ul>
                </dd>
            </div>
        </dl>
    </div>

    <!-- Timeline Overview -->
    <div class="space-y-6">
        <h3 class="text-base font-medium text-gray-900">Practice Timeline</h3>
        {#each $timeline.sections as section, index}
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <span class="text-xl">{section.icon}</span>
                        <div>
                            <h4 class="text-sm font-medium text-gray-900">{section.name}</h4>
                            <p class="text-sm text-gray-500">
                                Duration: {formatTime(section.duration)} | 
                                Starts at: {formatTime(section.startTime)}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        on:click={() => goToSection(index)}
                        class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Edit Drills
                    </button>
                </div>

                <!-- Drills List -->
                {#if section.drills?.length}
                    <div class="mt-4 space-y-3">
                        {#each section.drills as drill}
                            <div class="flex items-center justify-between py-2 border-t border-gray-100">
                                <div>
                                    <h5 class="text-sm font-medium text-gray-900">{drill.name}</h5>
                                    <p class="text-xs text-gray-500">{drill.drill.brief_description}</p>
                                </div>
                                <div class="text-sm text-gray-500">
                                    {formatTime(drill.duration)}
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="text-sm text-gray-500 italic">No drills added to this section</p>
                {/if}
            </div>
        {/each}
    </div>

    <!-- Submit Button -->
    <div class="flex justify-end">
        <button
            type="button"
            on:click={handleSubmit}
            class="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
            Create Practice Plan
        </button>
    </div>

    {#if $validationErrors.submission}
        <div class="text-red-600 text-sm mt-2">
            {$validationErrors.submission}
        </div>
    {/if}

    <!-- Also show specific validation errors if any -->
    {#if Object.keys($validationErrors).length > 0}
        <div class="text-red-600 text-sm mt-2">
            <ul>
                {#each Object.entries($validationErrors) as [section, errors]}
                    {#if typeof errors === 'object' && Object.keys(errors).length > 0}
                        {#each Object.entries(errors) as [field, message]}
                            <li>{message}</li>
                        {/each}
                    {/if}
                {/each}
            </ul>
        </div>
    {/if}
</div> 