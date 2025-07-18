<script>
	import { timeline, basicInfo, syncTimelineWithSections } from '$lib/stores/wizardStore';
	import { sections as sectionsStore } from '$lib/stores/sectionsStore';
	// Removed import for wizardStore sections
	// Removed import for wizardValidation
	// Removed import for scheduleAutoSave

	// Local touched state if needed
	let touched = {
		totalTime: false,
		sections: false
	};

	// Keep timeline in sync whenever sections change
	$: syncTimelineWithSections($sectionsStore);

	// Handle duration change - still modifies the timeline store directly
	function handleDurationChange(index, newDuration) {
		touched.sections = true;
		timeline.update((current) => {
			const updated = { ...current };
			const sections = [...updated.sections]; // Ensure we modify a copy

			if (sections[index]) {
				sections[index] = {
					...sections[index],
					duration: Math.max(1, parseInt(newDuration) || 0)
				};
			}

			// Recalculate start times
			let currentStartTime = 0;
			updated.sections = sections.map((section) => {
				const sectionCopy = { ...section }; // Create copy before modifying
				sectionCopy.startTime = currentStartTime;
				currentStartTime += sectionCopy.duration || 0;
				return sectionCopy;
			});

			return updated;
		});
	}

	// Handle reordering - still modifies the timeline store directly
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

		timeline.update((current) => {
			const updated = { ...current };
			const sections = [...updated.sections]; // Operate on a copy
			const [removed] = sections.splice(sourceIndex, 1);
			sections.splice(targetIndex, 0, removed);

			// Recalculate start times
			let currentStartTime = 0;
			updated.sections = sections.map((section) => {
				const sectionCopy = { ...section }; // Create copy before modifying
				sectionCopy.startTime = currentStartTime;
				currentStartTime += sectionCopy.duration || 0;
				return sectionCopy;
			});

			return updated;
		});
	}

	// Calculate total time used
	$: totalTimeUsed = $timeline.sections.reduce(
		(total, section) => total + (section.duration || 0),
		0
	);
	// Use basicInfo totalTime which might be separately editable
	$: definedTotalTime = $basicInfo.totalTime || $timeline.totalTime || 120; // Provide a fallback
	$: timeRemaining = definedTotalTime - totalTimeUsed;

	// Format time for display
	function formatTime(minutes) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
	}
</script>

<div class="space-y-8">
	<div>
		<h2 class="text-lg font-medium text-gray-900">Arrange Timeline</h2>
		<p class="mt-1 text-sm text-gray-500">
			Set durations and order for sections. Total practice time: {formatTime(definedTotalTime)}
		</p>
	</div>

	<!-- Time Summary -->
	<div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
		<div class="flex justify-between items-center">
			<div>
				<h3 class="text-sm font-medium text-gray-700">Time Allocation</h3>
				<p class="text-sm text-gray-500">
					Used: {formatTime(totalTimeUsed)} / Available: {formatTime(definedTotalTime)}
				</p>
			</div>
			<div class="text-sm {timeRemaining < 0 ? 'text-red-600' : 'text-green-600'}">
				{timeRemaining >= 0
					? `Remaining: ${formatTime(timeRemaining)}`
					: `Over by: ${formatTime(Math.abs(timeRemaining))}`}
			</div>
		</div>

		<!-- Progress bar -->
		<div class="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
			<div
				class="h-full {timeRemaining < 0 ? 'bg-red-500' : 'bg-blue-500'}"
				style="width: {Math.min(100, (totalTimeUsed / (definedTotalTime || 1)) * 100)}%"
			></div>
		</div>
	</div>

	<!-- Timeline -->
	<div class="space-y-4">
		<h3 class="text-lg font-medium text-gray-900 mb-4">Timeline Setup</h3>

		<div class="space-y-4" role="list">
			{#if $timeline.sections.length > 0}
				{#each $timeline.sections as section, index (section.id)}
					<!-- Use section.id as key -->
					<div
						role="listitem"
						class="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
						draggable="true"
						on:dragstart={(e) => handleDragStart(e, index)}
						on:dragover={handleDragOver}
						on:drop={(e) => handleDrop(e, index)}
					>
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-3">
								<!-- Icon not available from sectionsStore -->
								<!-- <span class="text-xl">{section.icon}</span> -->
								<div>
									<h4 class="text-sm font-medium text-gray-900">{section.name}</h4>
									<p class="text-xs text-gray-500">Starts at: {formatTime(section.startTime)}</p>
								</div>
							</div>
							<div class="flex items-center space-x-4">
								<label class="flex items-center space-x-2">
									<span class="text-sm text-gray-700">Duration:</span>
									<input
										type="number"
										min="1"
										value={section.duration}
										on:input={(e) => handleDurationChange(index, e.target.value)}
										class="shadow-sm focus:ring-blue-500 focus:border-blue-500 w-20 sm:text-sm border-gray-300 rounded-md"
									/>
									<span class="text-sm text-gray-500">min</span>
								</label>
								<div class="flex items-center">
									<button
										type="button"
										class="p-1 text-gray-400 hover:text-gray-500"
										on:click={() =>
											handleDurationChange(index, Math.max(1, (section.duration || 0) - 5))}
										aria-label="Decrease duration by 5 minutes"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
												clip-rule="evenodd"
											/>
										</svg>
									</button>
									<button
										type="button"
										class="p-1 text-gray-400 hover:text-gray-500"
										on:click={() => handleDurationChange(index, (section.duration || 0) + 5)}
										aria-label="Increase duration by 5 minutes"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
												clip-rule="evenodd"
											/>
										</svg>
									</button>
								</div>
							</div>
						</div>
					</div>
				{/each}
			{:else}
				<p class="text-sm text-gray-500 italic">
					No sections available to order. Go back to define sections.
				</p>
			{/if}
		</div>
	</div>
</div>
