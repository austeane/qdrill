<script>
	import { page } from '$app/stores';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue,
	} from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Check, ChevronsUpDown } from 'lucide-svelte';
	import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk-sv';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import { writable } from 'svelte/store'; // Import writable for local store

	// --- Import stores from the correct metadata store ---
	import {
		// practicePlanStore, // Removed
		planName,
		planDescription,
		// skillLevel, // Does not exist in metadata store
		estimatedNumberOfParticipants as participantCount, // Alias store variable
		practiceGoals, // Assuming this is the store for the array
		// focusAreas, // Does not exist in metadata store
		visibility,
		isEditableByOthers,
		phaseOfSeason, // Store for phaseOfSeason
		startTime, // Store for startTime
		// Import the actual store actions
		addPracticeGoal, 
		removePracticeGoal, 
		updatePracticeGoal 
	} from '$lib/stores/practicePlanMetadataStore'; // Corrected path

	// TODO: Import metadataErrors store if it exists separately and is needed here
	let metadataErrors = {}; // Keep local or import if needed

	export let skillOptions = [];
	export let focusAreaOptions = [];

	// Define phaseOfSeasonOptions locally as they are just display options
	let phaseOfSeasonOptions = ['Pre-season', 'Regular Season', 'Post-season', 'Tournament Prep'];

	// Local state for focusAreas since it's not in the central store
	let localFocusAreas = writable([]); // Use a local writable store

	// Local state for skillLevel
	let localSkillLevel = ''; // Use a simple reactive variable

	// Combobox state
	let open = false;
	let value = ''; // For search input

	// Helper function to update LOCAL focusAreas state
	function handleSelectFocusArea(currentValue) {
		localFocusAreas.update(currentAreas => {
			if (currentAreas.includes(currentValue)) {
				// Remove
				return currentAreas.filter((v) => v !== currentValue);
			} else {
				// Add
				return [...currentAreas, currentValue];
			}
		});
	}

	// Update selectedLabels to use the local store
	$: selectedLabels = focusAreaOptions
		.filter((option) => $localFocusAreas.includes(option.value)) // Use $localFocusAreas
		.map((option) => option.label)
		.join(', ');

	// Remove conflicting local declarations for store-managed variables/functions:
	// let phaseOfSeason = ''; 
	// let practiceGoals = []; 
	// function addPracticeGoal() { ... } 
	// function removePracticeGoal(index) { ... } 
	// function updatePracticeGoal(index, value) { ... } 
	// let startTime = '09:00'; 

</script>

