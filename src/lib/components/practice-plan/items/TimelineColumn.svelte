<script>
	import {
		handleTimelineDragOver,
		handleDragLeave,
		handleDrop
	} from '$lib/stores/dragManager';
	import DrillItem from './DrillItem.svelte';
	// Remove direct store imports
	// import { removeItem, getTimelineName, customTimelineNames } from '$lib/stores/sectionsStore';

	export let timeline;
	export let groupTimelines;
	export let timelineItems = []; // All items passed from parent
	export let sectionIndex;
	export let sectionId;
	export let parallelGroupId;
	export let totalDuration = 0;
	// Add props for data and actions
	export let onRemoveItem = (sectionIndex, itemIndex) => {
		console.warn('onRemoveItem prop not provided to TimelineColumn', sectionIndex, itemIndex);
	};
	export let onDurationChange = (sectionIndex, itemIndex, newDuration) => {
		console.warn(
			'onDurationChange prop not provided to TimelineColumn',
			sectionIndex,
			itemIndex,
			newDuration
		);
	};
	export let onTimelineChange = (sectionIndex, itemIndex, newTimeline) => {
		console.warn(
			'onTimelineChange prop not provided to TimelineColumn',
			sectionIndex,
			itemIndex,
			newTimeline
		);
	};
	export let timelineNameGetter = (timeline) => timeline; // Simple default
	export let customTimelineNamesData = {}; // Pass the reactive data (not directly used here, but needed by getter)

	// No longer subscribe directly
	// let timelineNamesStore;
	// $: timelineNamesStore = $customTimelineNames;

	// Get the timeline name reactively using the passed getter
	$: timelineName = timelineNameGetter(timeline);

	// Filter items for this specific timeline
	$: timelineSpecificItems = timelineItems.filter(
		(item) => item.parallel_group_id === parallelGroupId && item.parallel_timeline === timeline
	);

	// Find the original index of an item within the parent's `timelineItems` array
	function findOriginalItemIndex(item) {
		if (!item) return -1;
		return timelineItems.findIndex((i) => i.id === item.id);
	}

	// Removed debug log for brevity
</script>

<div
	class="timeline-column bg-white rounded-lg border border-gray-200 p-2 min-h-[150px] flex flex-col transition-all duration-200"
	data-section-index={sectionIndex}
	data-timeline={timeline}
	data-group-id={parallelGroupId}
	on:dragover={(e) =>
		handleTimelineDragOver(e, sectionIndex, timeline, parallelGroupId, e.currentTarget)}
	on:dragleave={handleDragLeave}
	on:drop={(e) => {
		// Ensure we capture the event parameters directly in the handler
		e.preventDefault();
		e.stopPropagation();

		// Force update the currentTarget if it's missing
		if (!e.currentTarget) {
			e.currentTarget = e.target.closest('.timeline-column');
		}

		// Provide backup parameters from data attributes if needed
		const targetSection = parseInt(e.currentTarget.getAttribute('data-section-index'));
		const targetTimeline = e.currentTarget.getAttribute('data-timeline');
		const targetGroupId = e.currentTarget.getAttribute('data-group-id');

		// Before calling handleDrop, explicitly update the dragState with correct values
		// This ensures we don't lose critical drop target information
		const dragState = window.__dragManager ? window.__dragManager.get() : null;
		if (dragState && dragState.isDragging) {
			// Create a flag to know if we're dropping in the same timeline
			const isSameTimeline =
				dragState.sourceGroupId === parallelGroupId &&
				dragState.sourceTimeline === timeline &&
				dragState.sourceSection === sectionIndex;

			window.__dragManager.update((state) => ({
				...state,
				// Use nullish coalescing (??) instead of logical OR (||) to handle section index 0 correctly
				targetSection:
					targetSection !== null && !isNaN(targetSection) ? targetSection : sectionIndex,
				targetTimeline: targetTimeline || timeline,
				targetGroupId: targetGroupId || parallelGroupId,
				isSameTimeline: isSameTimeline,
				dropPosition: 'inside'
			}));
		}

		console.log('[TIMELINE DROP] Direct handler with attributes:', {
			sectionIndex,
			timeline,
			parallelGroupId,
			timelineItems: timelineSpecificItems.length,
			isSameTimeline:
				dragState?.sourceTimeline === timeline && dragState?.sourceGroupId === parallelGroupId
		});

		// Call the main drop handler
		handleDrop(e);
	}}
>
	<div class="timeline-header bg-gray-100 rounded-lg p-2 mb-3 flex-shrink-0">
		<h4 class="font-semibold">{timelineName}</h4>
		<div class="text-sm text-gray-500">{totalDuration}min</div>
	</div>

	<ul class="space-y-2 min-h-[50px] flex-grow">
		{#if timelineSpecificItems.length === 0}
			<div
				class="empty-timeline p-2 text-center text-gray-400 border border-dashed border-gray-300 rounded h-full min-h-[60px] flex items-center justify-center transition-all duration-200"
			>
				Drag drills here
			</div>
		{:else}
			{#each timelineSpecificItems as item, timelineItemIndex (item.id)}
				{@const originalItemIndex = findOriginalItemIndex(item)}
				<DrillItem
					{item}
					itemIndex={originalItemIndex}
					{timelineItemIndex}
					{timeline}
					{parallelGroupId}
					{sectionIndex}
					onRemove={() => onRemoveItem(sectionIndex, originalItemIndex)}
					{onDurationChange}
					{onTimelineChange}
				/>
			{/each}
		{/if}
	</ul>
</div>

<style>
	.timeline-column {
		position: relative;
		transition: all 0.2s ease-in-out;
	}

	/* Drop target styles */
	:global(.timeline-column.timeline-drop-target) {
		border-color: #3b82f6;
		border-style: dashed;
		background-color: rgba(219, 234, 254, 0.5); /* bg-blue-100 with opacity */
		box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
	}

	.empty-timeline {
		transition: all 0.2s ease-in-out;
	}

	:global(.timeline-drop-target .empty-timeline) {
		border-color: #3b82f6;
		background-color: rgba(219, 234, 254, 0.8);
	}
</style>
