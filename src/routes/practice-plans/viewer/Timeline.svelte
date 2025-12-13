<script>
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	let { sections = [], currentSectionId = null, totalDuration = 0 } = $props();

	// Process sections to create timeline items with parallel groups
	const timelineItems = $derived.by(() =>
		sections.reduce((acc, section) => {
			const sectionItems = [];
			let currentParallelGroup = null;

			section.items?.forEach((item) => {
				if (item.parallel_group_id) {
					// Start or add to parallel group
					if (!currentParallelGroup || currentParallelGroup.id !== item.parallel_group_id) {
						if (currentParallelGroup) {
							sectionItems.push(currentParallelGroup);
						}
						currentParallelGroup = {
							id: item.parallel_group_id,
							type: 'parallel',
							items: [item],
							duration: item.duration
						};
					} else {
						currentParallelGroup.items.push(item);
						currentParallelGroup.duration = Math.max(currentParallelGroup.duration, item.duration);
					}
				} else {
					// Add any existing parallel group before adding single item
					if (currentParallelGroup) {
						sectionItems.push(currentParallelGroup);
						currentParallelGroup = null;
					}
					sectionItems.push(item);
				}
			});

			// Add any remaining parallel group
			if (currentParallelGroup) {
				sectionItems.push(currentParallelGroup);
			}

			return [...acc, { ...section, items: sectionItems }];
		}, [])
	);

	// Animated scroll indicator
	const scrollPosition = tweened(0, {
		duration: 200,
		easing: cubicOut
	});

	// Update scroll position based on current section
	$effect(() => {
		if (!currentSectionId || !totalDuration) {
			return;
		}

		const currentSection = timelineItems.find((item) => item.id === currentSectionId);
		if (!currentSection) {
			return;
		}

		const startTime = timelineItems
			.slice(0, timelineItems.indexOf(currentSection))
			.reduce((acc, s) => acc + calculateSectionDuration(s.items), 0);

		scrollPosition.set((startTime / totalDuration) * 100);
	});

	function calculateSectionDuration(items) {
		// console.log('Calculating duration for items:', items);
		return items.reduce((acc, item) => {
			if (item.type === 'parallel') {
				console.log('Parallel group duration:', item.duration);
				return acc + item.duration;
			}
			return acc + (item.selected_duration || item.duration || 0);
		}, 0);
	}

	function handleTimelineClick(section) {
		const element = document.getElementById(`section-${section.id}`);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	function handleTimelineKeyDown(event, section) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault(); // Prevent page scroll on Space
			handleTimelineClick(section);
		}
	}

	// Add this array at the top with the other variables
	const sectionColors = [
		'bg-blue-50',
		'bg-green-50',
		'bg-purple-50',
		'bg-amber-50',
		'bg-rose-50',
		'bg-cyan-50'
	];

	// Add this function to get color for a section
	function getSectionColor(index) {
		return sectionColors[index % sectionColors.length];
	}

	// Group items by timeline for parallel activities
	function groupByTimeline(items) {
		const groups = {};
		items.forEach((item) => {
			const timeline = item.parallel_timeline || 'default';
			if (!groups[timeline]) {
				groups[timeline] = [];
			}
			groups[timeline].push(item);
		});
		return groups;
	}

	// $: console.log('Timeline Sections:', sections);

	let tooltipVisible = $state(false);
	let tooltipContent = $state('');
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	function showTooltip(event, text) {
		tooltipContent = text;
		tooltipVisible = true;
		updateTooltipPosition(event);
	}

	function hideTooltip() {
		tooltipVisible = false;
	}

	function updateTooltipPosition(event) {
		// Get the timeline container's position
		const timelineRect = event.currentTarget.getBoundingClientRect();

		// Get the tooltip element and its width
		const tooltipElement = document.querySelector('.custom-tooltip');
		const tooltipWidth = tooltipElement?.offsetWidth || 0;

		// Position the tooltip so its right edge aligns with the timeline's left edge
		tooltipX = timelineRect.left - tooltipWidth - 10; // 10px gap from timeline
		tooltipY = event.clientY - 10; // Offset slightly above the cursor
	}

	function handleMouseMove(event) {
		if (tooltipVisible) {
			updateTooltipPosition(event);
		}
	}
