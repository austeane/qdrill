<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { toast } from '@zerodevx/svelte-toast';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import Card from '$lib/components/ui/Card.svelte';
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/Input.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import RecurrenceConfig from '$lib/components/season/RecurrenceConfig.svelte';
	import BatchGenerationPreview from '$lib/components/season/BatchGenerationPreview.svelte';
	import { toLocalISO } from '$lib/utils/date.js';

	let season = $state(null);
	let recurrences = $state([]);
	let templates = $state([]);
	let loading = $state(true);
	let error = $state(null);

	let showConfig = $state(false);
	let editingRecurrence = $state(null);
	let showPreview = $state(false);
	let selectedRecurrence = $state(null);
	let preview = $state(null);
	let generating = $state(false);

	let dateRange = $state({
		start_date: '',
		end_date: ''
	});

	onMount(loadData);

	async function loadData() {
		try {
			loading = true;

			// Get active season
			season = await apiFetch(`/api/teams/${$page.params.slug}/seasons/active`);

			// Set default date range to next month
			const today = new Date();
			const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
			const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
			dateRange.start_date = toLocalISO(nextMonth);
			dateRange.end_date = toLocalISO(endOfNextMonth);

			// Get recurrences
			recurrences = await apiFetch(`/api/seasons/${season.id}/recurrences`).catch(() => []);

			// Get template practice plans
			const plansRes = await apiFetch(
				`/api/teams/${$page.params.slug}/practice-plans?template=true`
			).catch(() => []);
			templates = Array.isArray(plansRes) ? plansRes : plansRes.plans || [];
		} catch (err) {
			error = err?.message || 'Failed to load data';
		} finally {
			loading = false;
		}
	}

	async function handleSaveRecurrence(data) {
		try {
			const url = editingRecurrence
				? `/api/seasons/${season.id}/recurrences/${editingRecurrence.id}`
				: `/api/seasons/${season.id}/recurrences`;
			const method = editingRecurrence ? 'PUT' : 'POST';

			await apiFetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});

			toast.push(editingRecurrence ? 'Recurrence updated' : 'Recurrence created', {
				theme: { '--toastBackground': '#10b981' }
			});
			await loadData();
			showConfig = false;
			editingRecurrence = null;
		} catch (err) {
			toast.push(err?.message || 'Failed to save recurrence', {
				theme: { '--toastBackground': '#ef4444' }
			});
		}
	}

	function handleEditRecurrence(recurrence) {
		editingRecurrence = recurrence;
		showConfig = true;
	}

	async function handleDeleteRecurrence(recurrence) {
		if (
			!confirm(
				`Delete recurrence pattern "${recurrence.name}"? This will not delete already generated practices.`
			)
		) {
			return;
		}
		try {
			await apiFetch(`/api/seasons/${season.id}/recurrences/${recurrence.id}`, {
				method: 'DELETE'
			});
			toast.push('Recurrence deleted', { theme: { '--toastBackground': '#10b981' } });
			await loadData();
		} catch (err) {
			toast.push(err?.message || 'Failed to delete recurrence', {
				theme: { '--toastBackground': '#ef4444' }
			});
		}
	}

	async function handlePreviewGeneration(recurrence) {
		selectedRecurrence = recurrence;
		preview = null;
		showPreview = true;
		try {
			preview = await apiFetch(`/api/seasons/${season.id}/recurrences/${recurrence.id}/preview`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(dateRange)
			});
		} catch (err) {
			toast.push(err?.message || 'Failed to preview generation', {
				theme: { '--toastBackground': '#ef4444' }
			});
			showPreview = false;
		}
	}

	async function handleGenerate() {
		if (!selectedRecurrence || !preview) return;
		generating = true;
		try {
			const result = await apiFetch(
				`/api/seasons/${season.id}/recurrences/${selectedRecurrence.id}/generate`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(dateRange)
				}
			);
			toast.push(`Generated ${result.generated} practices`, {
				theme: { '--toastBackground': '#10b981' }
			});
			showPreview = false;
			selectedRecurrence = null;
			preview = null;
			await loadData();
		} catch (err) {
			toast.push(err?.message || 'Failed to generate practices', {
				theme: { '--toastBackground': '#ef4444' }
			});
		} finally {
			generating = false;
		}
	}

	function formatPattern(pattern) {
		return pattern.charAt(0).toUpperCase() + pattern.slice(1);
	}

	function formatDays(recurrence) {
		if (recurrence.day_of_week && recurrence.day_of_week.length > 0) {
			const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			return recurrence.day_of_week.map((d) => days[d]).join(', ');
		}
		if (recurrence.day_of_month && recurrence.day_of_month.length > 0) {
			return recurrence.day_of_month.map((d) => `${d}${getOrdinalSuffix(d)}`).join(', ');
		}
		return '-';
	}

	function getOrdinalSuffix(n) {
		const s = ['th', 'st', 'nd', 'rd'];
		const v = n % 100;
		return s[(v - 20) % 10] || s[v] || s[0];
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl" data-testid="recurrences-page">
	{#if loading}
		<Card>
			<div class="flex justify-center py-12 text-gray-500">Loading...</div>
		</Card>
	{:else if error}
		<Card>
			<div class="p-4 text-red-700">{error}</div>
		</Card>
	{:else if !season}
		<Card>
			<div class="p-4 text-amber-700">
				No active season found. Please create and activate a season first.
			</div>
		</Card>
	{:else}
		<div class="mb-6">
			<h1 class="text-2xl font-bold mb-2">Practice Recurrence Patterns</h1>
			<p class="text-gray-600">Set up recurring practice schedules for {season.name}</p>
		</div>

			{#if showConfig}
				<Card class="mb-6">
					{#snippet header()}
						<h2 class="text-lg font-semibold">
							{editingRecurrence ? 'Edit' : 'Create'} Recurrence Pattern
						</h2>
					{/snippet}
					<RecurrenceConfig
						recurrence={editingRecurrence}
						{season}
						{templates}
					onSave={handleSaveRecurrence}
					onCancel={() => {
						showConfig = false;
						editingRecurrence = null;
					}}
					/>
				</Card>
			{:else if showPreview}
				<Card class="mb-6">
					{#snippet header()}
						<h2 class="text-lg font-semibold">
							Preview Batch Generation: {selectedRecurrence?.name}
						</h2>
					{/snippet}
					<div class="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Input
							label="Start Date"
						type="date"
						bind:value={dateRange.start_date}
						min={season.start_date}
						max={season.end_date}
						onchange={() => handlePreviewGeneration(selectedRecurrence)}
					/>
					<Input
						label="End Date"
						type="date"
						bind:value={dateRange.end_date}
						min={season.start_date}
						max={season.end_date}
						onchange={() => handlePreviewGeneration(selectedRecurrence)}
					/>
				</div>
				<BatchGenerationPreview
					{preview}
					loading={generating}
					onGenerate={handleGenerate}
					onCancel={() => {
						showPreview = false;
						selectedRecurrence = null;
						preview = null;
					}}
				/>
			</Card>
		{:else}
			<div class="mb-4">
				<Button variant="primary" onclick={() => (showConfig = true)}
					>+ Add Recurrence Pattern</Button
				>
			</div>

			{#if recurrences.length === 0}
				<Card>
					<div class="p-8 text-center text-gray-500">No recurrence patterns configured yet.</div>
				</Card>
			{:else}
				<Card>
					<table class="w-full">
						<thead class="bg-gray-50 border-b">
							<tr>
								<th
									class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									Name
								</th>
								<th
									class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									Pattern
								</th>
								<th
									class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									Days
								</th>
								<th
									class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									Time
								</th>
								<th
									class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									Template
								</th>
								<th
									class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									Status
								</th>
								<th
									class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="divide-y">
							{#each recurrences as recurrence (recurrence.id)}
								<tr>
									<td class="px-4 py-3 font-medium">
										{recurrence.name}
									</td>
									<td class="px-4 py-3 text-sm">
										{formatPattern(recurrence.pattern)}
									</td>
									<td class="px-4 py-3 text-sm">
										{formatDays(recurrence)}
									</td>
									<td class="px-4 py-3 text-sm">
										{recurrence.time_of_day || '-'}
									</td>
									<td class="px-4 py-3 text-sm">
										{recurrence.template_name || 'Season default'}
									</td>
									<td class="px-4 py-3">
										{#if recurrence.is_active}
											<Badge variant="success">Active</Badge>
										{:else}
											<Badge variant="secondary">Inactive</Badge>
										{/if}
									</td>
									<td class="px-4 py-3 text-right text-sm space-x-2">
										<Button
											size="sm"
											variant="ghost"
											onclick={() => handlePreviewGeneration(recurrence)}>Generate</Button
										>
										<Button
											size="sm"
											variant="ghost"
											onclick={() => handleEditRecurrence(recurrence)}>Edit</Button
										>
										<Button
											size="sm"
											variant="destructive"
											onclick={() => handleDeleteRecurrence(recurrence)}>Delete</Button
										>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</Card>
			{/if}
		{/if}
	{/if}
</div>
