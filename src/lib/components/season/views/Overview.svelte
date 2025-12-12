<script>
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import { device } from '$lib/stores/deviceStore';
	import Card from '$lib/components/ui/Card.svelte';
	import { Button } from '$lib/components/ui/button';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EditSectionSheet from '../mobile/EditSectionSheet.svelte';
	import EditMarkerSheet from '../mobile/EditMarkerSheet.svelte';
	import CreateSectionDialog from '../desktop/CreateSectionDialog.svelte';
	import { toLocalISO } from '$lib/utils/date.js';
	import CreateMarkerDialog from '../desktop/CreateMarkerDialog.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { Layers, Edit2, ChevronRight, Plus } from 'lucide-svelte';
	import { formatInTz } from '$lib/utils/formatInTz.js';

	export let season = null;
	export let sections = [];
	export let markers = [];
	export let practices = [];
	export let isAdmin = false;
	export let teamSlug = '';
	export let teamTimezone = 'UTC';

	const dispatch = createEventDispatcher();

	let showSectionDialog = false;
	let showMarkerDialog = false;
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
			const date = new Date(marker.date || marker.start_date);
			const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

			if (!grouped[monthKey]) {
				grouped[monthKey] = [];
			}

			grouped[monthKey].push(marker);
		});

		// Sort markers within each month
		Object.keys(grouped).forEach((month) => {
			grouped[month].sort(
				(a, b) => new Date(a.date || a.start_date) - new Date(b.date || b.start_date)
			);
		});

		return grouped;
	}

	function handleAddSection() {
		editingSection = null;
		showSectionDialog = true;
	}

	function handleEditSection(section) {
		editingSection = section;
		showSectionDialog = true;
	}

	function handleAddMarker() {
		editingMarker = null;
		showMarkerDialog = true;
	}

	function handleEditMarker(marker) {
		editingMarker = marker;
		showMarkerDialog = true;
	}

	function handleSectionSaved(event) {
		showSectionDialog = false;
		dispatch('sectionChange', event.detail);
	}

	function handleMarkerSaved(event) {
		showMarkerDialog = false;
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

	function viewTimeline() {
		goto(`/teams/${teamSlug}/season/timeline`);
	}

	$: markerGroups = groupMarkersByMonth();
	$: markerMonths = Object.keys(markerGroups).sort((a, b) => new Date(a) - new Date(b));
</script>

<div class="overview-container" class:desktop={!$device.isMobile}>
	<!-- Action Bar -->
	<div class="action-bar">
		<h2 class="section-title">Season Overview</h2>
		<Button on:click={viewTimeline} variant="outline" size="sm">
			<Layers size={16} class="mr-2" />
			View Timeline
		</Button>
	</div>

	<!-- Sections -->
	<div class="sections-grid">
		{#each sections as section}
			{@const progress = calculateProgress(section)}
			{@const practiceCount = getSectionPractices(section).length}
			{@const nextPractice = getNextPractice(section)}

			<Card class="section-card">
				<div class="section-header">
					<div class="section-color" style="background-color: {section.color}" />
					<div class="section-info">
						<h3 class="section-name">{section.name}</h3>
						<div class="section-dates">
							{formatInTz(section.start_date, teamTimezone, { month: 'short', day: 'numeric' })}
							–
							{formatInTz(section.end_date, teamTimezone, { month: 'short', day: 'numeric' })}
						</div>
					</div>
					{#if isAdmin}
						<button
							class="edit-button"
							on:click={() => handleEditSection(section)}
							aria-label="Edit section"
						>
							<Edit2 size={20} />
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

					<div class="section-actions">
						{#if nextPractice}
							<button class="next-practice" on:click={() => navigateToPractice(nextPractice)}>
								<span class="stat-label">Next:</span>
								<span class="stat-value">
									{formatInTz(nextPractice.scheduled_date, teamTimezone, {
										month: 'short',
										day: 'numeric'
									})}
								</span>
								<ChevronRight size={16} />
							</button>
						{/if}

						{#if isAdmin && progress < 100}
							<Button
								size="sm"
								variant={nextPractice ? 'ghost' : 'default'}
								on:click={() => handleAddPractice(section)}
							>
								<Plus size={16} class="mr-1" />
								Add Practice
							</Button>
						{/if}
					</div>
				</div>
			</Card>
		{/each}

		{#if isAdmin}
			<button class="add-section-button" on:click={handleAddSection}>
				<Plus size={20} />
				Add Section
			</button>
		{/if}
	</div>

	<!-- Markers/Events -->
	{#if markers.length > 0 || isAdmin}
		<div class="markers-section">
			<div class="section-header-row">
				<h2 class="section-title">Events & Milestones</h2>
				{#if isAdmin}
					<Button size="sm" variant="outline" on:click={handleAddMarker}>
						<Plus size={16} class="mr-1" />
						Add Event
					</Button>
				{/if}
			</div>

			{#if markers.length > 0}
				<div class="markers-timeline">
					{#each markerMonths as month}
						<div class="month-group">
							<h3 class="month-header">{month}</h3>

							<div class="markers-list">
								{#each markerGroups[month] as marker}
									<div
										class="marker-item"
										class:clickable={isAdmin}
										on:click={() => isAdmin && handleEditMarker(marker)}
										on:keydown={(e) => e.key === 'Enter' && isAdmin && handleEditMarker(marker)}
										role={isAdmin ? 'button' : 'listitem'}
										tabindex={isAdmin ? 0 : -1}
									>
										<div class="marker-color" style="background-color: {marker.color}" />
										<div class="marker-info">
											<div class="marker-name">{marker.name || marker.title}</div>
											<div class="marker-date">
												{#if marker.end_date}
													{formatInTz(marker.date || marker.start_date, teamTimezone, {
														month: 'short',
														day: 'numeric'
													})}
													–
													{formatInTz(marker.end_date, teamTimezone, {
														month: 'short',
														day: 'numeric'
													})}
												{:else}
													{formatInTz(marker.date || marker.start_date, teamTimezone, {
														weekday: 'short',
														month: 'short',
														day: 'numeric'
													})}
												{/if}
											</div>
										</div>
										<Badge variant="secondary" size="xs">
											{marker.type}
										</Badge>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{:else if !isAdmin}
				<p class="empty-message">No events scheduled yet.</p>
			{/if}
		</div>
	{/if}
</div>

<!-- Section Dialog/Sheet -->
{#if showSectionDialog}
	{#if $device.isMobile}
		<EditSectionSheet
			{season}
			section={editingSection}
			{teamSlug}
			on:save={handleSectionSaved}
			on:close={() => (showSectionDialog = false)}
		/>
	{:else}
		<CreateSectionDialog
			bind:open={showSectionDialog}
			{season}
			section={editingSection}
			on:save={handleSectionSaved}
			on:delete={handleSectionSaved}
			on:close={() => (showSectionDialog = false)}
		/>
	{/if}
{/if}

<!-- Marker Dialog/Sheet -->
{#if showMarkerDialog}
	{#if $device.isMobile}
		<EditMarkerSheet
			{season}
			marker={editingMarker}
			on:save={handleMarkerSaved}
			on:close={() => (showMarkerDialog = false)}
		/>
	{:else}
		<CreateMarkerDialog
			bind:open={showMarkerDialog}
			{season}
			marker={editingMarker}
			on:save={handleMarkerSaved}
			on:delete={handleMarkerSaved}
			on:close={() => (showMarkerDialog = false)}
		/>
	{/if}
{/if}

<style>
	.overview-container {
		padding: 16px;
		padding-bottom: 80px;
	}

	.overview-container.desktop {
		padding: 0;
		padding-bottom: 0;
		max-width: 1200px;
		margin: 0 auto;
	}

	.action-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24px;
	}

	.section-title {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
		color: #111827;
	}

	.desktop .section-title {
		font-size: 24px;
	}

	.sections-grid {
		display: grid;
		gap: 16px;
		margin-bottom: 32px;
	}

	.desktop .sections-grid {
		grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
		gap: 20px;
	}

	:global(.section-card) {
		padding: 16px !important;
	}

	.desktop :global(.section-card) {
		padding: 20px !important;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.desktop :global(.section-card:hover) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.section-header {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		margin-bottom: 16px;
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

	.desktop .section-name {
		font-size: 18px;
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
		transition: background-color 0.2s;
	}

	.edit-button:hover {
		background: #f3f4f6;
	}

	.progress-container {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
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
		padding-top: 16px;
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

	.section-actions {
		display: flex;
		align-items: center;
		gap: 8px;
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
		transition: background-color 0.2s;
	}

	.next-practice:hover {
		background: #dbeafe;
	}

	.add-section-button {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 40px 16px;
		background: white;
		border: 2px dashed #d1d5db;
		border-radius: 12px;
		color: #6b7280;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.add-section-button:hover {
		background: #f9fafb;
		border-color: #9ca3af;
		color: #4b5563;
	}

	.markers-section {
		margin-top: 32px;
	}

	.section-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
	}

	.markers-timeline {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.month-group {
		margin-bottom: 20px;
	}

	.month-header {
		font-size: 14px;
		font-weight: 600;
		color: #6b7280;
		margin: 0 0 12px 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.markers-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.desktop .markers-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 12px;
	}

	.marker-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		transition: all 0.2s;
	}

	.marker-item.clickable {
		cursor: pointer;
	}

	.marker-item.clickable:hover {
		background: #f9fafb;
		border-color: #d1d5db;
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

	.empty-message {
		text-align: center;
		color: #6b7280;
		font-size: 14px;
		padding: 20px;
	}

	/* Dark mode support */
	:global(.dark) .overview-container {
		background: transparent;
	}

	:global(.dark) .section-title,
	:global(.dark) .section-name,
	:global(.dark) .marker-name {
		color: #f3f4f6;
	}

	:global(.dark) .section-dates,
	:global(.dark) .marker-date,
	:global(.dark) .stat-label,
	:global(.dark) .progress-text,
	:global(.dark) .month-header,
	:global(.dark) .empty-message {
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

	:global(.dark) .edit-button:hover {
		background: #374151;
	}

	:global(.dark) .next-practice {
		background: #1e3a8a;
		color: #bfdbfe;
	}

	:global(.dark) .next-practice:hover {
		background: #1e40af;
	}

	:global(.dark) .add-section-button {
		background: #1f2937;
		border-color: #4b5563;
		color: #9ca3af;
	}

	:global(.dark) .add-section-button:hover {
		background: #111827;
		border-color: #6b7280;
		color: #d1d5db;
	}

	:global(.dark) .marker-item {
		background: #1f2937;
		border-color: #374151;
	}

	:global(.dark) .marker-item.clickable:hover {
		background: #111827;
		border-color: #4b5563;
	}
</style>
