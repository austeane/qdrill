<script>
	import { page } from '$app/stores';
	import { writable } from 'svelte/store';

	// --- Import stores ---
	import {
		planName,
		planDescription,
		estimatedNumberOfParticipants,
		practiceGoals,
		visibility,
		isEditableByOthers,
		phaseOfSeason,
		startTime,
		addPracticeGoal,
		removePracticeGoal,
		updatePracticeGoal,
		errors as metadataErrors
	} from '$lib/stores/practicePlanMetadataStore';

	export let skillOptions = [];
	export let focusAreaOptions = [];

	// Local state for phaseOfSeason dropdown
	let phaseOfSeasonOptions = ['Pre-season', 'Regular Season', 'Post-season', 'Tournament Prep'];

	// Local state for focusAreas checkboxes
	let localFocusAreas = writable([]);

	// Local state for skillLevel dropdown
	let localSkillLevel = '';

	// Helper function to update localFocusAreas for checkboxes
	function handleFocusAreaChange(event) {
		const { value, checked } = event.target;
		localFocusAreas.update((currentAreas) => {
			if (checked) {
				return [...currentAreas, value];
			} else {
				return currentAreas.filter((v) => v !== value);
			}
		});
	}

	// Removed selectedLabels logic for popover
</script>

<div class="space-y-4 mb-6">
	<h2 class="text-xl font-semibold">Plan Details</h2>

	<div>
		<!-- Standard label -->
		<label for="planName" class="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
		<!-- Standard input -->
		<input
			id="planName"
			name="planName"
			bind:value={$planName}
			placeholder="e.g., Wednesday Throwing Focus"
			required
			class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
		/>
		{#if $page.form?.errors?.name}
			<p class="text-red-500 text-sm mt-1">{$page.form.errors.name[0]}</p>
		{:else if $metadataErrors.name?.[0]}
			<p class="text-red-500 text-sm mt-1">{$metadataErrors.name[0]}</p>
		{/if}
	</div>

	<div>
		<!-- Standard label -->
		<label for="planDescription" class="block text-sm font-medium text-gray-700 mb-1"
			>Plan Description</label
		>
		<!-- Standard textarea -->
		<textarea
			id="planDescription"
			name="planDescription"
			bind:value={$planDescription}
			placeholder="Briefly describe the practice plan..."
			rows="3"
			class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
		>
		</textarea>
		{#if $page.form?.errors?.description}
			<p class="text-red-500 text-sm mt-1">{$page.form.errors.description[0]}</p>
		{:else if $metadataErrors.description?.[0]}
			<p class="text-red-500 text-sm mt-1">{$metadataErrors.description[0]}</p>
		{/if}
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div>
			<!-- Standard label -->
			<label for="skillLevel" class="block text-sm font-medium text-gray-700 mb-1"
				>Skill Level</label
			>
			<!-- Standard select -->
			<select
				id="skillLevel"
				name="skillLevel"
				bind:value={localSkillLevel}
				class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
			>
				<option value="" disabled>Select skill level...</option>
				{#each skillOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
			<!-- Error handling for skillLevel -->
		</div>

		<div>
			<!-- Standard label -->
			<label for="participantCount" class="block text-sm font-medium text-gray-700 mb-1"
				>Participant Count</label
			>
			<!-- Standard input -->
                        <input
                                id="participantCount"
                                name="participantCount"
                                type="number"
                                min="1"
                                bind:value={$estimatedNumberOfParticipants}
                                placeholder="e.g., 15"
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        {#if $metadataErrors.estimated_number_of_participants?.[0]}
                                <p class="text-red-500 text-sm mt-1">{$metadataErrors.estimated_number_of_participants[0]}</p>
                        {/if}
                </div>

		<div>
			<!-- Standard label -->
			<label for="phaseOfSeason" class="block text-sm font-medium text-gray-700 mb-1"
				>Phase of Season</label
			>
			<!-- Standard select -->
                        <select
                                id="phaseOfSeason"
                                name="phaseOfSeason"
                                bind:value={$phaseOfSeason}
                                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                                <option value="">Select Phase</option>
                                {#each phaseOfSeasonOptions as option}
                                        <option value={option}>{option}</option>
                                {/each}
                        </select>
                        {#if $metadataErrors.phase_of_season?.[0]}
                                <p class="text-red-500 text-sm mt-1">{$metadataErrors.phase_of_season[0]}</p>
                        {/if}
                </div>
        </div>

	<div>
		<!-- Standard label -->
		<label for="startTime" class="block text-sm font-medium text-gray-700 mb-1"
			>Practice Start Time</label
		>
		<!-- Standard input -->
                <input
                        id="startTime"
                        name="startTime"
                        type="time"
                        bind:value={$startTime}
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {#if $metadataErrors.start_time?.[0]}
                        <p class="text-red-500 text-sm mt-1">{$metadataErrors.start_time[0]}</p>
                {/if}
        </div>

	<div>
		<!-- Standard label -->
		<label class="block text-sm font-medium text-gray-700 mb-1">Focus Areas</label>
		<!-- Replaced Popover/Command with Checkboxes -->
                <div class="mt-2 space-y-2 border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto">
			{#if focusAreaOptions.length === 0}
				<p class="text-sm text-gray-500">No focus areas available.</p>
			{:else}
				{#each focusAreaOptions as option}
					<label class="flex items-center space-x-2 cursor-pointer">
						<input
							type="checkbox"
							value={option.value}
							checked={$localFocusAreas.includes(option.value)}
							on:change={handleFocusAreaChange}
							class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
						/>
						<span class="text-sm text-gray-700">{option.label}</span>
					</label>
				{/each}
			{/if}
                </div>
                {#if $metadataErrors.focus_areas?.[0]}
                        <p class="text-red-500 text-sm mt-1">{$metadataErrors.focus_areas[0]}</p>
                {/if}
        </div>

	<div>
		<label id="practice-goals-label" class="block text-sm font-medium text-gray-700 mb-1"
			>Practice Goals</label
		>
		<div role="list" aria-labelledby="practice-goals-label" class="space-y-2">
			{#each $practiceGoals as goal, index}
				<div class="flex items-center space-x-2">
					<!-- Standard input -->
					<input
						type="text"
						name="practiceGoals[]"
						bind:value={goal}
						on:input={(e) => updatePracticeGoal(index, e.target.value)}
						placeholder="Enter practice goal"
						class="flex-1 mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
					{#if $practiceGoals.length > 1}
						<!-- Standard button -->
						<button
							type="button"
							on:click={() => removePracticeGoal(index)}
							class="inline-flex justify-center py-1 px-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
						>
							Remove
						</button>
					{/if}
				</div>
			{/each}
		</div>
		<!-- Standard button -->
                <button
                        type="button"
                        on:click={addPracticeGoal}
                        class="mt-2 inline-flex justify-center py-1 px-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                        + Add Goal
                </button>
                {#if $metadataErrors.practice_goals?.[0]}
                        <p class="text-red-500 text-sm mt-1">{$metadataErrors.practice_goals[0]}</p>
                {/if}
        </div>

	<!-- Visibility settings -->
	<div class="space-y-2">
		<div>
			<!-- Standard label -->
			<label for="visibility-select" class="block text-sm font-medium text-gray-700 mb-1"
				>Visibility</label
			>
			<!-- Standard select -->
			<select
				id="visibility-select"
				name="visibility"
				bind:value={$visibility}
				disabled={!$page.data.session}
				class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
				title={!$page.data.session ? 'Log in to change visibility' : ''}
			>
				<option value="public">Public</option>
				{#if $page.data.session}
					<option value="unlisted">Unlisted</option>
					<option value="private">Private</option>
				{/if}
			</select>
			{#if !$page.data.session}
				<p class="text-sm text-muted-foreground mt-1">Anonymous submissions are always public.</p>
			{/if}
		</div>

		<div>
			<!-- Standard label wrapping checkbox -->
			<label class="flex items-center space-x-2">
				<!-- Standard input checkbox -->
				<input
					type="checkbox"
					name="isEditableByOthers"
					bind:checked={$isEditableByOthers}
					disabled={!$page.data.session}
					class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:cursor-not-allowed"
				/>
				<span class="text-sm text-gray-700">Allow others to edit</span>
				{#if !$page.data.session}
					<span class="text-sm text-muted-foreground">(required for anonymous)</span>
				{/if}
			</label>
		</div>
	</div>
</div>
