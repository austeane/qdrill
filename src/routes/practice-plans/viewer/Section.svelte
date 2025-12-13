<script>
	import { slide } from 'svelte/transition';
	import DrillCard from './DrillCard.svelte';
	import ParallelGroup from './ParallelGroup.svelte';
	import FormationReference from '$lib/components/practice-plan/FormationReference.svelte';

	let {
		section,
		isActive = false,
		canEdit = false,
		sectionIndex = 0,
		startTime = null,
		onEdit,
		onDurationChange,
		onUngroup,
		onCollapse
	} = $props();

	let isCollapsed = $state(false);

	const sectionColors = [
		'bg-blue-50',
		'bg-green-50',
		'bg-purple-50',
		'bg-amber-50',
		'bg-rose-50',
		'bg-cyan-50'
	];

	const normalizedItems = $derived.by(() =>
		(section?.items ?? []).map((item) => ({
			...item,
			name: item.drill?.name || item.name || 'Unnamed Item',
			duration: Number(item.selected_duration ?? item.drill?.duration ?? item.duration ?? 15),
			description: item.drill?.brief_description || item.brief_description || '',
			skill_level: item.drill?.skill_level || item.skill_level || [],
			skills_focused_on: item.drill?.skills_focused_on || item.skills_focused_on || []
		}))
	);

	// Separate formations from regular items
	const formations = $derived(normalizedItems.filter((item) => item.type === 'formation'));
	const drillItems = $derived(normalizedItems.filter((item) => item.type !== 'formation'));

	function addMinutes(timeStr, minutes) {
		if (!timeStr) return null;
		const [hours, mins] = timeStr.split(':').map(Number);
		const totalMinutes = hours * 60 + mins + minutes;
		const newHours = Math.floor(totalMinutes / 60);
		const newMins = totalMinutes % 60;
		return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
	}

	function getItemDurationMinutes(item) {
		const value = Number(item.selected_duration ?? item.duration ?? 0);
		return Number.isFinite(value) ? value : 0;
	}

	const timing = $derived.by(() => {
		const groupMaxDurations = new Map();
		for (const item of drillItems) {
			if (!item.parallel_group_id) continue;
			const duration = getItemDurationMinutes(item);
			const prev = groupMaxDurations.get(item.parallel_group_id) ?? 0;
			if (duration > prev) {
				groupMaxDurations.set(item.parallel_group_id, duration);
			}
		}

		const singleStartTimes = new Map();
		const groupStartTimes = new Map();
		const processedGroups = new Set();
		let currentTime = startTime;
		let duration = 0;

		for (const item of drillItems) {
			const itemDuration = getItemDurationMinutes(item);

			if (item.parallel_group_id) {
				if (processedGroups.has(item.parallel_group_id)) continue;
				processedGroups.add(item.parallel_group_id);

				groupStartTimes.set(item.parallel_group_id, currentTime);

				const groupDuration = groupMaxDurations.get(item.parallel_group_id) ?? itemDuration;
				duration += groupDuration;
				currentTime = addMinutes(currentTime, groupDuration);

				continue;
			}

			singleStartTimes.set(item.id, currentTime);
			duration += itemDuration;
			currentTime = addMinutes(currentTime, itemDuration);
		}

		return { duration, singleStartTimes, groupStartTimes };
	});

	function toggleCollapse() {
		const nextCollapsed = !isCollapsed;
		isCollapsed = nextCollapsed;
		onCollapse?.({ isCollapsed: nextCollapsed });
	}

	function getSectionColor(index) {
		return sectionColors[index % sectionColors.length];
	}
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
					onclick={toggleCollapse}
					role="button"
					tabindex="0"
					onkeydown={(e) => e.key === 'Enter' && toggleCollapse()}
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
				<span class="section-duration">{timing.duration} minutes</span>
			</div>

		{#if section.goals?.length > 0}
			<div class="section-goals">
				<h3 class="goals-title">Section Goals:</h3>
				<ul class="goals-list">
					{#each section.goals as goal, goalIndex (goalIndex)}
						<li>{goal}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</header>

	{#if !isCollapsed}
		<div class="section-content" transition:slide>
			<!-- Display formation references if any -->
			<FormationReference {formations} />

			<!-- Render drill items in their original order -->
			{#each drillItems as item, itemIndex (item.id)}
				{#if item.parallel_group_id}
					<!-- Only render the parallel group once per group ID -->
					{#if !drillItems
						.slice(0, itemIndex)
						.some((prevItem) => prevItem.parallel_group_id === item.parallel_group_id)}
							<ParallelGroup
								items={drillItems.filter((i) => i.parallel_group_id === item.parallel_group_id)}
								{canEdit}
								startTime={timing.groupStartTimes.get(item.parallel_group_id)}
								onUngroup={onUngroup}
								onEdit={onEdit}
								onDurationChange={onDurationChange}
							/>
						{/if}
					{:else}
					<!-- Render regular drill items -->
					<DrillCard
							{item}
							editable={canEdit}
							startTime={timing.singleStartTimes.get(item.id)}
							onEdit={onEdit}
							onDurationChange={onDurationChange}
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
