<script>
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import EditSectionSheet from './EditSectionSheet.svelte';
	import EditMarkerSheet from './EditMarkerSheet.svelte';
	import { toLocalISO } from '$lib/utils/date.js';

	export let season = null;
	export let sections = [];
	export let markers = [];
	export let practices = [];
	export let isAdmin = false;
	export let teamSlug = '';

	const dispatch = createEventDispatcher();

	let showSectionSheet = false;
	let showMarkerSheet = false;
	let editingSection = null;
	let editingMarker = null;

	// Calculate progress for each section
	function calculateProgress(section) {
		const today = new Date();
		const start = new Date(section.start_date);
		const end = new Date(section.end_date);

		if (today < start) return 0;
		if (today > end) return 100;

		const total = end - start;
		const elapsed = today - start;
		return Math.round((elapsed / total) * 100);
	}

	// Get practices for a section
	function getSectionPractices(section) {
		return practices.filter((p) => {
			const practiceDate = new Date(p.scheduled_date);
			const start = new Date(section.start_date);
			const end = new Date(section.end_date);
			return practiceDate >= start && practiceDate <= end;
		});
	}

	// Get next practice for a section
	function getNextPractice(section) {
		const sectionPractices = getSectionPractices(section);
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const upcoming = sectionPractices
			.filter((p) => new Date(p.scheduled_date) >= today)
			.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

		return upcoming[0];
	}

	// Group markers by month
	function groupMarkersByMonth() {
		const grouped = {};

		markers.forEach((marker) => {
			const date = new Date(marker.date);
			const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

			if (!grouped[monthKey]) {
				grouped[monthKey] = [];
			}

			grouped[monthKey].push(marker);
		});

		// Sort markers within each month
		Object.keys(grouped).forEach((month) => {
			grouped[month].sort((a, b) => new Date(a.date) - new Date(b.date));
		});

		return grouped;
	}

	function handleAddSection() {
		editingSection = null;
		showSectionSheet = true;
	}

	function handleEditSection(section) {
		editingSection = section;
		showSectionSheet = true;
	}

	function handleAddMarker() {
		editingMarker = null;
		showMarkerSheet = true;
	}

	function handleEditMarker(marker) {
		editingMarker = marker;
		showMarkerSheet = true;
	}

	function handleSectionSaved(event) {
		showSectionSheet = false;
		dispatch('sectionChange', event.detail);
	}

	function handleMarkerSaved(event) {
		showMarkerSheet = false;
		dispatch('markerChange', event.detail);
	}

	function handleAddPractice(section) {
		// Find the next available date within the section
		const sectionStart = new Date(section.start_date);
		const sectionEnd = new Date(section.end_date);
		const today = new Date();

		const targetDate = today > sectionStart ? today : sectionStart;

		if (targetDate <= sectionEnd) {
			dispatch('createPractice', {
				date: toLocalISO(targetDate),
				sectionId: section.id
			});
		}
	}

	function navigateToPractice(practice) {
		goto(`/teams/${teamSlug}/plans/${practice.id}`);
	}

	$: markerGroups = groupMarkersByMonth();
	$: markerMonths = Object.keys(markerGroups).sort((a, b) => new Date(a) - new Date(b));
</script>