<div class="space-y-4 mb-6">
	<h2 class="text-xl font-semibold">Plan Details</h2>

	<div>
		<Label for="planName">Plan Name</Label>
		<Input id="planName" name="planName" bind:value={$planName} placeholder="e.g., Wednesday Throwing Focus" required />
		{#if $page.form?.errors?.name}
			<p class="text-red-500 text-sm mt-1">{$page.form.errors.name[0]}</p>
		{:else if metadataErrors.name?.[0]}
			<p class="text-red-500 text-sm mt-1">{metadataErrors.name[0]}</p>
		{/if}
	</div>

	<div>
		<Label for="planDescription">Plan Description</Label>
		<Textarea id="planDescription" name="planDescription" bind:value={$planDescription} placeholder="Briefly describe the practice plan..." rows="3"></Textarea>
		{#if $page.form?.errors?.description}
			<p class="text-red-500 text-sm mt-1">{$page.form.errors.description[0]}</p>
		{:else if metadataErrors.description?.[0]}
			<p class="text-red-500 text-sm mt-1">{metadataErrors.description[0]}</p>
		{/if}
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div>
			<Label for="skillLevel">Skill Level</Label>
			<Select name="skillLevel" bind:value={localSkillLevel}>
				<SelectTrigger id="skillLevel">
					<SelectValue placeholder="Select skill level..." />
				</SelectTrigger>
				<SelectContent>
					{#each skillOptions as option}
						<SelectItem value={option.value}>{option.label}</SelectItem>
					{/each}
				</SelectContent>
			</Select>
			<!-- Error handling for skillLevel -->
		</div>

		<div>
			<Label for="participantCount">Participant Count</Label>
			<Input id="participantCount" name="participantCount" type="number" min="1" bind:value={$participantCount} placeholder="e.g., 15" />
			<!-- Error handling for participantCount -->
		</div>

		<div>
			<Label for="phaseOfSeason">Phase of Season</Label>
			<Select name="phaseOfSeason" bind:value={$phaseOfSeason}>
				<SelectTrigger id="phaseOfSeason">
					<SelectValue placeholder="Select phase..." />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="">Select Phase</SelectItem>
					{#each phaseOfSeasonOptions as option}
						<SelectItem value={option}>{option}</SelectItem>
					{/each}
				</SelectContent>
			</Select>
			<!-- Error handling for phaseOfSeason -->
		</div>
	</div>

	<div>
		<Label for="startTime">Practice Start Time</Label>
		<Input id="startTime" name="startTime" type="time" bind:value={$startTime} /> 		<!-- Error handling for startTime -->
	</div>

	<div>
		<Label for="focusAreas">Focus Areas</Label>
		<Popover bind:open>
			<PopoverTrigger asChild let:builder>
				<Button
					builders={[builder]}
					variant="outline"
					role="combobox"
					aria-expanded={open}
					class="w-full justify-between"
					id="focusAreas"
				>
					<span class="truncate">
						{selectedLabels || 'Select focus areas...'}
					</span>
					<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent class="w-[--trigger-width] p-0">
				<Command>
					<CommandInput placeholder="Search focus areas..." />
					<CommandList>
						<CommandEmpty>No focus area found.</CommandEmpty>
						<CommandGroup>
							{#each focusAreaOptions as option}
								<CommandItem
									value={option.value}
									onSelect={() => {
										handleSelectFocusArea(option.value);
										// Optionally close popover on select: open = false;
									}}
								>
									<Check class={cn('mr-2 h-4 w-4', $localFocusAreas.includes(option.value) ? 'opacity-100' : 'opacity-0')} />
									{option.label}
								</CommandItem>
							{/each}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
		<!-- Error handling for focusAreas -->
	</div>

	<div>
		<Label id="practice-goals-label">Practice Goals</Label>
		<div role="list" aria-labelledby="practice-goals-label" class="space-y-2">
			{#each $practiceGoals as goal, index}
				<div class="flex items-center space-x-2">
					<Input
						type="text"
						name="practiceGoals[]"
						bind:value={goal}
						on:input={(e) => updatePracticeGoal(index, e.target.value)}
						placeholder="Enter practice goal"
						class="flex-1"
					/>
					{#if $practiceGoals.length > 1}
						<Button type="button" variant="destructive" size="sm" on:click={() => removePracticeGoal(index)}>Remove</Button>
					{/if}
				</div>
			{/each}
		</div>
		<Button type="button" variant="outline" size="sm" on:click={addPracticeGoal} class="mt-2">+ Add Goal</Button>
		<!-- Error handling for practiceGoals -->
	</div>

	<!-- Visibility settings -->
	<div class="space-y-2">
		<div>
			<Label for="visibility-select">Visibility</Label>
			<Select
				name="visibility"
				bind:value={$visibility}
				disabled={!$page.data.session}
			>
				<SelectTrigger id="visibility-select" title={!$page.data.session ? 'Log in to change visibility' : ''}>
					<SelectValue placeholder="Select visibility..." />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="public">Public</SelectItem>
					{#if $page.data.session}
						<SelectItem value="unlisted">Unlisted</SelectItem>
						<SelectItem value="private">Private</SelectItem>
					{/if}
				</SelectContent>
			</Select>
			{#if !$page.data.session}
				<p class="text-sm text-muted-foreground mt-1">Anonymous submissions are always public.</p>
			{/if}
		</div>

		<div>
			<Label class="flex items-center space-x-2">
				<Input
					type="checkbox"
					name="isEditableByOthers"
					bind:checked={$isEditableByOthers}
					disabled={!$page.data.session}
				/>
				<span>Allow others to edit</span>
				{#if !$page.data.session}
					<span class="text-muted-foreground">(required for anonymous)</span>
				{/if}
			</Label>
		</div>
	</div>

</div> 