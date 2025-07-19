<script>
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';

	const dispatch = createEventDispatcher();

	export let items = [];
	export let availableDrills = [];
	export let sectionIndex = 0;

	// Timeline options for position groups
	const timelineOptions = [
		{ value: 'BEATERS', label: 'Beaters', color: 'bg-red-100 text-red-800' },
		{ value: 'CHASERS', label: 'Chasers', color: 'bg-blue-100 text-blue-800' },
		{ value: 'KEEPERS', label: 'Keepers', color: 'bg-green-100 text-green-800' },
		{ value: 'SEEKERS', label: 'Seekers', color: 'bg-purple-100 text-purple-800' },
		{ value: 'CHASERS/KEEPERS', label: 'Chasers/Keepers', color: 'bg-teal-100 text-teal-800' },
		{ value: 'ALL', label: 'All Positions', color: 'bg-gray-100 text-gray-800' }
	];

	// State for creating parallel activities
	let isCreatingParallel = false;
	let parallelActivities = [];
	let nextGroupId = Date.now(); // Simple unique ID generator

	// Initialize with empty parallel activity
	function startParallelCreation() {
		isCreatingParallel = true;
		parallelActivities = [
			{
				timeline: 'BEATERS',
				drill: null,
				duration: 15,
				tempId: `temp_${Date.now()}_1`
			},
			{
				timeline: 'CHASERS',
				drill: null,
				duration: 15,
				tempId: `temp_${Date.now()}_2`
			}
		];
	}

	// Add another parallel activity
	function addParallelActivity() {
		parallelActivities = [
			...parallelActivities,
			{
				timeline: '',
				drill: null,
				duration: 15,
				tempId: `temp_${Date.now()}_${parallelActivities.length + 1}`
			}
		];
	}

	// Remove a parallel activity
	function removeParallelActivity(index) {
		parallelActivities = parallelActivities.filter((_, i) => i !== index);
		if (parallelActivities.length === 0) {
			cancelParallelCreation();
		}
	}

	// Cancel parallel creation
	function cancelParallelCreation() {
		isCreatingParallel = false;
		parallelActivities = [];
	}

	// Save parallel activities
	function saveParallelActivities() {
		const groupId = `parallel_${nextGroupId}`;
		nextGroupId++;

		const newItems = parallelActivities
			.filter((activity) => activity.drill && activity.timeline)
			.map((activity, index) => {
				const drill = availableDrills.find((d) => d.id === parseInt(activity.drill));
				const timeline = activity.timeline;
				const groupTimelines = timeline.includes('/') ? timeline.split('/') : [timeline];

				return {
					type: 'drill',
					drill_id: drill.id,
					drill: drill,
					duration: activity.duration,
					name: drill.name,
					parallel_group_id: groupId,
					parallel_timeline: timeline,
					groupTimelines: groupTimelines,
					id: `new_${Date.now()}_${index}` // Temporary ID for new items
				};
			});

		if (newItems.length > 1) {
			dispatch('addParallelItems', { items: newItems, sectionIndex });
			cancelParallelCreation();
		}
	}

	// Check if we can save
	$: canSave =
		parallelActivities.length >= 2 &&
		parallelActivities.every((a) => a.drill && a.timeline) &&
		// Ensure at least 2 different timelines
		new Set(parallelActivities.map((a) => a.timeline)).size >= 2;

	// Get filtered drills based on position
	function getFilteredDrills(timeline) {
		if (!timeline || timeline === 'ALL') return availableDrills;

		const positions = timeline.split('/');
		return availableDrills.filter((drill) => {
			if (!drill.positions_focused_on || drill.positions_focused_on.length === 0) {
				return true; // Include drills without specific positions
			}
			return positions.some((pos) =>
				drill.positions_focused_on.some((drillPos) =>
					drillPos.toLowerCase().includes(pos.toLowerCase().replace('s', ''))
				)
			);
		});
	}
</script>

<div class="parallel-activity-creator">
	{#if !isCreatingParallel}
		<Button
			variant="outline"
			on:click={startParallelCreation}
			class="w-full border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
		>
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
				/>
			</svg>
			Create Parallel Activities
		</Button>
	{:else}
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
			<div class="flex justify-between items-center">
				<h3 class="text-lg font-medium text-gray-900">Parallel Activities</h3>
				<button on:click={cancelParallelCreation} class="text-gray-400 hover:text-gray-600">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<p class="text-sm text-gray-600">
				Create activities that happen simultaneously for different position groups.
			</p>

			<div class="space-y-3">
				{#each parallelActivities as activity, index (activity.tempId)}
					<div class="bg-white rounded-lg p-3 border border-gray-200">
						<div class="flex items-start gap-3">
							<div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
								<!-- Timeline Selection -->
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">
										Position Group
									</label>
									<select
										bind:value={activity.timeline}
										class="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									>
										<option value="">Select group...</option>
										{#each timelineOptions as option}
											<option value={option.value}>{option.label}</option>
										{/each}
									</select>
								</div>

								<!-- Drill Selection -->
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1"> Drill </label>
									<select
										bind:value={activity.drill}
										class="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									>
										<option value="">Select drill...</option>
										{#each getFilteredDrills(activity.timeline) as drill}
											<option value={drill.id}>
												{drill.name}
												{#if drill.suggested_length_min}
													({drill.suggested_length_min}min)
												{/if}
											</option>
										{/each}
									</select>
								</div>

								<!-- Duration -->
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">
										Duration (min)
									</label>
									<input
										type="number"
										bind:value={activity.duration}
										min="1"
										max="60"
										class="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									/>
								</div>
							</div>

							<!-- Remove button -->
							{#if parallelActivities.length > 2}
								<button
									on:click={() => removeParallelActivity(index)}
									class="text-red-400 hover:text-red-600 mt-6"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							{/if}
						</div>

						<!-- Show timeline badge -->
						{#if activity.timeline}
							{@const timelineOption = timelineOptions.find((t) => t.value === activity.timeline)}
							<div class="mt-2">
								<span
									class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {timelineOption?.color ||
										'bg-gray-100 text-gray-800'}"
								>
									{timelineOption?.label || activity.timeline}
								</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<div class="flex justify-between">
				<Button variant="outline" size="sm" on:click={addParallelActivity}>
					<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Add Another
				</Button>

				<div class="space-x-2">
					<Button variant="ghost" size="sm" on:click={cancelParallelCreation}>Cancel</Button>
					<Button variant="default" size="sm" on:click={saveParallelActivities} disabled={!canSave}>
						Save Parallel Activities
					</Button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.parallel-activity-creator {
		margin: 1rem 0;
	}
</style>
