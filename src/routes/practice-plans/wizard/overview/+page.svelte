<script>
    import { basicInfo, timeline, wizardState, currentStep } from '$lib/stores/wizardStore';
    import { sections as sectionsStore, formatDrillItem } from '$lib/stores/sectionsStore';
    import { goto } from '$app/navigation';
    import { writable } from 'svelte/store';

    let submissionError = writable(null);

    // Format time for display
    function formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
    }

    // Helper to find timeline details for a section
    function getTimelineDetails(sectionId) {
        const timelineSection = $timeline.sections.find(ts => ts.id === sectionId);
        return {
            duration: timelineSection?.duration || 0,
            startTime: timelineSection?.startTime || 0
        };
    }

    // Handle final submission
    async function handleSubmit() {
        submissionError.set(null);
        try {
            // Validation should happen in previous steps or be re-evaluated here
            // For simplicity, skipping detailed re-validation logic here
            // Assuming previous steps ensured data validity according to sectionsStore

            // Construct payload from basicInfo and sectionsStore
            const planData = {
                name: $basicInfo.name,
                description: $basicInfo.description,
                phase_of_season: $basicInfo.phaseOfSeason,
                estimated_number_of_participants: parseInt($basicInfo.participants) || null,
                practice_goals: $basicInfo.practiceGoals.filter(goal => goal && goal.trim()),
                visibility: $basicInfo.visibility,
                is_editable_by_others: $basicInfo.isEditableByOthers,
                sections: $sectionsStore.map((section, sectionIndex) => ({
                    id: section.id,
                    name: section.name,
                    order: sectionIndex,
                    goals: section.goals || [],
                    notes: section.notes || '',
                    items: (section.items || []).map((item, itemIndex) => {
                        const formatted = formatDrillItem(item, section.id);
                        return {
                            type: formatted.type,
                            drill_id: formatted.type === 'drill' ? formatted.id : null,
                            name: formatted.name,
                            duration: formatted.selected_duration || formatted.duration || 0,
                            order_in_plan: itemIndex,
                            diagram_data: formatted.diagram_data,
                            parallel_group_id: formatted.parallel_group_id,
                            parallel_timeline: formatted.parallel_timeline,
                            group_timelines: formatted.groupTimelines,
                            timeline_name: formatted.timeline_name,
                            timeline_color: formatted.timeline_color,
                            ...(formatted.type === 'one-off' && {
                                brief_description: formatted.brief_description,
                                skills_focused_on: formatted.skills_focused_on,
                                skill_level: formatted.skill_level
                            })
                        };
                    })
                }))
            };

            console.log("Submitting Plan Data:", JSON.stringify(planData, null, 2));

            const response = await fetch('/api/practice-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(planData)
            });

            if (!response.ok) {
                let errorMsg = 'Failed to create practice plan.';
                try {
                     const errorData = await response.json();
                     errorMsg = errorData.message || errorData.error || JSON.stringify(errorData);
                } catch(e) {
                    errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
                }
                console.error('Submission Error:', errorMsg);
                submissionError.set(errorMsg);
                throw new Error(errorMsg);
            }

            const data = await response.json();
            if (data.id) {
                 goto(`/practice-plans/${data.id}`);
            } else {
                 console.error('Submission successful, but no ID returned:', data);
                 submissionError.set('Plan created, but failed to redirect.');
            }

        } catch (error) {
            console.error('Failed to create practice plan:', error);
            if (!$submissionError) {
                 submissionError.set(error.message || 'An unexpected error occurred during submission.');
            }
        }
    }

    // Navigate to edit a specific section's drills (pass section ID)
    function goToSectionDrills(sectionId) {
        goto(`/practice-plans/wizard/drills?sectionId=${sectionId}`);
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
                <dd class="mt-1 text-sm text-gray-900">{$basicInfo.name || '-'}</dd>
            </div>
            <div>
                <dt class="text-sm font-medium text-gray-500">Participants</dt>
                <dd class="mt-1 text-sm text-gray-900">{$basicInfo.participants || '-'}</dd>
            </div>
            <div>
                <dt class="text-sm font-medium text-gray-500">Phase of Season</dt>
                <dd class="mt-1 text-sm text-gray-900">{$basicInfo.phaseOfSeason || '-'}</dd>
            </div>
            <div>
                 <dt class="text-sm font-medium text-gray-500">Visibility</dt>
                 <dd class="mt-1 text-sm text-gray-900 capitalize">{$basicInfo.visibility || 'public'}</dd>
            </div>
            <div class="sm:col-span-2">
                <dt class="text-sm font-medium text-gray-500">Practice Goals</dt>
                <dd class="mt-1 text-sm text-gray-900">
                    {#if $basicInfo.practiceGoals && $basicInfo.practiceGoals.filter(g => g && g.trim()).length > 0}
                        <ul class="list-disc pl-5 space-y-1">
                            {#each $basicInfo.practiceGoals.filter(goal => goal && goal.trim()) as goal}
                                <li>{goal}</li>
                            {/each}
                        </ul>
                    {:else}
                        <p class="italic text-gray-500">No goals specified.</p>
                    {/if}
                </dd>
            </div>
             <div class="sm:col-span-2">
                 <dt class="text-sm font-medium text-gray-500">Description</dt>
                 <dd class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{$basicInfo.description || '-'}</dd>
            </div>
        </dl>
    </div>

    <!-- Sections & Items Overview -->
    <div class="space-y-6">
        <h3 class="text-base font-medium text-gray-900">Plan Sections & Items</h3>
        {#if $sectionsStore.length > 0}
            {#each $sectionsStore as section (section.id)}
                {@const timelineDetails = getTimelineDetails(section.id)}
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div>
                                <h4 class="text-sm font-medium text-gray-900">{section.name}</h4>
                                <p class="text-sm text-gray-500">
                                    Duration: {formatTime(timelineDetails.duration)} |
                                    Starts at: {formatTime(timelineDetails.startTime)}
                                </p>
                                {#if section.goals && section.goals.length > 0}
                                    <p class="text-xs text-gray-500 mt-1">Goals: {section.goals.join(', ')}</p>
                                {/if}
                                {#if section.notes}
                                     <p class="text-xs text-gray-500 mt-1">Notes: {section.notes}</p>
                                {/if}
                            </div>
                        </div>
                        <button
                            type="button"
                            on:click={() => goToSectionDrills(section.id)}
                            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Edit Items
                        </button>
                    </div>

                    <!-- Items List -->
                    {#if section.items && section.items.length > 0}
                        <div class="mt-4 space-y-3">
                            {#each section.items as item (item.id)}
                                {@const formattedItem = formatDrillItem(item, section.id)}
                                <div class="flex items-center justify-between py-2 border-t border-gray-100">
                                    <div>
                                        <h5 class="text-sm font-medium text-gray-900">{formattedItem.name}</h5>
                                        <p class="text-xs text-gray-500">{formattedItem.brief_description || ''}</p>
                                        {#if formattedItem.parallel_group_id}
                                             <span class="text-xs text-blue-600">({formattedItem.timeline_name || formattedItem.parallel_timeline})</span>
                                        {/if}
                                    </div>
                                    <div class="text-sm text-gray-500 flex-shrink-0 ml-4">
                                        {formatTime(formattedItem.selected_duration || formattedItem.duration || 0)}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <p class="text-sm text-gray-500 italic">No items added to this section yet.</p>
                    {/if}
                </div>
            {/each}
        {:else}
             <p class="text-sm text-gray-500 italic">No sections defined for this plan yet.</p>
        {/if}
    </div>

    <!-- Submit Button -->
    <div class="flex justify-end mt-8">
        <button
            type="button"
            on:click={handleSubmit}
            class="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
            Create Practice Plan
        </button>
    </div>

    {#if $submissionError}
        <div class="text-red-600 text-sm mt-2 p-3 bg-red-50 border border-red-200 rounded">
            <strong>Error:</strong> {$submissionError}
        </div>
    {/if}
</div> 