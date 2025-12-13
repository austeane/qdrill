<script>
	import { onMount } from 'svelte';
	import {
		startItemDrag,
		handleItemDragOver,
		handleDragLeave,
		handleDrop,
		handleDragEnd,
		dragState
	} from '$lib/stores/dragManager';

	let {
		item,
		itemIndex,
		sectionIndex,
		onRemove,
		onDurationChange = (sectionIndex, itemIndex, newDuration) => {
		console.warn(
			'onDurationChange prop not provided to DrillItem',
			sectionIndex,
			itemIndex,
			newDuration
		);
		},
		onTimelineChange = (sectionIndex, itemIndex, newTimeline) => {
		console.warn(
			'onTimelineChange prop not provided to DrillItem',
			sectionIndex,
			itemIndex,
			newTimeline
		);
		},
		timelineItemIndex = null,
		timeline = null,
		parallelGroupId = null
	} = $props();

	// Generate a stable unique identifier for this item based on its content
	const itemId = $derived(item?.id);

	// Reactive drag states for this item - use ID instead of index
	const isBeingDragged = $derived(
		dragState.isDragging &&
		dragState.dragType === 'item' &&
		dragState.sourceSection === sectionIndex &&
		dragState.itemId === itemId
	);

	const _isDropTarget = $derived(
		dragState.targetSection === sectionIndex && dragState.targetIndex === itemIndex
	);

	// Only log when mounted in the DOM
	onMount(() => {
		console.log(
			`[DrillItem] Mounted: ${item.name} (ID: ${itemId}) at section ${sectionIndex} index ${itemIndex}${item.parallel_timeline ? ` in ${item.parallel_timeline} timeline (position ${timelineItemIndex})` : ''}`
		);
	});
</script>

<li
	class="timeline-item relative transition-all duration-200 {isBeingDragged ? 'dragging' : ''}"
	draggable="true"
	data-testid="drill-item"
	data-item-id={itemId}
	data-section-index={sectionIndex}
	data-item-index={itemIndex}
	data-timeline-index={timelineItemIndex}
	data-item-name={item.name}
	data-timeline={timeline || item.parallel_timeline}
	data-group-id={parallelGroupId || item.parallel_group_id}
	ondragstart={(e) => {
		// Make sure the ID is in the event dataset
		if (e.currentTarget) {
			// Force set all the data attributes on the element
			e.currentTarget.dataset.itemId = itemId;
			e.currentTarget.dataset.itemName = item.name;
			e.currentTarget.dataset.sectionIndex = sectionIndex;
			e.currentTarget.dataset.itemIndex = itemIndex;
			e.currentTarget.dataset.timelineIndex = timelineItemIndex;
			e.currentTarget.dataset.timeline = timeline || item.parallel_timeline;
			e.currentTarget.dataset.groupId = parallelGroupId || item.parallel_group_id;
		}

		// Print what we're actually dragging
		console.log(
			`[DRAGSTART] ${item.name} (ID: ${itemId}) from section ${sectionIndex} index ${itemIndex}${timelineItemIndex !== null ? ` timeline position ${timelineItemIndex}` : ''}`
		);

		// Pass additional timeline position info for better reordering
		startItemDrag(e, sectionIndex, itemIndex, item, itemId, timelineItemIndex);
	}}
	ondragover={(e) =>
		handleItemDragOver(e, sectionIndex, itemIndex, item, e.currentTarget, timelineItemIndex)}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	ondragend={handleDragEnd}
>
	<!-- Item content -->
	<div class="bg-white p-4 rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md">
		<div class="flex justify-between items-center">
			<div class="flex items-center">
				<div class="mr-2 cursor-grab">⋮⋮</div>
				<span>{item.name}</span>
			</div>
			<div class="flex items-center space-x-2">
				{#if !item.parallel_group_id}
					<!-- Position selector for non-parallel items -->
					<select
						class="px-2 py-1 border rounded text-sm"
						value={item.parallel_timeline || ''}
						onchange={(e) => onTimelineChange(sectionIndex, itemIndex, e.target.value || null)}
					>
						<option value="">All Positions</option>
						<option value="BEATERS">Beaters</option>
						<option value="CHASERS">Chasers</option>
						<option value="SEEKERS">Seekers</option>
					</select>
				{/if}
				<div class="flex items-center">
					<input
						type="number"
						min="1"
						max="120"
						class="w-16 px-2 py-1 border rounded mr-2"
						value={item.selected_duration || item.duration}
						onblur={(e) =>
							onDurationChange(sectionIndex, itemIndex, parseInt(e.target.value) || 15)}
					/>
					<span class="text-sm text-gray-600">min</span>
				</div>
				<button type="button" class="text-red-500 hover:text-red-700 text-sm" onclick={onRemove}>
					Remove
				</button>
			</div>
		</div>
	</div>
</li>

<style>
	.timeline-item {
		position: relative;
		transition: all 0.2s ease;
		padding: 0.5rem 0; /* Add padding to increase drop target area */
	}

	.timeline-item::before {
		content: '';
		position: absolute;
		top: -0.5rem;
		left: 0;
		right: 0;
		height: 1rem;
		background: transparent;
	}

	.timeline-item::after {
		content: '';
		position: absolute;
		bottom: -0.5rem;
		left: 0;
		right: 0;
		height: 1rem;
		background: transparent;
	}

	/* Drop indicators */
	:global(.timeline-item.drop-before) {
		position: relative;
	}

	:global(.timeline-item.drop-before)::before {
		content: '';
		position: absolute;
		top: -0.25rem;
		left: 0;
		right: 0;
		height: 0.25rem;
		background-color: #3b82f6;
		border-radius: 999px;
		z-index: 10;
	}

	:global(.timeline-item.drop-after) {
		position: relative;
	}

	:global(.timeline-item.drop-after)::after {
		content: '';
		position: absolute;
		bottom: -0.25rem;
		left: 0;
		right: 0;
		height: 0.25rem;
		background-color: #3b82f6;
		border-radius: 999px;
		z-index: 10;
	}
</style>
