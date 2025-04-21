<script>
    // Import the main sections store
    import { sections as sectionsStore, addSection as addStoreSection, removeSection as removeStoreSection, updateSectionGoals } from '$lib/stores/sectionsStore';
    // Removed import from wizardStore
    // Removed import from wizardValidation (assuming it was only for sections)
    // Removed import for scheduleAutoSave as section state is now global

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
        // Use the store's addSection function
        addStoreSection(); // Adds a generic section

        // Update the last added section with the predefined details
        sectionsStore.update(current => {
            const lastSectionIndex = current.length - 1;
            if (lastSectionIndex >= 0) {
                // We don't store description or icon in the main store, only name
                current[lastSectionIndex].name = sectionOption.name;
                // Optionally add default goals or notes if needed based on sectionOption
            }
            return current;
        });
        // scheduleAutoSave(); // Removed
    }

    // Handle adding a custom section
    function addCustomSection() {
        if (!customSectionName.trim()) return;

        // Use the store's addSection function
        addStoreSection(); // Adds a generic section

        // Update the last added section with the custom name
        sectionsStore.update(current => {
            const lastSectionIndex = current.length - 1;
            if (lastSectionIndex >= 0) {
                current[lastSectionIndex].name = customSectionName;
            }
            return current;
        });

        customSectionName = '';
        // scheduleAutoSave(); // Removed
    }

    // Handle removing a section by ID
    function removeSection(sectionId) {
        removeStoreSection(sectionId);
        // scheduleAutoSave(); // Removed
    }

    // Handle reordering sections using the store's update
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

        sectionsStore.update(current => {
            const updated = [...current];
            const [removed] = updated.splice(sourceIndex, 1);
            updated.splice(targetIndex, 0, removed);
            // Update order property for consistency
            return updated.map((section, i) => ({ ...section, order: i }));
        });
        // scheduleAutoSave(); // Removed
    }

    // --- Functions for managing goals and notes ---
    // These assume direct binding works or call functions in sectionsStore if needed

    function addGoal(sectionId) {
        sectionsStore.update(current => {
            const sectionIndex = current.findIndex(s => s.id === sectionId);
            if (sectionIndex > -1) {
                // Ensure goals array exists
                if (!Array.isArray(current[sectionIndex].goals)) {
                     current[sectionIndex].goals = [];
                }
                current[sectionIndex].goals.push(''); // Add empty goal
            }
            return current;
        });
        // Call scheduleAutoSave() if needed for other wizard state changes
    }

    function removeGoal(sectionId, goalIndex) {
         sectionsStore.update(current => {
            const sectionIndex = current.findIndex(s => s.id === sectionId);
            if (sectionIndex > -1 && current[sectionIndex].goals?.[goalIndex] !== undefined) {
                current[sectionIndex].goals.splice(goalIndex, 1);
            }
            return current;
        });
       // Call scheduleAutoSave() if needed for other wizard state changes
    }

    // Direct binding for section name (assuming name is editable here, though UI doesn't show it)
    // function handleNameChange(sectionId, event) {
    //     const newName = event.target.value;
    //     sectionsStore.update(current => {
    //         const sectionIndex = current.findIndex(s => s.id === sectionId);
    //         if (sectionIndex > -1) {
    //              current[sectionIndex].name = newName;
    //         }
    //         return current;
    //     });
    // }

    // Direct binding for notes should work with bind:value=$section.notes

</script>

