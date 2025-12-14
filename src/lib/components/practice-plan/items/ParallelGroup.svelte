<script>
	import {
		startGroupDrag,
		handleGroupDragOver,
		handleDragLeave,
		handleDrop,
		handleDragEnd,
		dragState
	} from '$lib/stores/dragManager';
	import TimelineColumn from './TimelineColumn.svelte';

	let {
		groupId,
		items = [],
		sectionIndex,
		sectionId,
		onUngroup = (groupId) => {
			console.warn('onUngroup prop not provided to ParallelGroup', groupId);
		},
		onDurationChange = (sectionIndex, itemIndex, newDuration) => {
			console.warn(
				'onDurationChange prop not provided to ParallelGroup',
				sectionIndex,
				itemIndex,
				newDuration
			);
		},
		onTimelineChange = (sectionIndex, itemIndex, newTimeline) => {
			console.warn(
				'onTimelineChange prop not provided to ParallelGroup',
				sectionIndex,
				itemIndex,
				newTimeline
			);
		},
		onRemoveItem = (sectionIndex, itemIndex) => {
			console.warn('onRemoveItem prop not provided to ParallelGroup', sectionIndex, itemIndex);
		},
		timelineNameGetter = (timeline) => timeline,
		customTimelineNamesData = {}
	} = $props();

	const firstGroupItem = $derived(items.find((item) => item.parallel_group_id === groupId));
	const groupTimelines = $derived(firstGroupItem?.groupTimelines || []);

	const groupName = $derived.by(() => {
		if (firstGroupItem?.group_name && firstGroupItem.group_name !== 'Parallel Activities') {
			return firstGroupItem.group_name;
		}

		if (groupTimelines && groupTimelines.length) {
			const timelineNames = groupTimelines.map((t) => timelineNameGetter(t));

			if (timelineNames.length > 2) {
				return 'Multiple Timelines';
			}

			return timelineNames.join(' & ');
		}

		return 'Parallel Activities';
	});

	function calculateLocalTimelineDurations(groupItems, groupId) {
		if (!groupId) return {};
		const groupItemsInThisGroup = groupItems.filter((item) => item.parallel_group_id === groupId);
		if (groupItemsInThisGroup.length === 0) return {};
		const firstItem = groupItemsInThisGroup[0];
		const timelinesInGroup = firstItem?.groupTimelines || [];
		const durations = {};
		timelinesInGroup.forEach((timeline) => {
			const timelineItems = groupItemsInThisGroup.filter(
				(item) => item.parallel_timeline === timeline
			);
			durations[timeline] = timelineItems.reduce(
				(total, item) => total + (parseInt(item.selected_duration) || parseInt(item.duration) || 0),
				0
			);
		});
		return durations;
	}

	const durations = $derived(calculateLocalTimelineDurations(items, groupId));

	const isBeingDragged = $derived(
		dragState.isDragging &&
			dragState.dragType === 'group' &&
			dragState.sourceSection === sectionIndex &&
			dragState.sourceGroupId === groupId
	);

	const _isDropTarget = $derived(
		dragState.targetSection === sectionIndex && dragState.targetGroupId === groupId
	);
</script>

<div
	class="parallel-group-container relative px-2 py-2 mb-2 bg-blue-50 border-l-4 border-blue-300 rounded {isBeingDragged
		? 'dragging'
		: ''}"
	role="group"
	aria-label={groupName}
	draggable="true"
	ondragstart={(e) => startGroupDrag(e, sectionIndex, groupId)}
	ondragover={(e) => handleGroupDragOver(e, sectionIndex, groupId, e.currentTarget)}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	ondragend={handleDragEnd}
>
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div class="group-drag-handle">Drag Entire Block</div>
			<h3 class="text-md font-medium">{groupName}</h3>
		</div>
		<button type="button" onclick={() => onUngroup(groupId)}>Ungroup</button>
	</div>

	{#if groupTimelines?.length > 0}
		<div
			class="grid gap-4"
			style="--timeline-count: {groupTimelines.length}; grid-template-columns: repeat(var(--timeline-count), 1fr);"
		>
			{#each [...groupTimelines].sort() as timeline (timeline)}
				<TimelineColumn
					{timeline}
					{groupTimelines}
					timelineItems={items}
					{sectionIndex}
					{sectionId}
					parallelGroupId={groupId}
					totalDuration={durations[timeline] || 0}
					{timelineNameGetter}
					{customTimelineNamesData}
					{onDurationChange}
					{onTimelineChange}
					{onRemoveItem}
				/>
			{/each}
		</div>
	{:else}
		<div class="text-center text-gray-500 py-4">
			No timelines configured. Click "Create Parallel Block" to add timelines.
		</div>
	{/if}
</div>

<style>
	.parallel-group-container {
		position: relative;
		transition:
			transform 0.2s ease,
			outline 0.2s ease;
	}

	:global(.parallel-group-container.drop-before) {
		position: relative;
	}

	:global(.parallel-group-container.drop-before)::before {
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

	:global(.parallel-group-container.drop-after) {
		position: relative;
	}

	:global(.parallel-group-container.drop-after)::after {
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

	.group-drag-handle {
		padding: 0.25rem 0.5rem;
		border: 1px solid transparent;
		background-color: #f9fafb;
		border-radius: 0.25rem;
		cursor: grab;
	}

	.group-drag-handle:active {
		cursor: grabbing;
	}

	.group-drag-handle:hover {
		border-color: #93c5fd;
	}

	@media (max-width: 767px) {
		.grid {
			grid-template-columns: 1fr !important;
			grid-template-rows: repeat(var(--timeline-count, 2), auto);
		}
	}
</style>
