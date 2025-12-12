<script>
	import { createEventDispatcher } from 'svelte';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import { toast } from '@zerodevx/svelte-toast';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import { toLocalISO } from '$lib/utils/date.js';

	export let open = false;
	export let season = null;
	export let section = null;
	export let teamId = '';

	const dispatch = createEventDispatcher();

	let loading = false;
	let name = '';
	let color = '#2563eb';
	let startDate = '';
	let endDate = '';
	let seedDefaults = false;

	$: isEdit = !!section;

	$: if (section) {
		name = section.name || '';
		color = section.color || '#2563eb';
		startDate = section.start_date || '';
		endDate = section.end_date || '';
	} else {
		name = '';
		color = '#2563eb';
		startDate = season?.start_date || '';
		endDate = season?.end_date || '';
		seedDefaults = false;
	}

	const colors = [
		'#2563eb', // Blue
		'#10b981', // Green
		'#f59e0b', // Amber
		'#ef4444', // Red
		'#8b5cf6', // Purple
		'#06b6d4', // Cyan
		'#ec4899', // Pink
		'#f97316' // Orange
	];

	async function handleSave() {
		if (!name.trim()) {
			toast.push('Please enter a section name', {
				theme: {
					'--toastBackground': '#ef4444',
					'--toastColor': 'white'
				}
			});
			return;
		}

		loading = true;

		try {
			const url = isEdit
				? `/api/seasons/${season.id}/sections/${section.id}`
				: `/api/seasons/${season.id}/sections`;

			const response = await apiFetch(url, {
				method: isEdit ? 'PUT' : 'POST',
				body: JSON.stringify({
					name: name.trim(),
					color,
					start_date: startDate,
					end_date: endDate,
					seed_default_sections: !isEdit && seedDefaults
				})
			});

			toast.push(isEdit ? 'Section updated' : 'Section created', {
				theme: {
					'--toastBackground': '#10b981',
					'--toastColor': 'white'
				}
			});

			dispatch('save', response);
			handleClose();
		} catch (error) {
			console.error('Failed to save section:', error);
			toast.push(error.message || 'Failed to save section', {
				theme: {
					'--toastBackground': '#ef4444',
					'--toastColor': 'white'
				}
			});
		} finally {
			loading = false;
		}
	}

	async function handleDelete() {
		if (!section) return;

		loading = true;

		try {
			await apiFetch(`/api/seasons/${season.id}/sections/${section.id}`, {
				method: 'DELETE'
			});

			toast.push('Section deleted', {
				theme: {
					'--toastBackground': '#10b981',
					'--toastColor': 'white'
				}
			});

			dispatch('delete', section);
			handleClose();
		} catch (error) {
			console.error('Failed to delete section:', error);
			toast.push('Failed to delete section', {
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
		dispatch('close');
		resetForm();
	}

	function resetForm() {
		name = '';
		color = '#2563eb';
		startDate = season?.start_date || '';
		endDate = season?.end_date || '';
		seedDefaults = false;
	}

	function setDateRange(option) {
		const today = new Date();
		const start = new Date(today);

			switch (option) {
				case 'this-week': {
					const dayOfWeek = start.getDay();
					start.setDate(start.getDate() - dayOfWeek);
					startDate = toLocalISO(start);

					const endOfWeek = new Date(start);
					endOfWeek.setDate(start.getDate() + 6);
					endDate = toLocalISO(endOfWeek);
					break;
				}

				case 'next-4-weeks': {
					startDate = toLocalISO(today);
					const fourWeeksLater = new Date(today);
					fourWeeksLater.setDate(today.getDate() + 28);
					endDate = toLocalISO(fourWeeksLater);
					break;
				}

				case 'to-season-end': {
					startDate = toLocalISO(today);
					endDate = season?.end_date || '';
					break;
				}
			}
		}
</script>

<Dialog
	bind:open
	title={isEdit ? 'Edit Section' : 'Create Section'}
	description={isEdit ? 'Update this season section' : 'Add a new section to your season'}
	on:close={handleClose}
>
	<div class="grid gap-4">
		<Input
			label="Section Name"
			placeholder="e.g., Pre-Season, Regular Season, Playoffs"
			bind:value={name}
			required
			disabled={loading}
		/>

		<div class="form-group">
			<span class="form-label">Color</span>
			<div class="color-grid">
				{#each colors as c (c)}
					<button
						type="button"
						class="color-option"
						class:selected={color === c}
						style="background-color: {c}"
						on:click={() => (color = c)}
						disabled={loading}
						aria-label="Select color"
					/>
				{/each}
			</div>
		</div>

		<div class="date-group">
			<Input
				label="Start Date"
				type="date"
				bind:value={startDate}
				min={season?.start_date}
				max={season?.end_date}
				required
				disabled={loading}
			/>

			<Input
				label="End Date"
				type="date"
				bind:value={endDate}
				min={startDate}
				max={season?.end_date}
				required
				disabled={loading}
			/>
		</div>

		<div class="quick-options">
			<span class="quick-label">Quick set:</span>
			<button
				type="button"
				class="quick-button"
				on:click={() => setDateRange('this-week')}
				disabled={loading}
			>
				This Week
			</button>
			<button
				type="button"
				class="quick-button"
				on:click={() => setDateRange('next-4-weeks')}
				disabled={loading}
			>
				Next 4 Weeks
			</button>
			<button
				type="button"
				class="quick-button"
				on:click={() => setDateRange('to-season-end')}
				disabled={loading}
			>
				To Season End
			</button>
		</div>

		{#if !isEdit}
			<Checkbox bind:checked={seedDefaults} disabled={loading}>
				Add default practice sections
			</Checkbox>
		{/if}
	</div>

	<div slot="footer" class="footer-buttons">
		{#if isEdit}
			<button class="button button-destructive" on:click={handleDelete} disabled={loading}>
				{loading ? 'Deleting...' : 'Delete'}
			</button>
		{/if}
		<div class="footer-right">
			<button class="button button-secondary" on:click={handleClose} disabled={loading}>
				Cancel
			</button>
			<button
				class="button button-primary"
				on:click={handleSave}
				disabled={loading || !name.trim()}
			>
				{loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
			</button>
		</div>
	</div>
</Dialog>

<style>
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

	.color-grid {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: 8px;
	}

	.color-option {
		width: 40px;
		height: 40px;
		border-radius: 8px;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.2s;
	}

	.color-option:hover:not(:disabled) {
		transform: scale(1.1);
	}

	.color-option.selected {
		border-color: #111827;
		box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.1);
	}

	.color-option:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.date-group {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.quick-options {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.quick-label {
		font-size: 14px;
		color: #6b7280;
	}

	.quick-button {
		padding: 4px 12px;
		font-size: 13px;
		color: #3b82f6;
		background: #eff6ff;
		border: 1px solid #dbeafe;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.quick-button:hover:not(:disabled) {
		background: #dbeafe;
		border-color: #bfdbfe;
	}

	.quick-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.footer-buttons {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	.footer-right {
		display: flex;
		gap: 12px;
		margin-left: auto;
	}

	.button {
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.button-secondary {
		background-color: #f3f4f6;
		color: #374151;
	}

	.button-secondary:hover:not(:disabled) {
		background-color: #e5e7eb;
	}

	.button-primary {
		background-color: #3b82f6;
		color: white;
	}

	.button-primary:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.button-destructive {
		background-color: #ef4444;
		color: white;
	}

	.button-destructive:hover:not(:disabled) {
		background-color: #dc2626;
	}
</style>
