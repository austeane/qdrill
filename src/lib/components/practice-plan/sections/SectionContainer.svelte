<script>
	import { createEventDispatcher } from 'svelte';
	import {
		startSectionDrag,
		handleSectionDragOver,
		handleDragLeave,
		handleDrop,
		handleDragEnd,
		handleEmptySectionDragOver
	} from '$lib/stores/dragManager';
	import SectionHeader from './SectionHeader.svelte';
	import DrillItem from '../items/DrillItem.svelte';
	import FormationItem from '../items/FormationItem.svelte';
	import ParallelGroup from '../items/ParallelGroup.svelte';

	export let section;
	export let sectionIndex;

	export let onRemoveSection = (sectionId) => {
		console.warn('onRemoveSection prop not provided to SectionContainer', sectionId);
	};
	export let onRemoveItem = (sectionIndex, itemIndex) => {
		console.warn('onRemoveItem prop not provided to SectionContainer', sectionIndex, itemIndex);
	};
	export let onDurationChange = (sectionIndex, itemIndex, newDuration) => {
		console.warn(
			'onDurationChange prop not provided to SectionContainer',
			sectionIndex,
			itemIndex,
			newDuration
		);
	};
	export let onTimelineChange = (sectionIndex, itemIndex, newTimeline) => {
		console.warn(
			'onTimelineChange prop not provided to SectionContainer',
			sectionIndex,
			itemIndex,
			newTimeline
		);
	};
	export let onUngroup = (groupId) => {
		console.warn('onUngroup prop not provided to SectionContainer', groupId);
	};
	export let timelineNameGetter = (timeline) => timeline;
	export let customTimelineNamesData = {};

	const dispatch = createEventDispatcher();

	function handleOpenDrillSearch(event) {
		dispatch('openDrillSearch', event.detail);
	}

       function handleOpenTimelineSelector(event) {
               dispatch('openTimelineSelector', event.detail);
       }

	// Group items by parallel group ID
	$: groupedItems = groupItemsByParallelGroup(section.items);

	function groupItemsByParallelGroup(items) {
		const result = {
			groups: {},
			singles: []
		};

		if (!items) return result;

		items.forEach((item) => {
			if (item.parallel_group_id) {
				if (!result.groups[item.parallel_group_id]) {
					result.groups[item.parallel_group_id] = [];
				}
				result.groups[item.parallel_group_id].push(item);
			} else {
				result.singles.push(item);
			}
		});

		return result;
	}
</script>

<div
	class="section-container bg-white rounded-lg shadow-sm p-4 mb-4"
	draggable="true"
	on:dragstart={(e) => startSectionDrag(e, sectionIndex)}
	on:dragover={(e) => handleSectionDragOver(e, sectionIndex, e.currentTarget)}
	on:dragleave={handleDragLeave}
	on:drop={handleDrop}
	on:dragend={handleDragEnd}
>
	<SectionHeader
		{section}
		onRemove={() => onRemoveSection(section.id)}
		on:openDrillSearch={handleOpenDrillSearch}
		on:openTimelineSelector={handleOpenTimelineSelector}
	/>

	<ul class="space-y-4 min-h-[50px]" on:dragover|preventDefault>
		{#if section.items.length === 0}
			<div
				class="empty-section-placeholder h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500"
				on:dragover={(e) => handleEmptySectionDragOver(e, sectionIndex, e.currentTarget)}
				on:dragleave={handleDragLeave}
				on:drop={handleDrop}
			>
				Drag drills here
			</div>
		{:else}
			<!-- Render all items while preserving original order -->
			{#each section.items as item, itemIndex}
				{#if item.parallel_group_id}
					<!-- Render group header when we find the first item of that group -->
					{#if !section.items
						.slice(0, itemIndex)
						.some((prevItem) => prevItem.parallel_group_id === item.parallel_group_id)}
						<ParallelGroup
							groupId={item.parallel_group_id}
							items={section.items}
							{sectionIndex}
							sectionId={section.id}
							{onUngroup}
							{onDurationChange}
							{onTimelineChange}
							{onRemoveItem}
							{timelineNameGetter}
							{customTimelineNamesData}
						/>
					{/if}
				{:else if item.type === 'formation'}
					<!-- Render formation reference -->
					<FormationItem
						{item}
						{itemIndex}
						{sectionIndex}
						onRemove={() => onRemoveItem(sectionIndex, itemIndex)}
					/>
				{:else}
					<!-- Render regular drill items -->
					<DrillItem
						{item}
						{itemIndex}
						{sectionIndex}
						{onDurationChange}
						{onTimelineChange}
						onRemove={() => onRemoveItem(sectionIndex, itemIndex)}
					/>
				{/if}
			{/each}
		{/if}
	</ul>
</div>

<style>
	.empty-section-placeholder {
		transition: all 0.2s ease;
	}

	.empty-section-placeholder:hover {
		border-color: theme('colors.blue.500');
		color: theme('colors.blue.500');
	}

	:global(.empty-section-target) {
		border-color: #3b82f6;
		border-width: 2px;
		background-color: rgba(59, 130, 246, 0.05);
	}

	.section-container {
		transition: border-color 0.2s ease;
		border: 2px solid transparent;
		cursor: grab;
	}

	.section-container:active {
		cursor: grabbing;
	}

	:global(.section-container.section-drop-before) {
		position: relative;
	}

	:global(.section-container.section-drop-before)::before {
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

	:global(.section-container.section-drop-after) {
		position: relative;
	}

	:global(.section-container.section-drop-after)::after {
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
