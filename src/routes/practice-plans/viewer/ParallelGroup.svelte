<script>
	import DrillCard from './DrillCard.svelte';
	import {
		customTimelineColors,
		customTimelineNames,
		DEFAULT_TIMELINE_COLORS,
		DEFAULT_TIMELINE_NAMES
	} from '$lib/stores/sectionsStore';

	let {
		items = [],
		canEdit = false,
		startTime = null,
		onUngroup,
		onEdit,
		onDurationChange
	} = $props();

	// Group items by timeline
	const timelineGroups = $derived.by(() =>
		items.reduce((acc, item) => {
			const timeline = item.parallel_timeline || 'CHASERS';
			if (!acc[timeline]) {
				acc[timeline] = [];
			}
			acc[timeline].push(item);
			return acc;
		}, {})
	);

	// Calculate max duration across all timelines
	const groupDuration = $derived.by(() =>
		Math.max(
			...Object.values(timelineGroups).map((timelineItems) =>
				timelineItems.reduce((sum, item) => sum + (item.selected_duration || item.duration || 0), 0)
			)
		)
	);

	// Get the group name from the first item in the group
	const groupName = $derived(items[0]?.group_name || 'Parallel Activities');

	function ungroup() {
		onUngroup?.({ groupId: items[0]?.parallel_group_id });
	}

	// Helper function to format time (copied from DrillCard)
	function formatTime(timeStr) {
		if (!timeStr) return '';
		const [hours, minutes] = timeStr.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const hour12 = hour % 12 || 12;
		return `${hour12}:${minutes} ${ampm}`;
	}

	// Helper function to add minutes (copied from +page.svelte)
	function addMinutes(timeStr, minutes) {
		if (!timeStr) return null;
		const [hours, mins] = timeStr.split(':').map(Number);
		const date = new Date();
		date.setHours(hours, mins + minutes);
		return (
			date.getHours().toString().padStart(2, '0') +
			':' +
			date.getMinutes().toString().padStart(2, '0')
		);
	}

	// Calculate start times within each timeline
	const timelineGroupsWithStartTimes = $derived.by(() =>
		Object.entries(timelineGroups).map(([timeline, timelineItems]) => {
			let currentTimelineTime = startTime; // Start with the group's overall start time
			const itemsWithStartTimes = timelineItems.map((item) => {
				const itemStartTime = currentTimelineTime;
				currentTimelineTime = addMinutes(
					currentTimelineTime,
					item.selected_duration || item.duration || 0
				);
				return { ...item, startTime: itemStartTime };
			});
			return [timeline, itemsWithStartTimes];
		})
	);

	function getTimelineColorClass(timeline) {
		return (
			customTimelineColors?.[timeline] ||
			DEFAULT_TIMELINE_COLORS?.[timeline] ||
			'bg-gray-500'
		);
	}

	function getTimelineDisplayName(timeline) {
		return (
			customTimelineNames?.[timeline] || DEFAULT_TIMELINE_NAMES?.[timeline] || timeline || ''
		);
	}
</script>

<div class="parallel-group">
	<div class="group-header">
		<div class="parallel-indicator">{groupName}</div>
			<div class="group-actions">
				<div class="group-duration">
					{#if startTime}
						<span class="text-sm text-gray-500 mr-2">{formatTime(startTime)}</span>
					{/if}
					{groupDuration} min
				</div>
				{#if canEdit}
					<button class="ungroup-btn" onclick={ungroup} title="Ungroup activities"> Ungroup </button>
				{/if}
			</div>
		</div>

	<div class="group-content">
			{#each timelineGroupsWithStartTimes as [timeline, timelineItems] (timeline)}
				<div class="timeline-column" class:single-timeline={Object.keys(timelineGroups).length === 1}>
					<div class="timeline-header {getTimelineColorClass(timeline)}">
						{getTimelineDisplayName(timeline)}
					</div>
					<div class="timeline-items">
						{#each timelineItems as item, idx (item.id ?? item.drill?.id ?? idx)}
							<DrillCard
								{item}
								editable={canEdit}
								startTime={item.startTime}
								isInParallelGroup={true}
								onEdit={onEdit}
								onDurationChange={onDurationChange}
							/>
						{/each}
					</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.parallel-group {
		border: 1px solid theme('colors.gray.200');
		border-radius: 0.5rem;
		padding: 1rem;
		background: theme('colors.gray.50');
	}

	.group-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.parallel-indicator {
		font-size: 0.875rem;
		color: theme('colors.gray.600');
		font-weight: 500;
	}

	.group-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.group-duration {
		font-size: 0.875rem;
		color: theme('colors.gray.600');
	}

	.ungroup-btn {
		font-size: 0.75rem;
		color: theme('colors.red.600');
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid theme('colors.red.200');
		background: theme('colors.red.50');
	}

	.ungroup-btn:hover {
		background: theme('colors.red.100');
	}

	.group-content {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	}

	.timeline-column {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.timeline-column.single-timeline {
		grid-column: 1 / -1;
		max-width: 600px;
		margin: 0 auto;
	}

	.timeline-header {
		padding: 0.5rem;
		border-radius: 0.25rem;
		font-weight: 500;
		color: white;
		text-align: center;
	}

	.timeline-items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	@media (max-width: 640px) {
		.group-content {
			grid-template-columns: 1fr;
		}

		.timeline-column {
			border-bottom: 1px solid theme('colors.gray.200');
			padding-bottom: 1rem;
		}

		.timeline-column:last-child {
			border-bottom: none;
			padding-bottom: 0;
		}
	}
</style>
