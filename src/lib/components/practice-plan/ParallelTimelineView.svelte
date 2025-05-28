<script>
	import { fade } from 'svelte/transition';
	
	export let items = [];
	export let sectionName = '';
	export let showTimeline = true;
	
	// Group items by parallel_group_id
	function groupItemsByParallel(items) {
		const groups = [];
		const processedIds = new Set();
		
		items.forEach(item => {
			if (processedIds.has(item.id)) return;
			
			if (item.parallel_group_id) {
				// Find all items with the same parallel_group_id
				const parallelItems = items.filter(i => i.parallel_group_id === item.parallel_group_id);
				parallelItems.forEach(i => processedIds.add(i.id));
				
				groups.push({
					type: 'parallel',
					id: item.parallel_group_id,
					items: parallelItems,
					duration: Math.max(...parallelItems.map(i => i.duration || 0))
				});
			} else {
				processedIds.add(item.id);
				groups.push({
					type: 'single',
					id: item.id,
					item: item,
					duration: item.duration || 0
				});
			}
		});
		
		return groups;
	}
	
	// Timeline colors for different position groups
	const timelineColors = {
		'BEATERS': 'bg-red-100 border-red-300 text-red-800',
		'CHASERS': 'bg-blue-100 border-blue-300 text-blue-800',
		'KEEPERS': 'bg-green-100 border-green-300 text-green-800',
		'SEEKERS': 'bg-purple-100 border-purple-300 text-purple-800',
		'CHASERS/KEEPERS': 'bg-teal-100 border-teal-300 text-teal-800',
		'ALL': 'bg-gray-100 border-gray-300 text-gray-800'
	};
	
	function getTimelineColor(timeline) {
		return timelineColors[timeline] || 'bg-gray-100 border-gray-300 text-gray-800';
	}
	
	// Calculate cumulative time
	function calculateStartTimes(groups) {
		let currentTime = 0;
		return groups.map(group => {
			const startTime = currentTime;
			currentTime += group.duration;
			return { ...group, startTime };
		});
	}
	
	$: groupedItems = groupItemsByParallel(items);
	$: timedGroups = calculateStartTimes(groupedItems);
	
	// Format time display
	function formatTime(minutes) {
		if (minutes === 0) return '0:00';
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}` : `${mins}:00`;
	}
</script>

{#if showTimeline && timedGroups.length > 0}
	<div class="parallel-timeline-view" transition:fade={{ duration: 200 }}>
		{#if sectionName}
			<h4 class="text-sm font-medium text-gray-700 mb-3">{sectionName} Timeline</h4>
		{/if}
		
		<div class="timeline-container">
			{#each timedGroups as group (group.id)}
				<div class="timeline-block" style="flex: {group.duration}">
					<div class="time-marker">
						{formatTime(group.startTime)}
					</div>
					
					{#if group.type === 'single'}
						<div class="single-item">
							<div class="item-card {group.item.type === 'break' ? 'break-item' : ''}">
								<div class="item-name">{group.item.name || 'Unnamed'}</div>
								<div class="item-duration">{group.duration} min</div>
								{#if group.item.type === 'formation'}
									<div class="item-type-badge formation">Formation</div>
								{/if}
							</div>
						</div>
					{:else}
						<div class="parallel-items">
							{#each group.items as item (item.id)}
								<div class="parallel-lane">
									<div class="timeline-label {getTimelineColor(item.parallel_timeline)}">
										{item.parallel_timeline}
									</div>
									<div class="item-card">
										<div class="item-name">{item.name || 'Unnamed'}</div>
										<div class="item-duration">{item.duration} min</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
			
			<!-- End time marker -->
			<div class="time-marker end-marker">
				{formatTime(timedGroups.reduce((sum, g) => sum + g.duration, 0))}
			</div>
		</div>
		
		<!-- Legend -->
		<div class="legend">
			<div class="legend-item">
				<div class="legend-icon single"></div>
				<span>Full team activity</span>
			</div>
			<div class="legend-item">
				<div class="legend-icon parallel"></div>
				<span>Parallel activities</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.parallel-timeline-view {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
		margin: 1rem 0;
	}
	
	.timeline-container {
		display: flex;
		position: relative;
		min-height: 120px;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		overflow-x: auto;
		padding: 0.5rem;
	}
	
	.timeline-block {
		position: relative;
		display: flex;
		flex-direction: column;
		min-width: 80px;
		margin-right: 0.5rem;
	}
	
	.time-marker {
		position: absolute;
		top: -1.5rem;
		left: 0;
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
	}
	
	.end-marker {
		position: absolute;
		right: -3rem;
		top: -1.5rem;
		left: auto;
	}
	
	.single-item,
	.parallel-items {
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.parallel-lane {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem;
		background: #f3f4f6;
		border-radius: 0.375rem;
		border: 1px solid #e5e7eb;
	}
	
	.timeline-label {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
		border-width: 1px;
		border-style: solid;
		min-width: 80px;
		text-align: center;
	}
	
	.item-card {
		flex: 1;
		padding: 0.5rem;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.item-card.break-item {
		background: #fef3c7;
		border-color: #fbbf24;
	}
	
	.item-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: #111827;
		line-height: 1.25;
	}
	
	.item-duration {
		font-size: 0.75rem;
		color: #6b7280;
	}
	
	.item-type-badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		font-size: 0.75rem;
		border-radius: 0.25rem;
		font-weight: 500;
	}
	
	.item-type-badge.formation {
		background: #ddd6fe;
		color: #6b21a8;
	}
	
	.legend {
		display: flex;
		gap: 1.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
		font-size: 0.875rem;
		color: #6b7280;
	}
	
	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.legend-icon {
		width: 1rem;
		height: 1rem;
		border-radius: 0.25rem;
	}
	
	.legend-icon.single {
		background: #e5e7eb;
		border: 1px solid #d1d5db;
	}
	
	.legend-icon.parallel {
		background: linear-gradient(45deg, #fecaca 50%, #bfdbfe 50%);
		border: 1px solid #d1d5db;
	}
</style>