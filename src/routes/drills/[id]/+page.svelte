<script>
	import { page } from '$app/state';
	import { cart } from '$lib/stores/cartStore';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import { goto } from '$app/navigation';
	import UpvoteDownvote from '$lib/components/UpvoteDownvote.svelte';
	import Comments from '$lib/components/Comments.svelte';
	import { toast } from '@zerodevx/svelte-toast';
	import ExcalidrawWrapper from '$lib/components/ExcalidrawWrapper.svelte';
	import { dev } from '$app/environment';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import { sanitizeHtml } from '$lib/utils/sanitize.js';

	let { data } = $props();

	let drill = $state(data.drill || {});

	// Check if user is admin or owner
	const session = $derived(page.data.session);
	const userId = $derived(session?.user?.id);
	const isAdmin = $derived(session?.user?.role === 'admin');
	const canEdit = $derived(isAdmin || drill.created_by === userId);

	// Reactively update the local store if the data prop changes
	$effect(() => {
		if (data.drill) drill = data.drill;
	});

	const allVariants = $derived.by(() => {
		if (!drill?.variations) return {};
		return {
			[drill.id]: {
				...drill,
				variations: drill.variations
			}
		};
	});

	let currentDrillId = $state(page.params.id);
	$effect(() => {
		currentDrillId = page.params.id;
	});

	let showVariantModal = $state(false);
	let searchQuery = $state('');
	let selectedDrill = $state(null);
	let relationshipType = $state(null);
	let isSearching = $state(false);
	let searchResults = $state([]);

	async function switchVariant(variantId) {
		try {
			currentDrillId = variantId;
			await goto(`/drills/${variantId}`, {
				invalidateAll: true,
				keepFocus: true
			});
		} catch (error) {
			console.error('Error switching variant:', error);
			toast.push('Failed to switch variant', {
				theme: { '--toastBackground': '#f56565', '--toastColor': '#fff' }
			});
		}
	}

	function addDrillToPlan() {
		cart.addDrill(drill);
		// Show notification
		alert('Drill added to plan');
	}

	async function setAsVariant() {
		if (!selectedDrill || !relationshipType) {
			toast.push('Please select a drill and relationship type', {
				theme: { '--toastBackground': '#EF4444', '--toastColor': 'white' }
			});
			return;
		}

		try {
			const updatedDrill = await apiFetch(
				`/api/drills/${relationshipType === 'current-as-child' ? drill.id : selectedDrill.id}/set-variant`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						parentDrillId: relationshipType === 'current-as-child' ? selectedDrill.id : drill.id
					})
				}
			);

			drill = updatedDrill;
			showVariantModal = false;
			selectedDrill = null;
			relationshipType = null;

			toast.push('Successfully set variant relationship', {
				theme: { '--toastBackground': '#10B981', '--toastColor': 'white' }
			});

			// Refresh the page to show updated relationships
			goto(`/drills/${drill.id}`, { replaceState: true });
		} catch (error) {
			console.error('Error setting variant relationship:', error);
			toast.push(`Failed to set variant relationship: ${error.message}`, {
				theme: { '--toastBackground': '#EF4444', '--toastColor': 'white' }
			});
		}
	}

	async function removeVariant() {
		try {
			const updatedDrill = await apiFetch(`/api/drills/${drill.id}/set-variant`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ parentDrillId: null })
			});

			drill = updatedDrill;
			toast.push('Successfully removed variant status', {
				theme: { '--toastBackground': '#10B981', '--toastColor': 'white' }
			});

			// Refresh the page to show updated relationships
			goto(`/drills/${drill.id}`, { replaceState: true });
		} catch (error) {
			console.error('Error removing variant status:', error);
			toast.push(`Failed to remove variant status: ${error.message}`, {
				theme: { '--toastBackground': '#EF4444', '--toastColor': 'white' }
			});
		}
	}

	async function searchDrills() {
		isSearching = true;
		searchResults = []; // Reset
		try {
			const drills = await apiFetch(`/api/drills/search?query=${encodeURIComponent(searchQuery)}`);

			// Filter out current drill and any variants
			searchResults = drills.filter((d) => d.id !== drill.id);
		} catch (error) {
			console.error('Error searching drills:', error);
			toast.push(`Search failed: ${error.message}`, {
				theme: { '--toastBackground': '#EF4444', '--toastColor': 'white' }
			});
		} finally {
			isSearching = false;
		}
	}

	// Debounce the search function
	let searchTimeout;
	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			searchDrills();
		}, 300);
	}

	function _selectDrill(drill) {
		selectedDrill = drill;
		searchQuery = drill.name;
	}

	async function removeVariantRelationship(variantId) {
		try {
			await apiFetch(`/api/drills/${variantId}/set-variant`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ parentDrillId: null })
			});

			// If the first fetch succeeded, refresh the current drill
			try {
				const updatedDrill = await apiFetch(`/api/drills/${drill.id}`);
				drill = updatedDrill;
				toast.push('Variant relationship removed successfully', {
					theme: { '--toastBackground': '#10B981', '--toastColor': 'white' }
				});
			} catch (refreshError) {
				// Handle error fetching the updated drill info specifically
				console.error('Error refreshing drill data after removing relationship:', refreshError);
				toast.push(
					`Removed relationship, but failed to refresh drill data: ${refreshError.message}`,
					{
						theme: { '--toastBackground': '#F59E0B', '--toastColor': 'white' } // Warning
					}
				);
				// Optionally, still try to update UI partially or navigate away
				// For now, we just show the warning.
			}
		} catch (error) {
			console.error('Error removing variant relationship:', error);
			toast.push(`Failed to remove variant relationship: ${error.message}`, {
				theme: { '--toastBackground': '#EF4444', '--toastColor': 'white' }
			});
		}
	}

	async function handleDelete() {
		if (!confirm('Are you sure you want to delete this drill? This action cannot be undone.')) {
			return;
		}

		try {
			await apiFetch(`/api/drills/${drill.id}`, {
				method: 'DELETE'
			});

			toast.push('Drill deleted successfully', {
				theme: { '--toastBackground': '#48bb78', '--toastColor': '#fff' }
			});

			// Navigate back to drills page
			goto('/drills');
		} catch (error) {
			console.error('Error deleting drill:', error);
			toast.push(`Failed to delete drill: ${error.message}`, {
				theme: { '--toastBackground': '#f56565', '--toastColor': '#fff' }
			});
		}
	}
