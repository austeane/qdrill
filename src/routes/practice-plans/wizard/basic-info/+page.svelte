<script>
    import { onMount } from 'svelte';
    import { basicInfo, validationErrors } from '$lib/stores/wizardStore';
    import { scheduleAutoSave } from '$lib/stores/wizardStore';
    
    // Change Editor import to be loaded dynamically
    let Editor;

    onMount(async () => {
        try {
            console.log('Loading TinyMCE editor...');
            const module = await import('@tinymce/tinymce-svelte');
            Editor = module.default;
            console.log('TinyMCE editor loaded successfully');
        } catch (error) {
            console.error('Error loading TinyMCE:', error);
        }
    });

    // Phase of season options
    const phaseOptions = [
        'Offseason',
        'Early season, new players',
        'Mid season, skill building',
        'Tournament tuneup',
        'End of season, peaking'
    ];

    // Handle input changes
    function handleChange() {
        scheduleAutoSave();
    }

    // Add practice goal
    function addPracticeGoal() {
        $basicInfo.practiceGoals = [...$basicInfo.practiceGoals, ''];
        handleChange();
    }

    // Remove practice goal
    function removePracticeGoal(index) {
        $basicInfo.practiceGoals = $basicInfo.practiceGoals.filter((_, i) => i !== index);
        handleChange();
    }

    // Handle description change
    function handleDescriptionChange(e) {
        $basicInfo.description = e.target.getContent();
        handleChange();
    }
</script>

