<script>
	// import { onMount } from 'svelte'; // Removed
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
import { navigating } from '$app/stores';
import { onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import {
		formations,
		// filteredFormations, // Removed
		// fetchAllFormations, // Removed
		// isLoading, // Removed
		searchQuery,
		selectedTags,
		selectedFormationType,
		initializeFormations, // Added
		currentPage, // Added
		totalPages, // Added
		totalItems, // Added
		formationsPerPage, // Added
		selectedSortOption, // Added (from store)
		selectedSortOrder, // Added (from store)
		resetFormationFilters // Added helper
	} from '$lib/stores/formationsStore';
	import { slide } from 'svelte/transition'; // Keep for potential sort dropdown

	export let data;

	// Initialize data from load function
	$: initializeFormations(data);

	// REMOVED: searchInput local variable (use store directly)
	// REMOVED: tagsList and onMount logic fetching all and extracting tags

	// Filter options from load (Placeholder - implement in +page.server.js if needed)
	const filterOptions = data.filterOptions || { tags: [], types: ['offense', 'defense'] }; // Example structure

	// --- Navigation Logic ---

let debounceTimer;
let isNavigating = false;
const unsubNavigating = navigating.subscribe((v) => (isNavigating = !!v));
onDestroy(unsubNavigating);
	function debounce(func, delay = 300) {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(func, delay);
	}

	function applyFiltersAndNavigate({ resetPage = false } = {}) {
		const params = new URLSearchParams(window.location.search); // Start with existing

		// Pagination
		const pageToNavigate = resetPage ? 1 : $currentPage;
		params.set('page', pageToNavigate.toString());
		params.set('limit', $formationsPerPage.toString());

		// Sorting
		if ($selectedSortOption) {
			params.set('sort', $selectedSortOption);
		} else {
			params.delete('sort');
		}
		if ($selectedSortOrder) {
			params.set('order', $selectedSortOrder);
		} else {
			params.delete('order');
		}

		// Filters
		const activeTags = Object.entries($selectedTags || {})
			.filter(([, selected]) => selected)
			.map(([tag]) => tag);
		if (activeTags.length > 0) {
			params.set('tags', activeTags.join(','));
		} else {
			params.delete('tags');
		}

		if ($selectedFormationType) {
			params.set('type', $selectedFormationType);
		} else {
			params.delete('type');
		}

		if ($searchQuery) {
			params.set('q', $searchQuery);
		} else {
			params.delete('q');
		}

		goto(`/formations?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	// Update filter handlers to call navigation
	function handleSearchInput() {
		// searchQuery store is bound directly with bind:value
		debounce(() => applyFiltersAndNavigate({ resetPage: true }));
	}

	function handleTagToggle(tag) {
		selectedTags.update((tags) => ({ ...tags, [tag]: !tags[tag] }));
		applyFiltersAndNavigate({ resetPage: true });
	}

	function handleFormationTypeChange(type) {
		selectedFormationType.update((current) => (type === current ? null : type));
		applyFiltersAndNavigate({ resetPage: true });
	}

	function handleClearFilters() {
		resetFormationFilters(); // Use helper from store
		applyFiltersAndNavigate({ resetPage: true });
	}

	// Pagination Handlers
	function nextPage() {
		if ($currentPage < $totalPages) {
			currentPage.update((p) => p + 1);
			applyFiltersAndNavigate();
		}
	}

	function prevPage() {
		if ($currentPage > 1) {
			currentPage.update((p) => p - 1);
			applyFiltersAndNavigate();
		}
	}

	// --- Sort Controls ---
	let showSortOptions = false;
	let sortOptionsRef;
	const sortOptions = [
		{ value: 'created_at', label: 'Date Created' },
		{ value: 'name', label: 'Name' },
		{ value: 'formation_type', label: 'Type' }
	];

	function toggleSortOptions(event) {
		event.stopPropagation();
		showSortOptions = !showSortOptions;
	}

	function handleSortChange(event) {
		selectedSortOption.set(event.target.value);
		applyFiltersAndNavigate({ resetPage: true });
	}

	function toggleSortOrder() {
		selectedSortOrder.update((order) => (order === 'asc' ? 'desc' : 'asc'));
		applyFiltersAndNavigate({ resetPage: true });
	}
	// Close dropdown on click outside
	import { onMount } from 'svelte'; // Keep onMount for this

	onMount(() => {
		const handleClickOutside = (event) => {
			if (sortOptionsRef && !sortOptionsRef.contains(event.target)) {
				showSortOptions = false;
			}
		};
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});
</script>

<svelte:head>
	<title>Formations - QDrill</title>
	<meta name="description" content="Browse and search player formations for your team" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">Formations</h1>
			<p class="text-gray-600 mt-1">
				Offensive and defensive formations for half-court situations.
			</p>
		</div>
		<button
			class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
			on:click={() => goto('/formations/create')}
		>
			Create Formation
		</button>
	</div>

	<!-- Search & Filter Section -->
	<div class="bg-gray-50 rounded-lg p-6 mb-8">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 items-end">
			<!-- Search -->
			<div>
				<label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search</label>
				<div class="relative">
					<input
						id="search"
						type="text"
						bind:value={$searchQuery}
						on:input={handleSearchInput}
						placeholder="Search formations..."
						class="block w-full border border-gray-300 rounded-md py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						aria-label="Search formations"
						data-testid="search-input"
					/>
					<div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
						<svg
							class="h-5 w-5 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							></path>
						</svg>
					</div>
				</div>
			</div>
			<!-- Sort -->
			<div class="relative">
				<label id="sort-label" class="block text-sm font-medium text-gray-700 mb-1">Sort</label>
				<button
					aria-labelledby="sort-label"
					on:click={() => (sortDropdownOpen = !sortDropdownOpen)}
					class="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500"
				>
					<span class="font-medium"
						>{$selectedSortOption
							? sortOptions.find((o) => o.value === $selectedSortOption)?.label
							: 'Select Sort'} ({$selectedSortOrder === 'asc' ? 'Asc' : 'Desc'})</span
					>
					<span
						class="transform transition-transform duration-300"
						class:rotate-180={showSortOptions}>▼</span
					>
				</button>
				{#if showSortOptions}
					<div
						bind:this={sortOptionsRef}
						transition:slide={{ duration: 200 }}
						class="absolute right-0 mt-2 w-full p-4 bg-white border border-gray-200 rounded-lg shadow-xl z-20"
					>
						<div class="flex flex-col space-y-2">
							<select
								class="p-2 border border-gray-300 rounded-md bg-white w-full"
								on:change={handleSortChange}
								value={$selectedSortOption}
								aria-label="Sort by"
								data-testid="sort-select"
							>
								{#each sortOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
							<button
								class="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors duration-300 w-full"
								on:click={toggleSortOrder}
								aria-label="Toggle sort order"
								data-testid="sort-order-toggle"
							>
								{$selectedSortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Formation Type Filter -->
		<div class="mt-4" data-testid="filter-category-formationType">
			<h3 class="text-sm font-medium text-gray-700 mb-2">Filter by Type</h3>
			<div class="flex gap-2 flex-wrap">
				{#each filterOptions.types as typeOption (typeOption)}
					<button
						class="px-3 py-1 text-sm rounded-full border transition-colors"
						class:bg-blue-100={$selectedFormationType === typeOption}
						class:border-blue-300={$selectedFormationType === typeOption}
						class:text-blue-800={$selectedFormationType === typeOption}
						class:border-gray-300={$selectedFormationType !== typeOption}
						on:click={() => handleFormationTypeChange(typeOption)}
						data-testid={`checkbox-control-${typeOption.toLowerCase()}`}
					>
						{typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
					</button>
				{/each}
			</div>
		</div>

		<!-- Tag Filter (Use filterOptions.tags if available) -->
		{#if filterOptions.tags && filterOptions.tags.length > 0}
			<div class="mt-4" data-testid="filter-category-tags">
				<h3 class="text-sm font-medium text-gray-700 mb-2">Filter by Tags</h3>
				<div class="flex flex-wrap gap-2" data-testid="tag-select-box">
					<!-- Adjusted selector target for test simplicity -->
					{#each filterOptions.tags as tag (tag)}
						<button
							class="px-3 py-1 text-sm rounded-full border transition-colors"
							class:bg-blue-100={$selectedTags[tag]}
							class:border-blue-300={$selectedTags[tag]}
							class:text-blue-800={$selectedTags[tag]}
							class:border-gray-300={!$selectedTags[tag]}
							on:click={() => handleTagToggle(tag)}
							data-testid={`tag-${tag.toLowerCase()}`}
						>
							{tag}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Clear Filters Button -->
		<div class="mt-4 flex justify-end">
			<button class="text-sm text-blue-600 hover:text-blue-800" on:click={handleClearFilters}>
				Clear All Filters
			</button>
		</div>
	</div>

	<!-- Loading State -->
       {#if isNavigating}
               <div class="flex justify-center py-12">
                       <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
               </div>
		<!-- Empty State -->
	{:else if !$formations || $formations.length === 0}
		<div class="bg-white rounded-lg shadow-sm p-8 text-center">
			<h3 class="text-xl font-medium text-gray-800 mb-2">No formations found</h3>
			<p class="text-gray-600 mb-4">
				Try adjusting your search or filters, or create a new formation.
			</p>
			<button
				class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
				on:click={() => goto('/formations/create')}
			>
				Create Formation
			</button>
		</div>
		<!-- Formations Grid -->
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each $formations as formation (formation.id)}
				<!-- Iterate over $formations -->
				<a
					href="/formations/{formation.id}"
					data-testid="formation-card"
					class="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					<div class="p-6">
						<h2
							data-testid="formation-card-name"
							class="text-xl font-semibold text-gray-800 mb-2 truncate"
							title={formation.name}
						>
							{formation.name}
						</h2>
						{#if formation.brief_description}
							<p class="text-gray-600 mb-4 line-clamp-3 text-sm">{formation.brief_description}</p>
						{/if}

						<!-- Tags -->
						{#if formation.tags && formation.tags.length > 0}
							<div class="flex flex-wrap gap-1.5 mt-2 mb-4">
								{#each formation.tags.slice(0, 3) as tag}
									<!-- Limit displayed tags -->
									<span
										class="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200"
									>
										{tag}
									</span>
								{/each}
								{#if formation.tags.length > 3}
									<span
										class="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200"
									>
										+ {formation.tags.length - 3} more
									</span>
								{/if}
							</div>
						{/if}

						<!-- Metadata -->
						<div
							class="flex items-center justify-between mt-auto text-xs text-gray-500 border-t border-gray-100 pt-3"
						>
							<span data-testid="formation-card-type"
								>Type: {formation.formation_type || 'N/A'}</span
							>
							<span data-testid="formation-card-date"
								>{new Date(formation.created_at).toLocaleDateString()}</span
							>
							<!-- {#if formation.created_by}<span>By {formation.created_by}</span>{/if} -->
						</div>
					</div>
				</a>
			{/each}
		</div>

		<!-- Pagination Controls -->
		{#if $totalPages > 1}
			<div
				class="flex justify-center items-center mt-8 space-x-4"
				data-testid="pagination-controls"
			>
				<button
					on:click={prevPage}
                               disabled={$currentPage === 1 || isNavigating}
					class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors duration-300"
					data-testid="pagination-prev-button"
				>
					Previous
				</button>
				<span class="text-gray-700" data-testid="pagination-current-page"
					>Page {$currentPage} of {$totalPages}</span
				>
				<button
					on:click={nextPage}
                               disabled={$currentPage === $totalPages || isNavigating}
					class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors duration-300"
					data-testid="pagination-next-button"
				>
					Next
				</button>
			</div>
		{/if}
	{/if}
</div>
