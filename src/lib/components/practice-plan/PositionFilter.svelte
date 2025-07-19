<script>
	import { createEventDispatcher } from 'svelte';

	export let sections = [];
	export let selectedPositions = ['CHASERS', 'BEATERS', 'SEEKERS'];

	const dispatch = createEventDispatcher();
	const allPositions = ['CHASERS', 'BEATERS', 'SEEKERS'];

	// Get available positions from the practice plan data
	$: availablePositions = getAvailablePositions(sections);

	function getAvailablePositions(sections) {
		const positions = new Set();

		sections.forEach((section) => {
			section.items?.forEach((item) => {
				// Check parallel_timeline for position indicators
				if (item.parallel_timeline && allPositions.includes(item.parallel_timeline)) {
					positions.add(item.parallel_timeline);
				}
				// Also check group_timelines array if present
				if (Array.isArray(item.group_timelines)) {
					item.group_timelines.forEach((timeline) => {
						if (allPositions.includes(timeline)) {
							positions.add(timeline);
						}
					});
				}
			});
		});

		// Return all positions if none found (for compatibility)
		return positions.size > 0 ? Array.from(positions) : allPositions;
	}

	function togglePosition(position) {
		if (selectedPositions.includes(position)) {
			// Don't allow deselecting all positions
			if (selectedPositions.length > 1) {
				selectedPositions = selectedPositions.filter((p) => p !== position);
			}
		} else {
			selectedPositions = [...selectedPositions, position];
		}

		dispatch('filterChange', { selectedPositions });
	}

	function selectAll() {
		selectedPositions = [...availablePositions];
		dispatch('filterChange', { selectedPositions });
	}

	function formatPositionName(position) {
		// Convert CHASERS -> Chasers, etc.
		return position.charAt(0) + position.slice(1).toLowerCase();
	}

	// Color mapping for positions
	const positionColors = {
		CHASERS: '#3B82F6', // Blue
		BEATERS: '#EF4444', // Red
		SEEKERS: '#10B981' // Green
	};
</script>

<div class="position-filter">
	<div class="filter-header">
		<span class="filter-label">View positions:</span>
		{#if selectedPositions.length < availablePositions.length}
			<button class="select-all-btn" on:click={selectAll}> Select All </button>
		{/if}
	</div>

	<div class="filter-buttons">
		{#each availablePositions as position}
			<button
				class="position-btn"
				class:active={selectedPositions.includes(position)}
				style="--position-color: {positionColors[position]}"
				on:click={() => togglePosition(position)}
				aria-pressed={selectedPositions.includes(position)}
			>
				<span class="position-checkbox" aria-hidden="true">
					{#if selectedPositions.includes(position)}
						✓
					{/if}
				</span>
				{formatPositionName(position)}
			</button>
		{/each}
	</div>

	{#if selectedPositions.length === 1}
		<div class="filter-info">
			Viewing {formatPositionName(selectedPositions[0])} perspective only
		</div>
	{:else if selectedPositions.length === 2}
		<div class="filter-info">
			Viewing {formatPositionName(selectedPositions[0])} & {formatPositionName(
				selectedPositions[1]
			)} activities
		</div>
	{/if}
</div>

<style>
	.position-filter {
		background: white;
		border: 1px solid theme('colors.gray.200');
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.filter-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.filter-label {
		font-weight: 500;
		color: theme('colors.gray.700');
	}

	.select-all-btn {
		font-size: 0.875rem;
		color: theme('colors.blue.600');
		text-decoration: underline;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}

	.select-all-btn:hover {
		color: theme('colors.blue.700');
	}

	.filter-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.position-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 2px solid theme('colors.gray.300');
		border-radius: 0.375rem;
		background: white;
		color: theme('colors.gray.700');
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.position-btn:hover {
		border-color: var(--position-color);
		background-color: theme('colors.gray.50');
	}

	.position-btn.active {
		border-color: var(--position-color);
		background-color: var(--position-color);
		color: white;
	}

	.position-checkbox {
		width: 1rem;
		height: 1rem;
		border: 2px solid currentColor;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: bold;
	}

	.position-btn:not(.active) .position-checkbox {
		border-color: theme('colors.gray.400');
	}

	.filter-info {
		margin-top: 0.75rem;
		font-size: 0.875rem;
		color: theme('colors.gray.600');
		font-style: italic;
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.position-filter {
			padding: 0.75rem;
		}

		.filter-buttons {
			gap: 0.375rem;
		}

		.position-btn {
			padding: 0.375rem 0.75rem;
			font-size: 0.875rem;
		}
	}
</style>
