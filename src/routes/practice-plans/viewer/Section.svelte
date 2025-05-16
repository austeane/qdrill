<script>
	import { slide } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import DrillCard from './DrillCard.svelte';
	import ParallelGroup from './ParallelGroup.svelte';

	export let section;
	export let isActive = false;
	export let canEdit = false;
	export let sectionIndex = 0;
	export let startTime = null;

	const dispatch = createEventDispatcher();
	let isCollapsed = false;

	const sectionColors = [
		'bg-blue-50',
		'bg-green-50',
		'bg-purple-50',
		'bg-amber-50',
		'bg-rose-50',
		'bg-cyan-50'
	];

	$: {
		console.log('[Section] Received section data:', {
			name: section.name,
			items: section.items?.map((item) => ({
				id: item.id,
				name: item.name,
				type: item.type,
				isOneOff: item.type === 'one-off' || (item.type === 'drill' && item.drill_id === null),
				duration: item.selected_duration || item.duration,
				drill: {
					name: item.drill?.name,
					duration: item.drill?.duration
				}
			}))
		});
	}

	$: {
		console.log('[Section] Full section data:', section);
		if (section.items?.length > 0) {
			console.log('[Section] First item in section:', section.items[0]);
			if (
				section.items[0].type === 'one-off' ||
				(section.items[0].type === 'drill' && section.items[0].drill_id === null)
			) {
				console.log('[Section] First item is a one-off drill');
			}
		}
	}

	$: normalizedItems = section.items?.map((item) => ({
		...item,
		name: item.drill?.name || item.name || 'Unnamed Item',
		duration: item.selected_duration || item.drill?.duration || item.duration || 15,
		description: item.drill?.brief_description || item.brief_description || '',
		skill_level: item.drill?.skill_level || item.skill_level || [],
		skills_focused_on: item.drill?.skills_focused_on || item.skills_focused_on || []
	}));

	$: {
		console.log('[Section] Normalized items:', normalizedItems);
	}

	function calculateSectionDuration(items) {
		if (!items || items.length === 0) return 0;

		const parallelGroups = {};
		let totalDuration = 0;

		items.forEach((item) => {
			const duration = parseInt(
				item.selected_duration ||
					item.duration ||
					(item.drill && item.drill.suggested_length_max) ||
					15
			);

			if (item.parallel_group_id) {
				if (!parallelGroups[item.parallel_group_id]) {
					parallelGroups[item.parallel_group_id] = {};
				}
				const timeline = item.parallel_timeline || 'CHASERS';
				if (!parallelGroups[item.parallel_group_id][timeline]) {
					parallelGroups[item.parallel_group_id][timeline] = 0;
				}
				parallelGroups[item.parallel_group_id][timeline] += duration;
			} else {
				totalDuration += duration;
			}
		});

		// Add the max duration from each parallel group's timelines
		Object.values(parallelGroups).forEach((timelineGroups) => {
			const maxTimelineDuration = Math.max(...Object.values(timelineGroups));
			totalDuration += maxTimelineDuration;
		});

		return totalDuration;
	}

	$: sectionDuration = calculateSectionDuration(section.items);

	$: groupedItems = section.items?.reduce(
		(acc, item) => {
			if (item.parallel_group_id) {
				if (!acc.parallelGroups[item.parallel_group_id]) {
					acc.parallelGroups[item.parallel_group_id] = [];
				}
				acc.parallelGroups[item.parallel_group_id].push(item);
			} else {
				acc.singles.push(item);
			}
			return acc;
		},
		{ singles: [], parallelGroups: {} }
	) || { singles: [], parallelGroups: {} };

	// Calculate cumulative duration for start times
	$: {
		let currentTime = startTime;
		groupedItems.singles.forEach((item) => {
			item.startTime = currentTime;
			currentTime = addMinutes(currentTime, item.selected_duration || item.duration || 0);
		});

		Object.values(groupedItems.parallelGroups).forEach((group) => {
			const groupStartTime = currentTime;
			const maxDuration = Math.max(
				...group.map((item) => item.selected_duration || item.duration || 0)
			);
			group.forEach((item) => {
				item.startTime = groupStartTime;
			});
			currentTime = addMinutes(currentTime, maxDuration);
		});
	}

	function addMinutes(timeStr, minutes) {
		if (!timeStr) return null;
		const [hours, mins] = timeStr.split(':').map(Number);
		const totalMinutes = hours * 60 + mins + minutes;
		const newHours = Math.floor(totalMinutes / 60);
		const newMins = totalMinutes % 60;
		return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
	}

	function handleEdit(event) {
		dispatch('edit', event.detail);
	}

	function handleDurationChange(event) {
		dispatch('durationChange', event.detail);
	}

	function handleUngroup(event) {
		dispatch('ungroup', event.detail);
	}

	function toggleCollapse() {
		isCollapsed = !isCollapsed;
		dispatch('collapse', { isCollapsed });
	}

	function handleDrop(event, targetItem) {
		const draggedItemData = event.dataTransfer.getData('text/plain');
		try {
			const draggedItem = JSON.parse(draggedItemData);
			if (draggedItem && targetItem) {
				const groupId = `group_${Date.now()}`;
				dispatch('updateItems', {
					sourceId: draggedItem.id,
					targetId: targetItem.id,
					groupId: groupId
				});
			}
		} catch (e) {
			console.error('Error handling drop:', e);
		}
	}

	function handleDragStart(event, item) {
		event.dataTransfer.setData('text/plain', JSON.stringify(item));
	}

	function getSectionColor(index) {
		return sectionColors[index % sectionColors.length];
	}

	$: console.log('Section Color:', getSectionColor(sectionIndex), 'Index:', sectionIndex);