</script>

<svelte:head>
	<title>{drill.name}</title>
	<meta name="description" content="Details of the selected drill" />
</svelte:head>

<Breadcrumb customSegments={[{ name: 'Drills', url: '/drills' }, { name: drill.name }]} />

<section class="max-w-4xl mx-auto px-4 py-8">
	<div class="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
		<div class="absolute top-4 right-4">
			<UpvoteDownvote drillId={drill.id} />
		</div>
		<h1 class="text-3xl font-bold mb-6 dark:text-white">{drill.name}</h1>
		<div class="flex justify-between items-center mb-6">
			<div class="flex space-x-4">
				<a
					href="/drills/create"
					class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-300"
				>
					Create New Drill
				</a>
				<button
					onclick={addDrillToPlan}
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
				>
					Add Drill to Plan
				</button>
				{#if dev || canEdit}
					<button
						onclick={handleDelete}
						class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300"
					>
						Delete Drill
					</button>
				{/if}
			</div>
		</div>

		<div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
			<p class="text-xl mb-4 dark:text-gray-200">{drill.brief_description}</p>

			<div class="flex justify-center space-x-4 mb-6">
				{#if canEdit}
					<a
						href="/drills/{page.params.id}/edit"
						class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
					>
						Edit Drill
					</a>
				{/if}
				{#if drill.variations?.length > 0 || drill.parent_drill_id}
					<button
						onclick={() => (showVariantModal = true)}
						class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 relative group"
						title="Link this drill as a variant of another similar drill"
					>
						Manage Variants
						<div
							class="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-normal sm:whitespace-nowrap max-w-[90vw] text-center"
						>
							Manage relationships with similar drills to help organize and link related content
						</div>
					</button>
				{:else}
					<button
						onclick={() => (showVariantModal = true)}
						class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 relative group"
						title="Link this drill as a variant of another similar drill"
					>
						Mark as Variant
						<div
							class="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-normal sm:whitespace-nowrap max-w-[90vw] text-center"
						>
							If this is very similar to another drill, you can set it to be a variant of that
							drill, which will link their pages and reduce the clutter on the main drills page
						</div>
					</button>
				{/if}
			</div>

			{#if (drill.variations?.length > 0 || drill.parent_drill_id) && (allVariants[drill.parent_drill_id || drill.id] || drill.related_variations)}
				<div class="mb-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
					<h3 class="text-lg font-semibold mb-3 dark:text-white">Drill Variations</h3>
					<div class="flex flex-wrap gap-2">
						{#if drill.parent_drill_id && drill.related_variations}
							<!-- Show variations when viewing a child drill -->
							{#each drill.related_variations as variation (variation.id)}
								<button
									onclick={() => switchVariant(variation.id)}
									class="px-4 py-2 rounded-full {currentDrillId === variation.id
										? 'bg-blue-500 text-white'
										: 'bg-white dark:bg-gray-600 border dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 dark:text-gray-200'}"
								>
									{variation.name}
									{#if variation.relationship === 'parent'}
										(Parent)
									{:else if variation.relationship === 'current'}
										(Current)
									{:else}
										(Variant)
									{/if}
								</button>
							{/each}
						{:else}
							<!-- Show parent drill first -->
							<button
								onclick={() => switchVariant(drill.parent_drill_id || drill.id)}
								class="px-4 py-2 rounded-full {currentDrillId ===
								(drill.parent_drill_id || drill.id)
									? 'bg-blue-500 text-white'
									: 'bg-white dark:bg-gray-600 border dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 dark:text-gray-200'}"
							>
								{drill.parent_drill_name || drill.name} (Parent)
							</button>

							<!-- Show all variants -->
							{#each allVariants[drill.parent_drill_id || drill.id].variations || [] as variation (variation.id)}
								<button
									onclick={() => switchVariant(variation.id)}
									class="px-4 py-2 rounded-full {currentDrillId === variation.id
										? 'bg-blue-500 text-white'
										: 'bg-white dark:bg-gray-600 border dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 dark:text-gray-200'}"
								>
									{variation.name} (Variant)
								</button>
							{/each}
						{/if}
					</div>
				</div>
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<div>
					<h2 class="text-lg font-semibold mb-2 dark:text-white">Drill Details</h2>
					<p class="dark:text-gray-200">
						<strong>Skill Levels:</strong>
						{drill.skill_level?.join(', ')}
					</p>
					<p class="dark:text-gray-200"><strong>Complexity:</strong> {drill.complexity}</p>
					<p class="dark:text-gray-200">
						<strong>Suggested Length:</strong>
						{#if drill.suggested_length_min !== null && drill.suggested_length_min !== undefined}
							{#if drill.suggested_length_max !== null && drill.suggested_length_max !== undefined && drill.suggested_length_max > drill.suggested_length_min}
								{drill.suggested_length_min} - {drill.suggested_length_max} minutes
							{:else}
								{drill.suggested_length_min} minutes
							{/if}
						{:else}
							N/A
						{/if}
					</p>
					<p class="dark:text-gray-200">
						<strong>Number of People:</strong>
						{drill.number_of_people_min} - {drill.number_of_people_max &&
						drill.number_of_people_max !== 0
							? drill.number_of_people_max
							: 'Any'}
					</p>
				</div>
				<div>
					<h2 class="text-lg font-semibold mb-2 dark:text-white">Focus Areas</h2>
					<p class="dark:text-gray-200">
						<strong>Skills:</strong>
						{Array.isArray(drill.skills_focused_on)
							? drill.skills_focused_on.join(', ')
							: typeof drill.skills_focused_on === 'string'
								? drill.skills_focused_on.split(', ').join(', ')
								: ''}
					</p>
					<p class="dark:text-gray-200">
						<strong>Positions:</strong>
						{Array.isArray(drill.positions_focused_on)
							? drill.positions_focused_on.join(', ')
							: typeof drill.positions_focused_on === 'string'
								? drill.positions_focused_on.split(', ').join(', ')
								: ''}
					</p>
				</div>
				<div>
					<h2 class="text-lg font-semibold mb-2 dark:text-white">Drill Types</h2>
					<p class="dark:text-gray-200">
						{Array.isArray(drill.drill_type) ? drill.drill_type.join(', ') : 'N/A'}
					</p>
				</div>
			</div>

			<div class="mb-6">
				<h2 class="text-lg font-semibold mb-2 dark:text-white">Detailed Description</h2>
				<div class="prose prose-sm sm:prose lg:prose-lg dark:prose-invert">
					{@html sanitizeHtml(drill.detailed_description)}
				</div>
			</div>

			{#if drill.video_link}
				<div class="mb-6">
					<h2 class="text-lg font-semibold mb-2 dark:text-white">Video</h2>
					<a
						href={drill.video_link}
						target="_blank"
						class="text-blue-500 hover:text-blue-700 transition duration-300">Watch Video</a
					>
				</div>
			{/if}

			{#if drill.images && drill.images.length > 0}
				<div class="mb-6">
					<h2 class="text-lg font-semibold mb-2 dark:text-white">Images</h2>
					<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
						{#each Array.isArray(drill.images) ? drill.images : [] as image, i (i)}
							<img src={image} alt="Drill Image" class="w-full h-48 object-cover rounded-lg" />
						{/each}
					</div>
				</div>
			{/if}

			{#if drill.diagrams && drill.diagrams.length > 0}
				<div>
					<h2 class="text-lg font-semibold mb-2 dark:text-white">Diagrams</h2>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#if drill.diagrams?.length > 0}
							{#each drill.diagrams as diagramData, index (index)}
								<!-- Removed unused 'key' directive -->
								<div class="border rounded-lg p-2">
									<h3 class="text-center font-medium mb-2 dark:text-gray-200">
										Diagram {index + 1}
									</h3>
									<ExcalidrawWrapper
										data={diagramData}
										id={`diagram-${drill.id}-${index}`}
										{index}
										viewOnly={true}
									/>
								</div>
							{/each}
						{/if}

						<!-- Fallback for old images array -->
						{#if !drill.diagrams?.length && Array.isArray(drill.images) && drill.images.length > 0}
							{#each drill.images as image, i (i)}
								<img
									src={image}
									alt="Drill diagram"
									class="w-full h-auto object-contain rounded-lg border"
								/>
							{/each}
						{/if}
					</div>
				</div>
				{/if}

				<div class="mb-6">
					<h2 class="text-lg font-semibold mb-2 dark:text-white">Comments</h2>
					<Comments drillId={page.params.id} />
				</div>
			</div>
		</div>

	{#if showVariantModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg w-full">
				<h2 class="text-xl font-bold mb-4 dark:text-white">Manage Variants</h2>

				<p class="text-gray-600 dark:text-gray-300 mb-6">
					Mark this drill as a variant if it's a modified version of another drill. This helps group
					related drills together, making them easier to find.
				</p>

				{#if drill.variation_count > 0}
					<div class="mb-6">
						<h3 class="font-semibold mb-2 dark:text-white">Variant Drills:</h3>
						<div class="space-y-2">
							{#each drill.variations as variation (variation.id)}
								<div class="flex items-center justify-between p-2 bg-gray-50 rounded">
									<span class="dark:text-gray-200">{variation.name}</span>
									<button
										onclick={() => removeVariantRelationship(variation.id)}
										class="text-red-500 hover:text-red-700"
									>
										Remove Variant
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if drill.parent_drill_id}
					<div class="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
						<h3 class="font-semibold mb-2 dark:text-white">Current Parent Drill:</h3>
						<p>{drill.parent_drill_name}</p>
						<button
							onclick={removeVariant}
							class="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
						>
							Remove Variant Status
						</button>
					</div>
				{/if}

				<div class="mt-4">
					<input
						type="text"
						bind:value={searchQuery}
						oninput={handleSearchInput}
						placeholder="Search for a new parent drill..."
						class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
					/>
				</div>

				{#if isSearching}
					<p>Searching...</p>
				{:else if searchResults.length > 0}
					<div class="max-h-60 overflow-y-auto mb-4">
						{#each searchResults as searchedDrill (searchedDrill.id)}
							<div
								class="flex items-center justify-between p-2 hover:bg-gray-100 {selectedDrill?.id ===
								searchedDrill.id
									? 'bg-blue-100'
									: ''}"
							>
								<span class="dark:text-gray-200">{searchedDrill.name}</span>
								<button
									onclick={() => {
										selectedDrill = searchedDrill;
										searchQuery = searchedDrill.name;
									}}
									class="text-blue-500 hover:text-blue-700"
								>
									Select
								</button>
							</div>
						{/each}
					</div>
				{:else if searchQuery}
					<p>No results found</p>
				{/if}

				{#if selectedDrill}
					<div class="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
						<h3 class="font-semibold mb-2 dark:text-white">Make "{drill.name}" the:</h3>
						<div class="space-y-2">
							<button
								onclick={() => (relationshipType = 'current-as-parent')}
								class="w-full text-left p-2 rounded {relationshipType === 'current-as-parent'
									? 'bg-blue-100'
									: 'hover:bg-gray-100'}"
							>
								Parent (of "{selectedDrill.name}")
							</button>
							<button
								onclick={() => (relationshipType = 'current-as-child')}
								class="w-full text-left p-2 rounded {relationshipType === 'current-as-child'
									? 'bg-blue-100'
									: 'hover:bg-gray-100'}"
							>
								Variant (of "{selectedDrill.name}")
							</button>
						</div>
					</div>
				{/if}

				<div class="mt-4 flex justify-end space-x-2">
					<button
						onclick={() => {
							showVariantModal = false;
							selectedDrill = null;
							relationshipType = null;
						}}
						class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
					>
						Cancel
					</button>
					<button
						onclick={setAsVariant}
						class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						disabled={!selectedDrill || !relationshipType}
					>
						Set Relationship
					</button>
				</div>
			</div>
		</div>
	{/if}
</section>

<style>
	.diagram-container {
		/* Set a fixed aspect ratio matching the CANVAS dimensions (500x600) */
		aspect-ratio: 5/6;
		width: 100%;
		max-width: 500px; /* Match CANVAS_WIDTH */
		margin: 0 auto; /* Center the container */
	}

	/* Make the container responsive but maintain aspect ratio */
	@media (max-width: 500px) {
		.diagram-container {
			width: 100%;
			max-width: none;
		}
	}
</style>
