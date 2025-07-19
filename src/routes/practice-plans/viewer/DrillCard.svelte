<script>
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';
	import ExcalidrawWrapper from '$lib/components/ExcalidrawWrapper.svelte';

	export let item;
	export let isInParallelGroup = false;
	export let editable = false;
	export let startTime = null;

	const dispatch = createEventDispatcher();
	let isExpanded = false;

	$: {
		console.log('[DrillCard] Full item data:', item);
		console.log('[DrillCard] Drill data:', item?.drill);
	}

	$: normalizedItem = {
		...item,
		name: item?.name || (item?.type === 'break' ? 'Break' : item?.drill?.name || 'Unnamed Item'),
		duration: item?.selected_duration || item?.duration || item?.drill?.duration || 15,
		description: item?.brief_description || item?.drill?.brief_description || '',
		detailedDescription: item?.detailed_description || item?.drill?.detailed_description || '',
		skillLevel: item?.skill_level || item?.drill?.skill_level || [],
		skillsFocusedOn: item?.skills_focused_on || item?.drill?.skills_focused_on || [],
		positionsFocusedOn: item?.positions_focused_on || item?.drill?.positions_focused_on || [],
		complexity: item?.complexity || item?.drill?.complexity || '',
		suggestedLengthMin: item?.suggested_length_min ?? item?.drill?.suggested_length_min ?? null,
		suggestedLengthMax: item?.suggested_length_max ?? item?.drill?.suggested_length_max ?? null,
		numberOfPeopleMin: item?.number_of_people_min || item?.drill?.number_of_people_min,
		numberOfPeopleMax: item?.number_of_people_max || item?.drill?.number_of_people_max,
		drillType: item?.drill_type || item?.drill?.drill_type || [],
		drill: item?.drill || item,
		hasDiagrams: item?.drill?.diagrams?.length > 0 || item?.diagrams?.length > 0,
		hasVideo: Boolean(item?.drill?.video_link || item?.video_link),
		isBreak: item?.type === 'break'
	};

	$: {
		console.log('[DrillCard] Normalized item:', normalizedItem);
	}

	function toggleExpand() {
		isExpanded = !isExpanded;
		console.log('[DrillCard] Toggled expansion:', isExpanded);
	}

	function handleEdit() {
		dispatch('edit', { item });
	}

	function handleDurationChange(newDuration) {
		dispatch('durationChange', {
			itemId: item.id,
			duration: parseInt(newDuration)
		});
	}

	function handleDurationInput(event) {
		const newDuration = parseInt(event.target.value) || normalizedItem.duration;
		if (newDuration > 0) {
			handleDurationChange(newDuration);
		}
	}

	// Helper function to format time
	function formatTime(timeStr) {
		if (!timeStr) return '';
		const [hours, minutes] = timeStr.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const hour12 = hour % 12 || 12;
		return `${hour12}:${minutes} ${ampm}`;
	}
	
	// Helper functions for position badges
	function getPositionColor(position) {
		const colors = {
			CHASERS: '#3B82F6', // Blue
			BEATERS: '#EF4444', // Red
			SEEKERS: '#10B981'  // Green
		};
		return colors[position] || '#6B7280'; // Gray fallback
	}
	
	function formatPositionName(position) {
		if (!position) return '';
		return position.charAt(0) + position.slice(1).toLowerCase();
	}
</script>

<div
	class="drill-card"
	class:break={normalizedItem.type === 'break'}
	class:parallel={isInParallelGroup}
	class:expanded={isExpanded}