</script>

<div
	class="practice-section {getSectionColor(sectionIndex)}"
	class:active={isActive}
	id={`section-${section.id}`}
>
	<header class="section-header">
		<div class="section-info">
			<div
				class="title-area"
				on:click={toggleCollapse}
				role="button"
				tabindex="0"
				on:keydown={(e) => e.key === 'Enter' && toggleCollapse()}
			>
				<svg
					class="w-4 h-4 transform transition-transform {isCollapsed ? '-rotate-90' : ''}"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
					/>
				</svg>
				<h2 class="section-title">{section.name || 'Unnamed Section'}</h2>
			</div>
			<span class="section-duration">{sectionDuration} minutes</span>
		</div>

		{#if section.goals?.length > 0}
			<div class="section-goals">
				<h3 class="goals-title">Section Goals:</h3>
				<ul class="goals-list">
					{#each section.goals as goal}
						<li>{goal}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</header>

	{#if !isCollapsed}
		<div class="section-content" transition:slide>
			<!-- Render items in their original order -->
			{#each section.items as item, itemIndex (item.id)}
				{#if item.parallel_group_id}
					<!-- Only render the parallel group once per group ID -->
					{#if !section.items
						.slice(0, itemIndex)
						.some((prevItem) => prevItem.parallel_group_id === item.parallel_group_id)}
						<ParallelGroup
							items={section.items.filter((i) => i.parallel_group_id === item.parallel_group_id)}
							{canEdit}
							startTime={item.startTime}
							on:edit={handleEdit}
							on:durationChange={handleDurationChange}
							on:ungroup={handleUngroup}
						/>
					{/if}
				{:else}
					<!-- Render regular drill items -->
					<DrillCard
						{item}
						editable={canEdit}
						startTime={item.startTime}
						on:edit={handleEdit}
						on:durationChange={handleDurationChange}
					/>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.practice-section {
		margin: 1rem 0;
		padding: 1rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.practice-section.active {
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
		border-left: 4px solid theme('colors.blue.500');
		filter: brightness(0.95);
	}

	.section-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.section-info {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	.title-area {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.25rem;
		transition: all 0.2s ease;
	}

	.title-area:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: theme('colors.gray.900');
	}

	.section-duration {
		margin-left: auto;
		color: theme('colors.gray.500');
		font-size: 0.875rem;
	}

	.section-goals {
		padding: 0.5rem;
		background: theme('colors.gray.50');
		border-radius: 0.25rem;
	}

	.goals-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: theme('colors.gray.700');
		margin-bottom: 0.25rem;
	}

	.goals-list {
		list-style-type: disc;
		margin-left: 1.5rem;
		font-size: 0.875rem;
		color: theme('colors.gray.600');
	}

	.section-content {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.draggable {
		cursor: move;
	}

	@media (max-width: 640px) {
		.practice-section {
			padding: 1rem;
			margin-bottom: 1rem;
		}

		.section-title {
			font-size: 1.25rem;
		}
	}
</style>
