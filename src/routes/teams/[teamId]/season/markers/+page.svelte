<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toast } from '@zerodevx/svelte-toast';

	export let data;

	let newMarker = { 
		type: 'milestone',
		name: '',
		date: '',
		color: '#EF4444'
	};
	let editingMarker = null;
	let showAddForm = false;

	const markerTypes = [
		{ value: 'milestone', label: 'Milestone', color: '#EF4444' },
		{ value: 'tournament', label: 'Tournament', color: '#8B5CF6' },
		{ value: 'break', label: 'Break', color: '#6B7280' },
		{ value: 'deadline', label: 'Deadline', color: '#F59E0B' }
	];

	async function addMarker() {
		if (!newMarker.name.trim() || !newMarker.date) {
			toast.push('Name and date are required', { theme: { '--toastBackground': '#ef4444' } });
			return;
		}

		try {
			const response = await fetch(`/api/seasons/${data.season.id}/markers`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newMarker)
			});

			if (!response.ok) throw new Error('Failed to add marker');

			const marker = await response.json();
			data.markers = [...data.markers, marker].sort((a, b) => 
				new Date(a.date) - new Date(b.date)
			);
			newMarker = { 
				type: 'milestone',
				name: '',
				date: '',
				color: '#EF4444'
			};
			showAddForm = false;
			toast.push('Marker added successfully', { theme: { '--toastBackground': '#10b981' } });
		} catch (error) {
			toast.push('Failed to add marker', { theme: { '--toastBackground': '#ef4444' } });
		}
	}

	async function updateMarker(marker) {
		try {
			const response = await fetch(`/api/seasons/${data.season.id}/markers/${marker.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(marker)
			});

			if (!response.ok) throw new Error('Failed to update marker');

			editingMarker = null;
			data.markers = data.markers.sort((a, b) => 
				new Date(a.date) - new Date(b.date)
			);
			toast.push('Marker updated successfully', { theme: { '--toastBackground': '#10b981' } });
		} catch (error) {
			toast.push('Failed to update marker', { theme: { '--toastBackground': '#ef4444' } });
		}
	}

	async function deleteMarker(markerId) {
		if (!confirm('Are you sure you want to delete this marker?')) return;

		try {
			const response = await fetch(`/api/seasons/${data.season.id}/markers/${markerId}`, {
				method: 'DELETE'
			});

			if (!response.ok) throw new Error('Failed to delete marker');

			data.markers = data.markers.filter(m => m.id !== markerId);
			toast.push('Marker deleted successfully', { theme: { '--toastBackground': '#10b981' } });
		} catch (error) {
			toast.push('Failed to delete marker', { theme: { '--toastBackground': '#ef4444' } });
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
			<p class="text-gray-600 mt-1">{data.season.name}</p>
		</div>
		<button
			onclick={() => goto(`/teams/${data.team.id}/season`)}
			class="btn btn-ghost"
		>
			← Back to Season
		</button>
	</div>

	{#if data.canEdit}
		<div class="mb-6">
			{#if showAddForm}
				<div class="card bg-base-100 shadow-xl p-6">
					<h3 class="text-lg font-semibold mb-4">Add New Marker</h3>
					<div class="grid gap-4">
						<div>
							<label class="label">
								<span class="label-text">Marker Type</span>
							</label>
							<select
								bind:value={newMarker.type}
								onchange={onTypeChange}
								class="select select-bordered w-full"
							>
								{#each markerTypes as type}
									<option value={type.value}>{type.label}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="label">
								<span class="label-text">Name</span>
							</label>
							<input
								type="text"
								bind:value={newMarker.name}
								class="input input-bordered w-full"
								placeholder="e.g., Regional Tournament"
							/>
						</div>
						<div>
							<label class="label">
								<span class="label-text">Date</span>
							</label>
							<input
								type="date"
								bind:value={newMarker.date}
								class="input input-bordered w-full"
								min={data.season.start_date}
								max={data.season.end_date}
							/>
						</div>
						<div>
							<label class="label">
								<span class="label-text">Color</span>
							</label>
							<input
								type="color"
								bind:value={newMarker.color}
								class="input input-bordered w-32"
							/>
						</div>
						<div class="flex gap-2">
							<button onclick={addMarker} class="btn btn-primary">
								Add Marker
							</button>
							<button onclick={() => showAddForm = false} class="btn btn-ghost">
								Cancel
							</button>
						</div>
					</div>
				</div>
			{:else}
				<button onclick={() => showAddForm = true} class="btn btn-primary">
					+ Add Marker
				</button>
			{/if}
		</div>
	{/if}

	<div class="space-y-4">
		{#each data.markers as marker}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					{#if editingMarker === marker.id}
						<div class="grid gap-4">
							<select
								bind:value={marker.type}
								class="select select-bordered"
							>
								{#each markerTypes as type}
									<option value={type.value}>{type.label}</option>
								{/each}
							</select>
							<input
								type="text"
								bind:value={marker.name}
								class="input input-bordered"
							/>
							<input
								type="date"
								bind:value={marker.date}
								class="input input-bordered"
								min={data.season.start_date}
								max={data.season.end_date}
							/>
							<input
								type="color"
								bind:value={marker.color}
								class="input input-bordered w-32"
							/>
							<div class="flex gap-2">
								<button onclick={() => updateMarker(marker)} class="btn btn-primary btn-sm">
									Save
								</button>
								<button onclick={() => editingMarker = null} class="btn btn-ghost btn-sm">
									Cancel
								</button>
							</div>
						</div>
					{:else}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div 
									class="w-2 h-8 rounded"
									style="background-color: {marker.color}"
								></div>
								<div>
									<h3 class="text-xl font-semibold">{marker.name}</h3>
									<p class="text-sm text-gray-500">
										{formatDate(marker.date)} • 
										<span class="badge badge-sm">{marker.type}</span>
									</p>
								</div>
							</div>
							{#if data.canEdit}
								<div class="flex gap-2">
									<button
										onclick={() => editingMarker = marker.id}
										class="btn btn-ghost btn-sm"
									>
										Edit
									</button>
									<button
										onclick={() => deleteMarker(marker.id)}
										class="btn btn-error btn-sm"
									>
										Delete
									</button>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/each}

		{#if data.markers.length === 0}
			<div class="card bg-base-100 shadow-xl p-8 text-center">
				<p class="text-gray-500">No markers defined for this season yet.</p>
				{#if data.canEdit}
					<p class="text-gray-500 mt-2">Click "Add Marker" to add important dates and milestones.</p>
				{/if}
			</div>
		{/if}
	</div>
</div>