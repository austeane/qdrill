<script>
	import { goto } from '$app/navigation';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import { toLocalISO } from '$lib/utils/date.js';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';

	let { open = $bindable(false), season = null, sections = [], date = null, teamId = '', onSave, onClose } =
		$props();

	let loading = $state(false);
	let selectedDate = $state(date || toLocalISO(new Date()));
	let startTime = $state('18:00');
	let seedDefaults = $state(true);
	let practiceType = $state('regular');
	let createAndEdit = $state(false);

	const overlappingSections = $derived(getOverlappingSections(selectedDate));

	$effect(() => {
		// Keep selectedDate in sync when parent updates the date while dialog is open
		if (open && date && date !== selectedDate) {
			selectedDate = date;
		}
	});

	const practiceTypeOptions = [
		{ value: 'regular', label: 'Regular Practice' },
		{ value: 'scrimmage', label: 'Scrimmage' },
		{ value: 'tournament', label: 'Tournament' },
		{ value: 'training', label: 'Special Training' }
	];

	function getOverlappingSections(dateStr) {
		if (!dateStr) return [];
		const checkDate = new Date(dateStr);

		return sections.filter((s) => {
			const sectionStart = new Date(s.start_date);
			const sectionEnd = new Date(s.end_date);
			return checkDate >= sectionStart && checkDate <= sectionEnd;
		});
	}

	async function handleCreate() {
		if (!selectedDate || !startTime) {
			toast.push('Please fill in all required fields', {
				theme: {
					'--toastBackground': '#ef4444',
					'--toastColor': 'white'
				}
			});
			return;
		}

		loading = true;

		try {
			// Check for existing practices on this date
			const response = await apiFetch(`/api/teams/${teamId}/practice-plans?date=${selectedDate}`);

			const existingPractices = response.items || [];

			if (existingPractices.length > 0) {
				if (!confirm(`A practice already exists on ${formatDate(selectedDate)}. Create another?`)) {
					loading = false;
					return;
				}
			}

			// Call the instantiate endpoint to create the practice plan
			const practiceResponse = await apiFetch(`/api/seasons/${season.id}/instantiate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					scheduled_date: selectedDate,
					start_time: startTime,
					seed_default_sections: seedDefaults && overlappingSections.length > 0,
					practice_type: practiceType
				})
			});

			if (!practiceResponse || !practiceResponse.id) {
				throw new Error('Failed to create practice - no ID returned');
			}

			toast.push('Practice created successfully', {
				theme: {
					'--toastBackground': '#10b981',
					'--toastColor': 'white'
				}
			});

			if (createAndEdit) {
				// Navigate first, then close the dialog to avoid resetting createAndEdit
				const editUrl = `/teams/${teamId}/plans/${practiceResponse.id}/edit`;
				await goto(editUrl);
				handleClose();
			} else {
				onSave?.(practiceResponse);
				handleClose();
			}
		} catch (error) {
			console.error('Failed to create practice:', error);
			toast.push(error.message || 'Failed to create practice', {
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
		resetForm();
	}

	function resetForm() {
		selectedDate = date || toLocalISO(new Date());
		startTime = '18:00';
		seedDefaults = true;
		practiceType = 'regular';
		createAndEdit = false;
	}

	function formatDate(dateStr) {
		return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatSectionName(section) {
		const start = new Date(section.start_date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
		const end = new Date(section.end_date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
		return `${section.name} (${start} - ${end})`;
	}
</script>

{#snippet footer()}
	<div class="flex justify-end gap-2">
		<Button variant="ghost" onclick={handleClose} disabled={loading}>Cancel</Button>
		<Button variant="primary" onclick={handleCreate} disabled={!selectedDate || loading}>
			{#if loading}
				Creating...
			{:else if createAndEdit}
				Create & Edit
			{:else}
				Create Practice
			{/if}
		</Button>
	</div>
{/snippet}

<Dialog
	bind:open
	title="Create Practice"
	description="Schedule a new practice for your team"
	onClose={handleClose}
	{footer}
>
	<div class="grid gap-4">
		<Input
			label="Practice Date"
			type="date"
			bind:value={selectedDate}
			min={season?.start_date}
			max={season?.end_date}
			required
			disabled={loading}
		/>

		<Input label="Start Time" type="time" bind:value={startTime} required disabled={loading} />

		<Select
			label="Practice Type"
			bind:value={practiceType}
			options={practiceTypeOptions}
			disabled={loading}
		/>

		{#if overlappingSections.length > 0}
			<div
				class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
			>
				<div class="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
					Season Sections on this date:
				</div>
				<ul class="text-sm text-blue-700 dark:text-blue-300 space-y-1">
					{#each overlappingSections as section (section.id)}
						<li>• {formatSectionName(section)}</li>
					{/each}
				</ul>

				<Checkbox
					label="Pre-populate with default sections"
					bind:checked={seedDefaults}
					disabled={loading}
					class="mt-3"
				/>
			</div>
		{:else}
			<div
				class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
			>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					No season sections overlap with this date. The practice will be created with empty
					sections.
				</p>
			</div>
		{/if}

		<Checkbox
			id="create-and-edit-checkbox"
			label="Create and edit immediately"
			bind:checked={createAndEdit}
			disabled={loading}
		/>

		{#if selectedDate}
			<div class="text-sm text-gray-600 dark:text-gray-400">
				Creating practice for: <strong>{formatDate(selectedDate)}</strong>
			</div>
		{/if}
	</div>
</Dialog>