>
	<div
		class="card-header"
		on:click={toggleExpand}
		role="button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Enter' && toggleExpand()}
	>
		<!-- Main Info -->
		<div class="header-content">
			<svg
				class="w-4 h-4 transform transition-transform {isExpanded ? 'rotate-180' : ''}"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
				/>
			</svg>

			<div class="title-section">
				<h3 class="drill-title">
					{normalizedItem.name}
				</h3>

				<!-- Position Badge (only show when not in parallel group) -->
				{#if item.parallel_timeline && !isInParallelGroup}
					<span 
						class="position-badge" 
						style="background-color: {getPositionColor(item.parallel_timeline)}"
					>
						{formatPositionName(item.parallel_timeline)}
					</span>
				{/if}

				<!-- Indicators -->
				<div class="indicators">
					{#if normalizedItem.hasDiagrams}
						<span class="indicator diagram-indicator" title="Has diagrams"> 📊 </span>
					{/if}
					{#if normalizedItem.hasVideo}
						<span class="indicator video-indicator" title="Has video"> 🎥 </span>
					{/if}
				</div>
			</div>

			<!-- Duration Control -->
			<div class="duration-control">
				{#if editable}
					<input
						type="number"
						min="1"
						class="duration-input"
						value={normalizedItem.duration}
						on:input={handleDurationInput}
						on:blur={handleDurationInput}
						on:click|stopPropagation={() => {}}
					/>
					<span class="duration-label">min</span>
				{:else}
					<div class="flex flex-col items-end">
						{#if startTime}
							<span class="text-sm text-gray-500">{formatTime(startTime)}</span>
						{/if}
						<div class="flex items-center">
							<span class="duration-display">{normalizedItem.duration}</span>
							<span class="duration-label">min</span>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if isExpanded}
		<div class="card-details" transition:slide>
			{#if !normalizedItem.isBreak}
				<!-- Brief Description -->
				<p class="brief-description">
					{normalizedItem.description}
				</p>

				<!-- Detailed Description -->
				<div class="detailed-description">
					<h4 class="info-subtitle">Detailed Description</h4>
					<div class="description-text prose prose-sm">
						{@html normalizedItem.detailedDescription}
					</div>
				</div>

				<!-- Key Information -->
				<div class="key-info">
					{#if normalizedItem.skillLevel}
						<div class="info-item">
							<span class="info-label">Skill Level:</span>
							<span class="info-value"
								>{Array.isArray(normalizedItem.skillLevel)
									? normalizedItem.skillLevel.join(', ')
									: normalizedItem.skillLevel}</span
							>
						</div>
					{/if}

					{#if normalizedItem.complexity}
						<div class="info-item">
							<span class="info-label">Complexity:</span>
							<span class="info-value">{normalizedItem.complexity}</span>
						</div>
					{/if}

					{#if normalizedItem.suggestedLengthMin !== null}
						<div class="info-item">
							<span class="info-label">Suggested Length:</span>
							<span class="info-value">
								{#if normalizedItem.suggestedLengthMax !== null && normalizedItem.suggestedLengthMax > normalizedItem.suggestedLengthMin}
									{normalizedItem.suggestedLengthMin} - {normalizedItem.suggestedLengthMax} minutes
								{:else}
									{normalizedItem.suggestedLengthMin} minutes
								{/if}
							</span>
						</div>
					{/if}

					{#if normalizedItem.numberOfPeopleMin}
						<div class="info-item">
							<span class="info-label">Players:</span>
							<span class="info-value">
								{normalizedItem.numberOfPeopleMin}-{normalizedItem.numberOfPeopleMax || 'Any'}
							</span>
						</div>
					{/if}

					{#if normalizedItem.drillType?.length}
						<div class="info-item">
							<span class="info-label">Drill Type:</span>
							<span class="info-value">
								{Array.isArray(normalizedItem.drillType)
									? normalizedItem.drillType.join(', ')
									: normalizedItem.drillType}
							</span>
						</div>
					{/if}

					{#if normalizedItem.skillsFocusedOn?.length}
						<div class="info-item">
							<span class="info-label">Skills:</span>
							<div class="skill-tags">
								{#each Array.isArray(normalizedItem.skillsFocusedOn) ? normalizedItem.skillsFocusedOn : normalizedItem.skillsFocusedOn.split(',') as skill}
									<span class="skill-tag">{skill.trim()}</span>
								{/each}
							</div>
						</div>
					{/if}

					{#if normalizedItem.positionsFocusedOn?.length}
						<div class="info-item">
							<span class="info-label">Positions:</span>
							<div class="skill-tags">
								{#each Array.isArray(normalizedItem.positionsFocusedOn) ? normalizedItem.positionsFocusedOn : normalizedItem.positionsFocusedOn.split(',') as position}
									<span class="skill-tag">{position.trim()}</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Diagrams Preview -->
				{#if normalizedItem.hasDiagrams}
					<div class="diagrams-preview">
						{#if normalizedItem.drill?.diagrams?.[0]}
                                                        <ExcalidrawWrapper
                                                                data={normalizedItem.drill.diagrams[0]}
                                                                id={`card-diagram-${index}-0`}
                                                                readonly={true}
                                                        />
						{:else if normalizedItem.diagrams?.[0]}
                                                        <ExcalidrawWrapper
                                                                data={normalizedItem.diagrams[0]}
                                                                id={`card-diagram-${index}-0-alt`}
                                                                readonly={true}
                                                        />
						{/if}
					</div>
				{/if}

				<!-- Video Link -->
				{#if normalizedItem.hasVideo}
					<a
						href={normalizedItem.drill?.video_link || normalizedItem.video_link}
						target="_blank"
						rel="noopener noreferrer"
						class="video-link"
					>
						Watch Video Demo
					</a>
				{/if}

				<!-- Action Button: Go to Drill / Create as Drill -->
				<div class="action-buttons-container mt-4">
					{#if item.drill_id}
						<a
							href={`/drills/${item.drill_id}`}
							target="_blank"
							rel="noopener noreferrer"
							class="action-button"
						>
							Go to Drill
						</a>
					{:else if item.type !== 'break'}
						<a
							href={`/drills/create?name=${encodeURIComponent(normalizedItem.name)}&practice_plan_id=${item.practice_plan_id}&practice_plan_item_id=${item.id}`}
							target="_blank"
							rel="noopener noreferrer"
							class="action-button"
						>
							Create as Drill
						</a>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.drill-title {
		font-weight: 600;
		font-size: 1rem;
		line-height: 1.5rem;
		color: theme('colors.gray.800');
	}

	.card-header {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		gap: 0.5rem;
	}

	.header-content {
		display: flex;
		flex-grow: 1;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.title-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-grow: 1;
	}
	
	.position-badge {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		color: white;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.indicators {
		display: flex;
		gap: 0.25rem;
	}

	.duration-control {
		display: flex;
		align-items: center;
		white-space: nowrap;
	}

	.duration-display {
		font-weight: 500;
		margin-right: 0.25rem;
	}

	.duration-label {
		font-size: 0.875rem;
		color: theme('colors.gray.500');
	}

	.duration-input {
		width: 3.5rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid theme('colors.gray.300');
		border-radius: 0.25rem;
		text-align: right;
		margin-right: 0.25rem;
	}

	.duration-control > .flex.flex-col {
		display: flex;
	}
	.duration-control > .flex.items-center:not(.editable-input-wrapper) {
		display: flex;
	}

	.action-buttons-container {
		display: flex;
		justify-content: flex-start; /* Or flex-end, center as preferred */
		gap: 0.5rem; /* Space between buttons if multiple were ever added */
	}

	.action-button {
		display: inline-block;
		padding: 0.5rem 1rem; /* Adjust padding as needed */
		background-color: theme('colors.blue.500');
		color: white;
		border-radius: 0.375rem; /* Equivalent to Tailwind's rounded-md */
		text-decoration: none;
		text-align: center;
		font-size: 0.875rem; /* text-sm */
		font-weight: 500; /* medium */
		transition: background-color 0.2s ease-in-out;
	}

	.action-button:hover {
		background-color: theme('colors.blue.600');
	}

	.video-link {
		display: inline-block;
		margin-top: 1rem; /* Ensure spacing if video link is present */
		color: theme('colors.blue.600');
		text-decoration: underline;
	}

	.video-link:hover {
		color: theme('colors.blue.800');
	}

	/* Main card styles */
	.drill-card {
		background: white;
		border: 1px solid theme('colors.gray.200');
		border-radius: 0.5rem;
		margin-bottom: 0.5rem;
		transition: all 0.2s ease;
	}

	.drill-card:hover {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.drill-card.break {
		background: theme('colors.gray.50');
		border-color: theme('colors.gray.300');
	}

	.drill-card.parallel {
		border-left: 4px solid theme('colors.blue.500');
	}

	.drill-card.expanded {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	/* Card details section */
	.card-details {
		padding: 1rem;
		border-top: 1px solid theme('colors.gray.200');
	}

	.brief-description {
		margin-bottom: 1rem;
		color: theme('colors.gray.600');
		line-height: 1.5;
	}

	.detailed-description {
		margin-bottom: 1rem;
	}

	.info-subtitle {
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: theme('colors.gray.700');
	}

	.description-text {
		color: theme('colors.gray.600');
		line-height: 1.6;
	}

	/* Key information styles */
	.key-info {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.info-item {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: flex-start;
	}

	.info-label {
		font-weight: 500;
		color: theme('colors.gray.700');
		min-width: 120px;
	}

	.info-value {
		color: theme('colors.gray.600');
		flex: 1;
	}

	/* Skill tags styles - THIS WAS MISSING! */
	.skill-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		flex: 1;
	}

	.skill-tag {
		background-color: theme('colors.gray.100');
		color: theme('colors.gray.700');
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
	}

	/* Indicators */
	.indicator {
		font-size: 1rem;
		line-height: 1;
	}

	.diagram-indicator,
	.video-indicator {
		opacity: 0.7;
	}

	/* Diagrams preview */
	.diagrams-preview {
		margin-top: 1rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 0.5rem;
		overflow: hidden;
	}
</style>
