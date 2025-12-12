<script>
	import {
		startItemDrag,
		handleItemDragOver,
		handleDragLeave,
		handleDrop,
		handleDragEnd,
		dragState
	} from '$lib/stores/dragManager';

	export let item;
	export let itemIndex;
	export let sectionIndex;
	export let onRemove;
	export let timelineItemIndex = null;
	export let timeline = null;
	export let parallelGroupId = null;

	// Generate a stable unique identifier for this item based on its content
	$: itemId = item.id;

	// Reactive drag states for this item - use ID instead of index
	$: isBeingDragged =
		$dragState.isDragging &&
		$dragState.dragType === 'item' &&
		$dragState.sourceSection === sectionIndex &&
		$dragState.itemId === itemId;

	$: _isDropTarget =
		$dragState.targetSection === sectionIndex && $dragState.targetIndex === itemIndex;
</script>

<li
	class="timeline-item relative transition-all duration-200 {isBeingDragged ? 'dragging' : ''}"
	draggable="true"
	data-testid="formation-item"
	data-item-id={itemId}
	data-section-index={sectionIndex}
	data-item-index={itemIndex}
	data-timeline-index={timelineItemIndex}
	data-item-name={item.name}
	data-timeline={timeline || item.parallel_timeline}
	data-group-id={parallelGroupId || item.parallel_group_id}
	on:dragstart={(e) => {
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

		// Pass additional timeline position info for better reordering
		startItemDrag(e, sectionIndex, itemIndex, item, itemId, timelineItemIndex);
	}}
	on:dragover={(e) =>
		handleItemDragOver(e, sectionIndex, itemIndex, item, e.currentTarget, timelineItemIndex)}
	on:dragleave={handleDragLeave}
	on:drop={handleDrop}
	on:dragend={handleDragEnd}
>
	<!-- Formation reference content -->
	<div
		class="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200 transition-all duration-200 hover:shadow-md"
	>
		<div class="flex justify-between items-center">
			<div class="flex items-center">
				<div class="mr-2 cursor-grab">⋮⋮</div>
				<span class="text-blue-800 font-medium">📋 {item.name}</span>
			</div>
			<div class="flex items-center space-x-4">
				<span class="text-sm text-blue-600">Formation Reference</span>
				<a
					href="/formations/{item.formation_id || item.formation?.id}"
					target="_blank"
					rel="noopener noreferrer"
					class="text-blue-600 hover:text-blue-700 text-sm underline"
					on:click|stopPropagation
				>
					View →
				</a>
				<button type="button" class="text-red-500 hover:text-red-700 text-sm" on:click={onRemove}>
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
