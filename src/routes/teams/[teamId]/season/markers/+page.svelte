<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toast } from '@zerodevx/svelte-toast';
	import { apiFetch } from '$lib/utils/apiFetch';
	import Card from '$lib/components/ui/Card.svelte';
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	export let data;

	let newMarker = { 
		type: 'milestone',
		name: '',
		date: '',
		color: '#EF4444'
	};
	let editingMarker = null;
	let showAddDialog = false;
	let isSubmitting = false;
	let addError = '';
	let editError = '';

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
			const marker = await apiFetch(`/api/seasons/${data.season.id}/markers`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newMarker)
			});

			data.markers = [...data.markers, marker].sort((a, b) => 
				new Date(a.date) - new Date(b.date)
			);
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
			await apiFetch(`/api/seasons/${data.season.id}/markers/${marker.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(marker)
			});

			editingMarker = null;
			data.markers = data.markers.sort((a, b) => 
				new Date(a.date) - new Date(b.date)
			);
			toast.push('Marker updated successfully', { theme: { '--toastBackground': '#10b981' } });
		} catch (error) {
			editError = error.message || 'Failed to update marker';
			toast.push(editError, { theme: { '--toastBackground': '#ef4444' } });
		}
	}

	async function deleteMarker(markerId) {
		if (!confirm('Are you sure you want to delete this marker?')) return;

		try {
			await apiFetch(`/api/seasons/${data.season.id}/markers/${markerId}`, {
				method: 'DELETE'
			});

			data.markers = data.markers.filter(m => m.id !== markerId);
			toast.push('Marker deleted successfully', { theme: { '--toastBackground': '#10b981' } });
		} catch (error) {
			const errorMsg = error.message || 'Failed to delete marker';
			toast.push(errorMsg, { theme: { '--toastBackground': '#ef4444' } });
		}
	}

	function formatDate(date) {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function onTypeChange() {
		const type = markerTypes.find(t => t.value === newMarker.type);
		if (type) {
			newMarker.color = type.color;
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Season Markers</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">{data.season.name}</p>
		</div>
		<Button variant="ghost" on:click={() => goto(`/teams/${data.team.id}/season`)}>
			← Back to Season
		</Button>
	</div>

	{#if data.canEdit}
		<div class="mb-6">
			<Button variant="primary" on:click={() => showAddDialog = true}>
				+ Add Marker
			</Button>
		</div>
		
		<Dialog bind:open={showAddDialog} title="Add New Marker">
			<div class="grid gap-4">
				<Select
					label="Marker Type"
					bind:value={newMarker.type}
					on:change={onTypeChange}
					options={markerTypes.map(t => ({ value: t.value, label: t.label }))}
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
					min={data.season.start_date}
					max={data.season.end_date}
					error={addError && !newMarker.date ? 'Date is required' : ''}
					required
				/>
				<div>
					<label class="block text-sm font-medium mb-2">Color</label>
					<input
						type="color"
						bind:value={newMarker.color}
						class="h-10 w-32 rounded-md border border-input bg-background px-2 cursor-pointer"
					/>
				</div>
			</div>
			<div slot="footer" class="flex gap-2">
				<Button 
					variant="primary" 
					on:click={addMarker}
					disabled={isSubmitting || !newMarker.name.trim() || !newMarker.date}
				>
					{isSubmitting ? 'Adding...' : 'Add Marker'}
				</Button>
				<Button variant="ghost" on:click={() => { showAddDialog = false; addError = ''; }}>
					Cancel
				</Button>
			</div>
		</Dialog>
	{/if}

	<div class="space-y-4">
		{#each data.markers as marker}
			<Card>
				{#if editingMarker === marker.id}
					<div class="grid gap-4">
						<Select
							label="Marker Type"
							bind:value={marker.type}
							options={markerTypes.map(t => ({ value: t.value, label: t.label }))}
							error={editError}
						/>
						<Input
							label="Name"
							bind:value={marker.name}
							error={editError}
						/>
						<Input
							label="Date"
							type="date"
							bind:value={marker.date}
							min={data.season.start_date}
							max={data.season.end_date}
							error={editError}
						/>
						<div>
							<label class="block text-sm font-medium mb-2">Color</label>
							<input
								type="color"
								bind:value={marker.color}
								class="h-10 w-32 rounded-md border border-input bg-background px-2 cursor-pointer"
							/>
						</div>
						<div class="flex gap-2">
							<Button size="sm" variant="primary" on:click={() => updateMarker(marker)}>
								Save
							</Button>
							<Button size="sm" variant="ghost" on:click={() => { editingMarker = null; editError = ''; }}>
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
						{#if data.canEdit}
							<div class="flex gap-2">
								<Button
									size="sm"
									variant="ghost"
									on:click={() => editingMarker = marker.id}
								>
									Edit
								</Button>
								<Button
									size="sm"
									variant="destructive"
									on:click={() => deleteMarker(marker.id)}
								>
									Delete
								</Button>
							</div>
						{/if}
					</div>
				{/if}
			</Card>
		{/each}

		{#if data.markers.length === 0}
			<Card>
				<div class="text-center py-8">
					<p class="text-gray-500 dark:text-gray-400">No markers defined for this season yet.</p>
					{#if data.canEdit}
						<p class="text-gray-500 dark:text-gray-400 mt-2">Click "Add Marker" to add important dates and milestones.</p>
					{/if}
				</div>
			</Card>
		{/if}
	</div>
</div>