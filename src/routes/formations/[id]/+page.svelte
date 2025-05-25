<script>
	// import { onMount } from 'svelte'; // Removed
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toast } from '@zerodevx/svelte-toast';
	import ExcalidrawWrapper from '$lib/components/ExcalidrawWrapper.svelte';
	import { dev } from '$app/environment';
	import { slide } from 'svelte/transition'; // Added for transitions

	export let data;

	// Use formation data directly from the load function
	$: formation = data.formation;

	// REMOVED: State for associated drills (isLoadingDrills, loadDrillsError)
	// REMOVED: isLoading state
	// REMOVED: error state
	// REMOVED: onMount fetch logic
	// REMOVED: loadAssociatedDrills function

	function handleEdit() {
		goto(`/formations/${formation.id}/edit`);
	}

	async function handleDelete() {
		if (!confirm('Are you sure you want to delete this formation? This action cannot be undone.')) {
			return;
		}
		try {
			const response = await fetch(`/api/formations/${formation.id}`, {
				method: 'DELETE'
			});
			if (!response.ok) {
				// Try to parse error message from response
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
			}
			goto('/formations');
			// Optionally add a success toast notification here
		} catch (err) {
			console.error('Error deleting formation:', err);
			alert(`Failed to delete formation: ${err.message}`); // Simple alert for now
		}
	}

	// Function to handle formation duplication
	async function handleDuplicate() {
		try {
			const response = await fetch(`/api/formations/${formation.id}/duplicate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (!response.ok) {
				// Try to parse error message from response
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
			}

			const result = await response.json();

			toast.push('Formation duplicated successfully', {
				theme: {
					'--toastBackground': '#48BB78',
					'--toastBarBackground': '#2F855A'
				}
			});
			goto(`/formations/${result.id}/edit`);
		} catch (error) {
			console.error('Error duplicating formation:', error);
			toast.push(error.message || 'Failed to duplicate formation', {
				theme: {
					'--toastBackground': '#F56565',
					'--toastBarBackground': '#C53030'
				}
			});
		}
	}
</script>

<svelte:head>
	<title>{formation?.name || 'Formation'} - QDrill</title>
	<!-- Use formation directly -->
	<meta name="description" content={formation?.brief_description || 'View formation details'} />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Remove top-level loading/error checks, data is guaranteed -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<button
				class="text-blue-600 hover:text-blue-800 flex items-center"
				on:click={() => goto('/formations')}
			>
				<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					></path>
				</svg>
				Back to Formations
			</button>
		</div>

		<!-- Edit/Delete Buttons (Permission check remains) -->
		{#if formation && $page.data.session && ((dev || $page.data.session.user.id === formation.created_by) || formation.is_editable_by_others)}
			<div class="flex space-x-4">
				<button
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
					on:click={handleEdit}
				>
					Edit
				</button>
				<button
					class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
					on:click={handleDuplicate}
				>
					Duplicate
				</button>
				{#if dev || $page.data.session.user.id === formation.created_by}
					<button
						class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
						on:click={handleDelete}
					>
						Delete
					</button>
				{/if}
			</div>
		{:else if formation && $page.data.session}
			<!-- Show Duplicate button for authenticated users who can't edit -->
			<div class="flex space-x-4">
				<button
					class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
					on:click={handleDuplicate}
				>
					Duplicate
				</button>
			</div>
		{/if}
	</div>

	{#if formation}
		<div class="bg-white rounded-lg shadow-sm overflow-hidden p-8">
			<h1 class="text-3xl font-bold mb-4" data-testid="formation-title">{formation.name}</h1>

			{#if formation.brief_description}
				<div class="mb-6" data-testid="formation-description">
					<p class="text-lg text-gray-700">{formation.brief_description}</p>
				</div>
			{/if}

			{#if formation.tags && formation.tags.length > 0}
				<div class="flex flex-wrap gap-2 mb-6">
					{#each formation.tags as tag}
						<span
							class="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full border border-blue-100"
						>
							{tag}
						</span>
					{/each}
				</div>
			{/if}

			{#if formation.detailed_description}
				<div class="border-t border-gray-200 pt-6 mb-8">
					<h2 class="text-xl font-semibold mb-4">Description</h2>
					<div class="prose max-w-none prose-indigo">
						{@html formation.detailed_description}
					</div>
				</div>
			{/if}

			{#if formation.diagrams && formation.diagrams.length > 0}
				<div class="border-t border-gray-200 pt-6">
					<h2 class="text-xl font-semibold mb-4">Diagrams</h2>
					<div class="space-y-8">
						{#each formation.diagrams as diagramData, i}
							{@const diagram =
								typeof diagramData === 'string' ? JSON.parse(diagramData) : diagramData}
							{#if diagram}
								<div class="border rounded-lg overflow-hidden shadow-sm">
									<div class="bg-gray-50 p-3 border-b">
										<h3 class="font-medium text-gray-700">Diagram {diagram.name || i + 1}</h3>
									</div>
									<div class="p-4 bg-gray-100">
										<ExcalidrawWrapper
											data={diagram}
											id={`view-diagram-${formation.id}-${i}`}
											readonly={true}
											viewModeEnabled={true}
											zenModeEnabled={false}
										/>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<div class="border-t border-gray-200 pt-6 mt-8 text-sm text-gray-500">
				<div class="flex flex-wrap justify-between gap-x-4 gap-y-1">
					<div>
						<span>Created: {new Date(formation.created_at).toLocaleDateString()}</span>
						{#if formation.updated_at && formation.created_at !== formation.updated_at}
							<span class="ml-4"
								>Updated: {new Date(formation.updated_at).toLocaleDateString()}</span
							>
						{/if}
					</div>
					<div class="flex items-center gap-x-2">
						{#if formation.formation_type}
							<span
								>Type: {formation.formation_type.charAt(0).toUpperCase() +
									formation.formation_type.slice(1)}</span
							>
							<span class="mx-1">•</span>
						{/if}
						<span>Visibility: {formation.visibility || 'Private'}</span>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- This case should ideally not be hit if load function handles errors -->
		<p class="text-center text-red-500">Formation data is not available.</p>
	{/if}
</div>
