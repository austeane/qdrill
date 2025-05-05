<script>
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Select,
		SelectTrigger,
		SelectValue,
		SelectContent,
		SelectItem
	} from '$lib/components/ui/select';
	import Spinner from '$lib/components/Spinner.svelte';
	import { Check, ChevronsUpDown } from 'lucide-svelte';
	import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk-sv';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';

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

	// Combobox state
	let openFocusAreas = false;

	// Helper function to update aiParams.focusAreas
	function handleSelectFocusArea(currentValue) {
		if (aiParams.focusAreas.includes(currentValue)) {
			aiParams.focusAreas = aiParams.focusAreas.filter((v) => v !== currentValue);
		} else {
			aiParams.focusAreas = [...aiParams.focusAreas, currentValue];
		}
	}

	$: selectedLabels = focusAreaOptions
		.filter((option) => aiParams.focusAreas.includes(option.value))
		.map((option) => option.label)
		.join(', ');

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

<Card>
	<CardHeader>
		<CardTitle>Generate Plan with AI</CardTitle>
		<CardDescription>
			Provide some basic parameters and let AI draft a plan for you. You can edit it afterwards.
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div>
				<Label for="ai-duration">Duration (minutes)</Label>
				<Input id="ai-duration" type="number" bind:value={aiParams.durationMinutes} placeholder="e.g., 90" min="15" />
			</div>
			<div>
				<Label for="ai-skill-level">Skill Level</Label>
				<Select bind:value={aiParams.skillLevel}>
					<SelectTrigger id="ai-skill-level">
						<SelectValue placeholder="Select skill level..." />
					</SelectTrigger>
					<SelectContent>
						{#each skillOptions as option}
							<SelectItem value={option.value}>{option.label}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>
			<div>
				<Label for="ai-participants">Participant Count</Label>
				<Input id="ai-participants" type="number" bind:value={aiParams.participantCount} placeholder="e.g., 15" min="2"/>
			</div>
		</div>
		<div>
			<Label for="ai-goals">Goals</Label>
			<Textarea id="ai-goals" bind:value={aiParams.goals} placeholder="What are the main goals of this practice?" />
		</div>
		<div>
			<Label for="ai-focus-areas">Focus Areas</Label>
			<Popover bind:open={openFocusAreas}>
				<PopoverTrigger asChild let:builder>
					<Button
						builders={[builder]}
						variant="outline"
						role="combobox"
						aria-expanded={openFocusAreas}
						class="w-full justify-between"
						id="ai-focus-areas"
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
										}}
									>
										<Check class={cn('mr-2 h-4 w-4', aiParams.focusAreas.includes(option.value) ? 'opacity-100' : 'opacity-0')} />
										{option.label}
									</CommandItem>
								{/each}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			<p class="text-sm text-muted-foreground mt-1">Select one or more areas the AI should focus on.</p>
		</div>
	</CardContent>
	<CardFooter>
		<Button type="button" on:click={handleGenerateAI} disabled={isGenerating}>
			{#if isGenerating}
				<Spinner class="mr-2 h-4 w-4 animate-spin" />
				Generating...
			{:else}
				Generate Plan
			{/if}
		</Button>
	</CardFooter>
</Card> 