<script>
    import { sections } from '$lib/stores/wizardStore';
    import { validationErrors } from '$lib/stores/wizardValidation';
    import { scheduleAutoSave } from '$lib/stores/wizardStore';

    // Predefined section options
    const sectionOptions = [
        {
            name: 'Warmup',
            description: 'Get players physically and mentally ready for practice',
            icon: '🏃‍♂️'
        },
        {
            name: 'Split Position Skills',
            description: 'Focus on position-specific skills in smaller groups',
            icon: '👥'
        },
        {
            name: 'Group Skills',
            description: 'Work on team-wide skills and coordination',
            icon: '🤝'
        },
        {
            name: 'Half Court',
            description: 'Practice plays and strategies in half-court scenarios',
            icon: '🏟️'
        },
        {
            name: 'Scrimmage',
            description: 'Full game simulation and practice',
            icon: '⚔️'
        },
        {
            name: 'Conditioning',
            description: 'Physical fitness and endurance training',
            icon: '💪'
        }
    ];

    // Custom section name input
    let customSectionName = '';

    // Handle adding a predefined section
    function addSection(sectionOption) {
        const newSection = {
            id: `section-${Date.now()}`,
            name: sectionOption.name,
            description: sectionOption.description,
            icon: sectionOption.icon,
            order: $sections.length,
            drills: []
        };
        
        sections.update(current => [...current, newSection]);
        scheduleAutoSave();
    }

    // Handle adding a custom section
    function addCustomSection() {
        if (!customSectionName.trim()) return;
        
        const newSection = {
            id: `section-${Date.now()}`,
            name: customSectionName,
            description: 'Custom section',
            icon: '📝',
            order: $sections.length,
            drills: []
        };
        
        sections.update(current => [...current, newSection]);
        customSectionName = '';
        scheduleAutoSave();
    }

    // Handle removing a section
    function removeSection(index) {
        sections.update(current => {
            const updated = current.filter((_, i) => i !== index);
            // Update order of remaining sections
            return updated.map((section, i) => ({ ...section, order: i }));
        });
        scheduleAutoSave();
    }

    // Handle reordering sections
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

        sections.update(current => {
            const updated = [...current];
            const [removed] = updated.splice(sourceIndex, 1);
            updated.splice(targetIndex, 0, removed);
            return updated.map((section, i) => ({ ...section, order: i }));
        });
        scheduleAutoSave();
    }
</script>

<div class="space-y-8">
    <div>
        <h2 class="text-lg font-medium text-gray-900">Select Practice Sections</h2>
        <p class="mt-1 text-sm text-gray-500">
            Choose the sections you want to include in your practice plan. You can reorder them by dragging.
        </p>
    </div>

    <!-- Selected Sections -->
    <div class="space-y-4">
        <h3 class="text-sm font-medium text-gray-700">Selected Sections</h3>
        {#if $sections.length === 0}
            <p class="text-sm text-gray-500 italic">No sections selected yet</p>
        {:else}
            <div class="space-y-2">
                {#each $sections as section, index}
                    <div class="flex flex-col space-y-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div class="flex items-center space-x-3">
                            <span class="text-xl">{section.icon}</span>
                            <div>
                                <h4 class="text-sm font-medium text-gray-900">{section.name}</h4>
                                <p class="text-sm text-gray-500">{section.description}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            on:click={() => removeSection(index)}
                            class="p-1 text-gray-400 hover:text-red-500"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>

                        <!-- Section Goals -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Section Goals</label>
                            <div class="space-y-2">
                                {#each section.goals || [] as goal, goalIndex}
                                    <div class="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            bind:value={section.goals[goalIndex]}
                                            class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        />
                                        <button
                                            type="button"
                                            on:click={() => removeGoal(index, goalIndex)}
                                            class="text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                {/each}
                                <button
                                    type="button"
                                    on:click={() => addGoal(index)}
                                    class="text-blue-500 hover:text-blue-700 text-sm"
                                >
                                    Add Goal
                                </button>
                            </div>
                        </div>

                        <!-- Section Notes -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Notes</label>
                            <textarea
                                bind:value={section.notes}
                                rows="3"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            ></textarea>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
        {#if $validationErrors.sections?.sections}
            <p class="mt-1 text-sm text-red-600">{$validationErrors.sections.sections}</p>
        {/if}
    </div>

    <!-- Available Sections -->
    <div class="space-y-4">
        <h3 class="text-sm font-medium text-gray-700">Available Sections</h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {#each sectionOptions as option}
                <button
                    type="button"
                    on:click={() => addSection(option)}
                    class="relative flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <span class="text-xl">{option.icon}</span>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-medium text-gray-900">{option.name}</h4>
                        <p class="text-sm text-gray-500">{option.description}</p>
                    </div>
                </button>
            {/each}
        </div>
    </div>

    <!-- Custom Section -->
    <div class="space-y-4">
        <h3 class="text-sm font-medium text-gray-700">Add Custom Section</h3>
        <div class="flex gap-2">
            <input
                type="text"
                bind:value={customSectionName}
                placeholder="Enter section name"
                class="bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md px-3 py-2"
                aria-label="Custom Section Name"
            />
            <button
                type="button"
                on:click={addCustomSection}
                disabled={!customSectionName.trim()}
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Add
            </button>
        </div>
    </div>
</div> 