<div class="space-y-8">
    <div>
        <h2 class="text-lg font-medium text-gray-900">Define Practice Sections</h2>
        <p class="mt-1 text-sm text-gray-500">
            Add sections like Warmup, Skills, Scrimmage. You can reorder them by dragging. Add specific goals and notes for each section.
        </p>
    </div>

    <!-- Selected Sections -->
    <div class="space-y-4">
        <h3 class="text-sm font-medium text-gray-700">Plan Sections</h3>
        {#if $sectionsStore.length === 0}
            <p class="text-sm text-gray-500 italic">No sections added yet. Use the options below.</p>
        {:else}
            <div class="space-y-2">
                {#each $sectionsStore as section (section.id)}  <!-- Use section.id as key -->
                    {@const sectionId = section.id} <!-- Capture sectionId for closures -->
                    {@const sectionIndex = $sectionsStore.findIndex(s => s.id === sectionId)} <!-- Find index for drag/drop -->
                     <div
                        class="flex flex-col space-y-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                        draggable="true"
                        on:dragstart={(e) => handleDragStart(e, sectionIndex)}
                        on:dragover={handleDragOver}
                        on:drop={(e) => handleDrop(e, sectionIndex)}
                    >
                        <div class="flex items-start justify-between">
                            <div class="flex items-center space-x-3">
                                <!-- Icon might not be stored, maybe derive from name or remove -->
                                <!-- <span class="text-xl">{section.icon || '📝'}</span> -->
                                <div>
                                    <!-- Make name editable -->
                                    <input
                                        type="text"
                                        bind:value={section.name}
                                        class="text-sm font-medium text-gray-900 border-none p-0 focus:ring-0"
                                        placeholder="Section Name"
                                    />
                                    <!-- Description not stored -->
                                    <!-- <p class="text-sm text-gray-500">{section.description}</p> -->
                                </div>
                            </div>
                             <button
                                type="button"
                                on:click={() => removeSection(sectionId)}
                                class="p-1 text-gray-400 hover:text-red-500"
                                aria-label="Remove section"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <!-- Section Goals -->
                        <div class="pl-5"> <!-- Indent goal/notes -->
                            <label for="section-goals-{sectionId}" class="block text-sm font-medium text-gray-700">Section Goals</label>
                            <div class="mt-1 space-y-2">
                                {#if section.goals && section.goals.length > 0}
                                    {#each section.goals as goal, goalIndex (goalIndex)} <!-- Use index as key for goals -->
                                        <div class="flex items-center space-x-2">
                                            <input
                                                id="section-goals-{sectionId}-{goalIndex}"
                                                type="text"
                                                bind:value={section.goals[goalIndex]}
                                                placeholder="e.g., Improve transition defense"
                                                class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            />
                                            <button
                                                type="button"
                                                on:click={() => removeGoal(sectionId, goalIndex)}
                                                class="text-xs text-red-600 hover:text-red-800"
                                                aria-label="Remove goal"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    {/each}
                                {:else}
                                     <p class="text-xs text-gray-500 italic">No goals added yet.</p>
                                {/if}
                                <button
                                    type="button"
                                    on:click={() => addGoal(sectionId)}
                                    class="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    + Add Goal
                                </button>
                            </div>
                        </div>

                        <!-- Section Notes -->
                         <div class="pl-5">
                            <label for="section-notes-{sectionId}" class="block text-sm font-medium text-gray-700">Notes</label>
                            <textarea
                                id="section-notes-{sectionId}"
                                bind:value={section.notes}
                                rows="2"
                                placeholder="Optional notes for this section..."
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            ></textarea>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Available Sections -->
    <div class="space-y-4 pt-6 border-t border-gray-200">
        <h3 class="text-sm font-medium text-gray-700">Add Predefined Section</h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {#each sectionOptions as option}
                <button
                    type="button"
                    on:click={() => addSection(option)}
                    class="relative flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-left"
                 >
                    <span class="text-xl flex-shrink-0">{option.icon}</span>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-medium text-gray-900">{option.name}</h4>
                        <p class="text-sm text-gray-500">{option.description}</p>
                    </div>
                </button>
            {/each}
        </div>
    </div>

    <!-- Custom Section -->
    <div class="space-y-4 pt-6 border-t border-gray-200">
        <h3 class="text-sm font-medium text-gray-700">Add Custom Section</h3>
        <div class="flex gap-2">
            <input
                type="text"
                bind:value={customSectionName}
                placeholder="Enter custom section name (e.g., Team Building)"
                class="bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md px-3 py-2"
                aria-label="Custom Section Name"
            />
            <button
                type="button"
                on:click={addCustomSection}
                disabled={!customSectionName.trim()}
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
                Add Custom
            </button>
        </div>
    </div>
</div> 