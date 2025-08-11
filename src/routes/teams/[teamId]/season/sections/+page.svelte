<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toast } from '@zerodevx/svelte-toast';

	export let data;

	let newSection = { name: '', color: '#3B82F6' };
	let editingSection = null;
	let showAddForm = false;

	async function addSection() {
		if (!newSection.name.trim()) {
			toast.push('Section name is required', { theme: { '--toastBackground': '#ef4444' } });
			return;
		}

		try {
			const response = await fetch(`/api/seasons/${data.season.id}/sections`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: newSection.name,
					color: newSection.color,
					order_index: data.sections.length
				})
			});

			if (!response.ok) throw new Error('Failed to add section');

			const section = await response.json();
			data.sections = [...data.sections, section];
			newSection = { name: '', color: '#3B82F6' };
			showAddForm = false;
			toast.push('Section added successfully', { theme: { '--toastBackground': '#10b981' } });
		} catch (error) {
			toast.push('Failed to add section', { theme: { '--toastBackground': '#ef4444' } });
		}
	}

	async function updateSection(section) {
		try {
			const response = await fetch(`/api/seasons/${data.season.id}/sections/${section.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(section)
			});

			if (!response.ok) throw new Error('Failed to update section');

			editingSection = null;
			toast.push('Section updated successfully', { theme: { '--toastBackground': '#10b981' } });
		} catch (error) {
			toast.push('Failed to update section', { theme: { '--toastBackground': '#ef4444' } });
		}
	}

	async function deleteSection(sectionId) {
		if (!confirm('Are you sure you want to delete this section?')) return;

		try {
			const response = await fetch(`/api/seasons/${data.season.id}/sections/${sectionId}`, {
				method: 'DELETE'
			});

			if (!response.ok) throw new Error('Failed to delete section');

			data.sections = data.sections.filter(s => s.id !== sectionId);
			toast.push('Section deleted successfully', { theme: { '--toastBackground': '#10b981' } });
		} catch (error) {
			toast.push('Failed to delete section', { theme: { '--toastBackground': '#ef4444' } });
		}
	}

	function moveSection(index, direction) {
		const newIndex = index + direction;
		if (newIndex < 0 || newIndex >= data.sections.length) return;

		const sections = [...data.sections];
		[sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
		
		// Update order indices
		sections.forEach((section, i) => {
			section.order_index = i;
			updateSection(section);
		});

		data.sections = sections;
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Season Sections</h1>
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
					<h3 class="text-lg font-semibold mb-4">Add New Section</h3>
					<div class="grid gap-4">
						<div>
							<label class="label">
								<span class="label-text">Section Name</span>
							</label>
							<input
								type="text"
								bind:value={newSection.name}
								class="input input-bordered w-full"
								placeholder="e.g., Pre-season, Regular Season"
							/>
						</div>
						<div>
							<label class="label">
								<span class="label-text">Color</span>
							</label>
							<input
								type="color"
								bind:value={newSection.color}
								class="input input-bordered w-32"
							/>
						</div>
						<div class="flex gap-2">
							<button onclick={addSection} class="btn btn-primary">
								Add Section
							</button>
							<button onclick={() => showAddForm = false} class="btn btn-ghost">
								Cancel
							</button>
						</div>
					</div>
				</div>
			{:else}
				<button onclick={() => showAddForm = true} class="btn btn-primary">
					+ Add Section
				</button>
			{/if}
		</div>
	{/if}

	<div class="space-y-4">
		{#each data.sections as section, index}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					{#if editingSection === section.id}
						<div class="grid gap-4">
							<input
								type="text"
								bind:value={section.name}
								class="input input-bordered"
							/>
							<input
								type="color"
								bind:value={section.color}
								class="input input-bordered w-32"
							/>
							<div class="flex gap-2">
								<button onclick={() => updateSection(section)} class="btn btn-primary btn-sm">
									Save
								</button>
								<button onclick={() => editingSection = null} class="btn btn-ghost btn-sm">
									Cancel
								</button>
							</div>
						</div>
					{:else}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div 
									class="w-6 h-6 rounded"
									style="background-color: {section.color}"
								></div>
								<h3 class="text-xl font-semibold">{section.name}</h3>
							</div>
							{#if data.canEdit}
								<div class="flex gap-2">
									<button
										onclick={() => moveSection(index, -1)}
										disabled={index === 0}
										class="btn btn-ghost btn-sm"
									>
										↑
									</button>
									<button
										onclick={() => moveSection(index, 1)}
										disabled={index === data.sections.length - 1}
										class="btn btn-ghost btn-sm"
									>
										↓
									</button>
									<button
										onclick={() => editingSection = section.id}
										class="btn btn-ghost btn-sm"
									>
										Edit
									</button>
									<button
										onclick={() => deleteSection(section.id)}
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

		{#if data.sections.length === 0}
			<div class="card bg-base-100 shadow-xl p-8 text-center">
				<p class="text-gray-500">No sections defined for this season yet.</p>
				{#if data.canEdit}
					<p class="text-gray-500 mt-2">Click "Add Section" to get started.</p>
				{/if}
			</div>
		{/if}
	</div>
</div>