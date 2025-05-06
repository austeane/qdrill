<script>
	import { createEventDispatcher } from 'svelte';
	// Removed shadcn component imports - Card, Button, Input, Label, Textarea, Select, Popover, etc.
	import Spinner from '$lib/components/Spinner.svelte';
	// Removed lucide-svelte, cmdk-sv, bits-ui, cn imports

	const dispatch = createEventDispatcher();

	export let skillOptions = [];
	export let focusAreaOptions = [];

	// AI Generation State
	let aiParams = {
		durationMinutes: 90,
		skillLevel: 'intermediate',
		participantCount: 15,
		goals: 'Improve team offense and cutting timing.',
		focusAreas: [] // Initialize as empty array
	};
	let isGenerating = false;

	// Helper function to update aiParams.focusAreas for checkboxes
	function handleFocusAreaChange(event) {
		const { value, checked } = event.target;
		if (checked) {
			aiParams.focusAreas = [...aiParams.focusAreas, value];
		} else {
			aiParams.focusAreas = aiParams.focusAreas.filter((v) => v !== value);
		}
		// Ensure reactivity by reassigning
		aiParams = aiParams;
	}


	async function handleGenerateAI() {
		isGenerating = true;
		try {
			console.log('Sending parameters to AI:', aiParams);

			const response = await fetch('/api/practice-plans/generate-ai', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ parameters: aiParams })
			});

			const responseBody = await response.json();

			if (!response.ok) {
				console.error('AI Generation Error Response:', responseBody);
				const errorMessage = responseBody.error || 'AI generation failed. Please try again.';
				dispatch('error', errorMessage); // Dispatch error event
				return;
			}

			console.log('Received AI generated plan:', responseBody);

			// Validate the structure roughly before dispatching
			if (!responseBody.planDetails || !responseBody.sections) {
				throw new Error('Invalid plan structure received from AI.');
			}

			dispatch('generated', responseBody); // Dispatch success event with data

		} catch (error) {
			console.error('Failed to generate plan with AI:', error);
			dispatch('error', `Generation failed: ${error.message || 'An unknown error occurred.'}`);
		} finally {
			isGenerating = false;
		}
	}
</script>

<!-- Replaced Card with styled div -->
<div class="border bg-card text-card-foreground rounded-lg shadow-sm">
	<!-- Replaced CardHeader -->
	<div class="flex flex-col space-y-1.5 p-6">
		<!-- Replaced CardTitle -->
		<h3 class="text-lg font-semibold leading-none tracking-tight">Generate Plan with AI</h3>
		<!-- Replaced CardDescription -->
		<p class="text-sm text-muted-foreground">
			Provide some basic parameters and let AI draft a plan for you. You can edit it afterwards.
		</p>
	</div>
	<!-- Replaced CardContent -->
	<div class="p-6 pt-0 space-y-4">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div>
				<!-- Standard label -->
				<label for="ai-duration" class="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
				<!-- Standard input with Tailwind -->
				<input id="ai-duration" type="number" bind:value={aiParams.durationMinutes} placeholder="e.g., 90" min="15" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
			</div>
			<div>
				<!-- Standard label -->
				<label for="ai-skill-level" class="block text-sm font-medium text-gray-700 mb-1">Skill Level</label>
				<!-- Standard select with Tailwind -->
				<select id="ai-skill-level" bind:value={aiParams.skillLevel} class="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm">
					<option value="" disabled>Select skill level...</option>
					{#each skillOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>
			<div>
				<!-- Standard label -->
				<label for="ai-participants" class="block text-sm font-medium text-gray-700 mb-1">Participant Count</label>
				<!-- Standard input with Tailwind -->
				<input id="ai-participants" type="number" bind:value={aiParams.participantCount} placeholder="e.g., 15" min="2" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
			</div>
		</div>
		<div>
			<!-- Standard label -->
			<label for="ai-goals" class="block text-sm font-medium text-gray-700 mb-1">Goals</label>
			<!-- Standard textarea with Tailwind -->
			<textarea id="ai-goals" bind:value={aiParams.goals} placeholder="What are the main goals of this practice?" rows="3" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
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
								checked={aiParams.focusAreas.includes(option.value)}
								on:change={handleFocusAreaChange} 
								class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
							/>
							<span class="text-sm text-gray-700">{option.label}</span>
						</label>
					{/each}
				{/if}
			</div>
			<p class="text-sm text-muted-foreground mt-1">Select one or more areas the AI should focus on.</p>
		</div>
	</div>
	<!-- Replaced CardFooter -->
	<div class="flex items-center p-6 pt-0">
		<!-- Standard button with Tailwind -->
		<button
			type="button"
			on:click={handleGenerateAI}
			disabled={isGenerating}
			class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{#if isGenerating}
				<Spinner class="mr-2 h-4 w-4 animate-spin" />
				Generating...
			{:else}
				Generate Plan
			{/if}
		</button>
	</div>
</div> 