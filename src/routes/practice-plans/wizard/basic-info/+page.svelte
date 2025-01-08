<script>
    import { basicInfo } from '$lib/stores/wizardStore';
    import { validationErrors, getFieldError } from '$lib/stores/wizardValidation';
    import { scheduleAutoSave } from '$lib/stores/wizardStore';

    // Phase of season options
    const phaseOptions = [
        'Offseason',
        'Early season, new players',
        'Mid season, skill building',
        'Tournament tuneup',
        'End of season, peaking'
    ];

    // Skill level options
    const skillLevelOptions = [
        'Beginner',
        'Intermediate',
        'Advanced',
        'Elite'
    ];

    // Track which fields have been touched by the user
    let touched = {
        name: false,
        participants: false,
        phaseOfSeason: false,
        skillLevel: false,
        totalTime: false
    };

    // Handle input changes
    function handleChange(field) {
        touched[field] = true;
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
                Practice Plan Name
            </label>
            <div class="mt-1">
                <input
                    type="text"
                    id="name"
                    bind:value={$basicInfo.name}
                    on:input={() => handleChange('name')}
                    on:blur={() => touched.name = true}
                    class="bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md px-3 py-2"
                    aria-label="Practice Plan Name"
                />
                {#if getFieldError('name', touched, $validationErrors)}
                    <p class="mt-1 text-sm text-red-600">{$validationErrors.basicInfo.name}</p>
                {/if}
            </div>
        </div>

        <!-- Number of Participants -->
        <div>
            <label for="participants" class="block text-sm font-medium text-gray-700">
                Number of Participants
            </label>
            <div class="mt-1">
                <input
                    type="number"
                    id="participants"
                    bind:value={$basicInfo.participants}
                    on:input={() => handleChange('participants')}
                    on:blur={() => touched.participants = true}
                    min="1"
                    class="bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md px-3 py-2"
                    aria-label="Number of Participants"
                />
                {#if getFieldError('participants', touched, $validationErrors)}
                    <p class="mt-1 text-sm text-red-600">{$validationErrors.basicInfo.participants}</p>
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
                    on:change={() => handleChange('phaseOfSeason')}
                    on:blur={() => touched.phaseOfSeason = true}
                    class="bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md px-3 py-2"
                    aria-label="Phase of Season"
                >
                    <option value="">Select a phase</option>
                    {#each phaseOptions as phase}
                        <option value={phase}>{phase}</option>
                    {/each}
                </select>
                {#if getFieldError('phaseOfSeason', touched, $validationErrors)}
                    <p class="mt-1 text-sm text-red-600">{$validationErrors.basicInfo.phaseOfSeason}</p>
                {/if}
            </div>
        </div>

        <!-- Skill Level -->
        <div>
            <label for="skill" class="block text-sm font-medium text-gray-700">
                Skill Level
            </label>
            <div class="mt-1">
                <select
                    id="skill"
                    bind:value={$basicInfo.skillLevel}
                    on:change={() => handleChange('skillLevel')}
                    on:blur={() => touched.skillLevel = true}
                    class="bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md px-3 py-2"
                    aria-label="Skill Level"
                >
                    <option value="">Select skill level</option>
                    {#each skillLevelOptions as level}
                        <option value={level}>{level}</option>
                    {/each}
                </select>
                {#if getFieldError('skillLevel', touched, $validationErrors)}
                    <p class="mt-1 text-sm text-red-600">{$validationErrors.basicInfo.skillLevel}</p>
                {/if}
            </div>
        </div>

        <!-- Total Time -->
        <div>
            <label for="time" class="block text-sm font-medium text-gray-700">
                Total Practice Time (minutes)
            </label>
            <div class="mt-1">
                <input
                    type="number"
                    id="time"
                    bind:value={$basicInfo.totalTime}
                    on:input={() => handleChange('totalTime')}
                    on:blur={() => touched.totalTime = true}
                    min="1"
                    class="bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md px-3 py-2"
                    aria-label="Total Practice Time"
                />
                {#if getFieldError('totalTime', touched, $validationErrors)}
                    <p class="mt-1 text-sm text-red-600">{$validationErrors.basicInfo.totalTime}</p>
                {/if}
            </div>
        </div>

        <!-- Practice Goals -->
        <div>
            <div class="flex justify-between items-center">
                <label class="block text-sm font-medium text-gray-700">
                    Practice Goals
                </label>
                <button
                    type="button"
                    on:click={addPracticeGoal}
                    class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                    Add Goal
                </button>
            </div>
            <div class="mt-2 space-y-3">
                {#each $basicInfo.practiceGoals as goal, index}
                    <div class="flex gap-2">
                        <input
                            type="text"
                            bind:value={$basicInfo.practiceGoals[index]}
                            on:input={handleChange}
                            placeholder="Enter a practice goal"
                            class="bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md px-3 py-2"
                            aria-label={`Practice Goal ${index + 1}`}
                        />
                        <button
                            type="button"
                            on:click={() => removePracticeGoal(index)}
                            class="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                {/each}
            </div>
            {#if $validationErrors.basicInfo?.practiceGoals}
                <p class="mt-1 text-sm text-red-600">{$validationErrors.basicInfo.practiceGoals}</p>
            {/if}
        </div>

        <!-- Description field -->
        <div>
            <label for="description" class="block text-sm font-medium text-gray-700">
                Description
            </label>
            <textarea
                id="description"
                bind:value={$basicInfo.description}
                rows="3"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            ></textarea>
        </div>

        <!-- Visibility settings -->
        <div>
            <label class="block text-sm font-medium text-gray-700">Visibility</label>
            <select
                bind:value={$basicInfo.visibility}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
            </select>
        </div>

        <!-- Editability settings -->
        <div>
            <label class="flex items-center space-x-2">
                <input
                    type="checkbox"
                    bind:checked={$basicInfo.isEditableByOthers}
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700">Allow others to edit this practice plan</span>
            </label>
        </div>
    </div>
</div> 