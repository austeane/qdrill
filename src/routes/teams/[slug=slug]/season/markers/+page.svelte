<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from '@zerodevx/svelte-toast';
	import { apiFetch } from '$lib/utils/apiFetch';
	import { formatInTz } from '$lib/utils/formatInTz';
	import Card from '$lib/components/ui/Card.svelte';
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let { data } = $props();

	const teamSlug = $derived(page.params.slug);
	const season = $derived(data.season);
	const teamTimezone = $derived(data.team?.timezone || 'UTC');
	const canEdit = $derived(data.canEdit);

	let markers = $state([]);
	$effect(() => {
		markers = data.markers ?? [];
	});

	let newMarker = $state({
		type: 'milestone',
		name: '',
		date: '',
		color: '#EF4444'
	});
	let editingMarkerId = $state(null);
	let showAddDialog = $state(false);
	let isSubmitting = $state(false);
	let addError = $state('');
	let editError = $state('');

	const markerTypes = [
		{ value: 'milestone', label: 'Milestone', color: '#EF4444' },
		{ value: 'tournament', label: 'Tournament', color: '#8B5CF6' },
		{ value: 'break', label: 'Break', color: '#6B7280' },
		{ value: 'deadline', label: 'Deadline', color: '#F59E0B' }
	];

	async function addMarker() {
		if (!newMarker.name.trim() || !newMarker.date) {
			addError = 'Name and date are required';
			return;
		}

		isSubmitting = true;
		addError = '';

		try {
			const marker = await apiFetch(`/api/seasons/${season.id}/markers`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newMarker)
			});

			markers = [...markers, marker].sort((a, b) => new Date(a.date) - new Date(b.date));
			newMarker = {
				type: 'milestone',
				name: '',
				date: '',
				color: '#EF4444'
			};
			showAddDialog = false;
			toast.push('Marker added successfully', { theme: { '--toastBackground': '#10b981' } });
		} catch (error) {
			addError = error.message || 'Failed to add marker';
			toast.push(addError, { theme: { '--toastBackground': '#ef4444' } });
		} finally {
			isSubmitting = false;
		}
	}

	async function updateMarker(marker) {
		editError = '';
		try {
			await apiFetch(`/api/seasons/${season.id}/markers/${marker.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(marker)
			});

			editingMarkerId = null;
			markers = [...markers].sort((a, b) => new Date(a.date) - new Date(b.date));
			toast.push('Marker updated successfully', { theme: { '--toastBackground': '#10b981' } });
		} catch (error) {
			editError = error.message || 'Failed to update marker';
			toast.push(editError, { theme: { '--toastBackground': '#ef4444' } });
		}
	}

	async function deleteMarker(markerId) {
		if (!confirm('Are you sure you want to delete this marker?')) return;

		try {
			await apiFetch(`/api/seasons/${season.id}/markers/${markerId}`, {
				method: 'DELETE'
			});

			markers = markers.filter((m) => m.id !== markerId);
			toast.push('Marker deleted successfully', { theme: { '--toastBackground': '#10b981' } });
		} catch (error) {
			const errorMsg = error.message || 'Failed to delete marker';
			toast.push(errorMsg, { theme: { '--toastBackground': '#ef4444' } });
		}
	}

	function formatDate(date) {
		if (!date) return 'No date';
		// Use formatInTz with team timezone or UTC fallback
		return formatInTz(date, teamTimezone, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function onTypeChange() {
		const type = markerTypes.find((t) => t.value === newMarker.type);
		if (type) {
			newMarker.color = type.color;
		}
	}
</script>

<svelte:head>
	<title>Season Markers - {data?.team?.name || teamSlug}</title>
</svelte:head>

{#snippet footer()}
	<Button
		variant="primary"
		onclick={addMarker}
		disabled={isSubmitting || !newMarker.name.trim() || !newMarker.date}
	>
		{isSubmitting ? 'Adding...' : 'Add Marker'}
	</Button>
	<Button
		variant="ghost"
		onclick={() => {
			showAddDialog = false;
			addError = '';
		}}
	>
		Cancel
	</Button>
{/snippet}

<div class="container mx-auto px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Season Markers</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">{season.name}</p>
		</div>
		<Button variant="ghost" onclick={() => goto(`/teams/${teamSlug}/season`)}>
			← Back to Season
		</Button>
	</div>

	{#if canEdit}
		<div class="mb-6">
			<Button variant="primary" onclick={() => (showAddDialog = true)}>+ Add Marker</Button>
		</div>

		<Dialog
			bind:open={showAddDialog}
			title="Add New Marker"
			footer={footer}
			onClose={() => {
				addError = '';
			}}
		>
			<div class="grid gap-4">
				<Select
					label="Marker Type"
					bind:value={newMarker.type}
					onchange={onTypeChange}
					options={markerTypes.map((t) => ({ value: t.value, label: t.label }))}
				/>
				<Input
					label="Name"
					bind:value={newMarker.name}
					placeholder="e.g., Regional Tournament"
					error={addError && !newMarker.name.trim() ? 'Name is required' : ''}
					required
				/>
				<Input
					label="Date"
					type="date"
					bind:value={newMarker.date}
					min={season.start_date}
					max={season.end_date}
					error={addError && !newMarker.date ? 'Date is required' : ''}
					required
				/>
				<div>
					<label for="new-marker-color" class="block text-sm font-medium mb-2">Color</label>
					<input
						id="new-marker-color"
						type="color"
						bind:value={newMarker.color}
						class="h-10 w-32 rounded-md border border-input bg-background px-2 cursor-pointer"
					/>
				</div>
			</div>
		</Dialog>
	{/if}

	<div class="space-y-4">
		{#each markers as marker (marker.id)}
			<Card>
				{#if editingMarkerId === marker.id}
					<div class="grid gap-4">
						<Select
							label="Marker Type"
							bind:value={marker.type}
							options={markerTypes.map((t) => ({ value: t.value, label: t.label }))}
							error={editError}
						/>
						<Input label="Name" bind:value={marker.name} error={editError} />
						<Input
							label="Date"
							type="date"
							bind:value={marker.date}
							min={season.start_date}
							max={season.end_date}
							error={editError}
						/>
						<div>
							<label for="edit-marker-color-{marker.id}" class="block text-sm font-medium mb-2">Color</label>
							<input
								id="edit-marker-color-{marker.id}"
								type="color"
								bind:value={marker.color}
								class="h-10 w-32 rounded-md border border-input bg-background px-2 cursor-pointer"
							/>
						</div>
						<div class="flex gap-2">
							<Button size="sm" variant="primary" onclick={() => updateMarker(marker)}>
								Save
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onclick={() => {
									editingMarkerId = null;
									editError = '';
								}}
							>
								Cancel
							</Button>
						</div>
					</div>
				{:else}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div
								class="w-2 h-8 rounded"
								style="background-color: {marker.color}"
								aria-label="Marker color"
							></div>
							<div>
								<h3 class="text-xl font-semibold">{marker.name}</h3>
								<div class="flex items-center gap-2 mt-1">
									<span class="text-sm text-gray-500 dark:text-gray-400">
										{formatDate(marker.date)}
									</span>
									<Badge variant="secondary">{marker.type}</Badge>
								</div>
							</div>
						</div>
						{#if canEdit}
							<div class="flex gap-2">
								<Button size="sm" variant="ghost" onclick={() => (editingMarkerId = marker.id)}>
									Edit
								</Button>
								<Button size="sm" variant="destructive" onclick={() => deleteMarker(marker.id)}>
									Delete
								</Button>
							</div>
						{/if}
					</div>
				{/if}
			</Card>
		{/each}

		{#if markers.length === 0}
			<Card>
				<div class="text-center py-8">
					<p class="text-gray-500 dark:text-gray-400">No markers defined for this season yet.</p>
					{#if canEdit}
						<p class="text-gray-500 dark:text-gray-400 mt-2">
							Click "Add Marker" to add important dates and milestones.
						</p>
					{/if}
				</div>
			</Card>
		{/if}
	</div>
</div>
