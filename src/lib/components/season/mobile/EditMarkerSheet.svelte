<script>
	import { createEventDispatcher } from 'svelte';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import { toast } from '@zerodevx/svelte-toast';
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';

	export let season = null;
	export let marker = null;
	export let defaultDate = null;

	const dispatch = createEventDispatcher();

	let loading = false;
	let name = marker?.name || '';
	let type = marker?.type || 'tournament';
	let color = marker?.color || '#ef4444';
	let date = marker?.date || defaultDate || season?.start_date || '';
	let isMultiDay = !!marker?.end_date;
	let endDate = marker?.end_date || '';

	$: open = true;
	$: isEdit = !!marker;

	// Marker types
	const markerTypes = [
		{ value: 'tournament', label: 'Tournament', icon: '🏆' },
		{ value: 'break', label: 'Break', icon: '🏖️' },
		{ value: 'deadline', label: 'Deadline', icon: '📅' },
		{ value: 'custom', label: 'Custom', icon: '📌' }
	];

	// Predefined colors
	const colors = [
		'#ef4444', // Red
		'#f59e0b', // Amber
		'#10b981', // Green
		'#2563eb', // Blue
		'#8b5cf6', // Purple
		'#ec4899', // Pink
		'#06b6d4', // Cyan
		'#6b7280' // Gray
	];

	async function handleSave() {
		if (!name.trim()) {
			toast.push('Please enter an event name', {
				theme: {
					'--toastBackground': '#ef4444',
					'--toastColor': 'white'
				}
			});
			return;
		}

		if (!date) {
			toast.push('Please select a date', {
				theme: {
					'--toastBackground': '#ef4444',
					'--toastColor': 'white'
				}
			});
			return;
		}

		if (isMultiDay && !endDate) {
			toast.push('Please select an end date', {
				theme: {
					'--toastBackground': '#ef4444',
					'--toastColor': 'white'
				}
			});
			return;
		}

		if (isMultiDay && new Date(date) > new Date(endDate)) {
			toast.push('End date must be after start date', {
				theme: {
					'--toastBackground': '#ef4444',
					'--toastColor': 'white'
				}
			});
			return;
		}

		loading = true;

		try {
			const payload = {
				name: name.trim(),
				type,
				color,
				date
			};

			if (isMultiDay) {
				payload.end_date = endDate;
			} else {
				payload.end_date = null;
			}

			const response = await apiFetch(
				isEdit
					? `/api/seasons/${season.id}/markers/${marker.id}`
					: `/api/seasons/${season.id}/markers`,
				{
					method: isEdit ? 'PUT' : 'POST',
					body: JSON.stringify(payload)
				}
			);

			toast.push(isEdit ? 'Event updated successfully' : 'Event created successfully', {
				theme: {
					'--toastBackground': '#10b981',
					'--toastColor': 'white'
				}
			});

			dispatch('save', response);
			handleClose();
		} catch (error) {
			console.error('Failed to save marker:', error);
			toast.push(error.message || 'Failed to save event', {
				theme: {
					'--toastBackground': '#ef4444',
					'--toastColor': 'white'
				}
			});
		} finally {
			loading = false;
		}
	}

	function handleClose() {
		open = false;
		setTimeout(() => dispatch('close'), 200);
	}

	function formatDate(dateStr) {
		if (!dateStr) return '';
		return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<BottomSheet
	bind:open
	title={isEdit ? 'Edit Event' : 'Create Event'}
	height="auto"
	on:close={handleClose}
>
	<div class="form-content">
		<!-- Type Selection -->
		<div class="form-group">
			<span class="form-label">Event Type</span>
			<div class="type-grid">
				{#each markerTypes as markerType (markerType.value)}
					<button
						class="type-option"
						class:selected={type === markerType.value}
						on:click={() => (type = markerType.value)}
						disabled={loading}
					>
						<span class="type-icon">{markerType.icon}</span>
						<span class="type-label">{markerType.label}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Name -->
		<div class="form-group">
			<label for="marker-name" class="form-label"> Event Name </label>
			<input
				id="marker-name"
				type="text"
				bind:value={name}
				placeholder={type === 'tournament'
					? 'e.g., Regional Championship'
					: type === 'break'
						? 'e.g., Spring Break'
						: type === 'deadline'
							? 'e.g., Registration Deadline'
							: 'e.g., Team Meeting'}
				class="form-input"
				disabled={loading}
			/>
		</div>

		<!-- Color Selection -->
		<div class="form-group">
			<span class="form-label">Color</span>
			<div class="color-grid">
				{#each colors as c (c)}
					<button
						class="color-option"
						class:selected={color === c}
						style="background-color: {c}"
						on:click={() => (color = c)}
						aria-label="Select color {c}"
						disabled={loading}
					/>
				{/each}
			</div>
		</div>

		<!-- Multi-day toggle -->
		<div class="form-group">
			<label class="checkbox-label">
				<input type="checkbox" bind:checked={isMultiDay} disabled={loading} />
				<span>Multi-day event</span>
			</label>
		</div>

		<!-- Date Selection -->
		<div class="form-group">
			<span class="form-label">
				{isMultiDay ? 'Date Range' : 'Date'}
			</span>

			<div class="date-inputs" class:multi={isMultiDay}>
				<div class="date-field">
					{#if isMultiDay}
						<label for="start-date" class="date-label">Start</label>
					{/if}
					<input
						id="start-date"
						type="date"
						bind:value={date}
						min={season?.start_date}
						max={season?.end_date}
						class="form-input"
						disabled={loading}
					/>
					{#if !isMultiDay}
						<p class="form-helper">
							{formatDate(date)}
						</p>
					{/if}
				</div>

				{#if isMultiDay}
					<div class="date-field">
						<label for="end-date" class="date-label">End</label>
						<input
							id="end-date"
							type="date"
							bind:value={endDate}
							min={date}
							max={season?.end_date}
							class="form-input"
							disabled={loading}
						/>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<div slot="footer" class="footer-buttons">
		<button class="button button-secondary" on:click={handleClose} disabled={loading}>
			Cancel
		</button>
		<button class="button button-primary" on:click={handleSave} disabled={loading}>
			{loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Event'}
		</button>
	</div>
</BottomSheet>

<style>
	.form-content {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.form-label {
		font-size: 14px;
		font-weight: 500;
		color: #374151;
	}

	.form-input {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 16px;
		color: #111827;
		background: white;
	}

	.form-input:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.form-input:disabled {
		background: #f3f4f6;
		color: #6b7280;
	}

	.form-helper {
		font-size: 13px;
		color: #6b7280;
		margin: 0;
	}

	.type-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}

	.type-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 12px 8px;
		background: #f9fafb;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.type-option:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.type-option:not(:disabled):active {
		transform: scale(0.98);
	}

	.type-option.selected {
		background: #eff6ff;
		border-color: #2563eb;
	}

	.type-icon {
		font-size: 24px;
	}

	.type-label {
		font-size: 12px;
		font-weight: 500;
		color: #374151;
	}

	.type-option.selected .type-label {
		color: #2563eb;
	}

	.color-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 12px;
	}

	.color-option {
		width: 100%;
		aspect-ratio: 1;
		border-radius: 8px;
		border: 2px solid transparent;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.color-option:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.color-option:not(:disabled):active {
		transform: scale(0.95);
	}

	.color-option.selected {
		border-color: #111827;
		box-shadow:
			0 0 0 2px white,
			0 0 0 4px #111827;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		color: #374151;
		cursor: pointer;
	}

	.checkbox-label input[type='checkbox'] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.date-inputs {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.date-inputs.multi {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}

	.date-field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.date-label {
		font-size: 12px;
		color: #6b7280;
	}

	.footer-buttons {
		display: flex;
		gap: 12px;
		width: 100%;
	}

	.button {
		flex: 1;
		padding: 12px 20px;
		border-radius: 8px;
		font-size: 15px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
		border: none;
	}

	.button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.button-secondary {
		background: #f3f4f6;
		color: #374151;
	}

	.button-secondary:not(:disabled):active {
		background: #e5e7eb;
	}

	.button-primary {
		background: #2563eb;
		color: white;
	}

	.button-primary:not(:disabled):active {
		background: #1d4ed8;
	}

	/* Dark mode */
	:global(.dark) .form-label,
	:global(.dark) .checkbox-label {
		color: #d1d5db;
	}

	:global(.dark) .form-input {
		background: #374151;
		border-color: #4b5563;
		color: #f3f4f6;
	}

	:global(.dark) .form-input:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	:global(.dark) .form-input:disabled {
		background: #1f2937;
		color: #9ca3af;
	}

	:global(.dark) .form-helper,
	:global(.dark) .date-label {
		color: #9ca3af;
	}

	:global(.dark) .type-option {
		background: #1f2937;
		border-color: #374151;
	}

	:global(.dark) .type-option.selected {
		background: #1e3a8a;
		border-color: #3b82f6;
	}

	:global(.dark) .type-label {
		color: #d1d5db;
	}

	:global(.dark) .type-option.selected .type-label {
		color: #93bbfe;
	}

	:global(.dark) .color-option.selected {
		box-shadow:
			0 0 0 2px #1f2937,
			0 0 0 4px #f3f4f6;
	}

	:global(.dark) .button-secondary {
		background: #374151;
		color: #d1d5db;
	}

	:global(.dark) .button-secondary:not(:disabled):active {
		background: #4b5563;
	}

	:global(.dark) .button-primary {
		background: #3b82f6;
	}

	:global(.dark) .button-primary:not(:disabled):active {
		background: #2563eb;
	}
</style>
