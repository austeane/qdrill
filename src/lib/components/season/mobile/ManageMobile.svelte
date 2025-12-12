<script>
	import { createEventDispatcher } from 'svelte';
	import { flip } from 'svelte/animate';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import { toast } from '@zerodevx/svelte-toast';
	import EditSectionSheet from './EditSectionSheet.svelte';
	import EditMarkerSheet from './EditMarkerSheet.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

	export let season = null;
	export let sections = [];
	export let markers = [];
	export let teamId = '';

	const dispatch = createEventDispatcher();

	let showSectionSheet = false;
	let showMarkerSheet = false;
	let editingSection = null;
	let editingMarker = null;
	let deletingItem = null;
	let deleteType = null;
	let confirmDeleteSection = null;
	let confirmDeleteMarker = null;
	let deleteLoading = false;

	async function handleSectionMove(section, direction) {
		const currentIndex = sections.findIndex((s) => s.id === section.id);
		const newIndex = currentIndex + direction;

		if (newIndex < 0 || newIndex >= sections.length) return;

		// Optimistically update UI
		const newSections = [...sections];
		[newSections[currentIndex], newSections[newIndex]] = [
			newSections[newIndex],
			newSections[currentIndex]
		];

		// Update order values
		newSections.forEach((s, i) => {
			s.order = i;
		});

		sections = newSections;

		try {
			// Send reorder request to server
			await apiFetch(`/api/seasons/${season.id}/sections/reorder`, {
				method: 'PUT',
				body: JSON.stringify({
					sections: newSections.map((s) => ({ id: s.id, order: s.order }))
				})
			});

			dispatch('change');
		} catch (error) {
			// Revert on error
			sections = [...sections].sort((a, b) => a.order - b.order);
			toast.push('Failed to reorder sections', {
				theme: {
					'--toastBackground': '#ef4444',
					'--toastColor': 'white'
				}
			});
		}
	}

	function handleSectionDeleteClick(section) {
		confirmDeleteSection = section;
	}

	async function handleSectionDelete() {
		const section = confirmDeleteSection;
		if (!section) return;

		deleteLoading = true;

		try {
			await apiFetch(`/api/seasons/${season.id}/sections/${section.id}`, {
				method: 'DELETE'
			});

			sections = sections.filter((s) => s.id !== section.id);

			toast.push('Section deleted', {
				theme: {
					'--toastBackground': '#10b981',
					'--toastColor': 'white'
				}
			});

			dispatch('change');
		} catch (error) {
			toast.push('Failed to delete section', {
				theme: {
					'--toastBackground': '#ef4444',
					'--toastColor': 'white'
				}
			});
		} finally {
			confirmDeleteSection = null;
			deleteLoading = false;
		}
	}

	function handleMarkerDeleteClick(marker) {
		confirmDeleteMarker = marker;
	}

	async function handleMarkerDelete() {
		const marker = confirmDeleteMarker;
		if (!marker) return;

		deleteLoading = true;

		try {
			await apiFetch(`/api/seasons/${season.id}/markers/${marker.id}`, {
				method: 'DELETE'
			});

			markers = markers.filter((m) => m.id !== marker.id);

			toast.push('Event deleted', {
				theme: {
					'--toastBackground': '#10b981',
					'--toastColor': 'white'
				}
			});

			dispatch('change');
		} catch (error) {
			toast.push('Failed to delete event', {
				theme: {
					'--toastBackground': '#ef4444',
					'--toastColor': 'white'
				}
			});
		} finally {
			confirmDeleteMarker = null;
			deleteLoading = false;
		}
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

	function formatDateRange(start, end) {
		const startDate = new Date(start);
		const endDate = new Date(end);

		if (start === end) {
			return startDate.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		}

		return `${startDate.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		})} – ${endDate.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})}`;
	}
</script>

<div class="manage-container">
	<!-- Sections Card -->
	<div class="manage-card">
		<div class="card-header">
			<h2 class="card-title">Season Sections</h2>
			<button class="add-button" on:click={handleAddSection}>
				<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
			</button>
		</div>

		<div class="items-list">
			{#each sections as section, index (section.id)}
				<div class="list-item" animate:flip={{ duration: 200 }}>
					<div class="item-color" style="background-color: {section.color}" />

					<div class="item-content">
						<div class="item-name">{section.name}</div>
						<div class="item-details">
							{formatDateRange(section.start_date, section.end_date)}
						</div>
					</div>

					<div class="item-actions">
						<button
							class="action-button"
							on:click={() => handleSectionMove(section, -1)}
							disabled={index === 0}
							aria-label="Move up"
						>
							<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M12 15l-4-4-4 4M8 11V3" />
							</svg>
						</button>

						<button
							class="action-button"
							on:click={() => handleSectionMove(section, 1)}
							disabled={index === sections.length - 1}
							aria-label="Move down"
						>
							<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M12 9l-4 4-4-4M8 13V5" />
							</svg>
						</button>

						<button
							class="action-button"
							on:click={() => handleEditSection(section)}
							aria-label="Edit"
						>
							<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
								<path
									d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7M14.5 2.5a2.121 2.121 0 013 3L10 13l-4 1 1-4 7.5-7.5z"
								/>
							</svg>
						</button>

						<button
							class="action-button delete"
							on:click={() => handleSectionDeleteClick(section)}
							aria-label="Delete"
						>
							<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
								<path
									d="M3 6h12M8 6V4a1 1 0 011-1h2a1 1 0 011 1v2m2 0v9a2 2 0 01-2 2H6a2 2 0 01-2-2V6"
								/>
							</svg>
						</button>
					</div>
				</div>
			{/each}

			{#if sections.length === 0}
				<div class="empty-state">
					<p>No sections yet</p>
					<button class="inline-add-button" on:click={handleAddSection}>
						Add your first section
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Events Card -->
	<div class="manage-card">
		<div class="card-header">
			<h2 class="card-title">Events & Milestones</h2>
			<button class="add-button" on:click={handleAddMarker}>
				<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
			</button>
		</div>

		<div class="items-list">
			{#each markers as marker (marker.id)}
				<div class="list-item" animate:flip={{ duration: 200 }}>
					<div class="item-color" style="background-color: {marker.color}" />

					<div class="item-content">
						<div class="item-name">{marker.name}</div>
						<div class="item-details">
							<span class="marker-type">{marker.type}</span>
							<span class="marker-date">
								{formatDateRange(marker.date, marker.end_date || marker.date)}
							</span>
						</div>
					</div>

					<div class="item-actions">
						<button
							class="action-button"
							on:click={() => handleEditMarker(marker)}
							aria-label="Edit"
						>
							<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
								<path
									d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7M14.5 2.5a2.121 2.121 0 013 3L10 13l-4 1 1-4 7.5-7.5z"
								/>
							</svg>
						</button>

						<button
							class="action-button delete"
							on:click={() => handleMarkerDeleteClick(marker)}
							aria-label="Delete"
						>
							<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
								<path
									d="M3 6h12M8 6V4a1 1 0 011-1h2a1 1 0 011 1v2m2 0v9a2 2 0 01-2 2H6a2 2 0 01-2-2V6"
								/>
							</svg>
						</button>
					</div>
				</div>
			{/each}

			{#if markers.length === 0}
				<div class="empty-state">
					<p>No events yet</p>
					<button class="inline-add-button" on:click={handleAddMarker}>
						Add your first event
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Section Edit Sheet -->
{#if showSectionSheet}
	<EditSectionSheet
		{season}
		section={editingSection}
		{teamId}
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

<!-- Confirm Delete Dialogs -->
<ConfirmDialog
	bind:open={confirmDeleteSection}
	title="Delete Section"
	message={`Are you sure you want to delete the section "${confirmDeleteSection?.name}"? This action cannot be undone.`}
	confirmText="Delete"
	cancelText="Cancel"
	confirmVariant="destructive"
	loading={deleteLoading}
	on:confirm={handleSectionDelete}
	on:cancel={() => (confirmDeleteSection = null)}
/>

<ConfirmDialog
	bind:open={confirmDeleteMarker}
	title="Delete Event"
	message={`Are you sure you want to delete the event "${confirmDeleteMarker?.name}"? This action cannot be undone.`}
	confirmText="Delete"
	cancelText="Cancel"
	confirmVariant="destructive"
	loading={deleteLoading}
	on:confirm={handleMarkerDelete}
	on:cancel={() => (confirmDeleteMarker = null)}
/>

<style>
	.manage-container {
		padding: 16px;
		padding-bottom: 80px; /* Space for bottom nav */
	}

	.manage-card {
		background: white;
		border-radius: 12px;
		margin-bottom: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		border-bottom: 1px solid #e5e7eb;
	}

	.card-title {
		font-size: 18px;
		font-weight: 600;
		margin: 0;
		color: #111827;
	}

	.add-button {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #eff6ff;
		border: none;
		border-radius: 8px;
		color: #2563eb;
		cursor: pointer;
	}

	.add-button:active {
		background: #dbeafe;
	}

	.items-list {
		padding: 8px;
	}

	.list-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: #f9fafb;
		border-radius: 8px;
		margin-bottom: 8px;
	}

	.list-item:last-child {
		margin-bottom: 0;
	}

	.item-color {
		width: 4px;
		height: 40px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.item-content {
		flex: 1;
		min-width: 0;
	}

	.item-name {
		font-size: 15px;
		font-weight: 500;
		color: #111827;
		margin-bottom: 4px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-details {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: #6b7280;
	}

	.marker-type {
		text-transform: capitalize;
		padding: 2px 6px;
		background: white;
		border-radius: 4px;
	}

	.item-actions {
		display: flex;
		gap: 4px;
		flex-shrink: 0;
	}

	.action-button {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: white;
		border: none;
		border-radius: 6px;
		color: #6b7280;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.action-button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.action-button:not(:disabled):active {
		background: #e5e7eb;
	}

	.action-button.delete {
		color: #ef4444;
	}

	.action-button.delete:not(:disabled):active {
		background: #fee2e2;
	}

	.empty-state {
		padding: 32px 16px;
		text-align: center;
	}

	.empty-state p {
		margin: 0 0 12px 0;
		color: #6b7280;
		font-size: 14px;
	}

	.inline-add-button {
		padding: 8px 16px;
		background: #eff6ff;
		border: none;
		border-radius: 8px;
		color: #2563eb;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
	}

	.inline-add-button:active {
		background: #dbeafe;
	}

	/* Dark mode */
	:global(.dark) .manage-card {
		background: #1f2937;
	}

	:global(.dark) .card-header {
		border-bottom-color: #374151;
	}

	:global(.dark) .card-title {
		color: #f3f4f6;
	}

	:global(.dark) .add-button {
		background: #1e3a8a;
		color: #93bbfe;
	}

	:global(.dark) .add-button:active {
		background: #1e40af;
	}

	:global(.dark) .list-item {
		background: #111827;
	}

	:global(.dark) .item-name {
		color: #f3f4f6;
	}

	:global(.dark) .item-details {
		color: #9ca3af;
	}

	:global(.dark) .marker-type {
		background: #374151;
	}

	:global(.dark) .action-button {
		background: #374151;
		color: #9ca3af;
	}

	:global(.dark) .action-button:not(:disabled):active {
		background: #4b5563;
	}

	:global(.dark) .action-button.delete {
		color: #f87171;
	}

	:global(.dark) .action-button.delete:not(:disabled):active {
		background: #7f1d1d;
	}

	:global(.dark) .empty-state p {
		color: #9ca3af;
	}

	:global(.dark) .inline-add-button {
		background: #1e3a8a;
		color: #93bbfe;
	}

	:global(.dark) .inline-add-button:active {
		background: #1e40af;
	}
</style>
