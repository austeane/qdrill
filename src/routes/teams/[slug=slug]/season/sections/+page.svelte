<script>
	import { goto } from '$app/navigation';
	import { toast } from '@zerodevx/svelte-toast';
	import { apiFetch } from '$lib/utils/apiFetch';
	import Card from '$lib/components/ui/Card.svelte';
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/Input.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';

	let { data } = $props();

	const season = $derived(data.season);
	const teamSlug = $derived(data.team?.slug);
	const canEdit = $derived(data.canEdit);

	let sections = $state([]);
	$effect(() => {
		sections = data.sections ?? [];
	});

	let newSection = $state({ name: '', color: '#3B82F6' });
	let editingSectionId = $state(null);
	let showAddDialog = $state(false);
	let isSubmitting = $state(false);
	let addError = $state('');
	let editError = $state('');

	async function addSection() {
		if (!newSection.name.trim()) {
			addError = 'Section name is required';
			return;
		}

		isSubmitting = true;
		addError = '';

		try {
			const section = await apiFetch(`/api/seasons/${season.id}/sections`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: newSection.name,
					color: newSection.color,
					order_index: sections.length
				})
			});

			sections = [...sections, section];
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
			await apiFetch(`/api/seasons/${season.id}/sections/${section.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(section)
			});

			editingSectionId = null;
			sections = [...sections];
			toast.push('Section updated successfully', { theme: { '--toastBackground': '#10b981' } });
		} catch (error) {
			editError = error.message || 'Failed to update section';
			toast.push(editError, { theme: { '--toastBackground': '#ef4444' } });
		}
	}

	async function deleteSection(sectionId) {
		if (!confirm('Are you sure you want to delete this section?')) return;

		try {
			await apiFetch(`/api/seasons/${season.id}/sections/${sectionId}`, {
				method: 'DELETE'
			});

			sections = sections.filter((s) => s.id !== sectionId);
			toast.push('Section deleted successfully', { theme: { '--toastBackground': '#10b981' } });
		} catch (error) {
			const errorMsg = error.message || 'Failed to delete section';
			toast.push(errorMsg, { theme: { '--toastBackground': '#ef4444' } });
		}
	}

	async function moveSection(index, direction) {
		const newIndex = index + direction;
		if (newIndex < 0 || newIndex >= sections.length) return;

		const previousSections = sections;
		const nextSections = [...sections];
		[nextSections[index], nextSections[newIndex]] = [nextSections[newIndex], nextSections[index]];

		sections = nextSections;

		try {
			await apiFetch(`/api/seasons/${season.id}/sections/reorder`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sections: nextSections.map((s, i) => ({ id: s.id, order: i }))
				})
			});
		} catch (error) {
			sections = previousSections;
			toast.push(error.message || 'Failed to reorder sections', {
				theme: { '--toastBackground': '#ef4444' }
			});
		}
	}
</script>

{#snippet footer()}
	<Button variant="primary" onclick={addSection} disabled={isSubmitting || !newSection.name.trim()}>
		{isSubmitting ? 'Adding...' : 'Add Section'}
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
			<h1 class="text-3xl font-bold">Season Sections</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">{season.name}</p>
		</div>
		<Button variant="ghost" onclick={() => goto(`/teams/${teamSlug}/season`)}>
			← Back to Season
		</Button>
	</div>

	{#if canEdit}
		<div class="mb-6">
			<Button variant="primary" onclick={() => (showAddDialog = true)}>+ Add Section</Button>
		</div>

		<Dialog
			bind:open={showAddDialog}
			title="Add New Section"
			footer={footer}
			onClose={() => {
				addError = '';
			}}
		>
			<div class="grid gap-4">
				<Input
					label="Section Name"
					bind:value={newSection.name}
					placeholder="e.g., Pre-season, Regular Season"
					error={addError}
					required
				/>
				<div>
					<label for="new-section-color" class="block text-sm font-medium mb-2">Color</label>
					<input
						id="new-section-color"
						type="color"
						bind:value={newSection.color}
						class="h-10 w-32 rounded-md border border-input bg-background px-2 cursor-pointer"
					/>
				</div>
			</div>
		</Dialog>
	{/if}

	<div class="space-y-4">
		{#each sections as section, index (section.id)}
			<Card>
				{#if editingSectionId === section.id}
					<div class="grid gap-4">
						<Input bind:value={section.name} label="Section Name" error={editError} />
						<div>
							<label for="edit-section-color-{section.id}" class="block text-sm font-medium mb-2">Color</label>
							<input
								id="edit-section-color-{section.id}"
								type="color"
								bind:value={section.color}
								class="h-10 w-32 rounded-md border border-input bg-background px-2 cursor-pointer"
							/>
						</div>
						<div class="flex gap-2">
							<Button size="sm" variant="primary" onclick={() => updateSection(section)}>
								Save
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onclick={() => {
									editingSectionId = null;
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
								class="w-6 h-6 rounded border border-gray-200 dark:border-gray-700"
								style="background-color: {section.color}"
								aria-label="Section color"
							></div>
							<h3 class="text-xl font-semibold">{section.name}</h3>
						</div>
						{#if canEdit}
							<div class="flex gap-2">
								<Button
									size="sm"
									variant="ghost"
									onclick={() => moveSection(index, -1)}
									disabled={index === 0}
									aria-label="Move section up"
								>
									↑
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onclick={() => moveSection(index, 1)}
									disabled={index === sections.length - 1}
									aria-label="Move section down"
								>
									↓
								</Button>
								<Button size="sm" variant="ghost" onclick={() => (editingSectionId = section.id)}>
									Edit
								</Button>
								<Button size="sm" variant="destructive" onclick={() => deleteSection(section.id)}>
									Delete
								</Button>
							</div>
						{/if}
					</div>
				{/if}
			</Card>
		{/each}

		{#if sections.length === 0}
			<Card>
				<div class="text-center py-8">
					<p class="text-gray-500 dark:text-gray-400">No sections defined for this season yet.</p>
					{#if canEdit}
						<p class="text-gray-500 dark:text-gray-400 mt-2">Click "Add Section" to get started.</p>
					{/if}
				</div>
			</Card>
		{/if}
	</div>
</div>
