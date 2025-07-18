<!-- src/routes/drills/+page.svelte -->
<script>
	import FilterPanel from '$lib/components/FilterPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { resetDrillFilters } from '$lib/stores/drillsStore';
	import { cart } from '$lib/stores/cartStore';
	import { onMount } from 'svelte';
	import { SvelteToast, toast } from '@zerodevx/svelte-toast';
	import { selectedSortOption, selectedSortOrder } from '$lib/stores/sortStore.js';
	import UpvoteDownvote from '$lib/components/UpvoteDownvote.svelte';
	import { dev } from '$app/environment';
	import { page } from '$app/stores';
	import { goto, invalidate } from '$app/navigation';
	import { navigating } from '$app/stores';
	import { FILTER_STATES } from '$lib/constants';
	import { apiFetch } from '$lib/utils/apiFetch.js';

	// Import only necessary stores (filter/sort state)
	import {
		currentPage,
		totalPages,
		drillsPerPage,
		searchQuery,
		selectedSkillLevels,
		selectedComplexities,
		selectedSkillsFocusedOn,
		selectedPositionsFocusedOn,
		selectedNumberOfPeopleMin,
		selectedNumberOfPeopleMax,
		selectedSuggestedLengthsMin,
		selectedSuggestedLengthsMax,
		selectedHasVideo,
		selectedHasDiagrams,
		selectedHasImages,
		selectedDrillTypes
	} from '$lib/stores/drillsStore';

	import Pagination from '$lib/components/Pagination.svelte';

	export let data;

	// Filter options from load
	$: filterOptions = data.filterOptions || {};

	// Object to hold temporary button states ('added', 'removed', or null)
	let buttonStates = {};

	// Reactive set of drill IDs currently in the cart
	$: drillsInCart = new Set($cart.map((d) => d.id));

	// Initialize buttonStates based on data.items
	$: {
		if (data && data.items) {
			buttonStates = data.items.reduce((acc, drill) => {
				// Keep existing state if present, otherwise initialize
				acc[drill.id] = buttonStates[drill.id] ?? (drillsInCart.has(drill.id) ? 'in-cart' : null);
				return acc;
			}, {});
		}
	}

	// Initialize filter stores from URL search params on mount or when URL changes
	$: {
		if ($page.url.searchParams) {
			const params = $page.url.searchParams;

			// Helper to parse comma-separated params into store object
			const parseCommaSeparatedToStore = (paramName, store) => {
				const values =
					params
						.get(paramName)
						?.split(',')
						.map((t) => t.trim())
						.filter((t) => t) || [];
				const newState = {};
				values.forEach((v) => {
					newState[v] = FILTER_STATES.REQUIRED;
				}); // Assume URL values mean REQUIRED
				store.set(newState);
			};

			// Helper to parse simple param into store
			const parseSimpleParamToStore = (
				paramName,
				store,
				defaultValue = null,
				parser = (v) => v
			) => {
				store.set(params.has(paramName) ? parser(params.get(paramName)) : defaultValue);
			};

			const parseBooleanParamToStore = (paramName, store) => {
				const value = params.get(paramName)?.toLowerCase();
				store.set(value === 'true' ? true : value === 'false' ? false : null);
			};

			parseCommaSeparatedToStore('skillLevel', selectedSkillLevels);
			parseCommaSeparatedToStore('complexity', selectedComplexities);
			parseCommaSeparatedToStore('skills', selectedSkillsFocusedOn);
			parseCommaSeparatedToStore('positions', selectedPositionsFocusedOn);
			parseCommaSeparatedToStore('types', selectedDrillTypes);

			parseSimpleParamToStore('minPeople', selectedNumberOfPeopleMin, null, parseInt);
			parseSimpleParamToStore('maxPeople', selectedNumberOfPeopleMax, null, parseInt);
			parseSimpleParamToStore('minLength', selectedSuggestedLengthsMin, null, parseInt);
			parseSimpleParamToStore('maxLength', selectedSuggestedLengthsMax, null, parseInt);
			parseSimpleParamToStore('q', searchQuery, '');

			parseBooleanParamToStore('hasVideo', selectedHasVideo);
			parseBooleanParamToStore('hasDiagrams', selectedHasDiagrams);
			parseBooleanParamToStore('hasImages', selectedHasImages);

			// Initialize sort stores
			selectedSortOption.set(params.get('sort') || 'date_created');
			selectedSortOrder.set(params.get('order') || 'desc');

			// Update pagination stores from data (might be slightly delayed vs URL, but reflects loaded data)
			currentPage.set(data.pagination?.page || 1);
			totalPages.set(data.pagination?.totalPages || 1);
			drillsPerPage.set(parseInt(params.get('limit') || '10'));
		}
	}

	// Functions to navigate pages
	let debounceTimer;
	function debounce(func, delay = 300) {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(func, delay);
	}

	function applyFiltersAndNavigate({ resetPage = false } = {}) {
		const params = new URLSearchParams(); // Start fresh

		// Pagination
		const pageToNavigate = resetPage ? 1 : $page.url.searchParams.get('page') || 1;
		params.set('page', pageToNavigate.toString());
		params.set('limit', $drillsPerPage.toString());

		// Sorting
		if ($selectedSortOption && $selectedSortOption !== 'date_created') {
			// Only add if not default
			params.set('sort', $selectedSortOption);
		}
		if ($selectedSortOrder && $selectedSortOrder !== 'desc') {
			// Only add if not default
			params.set('order', $selectedSortOrder);
		}

		// Filters
		// Helper to set params for comma-separated values from filter store objects
		const updateCommaSeparatedParam = (paramName, storeValue) => {
			const values = Object.entries(storeValue || {})
				.filter(([, state]) => state === FILTER_STATES.REQUIRED) // Only add REQUIRED filters to URL
				.map(([key]) => key);
			if (values.length > 0) {
				params.set(paramName, values.join(','));
			}
		};

		// Helper to set params for simple values (considering default)
		const updateSimpleParam = (paramName, value, defaultValue = undefined) => {
			if (value !== null && value !== undefined && value !== defaultValue) {
				params.set(paramName, value.toString());
			}
		};

		const updateBooleanParam = (paramName, value) => {
			if (value !== null) {
				// Add if true or false, ignore null
				params.set(paramName, value.toString());
			}
		};

		updateCommaSeparatedParam('skillLevel', $selectedSkillLevels);
		updateCommaSeparatedParam('complexity', $selectedComplexities);
		updateCommaSeparatedParam('skills', $selectedSkillsFocusedOn);
		updateCommaSeparatedParam('positions', $selectedPositionsFocusedOn);
		updateCommaSeparatedParam('types', $selectedDrillTypes);

		// Range params – only include if they differ from the defaults
		const defaultMinPeople = filterOptions.numberOfPeopleOptions?.min ?? 0;
		const defaultMaxPeople = filterOptions.numberOfPeopleOptions?.max ?? 100;
		const defaultMinLength = filterOptions.suggestedLengths?.min ?? 0;
		const defaultMaxLength = filterOptions.suggestedLengths?.max ?? 120;

		updateSimpleParam('minPeople', $selectedNumberOfPeopleMin, defaultMinPeople);
		updateSimpleParam('maxPeople', $selectedNumberOfPeopleMax, defaultMaxPeople);
		updateSimpleParam('minLength', $selectedSuggestedLengthsMin, defaultMinLength);
		updateSimpleParam('maxLength', $selectedSuggestedLengthsMax, defaultMaxLength);

		updateBooleanParam('hasVideo', $selectedHasVideo);
		updateBooleanParam('hasDiagrams', $selectedHasDiagrams);
		updateBooleanParam('hasImages', $selectedHasImages);

		// Pass null for searchQuery if it's empty to avoid adding '?q='
		updateSimpleParam('q', $searchQuery === '' ? null : $searchQuery);

		goto(`/drills?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	function handlePageChange(event) {
		const newPage = event.detail.page;
		if (newPage >= 1 && newPage <= (data.pagination?.totalPages || 1)) {
			const params = new URLSearchParams($page.url.searchParams);
			params.set('page', newPage.toString());
			goto(`/drills?${params.toString()}`, { keepFocus: true, noScroll: true });
		}
	}

	function handleSearchInput() {
		debounce(() => applyFiltersAndNavigate({ resetPage: true }));
	}

	function handleSortChange(event) {
		selectedSortOption.set(event.target.value);
		applyFiltersAndNavigate({ resetPage: true });
	}

	function toggleSortOrder() {
		selectedSortOrder.update((order) => (order === 'asc' ? 'desc' : 'asc'));
		applyFiltersAndNavigate({ resetPage: true });
	}

	// Function to handle adding/removing drills from the cart
	async function toggleDrillInCart(drill) {
		const isInCart = drillsInCart.has(drill.id);
		if (isInCart) {
			cart.removeDrill(drill.id);
			buttonStates = { ...buttonStates, [drill.id]: 'removed' };
		} else {
			cart.addDrill(drill);
			buttonStates = { ...buttonStates, [drill.id]: 'added' };
		}
		// No need for second buttonStates = { ...buttonStates };
		setTimeout(() => {
			// Update state based on actual cart status after timeout
			buttonStates = {
				...buttonStates,
				[drill.id]: $cart.some((d) => d.id === drill.id) ? 'in-cart' : null
			};
		}, 500);
	}

	import { slide } from 'svelte/transition';

	let showSortOptions = false;
	let sortOptionsRef;

	onMount(() => {
		const handleClickOutside = (event) => {
			if (sortOptionsRef && !sortOptionsRef.contains(event.target)) {
				showSortOptions = false;
			}
		};
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	function toggleSortOptions(event) {
		event.stopPropagation();
		showSortOptions = !showSortOptions;
	}

	async function deleteDrill(drillId, event) {
		event.stopPropagation();

		if (!confirm('Are you sure you want to delete this drill? This action cannot be undone.')) {
			return;
		}

		try {
			// Use apiFetch for the DELETE request
			await apiFetch(`/api/drills/${drillId}`, {
				method: 'DELETE'
			});

			// apiFetch throws on error, so if we get here, it was successful
			toast.push('Drill deleted successfully', {
				theme: { '--toastBackground': '#48bb78', '--toastColor': '#fff' }
			});

			// Invalidate the data to refresh the list
			invalidate('app:drills'); // Assuming you have a layout load function that depends on this
			// Alternatively, force a page reload or manually remove the item from the UI
			// data.items = data.items.filter(d => d.id !== drillId);
		} catch (error) {
			console.error('Error deleting drill:', error);
			toast.push(`Failed to delete drill: ${error.message}`, {
				theme: { '--toastBackground': '#f56565', '--toastColor': '#fff' }
			});
		}
	}

	// Define sort options for drills
	const sortOptions = [
		{ value: 'date_created', label: 'Date Created' },
		{ value: 'name', label: 'Name' },
		{ value: 'complexity', label: 'Complexity' },
		{ value: 'suggested_length', label: 'Suggested Length' }
	];

	// Determine if any filters are active
	$: hasFilters =
		$searchQuery ||
		Object.keys($selectedSkillLevels).length > 0 ||
		Object.keys($selectedComplexities).length > 0 ||
		Object.keys($selectedSkillsFocusedOn).length > 0 ||
		Object.keys($selectedPositionsFocusedOn).length > 0 ||
		$selectedNumberOfPeopleMin !== null ||
		$selectedNumberOfPeopleMax !== null ||
		$selectedSuggestedLengthsMin !== null ||
		$selectedSuggestedLengthsMax !== null ||
		$selectedHasVideo !== null ||
		$selectedHasDiagrams !== null ||
		$selectedHasImages !== null ||
		Object.keys($selectedDrillTypes).length > 0;

	function clearAllFilters() {
		resetDrillFilters();
		applyFiltersAndNavigate({ resetPage: true });
	}

	$: emptyStateActions = hasFilters
		? [
				{ label: 'Clear Filters', onClick: clearAllFilters, primary: true },
				{ label: 'Create New Drill', href: '/drills/create' }
			]
		: [
				{ label: 'Create Your First Drill', href: '/drills/create', primary: true },
				{ label: 'Browse All Drills', onClick: () => goto('/drills') }
			];
</script>

<svelte:head>
	<title>Drills - QDrill</title>
	<meta name="description" content="Browse and manage drills for your practice plans." />
</svelte:head>

<div class="max-w-7xl mx-auto p-4">
	<div class="flex justify-between items-center mb-4">
		<h1 class="text-3xl font-bold">Drills</h1>
		<div class="flex space-x-4">
			<a
				href="/drills/create"
				class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-300"
			>
				Create Drill
			</a>
			<a
				href="/practice-plans/create"
				class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-300"
			>
				Create Practice Plan with {$cart.length} Drill{$cart.length !== 1 ? 's' : ''}
			</a>
		</div>
	</div>

	<!-- Filter Panel -->
	<FilterPanel
		customClass="mb-6"
		filterType="drills"
		skillLevels={filterOptions.skillLevels}
		complexities={filterOptions.complexities}
		skillsFocusedOn={filterOptions.skillsFocusedOn}
		positionsFocusedOn={filterOptions.positionsFocusedOn}
		numberOfPeopleOptions={filterOptions.numberOfPeopleOptions}
		suggestedLengths={filterOptions.suggestedLengths}
		drillTypes={filterOptions.drillTypes}
		on:filterChange={() => applyFiltersAndNavigate({ resetPage: true })}
	/>

	<!-- Sorting Section and Search Input -->
	<div class="mb-6 flex items-center space-x-4">
		<div class="relative">
			<button
				class="px-4 py-2 bg-gray-100 rounded-lg shadow-sm hover:bg-gray-200 transition-colors duration-300 flex items-center"
				on:click={toggleSortOptions}
			>
				<span class="font-semibold mr-2">Sort</span>
				<span class="transform transition-transform duration-300" class:rotate-180={showSortOptions}
					>▼</span
				>
			</button>
			{#if showSortOptions}
				<div
					bind:this={sortOptionsRef}
					transition:slide={{ duration: 300 }}
					class="absolute left-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm z-10"
				>
					<div class="flex flex-col space-y-2">
						<select
							class="p-2 border border-gray-300 rounded-md bg-white"
							on:change={handleSortChange}
							value={$selectedSortOption}
							data-testid="sort-select"
						>
							{#each sortOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						<button
							class="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors duration-300"
							on:click={toggleSortOrder}
							data-testid="sort-order-toggle"
						>
							{$selectedSortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
						</button>
					</div>
				</div>
			{/if}
		</div>

		<input
			type="text"
			placeholder="Search drills..."
			class="flex-grow p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
			bind:value={$searchQuery}
			on:input={handleSearchInput}
			aria-label="Search drills"
			data-testid="search-input"
		/>
	</div>

	<!-- Loading and Empty States -->
	{#if $navigating && !data.items}
		<p class="text-center text-gray-500 py-10">Loading drills...</p>
	{:else if !data.items || data.items.length === 0}
		<EmptyState
			title={hasFilters ? 'No drills match your criteria' : 'No drills available'}
			description={hasFilters
				? "Try adjusting your search or filters to find what you're looking for."
				: 'Get started by creating your first drill or exploring our collection.'}
			icon="drills"
			actions={emptyStateActions}
			showSearchSuggestion={hasFilters}
		/>
	{:else}
		<!-- Drills Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.items as drill (drill.id)}
				<div
					class="border border-gray-200 bg-white rounded-lg shadow-md transition-transform transform hover:-translate-y-1 hover:shadow-lg flex flex-col"
					data-testid="drill-card"
				>
					<div class="p-6 flex flex-col h-full relative">
						<!-- Top-right actions: Vote and Delete -->
						<div class="absolute top-2 right-2 flex items-start space-x-2">
							<!-- Vote component -->
							<UpvoteDownvote drillId={drill.id} />

							<!-- Conditional Delete Button -->
							{#if dev || drill.created_by === $page.data.session?.user?.id}
								<button
									on:click={(e) => deleteDrill(drill.id, e)}
									class="text-gray-500 hover:text-red-500 transition-colors duration-300 p-1 rounded-full hover:bg-gray-100"
									title="Delete drill"
									aria-label="Delete drill"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							{/if}
						</div>

						<!-- Variation badges (moved slightly to avoid overlap if actions are wide) -->
						{#if drill.variation_count > 0}
							<div class="absolute top-2 left-2">
								<span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
									{drill.variation_count} variation{drill.variation_count !== 1 ? 's' : ''}
								</span>
							</div>
						{:else if drill.parent_drill_id}
							<div class="absolute top-2 left-2">
								<span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
									Variant
								</span>
							</div>
						{/if}

						<!-- Main content area -->
						<div class="flex-grow mb-4">
							<!-- Title and description -->
							<div class="flex justify-between items-start mb-4">
								<div class="flex-grow mr-16 min-w-0">
									<!-- Added mr-16 to give space for top-right actions -->
									<h2
										class="text-xl font-bold text-gray-800 overflow-hidden"
										data-testid="drill-card-name"
									>
										<a
											href="/drills/{drill.id}"
											class="hover:text-blue-600 block overflow-hidden truncate"
											title={drill.name}
										>
											{drill.name}
										</a>
									</h2>
									<div class="prose prose-sm mt-2 text-gray-600 max-h-24 overflow-hidden">
										{@html drill.brief_description}
									</div>
								</div>
							</div>

							<!-- Drill details -->
							{#if drill.skill_level && drill.skill_level.length > 0}
								<p class="text-sm text-gray-500 mt-2">
									<span class="font-medium">Skill:</span>
									{drill.skill_level.join(', ')}
								</p>
							{/if}
							{#if drill.complexity}
								<p class="text-sm text-gray-500 mt-1">
									<span class="font-medium">Complexity:</span>
									{drill.complexity}
								</p>
							{/if}
							{#if drill.suggested_length_min !== null && drill.suggested_length_min !== undefined}
								<p class="text-sm text-gray-500 mt-1" data-testid="drill-card-duration">
									<span class="font-medium">Duration:</span>
									{#if drill.suggested_length_max !== null && drill.suggested_length_max !== undefined && drill.suggested_length_max > drill.suggested_length_min}
										{drill.suggested_length_min} - {drill.suggested_length_max} mins
									{:else}
										{drill.suggested_length_min} mins
									{/if}
								</p>
							{/if}
							{#if drill.number_of_people_min !== undefined && drill.number_of_people_min !== null}
								<p class="text-sm text-gray-500 mt-1">
									<span class="font-medium">People:</span>
									{drill.number_of_people_min}
									{#if drill.number_of_people_max && drill.number_of_people_max !== drill.number_of_people_min}
										- {drill.number_of_people_max}
									{:else if !drill.number_of_people_max}
										+
									{/if}
								</p>
							{/if}
						</div>

						<!-- Add to Practice Plan button -->
						<div class="mt-auto">
							<button
								class="w-full py-2 px-4 rounded-md font-semibold text-white transition-colors duration-300"
								class:bg-green-500={buttonStates[drill.id] === 'added'}
								class:hover:bg-green-600={buttonStates[drill.id] === 'added'}
								class:bg-red-500={buttonStates[drill.id] === 'removed' ||
									buttonStates[drill.id] === 'in-cart'}
								class:hover:bg-red-600={buttonStates[drill.id] === 'removed' ||
									buttonStates[drill.id] === 'in-cart'}
								class:bg-blue-500={!drillsInCart.has(drill.id) &&
									buttonStates[drill.id] !== 'added' &&
									buttonStates[drill.id] !== 'removed' &&
									buttonStates[drill.id] !== 'in-cart'}
								class:hover:bg-blue-600={!drillsInCart.has(drill.id) &&
									buttonStates[drill.id] !== 'added' &&
									buttonStates[drill.id] !== 'removed' &&
									buttonStates[drill.id] !== 'in-cart'}
								on:click|stopPropagation={() => toggleDrillInCart(drill)}
							>
								{#if buttonStates[drill.id] === 'added'}
									Added
								{:else if buttonStates[drill.id] === 'removed'}
									Removed
								{:else if buttonStates[drill.id] === 'in-cart'}
									Remove from Plan
								{:else}
									Add to Plan
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination Controls -->
		{#if data.pagination && data.pagination.totalPages > 1}
			<Pagination
				currentPage={data.pagination.page}
				totalPages={data.pagination.totalPages}
				on:pageChange={handlePageChange}
			/>
		{/if}
	{/if}
</div>
<!-- Toast Notifications -->
<SvelteToast />