<div class="space-y-8">
    <div>
        <h2 class="text-lg font-medium text-gray-900">Basic Information</h2>
        <p class="mt-1 text-sm text-gray-500">
            Let's start with the basic details of your practice plan.
        </p>
    </div>

    <div class="space-y-6">
        <!-- Plan Name -->
        <div>
            <label for="name" class="block text-sm font-medium text-gray-700">
                Practice Plan Name <span class="text-red-500">*</span>
            </label>
            <div class="mt-1">
                <input
                    type="text"
                    id="name"
                    bind:value={$basicInfo.name}
                    on:input={handleChange}
                    class="bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md px-3 py-2"
                    aria-label="Practice Plan Name"
                    aria-invalid={$validationErrors.name ? 'true' : 'false'} 
                    aria-describedby={$validationErrors.name ? 'name-error' : undefined}
                />
                {#if $validationErrors.name}
                    <p id="name-error" class="mt-1 text-sm text-red-600">{$validationErrors.name[0]}</p>
                {/if}
            </div>
        </div>

        <!-- Number of Participants -->
        <div>
            <label for="participants" class="block text-sm font-medium text-gray-700">
                Estimated Number of Participants
            </label>
            <div class="mt-1">
                <input
                    type="number"
                    id="participants"
                    bind:value={$basicInfo.participants}
                    on:input={handleChange}
                    min="1"
                    class="bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md px-3 py-2"
                    aria-label="Number of Participants"
                    aria-invalid={$validationErrors.participants ? 'true' : 'false'} 
                    aria-describedby={$validationErrors.participants ? 'participants-error' : undefined}
                />
                {#if $validationErrors.participants}
                    <p id="participants-error" class="mt-1 text-sm text-red-600">{$validationErrors.participants[0]}</p>
                {/if}
            </div>
        </div>

        <!-- Phase of Season -->
        <div>
            <label for="phase" class="block text-sm font-medium text-gray-700">
                Phase of Season
            </label>
            <div class="mt-1">
                <select
                    id="phase"
                    bind:value={$basicInfo.phaseOfSeason} 
                    on:change={handleChange}
                    class="bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md px-3 py-2"
                    aria-label="Phase of Season"
                     aria-invalid={$validationErrors.phaseOfSeason ? 'true' : 'false'} 
                    aria-describedby={$validationErrors.phaseOfSeason ? 'phase-error' : undefined}
                >
                    <option value={null}>Select a phase (optional)</option>
                    {#each phaseOptions as phase}
                        <option value={phase}>{phase}</option>
                    {/each}
                </select>
                {#if $validationErrors.phaseOfSeason}
                    <p id="phase-error" class="mt-1 text-sm text-red-600">{$validationErrors.phaseOfSeason[0]}</p>
                {/if}
            </div>
        </div>

        <!-- Practice Goals -->
        <div>
            <div class="flex justify-between items-center">
                <label class="block text-sm font-medium text-gray-700">
                    Practice Goals <span class="text-red-500">*</span>
                </label>
                <button
                    type="button"
                    on:click={addPracticeGoal}
                    class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                    Add Goal
                </button>
            </div>
            <div class="mt-2 space-y-3" 
                 role="group" 
                 aria-labelledby="practice-goals-label" 
                 aria-describedby={$validationErrors.practiceGoals ? 'practice-goals-error' : undefined}>
                {#each $basicInfo.practiceGoals as goal, index}
                    <div class="flex gap-2">
                        <input
                            type="text"
                            bind:value={$basicInfo.practiceGoals[index]}
                            on:input={handleChange}
                            placeholder="Enter a practice goal"
                            class="bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md px-3 py-2"
                            aria-label={`Practice Goal ${index + 1}`}
                            aria-invalid={$validationErrors.practiceGoals?.[index] ? 'true' : undefined}
                        />
                        <button
                            type="button"
                            on:click={() => removePracticeGoal(index)}
                            class="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                            aria-label={`Remove Practice Goal ${index + 1}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                {/each}
            </div>
            {#if $validationErrors.practiceGoals}
                <p id="practice-goals-error" class="mt-1 text-sm text-red-600">{$validationErrors.practiceGoals[0]}</p> 
            {/if}
        </div>

        <!-- Description field -->
        <div>
            <label for="description" class="block text-sm font-medium text-gray-700">
                Description (Optional)
            </label>
            <div class="mt-1">
                {#if Editor}
                    <div class="min-h-[300px]">
                        <svelte:component
                            this={Editor}
                            id="description"
                            apiKey={import.meta.env.VITE_TINY_API_KEY}
                            init={{
                                height: 300,
                                menubar: false,
                                plugins: [
                                    'advlist', 'autolink', 'lists', 'link', 'charmap',
                                    'anchor', 'searchreplace', 'visualblocks', 'code',
                                    'insertdatetime', 'table', 'code', 'help', 'wordcount'
                                ],
                                toolbar: 'undo redo | blocks | ' +
                                        'bold italic | alignleft aligncenter ' +
                                        'alignright alignjustify | bullist numlist outdent indent | ' +
                                        'removeformat | help',
                                content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }',
                                branding: false,
                                setup: (editor) => {
                                    editor.on('change keyup', (e) => {
                                         $basicInfo.description = editor.getContent();
                                         handleChange();
                                    });
                                }
                            }}
                            value={$basicInfo.description}
                            aria-invalid={$validationErrors.description ? 'true' : 'false'} 
                            aria-describedby={$validationErrors.description ? 'description-error' : undefined}
                        />
                    </div>
                {:else}
                    <textarea
                        id="description"
                        bind:value={$basicInfo.description}
                        on:input={handleChange}
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        rows="8"
                        aria-invalid={$validationErrors.description ? 'true' : 'false'} 
                        aria-describedby={$validationErrors.description ? 'description-error' : undefined}
                    ></textarea>
                {/if}
                {#if $validationErrors.description}
                    <p id="description-error" class="mt-1 text-sm text-red-600">{$validationErrors.description[0]}</p>
                {/if}
            </div>
        </div>

        <!-- Visibility settings -->
        <div>
            <label class="block text-sm font-medium text-gray-700">Visibility</label>
            <select
                bind:value={$basicInfo.visibility}
                on:change={handleChange}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                aria-invalid={$validationErrors.visibility ? 'true' : 'false'} 
                aria-describedby={$validationErrors.visibility ? 'visibility-error' : undefined}
            >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
            </select>
            {#if $validationErrors.visibility}
                <p id="visibility-error" class="mt-1 text-sm text-red-600">{$validationErrors.visibility[0]}</p>
            {/if}
        </div>

        <!-- Editability settings -->
        <div>
            <label class="flex items-center space-x-2">
                <input
                    type="checkbox"
                    bind:checked={$basicInfo.isEditableByOthers}
                    on:change={handleChange}
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    aria-invalid={$validationErrors.isEditableByOthers ? 'true' : 'false'} 
                    aria-describedby={$validationErrors.isEditableByOthers ? 'editable-error' : undefined}
                />
                <span class="text-sm text-gray-700">Allow others to edit this practice plan</span>
            </label>
             {#if $validationErrors.isEditableByOthers}
                <p id="editable-error" class="mt-1 text-sm text-red-600">{$validationErrors.isEditableByOthers[0]}</p>
            {/if}
        </div>
    </div>
</div> 