<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toast } from '@zerodevx/svelte-toast';
	import { apiFetch } from '$lib/utils/apiFetch';
	import Card from '$lib/components/ui/Card.svelte';
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/Input.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	export let data;

	let newSection = { name: '', color: '#3B82F6' };
	let editingSection = null;
	let showAddDialog = false;
	let isSubmitting = false;
	let addError = '';
	let editError = '';

	async function addSection() {
		if (!newSection.name.trim()) {
			addError = 'Section name is required';
			return;
		}

		isSubmitting = true;
		addError = '';

		try {
			const section = await apiFetch(`/api/seasons/${data.season.id}/sections`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: newSection.name,
					color: newSection.color,
					order_index: data.sections.length
				})
			});

			data.sections = [...data.sections, section];
			newSection = { name: '', color: '#3B82F6' };
			showAddDialog = false;
			toast.push('Section added successfully', { theme: { '--toastBackground': '#10b981' } });
		} catch (error) {
			addError = error.message || 'Failed to add section';
			toast.push(addError, { theme: { '--toastBackground': '#ef4444' } });
		} finally {
			isSubmitting = false;
		}
	}

	async function updateSection(section) {
		editError = '';
		try {
			await apiFetch(`/api/seasons/${data.season.id}/sections/${section.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(section)
			});

			editingSection = null;
			toast.push('Section updated successfully', { theme: { '--toastBackground': '#10b981' } });
		} catch (error) {
			editError = error.message || 'Failed to update section';
			toast.push(editError, { theme: { '--toastBackground': '#ef4444' } });
		}
	}

	async function deleteSection(sectionId) {
		if (!confirm('Are you sure you want to delete this section?')) return;

		try {
			await apiFetch(`/api/seasons/${data.season.id}/sections/${sectionId}`, {
				method: 'DELETE'
			});

			data.sections = data.sections.filter(s => s.id !== sectionId);
			toast.push('Section deleted successfully', { theme: { '--toastBackground': '#10b981' } });
		} catch (error) {
			const errorMsg = error.message || 'Failed to delete section';
			toast.push(errorMsg, { theme: { '--toastBackground': '#ef4444' } });
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
			<p class="text-gray-600 dark:text-gray-400 mt-1">{data.season.name}</p>
		</div>
		<Button variant="ghost" on:click={() => goto(`/teams/${data.team.slug}/season`)}>
			← Back to Season
		</Button>
	</div>

	{#if data.canEdit}
		<div class="mb-6">
			<Button variant="primary" on:click={() => showAddDialog = true}>
				+ Add Section
			</Button>
		</div>
		
		<Dialog bind:open={showAddDialog} title="Add New Section">
			<div class="grid gap-4">
				<Input
					label="Section Name"
					bind:value={newSection.name}
					placeholder="e.g., Pre-season, Regular Season"
					error={addError}
					required
				/>
				<div>
					<label class="block text-sm font-medium mb-2">Color</label>
					<input
						type="color"
						bind:value={newSection.color}
						class="h-10 w-32 rounded-md border border-input bg-background px-2 cursor-pointer"
					/>
				</div>
			</div>
			<div slot="footer" class="flex gap-2">
				<Button 
					variant="primary" 
					on:click={addSection}
					disabled={isSubmitting || !newSection.name.trim()}
				>
					{isSubmitting ? 'Adding...' : 'Add Section'}
				</Button>
				<Button variant="ghost" on:click={() => { showAddDialog = false; addError = ''; }}>
					Cancel
				</Button>
			</div>
		</Dialog>
	{/if}

	<div class="space-y-4">
		{#each data.sections as section, index}
			<Card>
				{#if editingSection === section.id}
					<div class="grid gap-4">
						<Input
							bind:value={section.name}
							label="Section Name"
							error={editError}
						/>
						<div>
							<label class="block text-sm font-medium mb-2">Color</label>
							<input
								type="color"
								bind:value={section.color}
								class="h-10 w-32 rounded-md border border-input bg-background px-2 cursor-pointer"
							/>
						</div>
						<div class="flex gap-2">
							<Button size="sm" variant="primary" on:click={() => updateSection(section)}>
								Save
							</Button>
							<Button size="sm" variant="ghost" on:click={() => { editingSection = null; editError = ''; }}>
								Cancel
							</Button>
						</div>
					</div>
				{:else}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div 
								class="w-6 h-6 rounded border border-gray-200 dark:border-gray-700"
								style="background-color: {section.color}"
								aria-label="Section color"
							></div>
							<h3 class="text-xl font-semibold">{section.name}</h3>
						</div>
						{#if data.canEdit}
							<div class="flex gap-2">
								<Button
									size="sm"
									variant="ghost"
									on:click={() => moveSection(index, -1)}
									disabled={index === 0}
									aria-label="Move section up"
								>
									↑
								</Button>
								<Button
									size="sm"
									variant="ghost"
									on:click={() => moveSection(index, 1)}
									disabled={index === data.sections.length - 1}
									aria-label="Move section down"
								>
									↓
								</Button>
								<Button
									size="sm"
									variant="ghost"
									on:click={() => editingSection = section.id}
								>
									Edit
								</Button>
								<Button
									size="sm"
									variant="destructive"
									on:click={() => deleteSection(section.id)}
								>
									Delete
								</Button>
							</div>
						{/if}
					</div>
				{/if}
			</Card>
		{/each}

		{#if data.sections.length === 0}
			<Card>
				<div class="text-center py-8">
					<p class="text-gray-500 dark:text-gray-400">No sections defined for this season yet.</p>
					{#if data.canEdit}
						<p class="text-gray-500 dark:text-gray-400 mt-2">Click "Add Section" to get started.</p>
					{/if}
				</div>
			</Card>
		{/if}
	</div>
</div>