<div class="overview-container">
	<!-- Sections -->
	<div class="sections-list">
		{#each sections as section (section.id)}
			{@const progress = calculateProgress(section)}
			{@const practiceCount = getSectionPractices(section).length}
			{@const nextPractice = getNextPractice(section)}

			<div class="section-card">
				<div class="section-header">
					<div class="section-color" style="background-color: {section.color}" />
					<div class="section-info">
						<h3 class="section-name">{section.name}</h3>
						<div class="section-dates">
							{new Date(section.start_date).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric'
							})}
							–
							{new Date(section.end_date).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric'
							})}
						</div>
					</div>
					{#if isAdmin}
						<button
							class="edit-button"
							on:click={() => handleEditSection(section)}
							aria-label="Edit section"
						>
							<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
								<path
									d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
								/>
							</svg>
						</button>
					{/if}
				</div>

				<div class="progress-container">
					<div class="progress-bar">
						<div class="progress-fill" style="width: {progress}%" />
					</div>
					<span class="progress-text">{progress}%</span>
				</div>

				<div class="section-stats">
					<div class="stat">
						<span class="stat-label">Practices:</span>
						<span class="stat-value">{practiceCount}</span>
					</div>
					{#if nextPractice}
						<button class="next-practice" on:click={() => navigateToPractice(nextPractice)}>
							<span class="stat-label">Next:</span>
							<span class="stat-value">
								{new Date(nextPractice.scheduled_date).toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric'
								})}
							</span>
							<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M5 12l7-7-7-7" />
							</svg>
						</button>
					{:else if isAdmin && progress < 100}
						<button class="add-practice-button" on:click={() => handleAddPractice(section)}>
							<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
								<line x1="12" y1="5" x2="12" y2="19" />
								<line x1="5" y1="12" x2="19" y2="12" />
							</svg>
							Add Practice
						</button>
					{/if}
				</div>
			</div>
		{/each}

		{#if isAdmin}
			<button class="add-section-button" on:click={handleAddSection}>
				<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
				Add Section
			</button>
		{/if}
	</div>

	<!-- Markers grouped by month -->
	{#if markers.length > 0}
		<div class="markers-section">
			<h2 class="markers-title">Events & Milestones</h2>

			{#each markerMonths as month (month)}
				<div class="month-group">
					<h3 class="month-header">{month}</h3>

					<div class="markers-list">
						{#each markerGroups[month] as marker (marker.id)}
							<button
								class="marker-item"
								on:click={() => isAdmin && handleEditMarker(marker)}
								disabled={!isAdmin}
							>
								<div class="marker-color" style="background-color: {marker.color}" />
								<div class="marker-info">
									<div class="marker-name">{marker.name}</div>
									<div class="marker-date">
										{#if marker.end_date}
											{new Date(marker.date).getDate()}–{new Date(marker.end_date).getDate()}
										{:else}
											{new Date(marker.date).toLocaleDateString('en-US', {
												weekday: 'short',
												day: 'numeric'
											})}
										{/if}
									</div>
								</div>
								<div class="marker-type">
									{marker.type}
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if isAdmin && markers.length === 0}
		<button class="add-marker-button" on:click={handleAddMarker}>
			<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			Add Event
		</button>
	{/if}
</div>

<!-- Section Edit Sheet -->
{#if showSectionSheet}
	<EditSectionSheet
		{season}
		section={editingSection}
		{teamSlug}
		on:save={handleSectionSaved}
		on:close={() => (showSectionSheet = false)}
	/>
{/if}

<!-- Marker Edit Sheet -->
{#if showMarkerSheet}
	<EditMarkerSheet
		{season}
		marker={editingMarker}
		on:save={handleMarkerSaved}
		on:close={() => (showMarkerSheet = false)}
	/>
{/if}

<style>
	.overview-container {
		padding: 16px;
		padding-bottom: 80px; /* Space for bottom nav */
	}

	.sections-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 24px;
	}

	.section-card {
		background: white;
		border-radius: 12px;
		padding: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.section-header {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		margin-bottom: 12px;
	}

	.section-color {
		width: 4px;
		height: 40px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.section-info {
		flex: 1;
	}

	.section-name {
		font-size: 16px;
		font-weight: 600;
		margin: 0 0 4px 0;
		color: #111827;
	}

	.section-dates {
		font-size: 13px;
		color: #6b7280;
	}

	.edit-button {
		padding: 8px;
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		border-radius: 8px;
	}

	.edit-button:active {
		background: #f3f4f6;
	}

	.progress-container {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
	}

	.progress-bar {
		flex: 1;
		height: 8px;
		background: #e5e7eb;
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #10b981;
		transition: width 0.3s ease;
	}

	.progress-text {
		font-size: 13px;
		font-weight: 600;
		color: #6b7280;
		min-width: 35px;
		text-align: right;
	}

	.section-stats {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 12px;
		border-top: 1px solid #e5e7eb;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.stat-label {
		font-size: 13px;
		color: #6b7280;
	}

	.stat-value {
		font-size: 14px;
		font-weight: 600;
		color: #111827;
	}

	.next-practice {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		background: #eff6ff;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}

	.next-practice:active {
		background: #dbeafe;
	}

	.add-practice-button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		background: #f0fdf4;
		color: #10b981;
		border: none;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
	}

	.add-practice-button:active {
		background: #dcfce7;
	}

	.add-section-button,
	.add-marker-button {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 16px;
		background: white;
		border: 2px dashed #d1d5db;
		border-radius: 12px;
		color: #6b7280;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
	}

	.add-section-button:active,
	.add-marker-button:active {
		background: #f9fafb;
	}

	.markers-section {
		margin-top: 24px;
	}

	.markers-title {
		font-size: 18px;
		font-weight: 600;
		margin: 0 0 16px 0;
		color: #111827;
	}

	.month-group {
		margin-bottom: 20px;
	}

	.month-header {
		font-size: 14px;
		font-weight: 600;
		color: #6b7280;
		margin: 0 0 8px 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.markers-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.marker-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: white;
		border: none;
		border-radius: 8px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
		cursor: pointer;
		text-align: left;
	}

	.marker-item:disabled {
		cursor: default;
	}

	.marker-item:not(:disabled):active {
		background: #f9fafb;
	}

	.marker-color {
		width: 4px;
		height: 32px;
		border-radius: 2px;
	}

	.marker-info {
		flex: 1;
	}

	.marker-name {
		font-size: 14px;
		font-weight: 500;
		color: #111827;
		margin-bottom: 2px;
	}

	.marker-date {
		font-size: 12px;
		color: #6b7280;
	}

	.marker-type {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #9ca3af;
		padding: 4px 8px;
		background: #f3f4f6;
		border-radius: 4px;
	}

	/* Dark mode */
	:global(.dark) .section-card,
	:global(.dark) .marker-item {
		background: #1f2937;
	}

	:global(.dark) .section-name,
	:global(.dark) .marker-name,
	:global(.dark) .markers-title {
		color: #f3f4f6;
	}

	:global(.dark) .section-dates,
	:global(.dark) .marker-date,
	:global(.dark) .stat-label,
	:global(.dark) .progress-text,
	:global(.dark) .month-header {
		color: #9ca3af;
	}

	:global(.dark) .stat-value {
		color: #f3f4f6;
	}

	:global(.dark) .progress-bar {
		background: #374151;
	}

	:global(.dark) .section-stats {
		border-top-color: #374151;
	}

	:global(.dark) .edit-button {
		color: #9ca3af;
	}

	:global(.dark) .edit-button:active {
		background: #374151;
	}

	:global(.dark) .next-practice {
		background: #1e3a8a;
		color: #bfdbfe;
	}

	:global(.dark) .next-practice:active {
		background: #1e40af;
	}

	:global(.dark) .add-practice-button {
		background: #064e3b;
		color: #6ee7b7;
	}

	:global(.dark) .add-practice-button:active {
		background: #047857;
	}

	:global(.dark) .add-section-button,
	:global(.dark) .add-marker-button {
		background: #1f2937;
		border-color: #4b5563;
		color: #9ca3af;
	}

	:global(.dark) .add-section-button:active,
	:global(.dark) .add-marker-button:active {
		background: #111827;
	}

	:global(.dark) .marker-type {
		background: #374151;
		color: #9ca3af;
	}
</style>