</script>

<!-- Add the tooltip element -->
{#if tooltipVisible}
	<div class="custom-tooltip" style="top: {tooltipY}px; left: {tooltipX}px;">
		{tooltipContent}
	</div>
{/if}

	<div class="timeline-container">
		<div
			class="timeline"
			onmousemove={handleMouseMove}
			role="group"
			aria-label="Practice Plan Timeline"
		>
		<!-- Progress indicator -->
		<div class="progress-line" style="height: {$scrollPosition}%"></div>

		<!-- Timeline sections -->
		{#each timelineItems as section, index (section.id)}
				<div
					role="button"
					tabindex="0"
					class="timeline-section"
					class:active={section.id === currentSectionId}
					onclick={() => handleTimelineClick(section)}
					onkeydown={(e) => handleTimelineKeyDown(e, section)}
					style="height: {(calculateSectionDuration(section.items) / totalDuration) * 100}%"
				>
				<!-- Section label -->
				<div class="section-label">
					<span class="section-name">{section.name}</span>
					<span class="section-duration">{calculateSectionDuration(section.items)}min</span>
				</div>

				<!-- Section items -->
				<div class="section-items">
					{#each section.items as item (item.id)}
						{#if item.type === 'parallel'}
							{@const timelineGroups = groupByTimeline(item.items)}
							<!-- Parallel group -->
							<div
								class="parallel-container"
								style="height: {(item.duration / calculateSectionDuration(section.items)) * 100}%"
							>
								<div class="parallel-split">
									{#each Object.entries(timelineGroups) as [_timeline, timelineItems] (_timeline)}
										<div class="parallel-timeline">
											{#each timelineItems as parallelItem, idx (parallelItem.id || idx)}
												{@const totalTimelineDuration = timelineItems.reduce(
													(sum, i) => sum + i.duration,
													0
												)}
												{@const cumulativeHeight =
													idx === 0
														? 0
														: (timelineItems.slice(0, idx).reduce((sum, i) => sum + i.duration, 0) /
																totalTimelineDuration) *
															100}
													<div
														role="tooltip"
														class="parallel-item-wrapper"
														style="height: {(parallelItem.duration / totalTimelineDuration) *
															100}%; top: {cumulativeHeight}%"
														onmouseenter={(e) =>
															showTooltip(
																e,
																`${section.name}: ${parallelItem.drill?.name || parallelItem.name || 'Unnamed Drill'}`
															)}
														onmouseleave={hideTooltip}
													>
													<div class="parallel-item-inner {getSectionColor(index)}"></div>
												</div>
											{/each}
										</div>
									{/each}
								</div>
							</div>
						{:else}
							<!-- Single item -->
								<div
									role="tooltip"
									class="timeline-item"
									style="height: {(item.duration / calculateSectionDuration(section.items)) * 100}%"
									onmouseenter={(e) =>
										showTooltip(
											e,
											`${section.name}: ${item.drill?.name || item.name || 'Unnamed Drill'}`
										)}
									onmouseleave={hideTooltip}
								>
								<div class="timeline-item-inner {getSectionColor(index)}">
									<!-- Remove the background and border properties from the base styles -->
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.timeline-container {
		position: fixed;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		height: 80vh;
		width: 4rem;
		z-index: 10;
	}

	.timeline {
		position: relative;
		height: 100%;
		width: 100%;
		background: theme('colors.gray.100');
		border-radius: 1rem;
		overflow: hidden;
	}

	.progress-line {
		position: absolute;
		left: 0;
		bottom: 0;
		width: 2px;
		background: theme('colors.blue.500');
		transition: height 0.2s ease;
	}

	.timeline-section {
		position: relative;
		width: 100%;
		transition: all 0.2s ease;
		cursor: pointer;
		border-left: 2px solid transparent;
	}

	.timeline-section:hover {
		filter: brightness(0.95);
	}

	.timeline-section.active {
		border-left-color: theme('colors.blue.500');
		filter: brightness(0.95);
	}

	.section-label {
		position: absolute;
		right: 100%;
		top: 0;
		transform: translateY(-50%);
		white-space: nowrap;
		padding-right: 0.5rem;
		opacity: 0;
		transition: opacity 0.2s ease;
		pointer-events: none;
	}

	.timeline-section:hover .section-label {
		opacity: 1;
	}

	.section-name {
		font-size: 0.875rem;
		color: theme('colors.gray.700');
		margin-right: 0.5rem;
	}

	.section-duration {
		font-size: 0.75rem;
		color: theme('colors.gray.500');
	}

	.section-items {
		height: 100%;
		padding: 0.25rem 0;
	}

	.timeline-item {
		margin: 0.125rem 0;
		padding: 0 0.25rem;
	}

	.timeline-item-inner {
		height: 100%;
		border-radius: 0.25rem;
	}

	.parallel-container {
		position: relative;
		margin: 0.125rem 0;
		height: 100%;
	}

	.parallel-split {
		height: 100%;
		display: flex !important;
		gap: 0.25rem !important;
		padding: 0 0.25rem;
	}

	.parallel-timeline {
		flex: 1 !important;
		position: relative;
		min-height: 0;
	}

	.parallel-item-wrapper {
		position: absolute;
		left: 0;
		right: 0;
		padding: 0.0625rem 0;
	}

	.parallel-item-inner {
		height: 100%;
		border-radius: 0.25rem;
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.timeline-container {
			display: none;
		}
	}

	/* Make styles more specific to prevent overrides */
	.timeline .section-items {
		height: 100%;
		padding: 0.125rem 0;
	}

	.timeline .parallel-container {
		position: relative;
		margin: 0.0625rem 0;
		height: 100%;
	}

	.timeline .parallel-split {
		height: 100%;
		display: flex !important;
		gap: 0.25rem !important;
		padding: 0 0.25rem;
	}

	.timeline .parallel-timeline {
		flex: 1 !important;
		position: relative;
		min-height: 0;
	}

	.timeline .parallel-item-wrapper {
		position: absolute;
		left: 0;
		right: 0;
		padding: 0.0625rem 0;
	}

	.timeline .parallel-item-inner {
		height: 100%;
		border-radius: 0.25rem;
	}

	.timeline .timeline-item {
		margin: 0.0625rem 0;
		padding: 0 0.25rem;
	}

	.timeline .timeline-item-inner {
		height: 100%;
		border-radius: 0.25rem;
	}

	/* Update color styles to be more intense */
	.bg-blue-50 {
		background-color: theme('colors.blue.200');
		border: 1px solid theme('colors.blue.300');
	}

	.bg-green-50 {
		background-color: theme('colors.green.200');
		border: 1px solid theme('colors.green.300');
	}

	.bg-purple-50 {
		background-color: theme('colors.purple.200');
		border: 1px solid theme('colors.purple.300');
	}

	.bg-amber-50 {
		background-color: theme('colors.amber.200');
		border: 1px solid theme('colors.amber.300');
	}

	.bg-rose-50 {
		background-color: theme('colors.rose.200');
		border: 1px solid theme('colors.rose.300');
	}

	.bg-cyan-50 {
		background-color: theme('colors.cyan.200');
		border: 1px solid theme('colors.cyan.300');
	}

	.custom-tooltip {
		position: fixed;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		pointer-events: none;
		z-index: 50;
		max-width: 300px;
		white-space: nowrap;
	}

	/* Optional: Add a subtle animation for the tooltip */
	.custom-tooltip {
		animation: tooltipFade 0.1s ease-in;
	}

	@keyframes tooltipFade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
