<script>
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import { toast } from '@zerodevx/svelte-toast';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { open = $bindable(false), season = null, onSave, onClose } = $props();

	let loading = $state(false);
	let name = $state('');
	let startDate = $state('');
	let endDate = $state('');

	$effect(() => {
		if (!open || !season) return;

		name = season.name || '';
		startDate = season.start_date || '';
		endDate = season.end_date || '';
	});

	async function handleSave() {
		if (!name.trim()) {
			toast.push('Please enter a season name', {
				theme: {
					'--toastBackground': '#ef4444',
					'--toastColor': 'white'
				}
			});
			return;
		}

		if (!startDate || !endDate) {
			toast.push('Please select date range', {
				theme: {
					'--toastBackground': '#ef4444',
					'--toastColor': 'white'
				}
			});
			return;
		}

		if (new Date(startDate) >= new Date(endDate)) {
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
			const response = await apiFetch(`/api/seasons/${season.id}`, {
				method: 'PATCH',
				body: JSON.stringify({
					name: name.trim(),
					start_date: startDate,
					end_date: endDate
				})
			});

			toast.push('Season updated successfully', {
				theme: {
					'--toastBackground': '#10b981',
					'--toastColor': 'white'
				}
			});

			onSave?.(response);
			handleClose();
		} catch (error) {
			console.error('Failed to update season:', error);
			toast.push(error.message || 'Failed to update season', {
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
		onClose?.();
	}
</script>

{#snippet footer()}
	<div class="footer-buttons">
		<button class="button button-secondary" onclick={handleClose} disabled={loading}>
			Cancel
		</button>
		<button
			class="button button-primary"
			onclick={handleSave}
			disabled={loading || !name.trim() || !startDate || !endDate}
		>
			{loading ? 'Saving...' : 'Save Changes'}
		</button>
	</div>
{/snippet}

<Dialog
	bind:open
	title="Edit Season"
	description="Update the season name and date range"
	onClose={handleClose}
	{footer}
>
	<div class="grid gap-4">
		<Input
			label="Season Name"
			placeholder="e.g., Spring 2025, Fall Season"
			bind:value={name}
			required
			disabled={loading}
		/>

		<div class="date-group">
			<Input
				label="Start Date"
				type="date"
				bind:value={startDate}
				required
				disabled={loading}
			/>

			<Input
				label="End Date"
				type="date"
				bind:value={endDate}
				min={startDate}
				required
				disabled={loading}
			/>
		</div>

		<p class="help-text">
			Note: Changing season dates may affect existing sections and practices that fall outside the new date range.
		</p>
	</div>
</Dialog>

<style>
	.date-group {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.help-text {
		font-size: 13px;
		color: #6b7280;
		margin: 0;
		padding: 8px 12px;
		background: #fef3c7;
		border: 1px solid #fcd34d;
		border-radius: 6px;
	}

	.footer-buttons {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
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

	/* Dark mode */
	:global(.dark) .help-text {
		background: #422006;
		border-color: #92400e;
		color: #fcd34d;
	}
</style>
