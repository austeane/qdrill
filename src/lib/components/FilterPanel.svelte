<script>
import RangeSlider from 'svelte-range-slider-pips';
import Spinner from '$lib/components/Spinner.svelte';
import { createLoadingState } from '$lib/utils/loadingStates.js';
import {
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
		searchQuery,
		selectedDrillTypes
	} from '$lib/stores/drillsStore';
	import { createEventDispatcher, onMount } from 'svelte';
	import { selectedSortOption, selectedSortOrder } from '$lib/stores/sortStore';
	import { writable } from 'svelte/store';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import ThreeStateCheckbox from '$lib/components/ThreeStateCheckbox.svelte';
	import { FILTER_STATES } from '$lib/constants';
	import {
		selectedPhaseOfSeason,
		selectedPracticeGoals,
		selectedEstimatedParticipantsMin,
		selectedEstimatedParticipantsMax,
		updateFilterState as updatePracticePlanFilterState
	} from '$lib/stores/practicePlanFilterStore';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import debounce from 'lodash/debounce';
	import { Plus, Minus, Search } from 'lucide-svelte';

       const dispatch = createEventDispatcher();

       const filterApplying = createLoadingState();

	export let customClass = '';
	export let filterType = 'drills'; // New prop to determine filter context
	export let selectedDrills = [];
	export let onDrillSelect = () => {};
	export let onDrillRemove = () => {};

	// Drills Filters
	export let skillLevels = [];
	export let complexities = [];
	export let skillsFocusedOn = [];
	export let positionsFocusedOn = [];
	export let numberOfPeopleOptions = { min: 0, max: 100 };
	export let suggestedLengths = { min: 0, max: 120 };

	// Practice Plans Filters
	export let phaseOfSeasonOptions = [];
	export let practiceGoalsOptions = [];

	// Toggle states for drill filters
	let showSkillLevels = false;
	let showDrillComplexity = false;
	let showSkillsFocusedOn = false;
	let showPositionsFocusedOn = false;
	let showNumberOfPeople = false;
	let showSuggestedLengths = false;
	let showHasImages = false;
	let showDrillTypes = false;

	// Toggle states for practice plans filters
	let showPhaseOfSeason = false;
	let showPracticeGoals = false;
	let showEstimatedParticipants = false;
	let showContainsDrill = false;

	// Provide safe defaults in case props are undefined
	const fallbackNumberOfPeople = { min: 0, max: 100 };
	const fallbackSuggestedLengths = { min: 0, max: 120 };

	// Effective options (merge prop with fallback)
	$: effectiveNumberOfPeopleOptions = {
		min: numberOfPeopleOptions?.min ?? fallbackNumberOfPeople.min,
		max: numberOfPeopleOptions?.max ?? fallbackNumberOfPeople.max
	};

	$: effectiveSuggestedLengths = {
		min: suggestedLengths?.min ?? fallbackSuggestedLengths.min,
		max: suggestedLengths?.max ?? fallbackSuggestedLengths.max
	};

	// Set up variables for the sliders
	let numberOfPeopleRange = [$selectedNumberOfPeopleMin, $selectedNumberOfPeopleMax];
	let suggestedLengthsRange = [$selectedSuggestedLengthsMin, $selectedSuggestedLengthsMax];
	let estimatedParticipantsRange = [1, 100];

	// Variables for Contains Drill filter
	let drillSearchTerm = '';
	let drillSuggestions = [];

	let mounted = false;

       onMount(() => {
               mounted = true;
               // Initialize slider ranges from store values in case they were loaded from URL
               numberOfPeopleRange = [
                       $selectedNumberOfPeopleMin ?? effectiveNumberOfPeopleOptions.min,
                       $selectedNumberOfPeopleMax ?? effectiveNumberOfPeopleOptions.max
               ];
               suggestedLengthsRange = [
                       $selectedSuggestedLengthsMin ?? effectiveSuggestedLengths.min,
                       $selectedSuggestedLengthsMax ?? effectiveSuggestedLengths.max
               ];
       });

       function triggerFilterChange() {
               filterApplying.start();
               dispatch('filterChange');
               setTimeout(() => filterApplying.stop(), 1000);
       }

	// Function to reset all filters
	function resetFilters() {
		selectedSkillLevels.set({});
		selectedComplexities.set({});
		selectedSkillsFocusedOn.set({});
		selectedPositionsFocusedOn.set({});
		selectedNumberOfPeopleMin.set(effectiveNumberOfPeopleOptions.min);
		selectedNumberOfPeopleMax.set(effectiveNumberOfPeopleOptions.max);
		selectedSuggestedLengthsMin.set(effectiveSuggestedLengths.min);
		selectedSuggestedLengthsMax.set(effectiveSuggestedLengths.max);
		selectedHasVideo.set(null);
		selectedHasDiagrams.set(null);
		selectedHasImages.set(null);
		selectedDrillTypes.set({});

		// Reset local slider state
		numberOfPeopleRange = [effectiveNumberOfPeopleOptions.min, effectiveNumberOfPeopleOptions.max];
		suggestedLengthsRange = [effectiveSuggestedLengths.min, effectiveSuggestedLengths.max];

		if (filterType === 'practice-plans') {
			selectedPhaseOfSeason.set({});
			selectedPracticeGoals.set({});
			selectedEstimatedParticipantsMin.set(1);
			selectedEstimatedParticipantsMax.set(100);
			selectedDrills = [];
		}
               closeAllFilters();
               triggerFilterChange();
       }

	// Function to handle toggling filters
	function toggleFilter(filterName) {
		console.log(`[FilterPanel] toggleFilter called with: ${filterName}`);

		let isCurrentlyOpen = false;
		// Check the current state of the filter being toggled
		switch (filterName) {
			case 'skillLevels':
				isCurrentlyOpen = showSkillLevels;
				break;
			case 'drillComplexity':
				isCurrentlyOpen = showDrillComplexity;
				break;
			case 'skillsFocusedOn':
				isCurrentlyOpen = showSkillsFocusedOn;
				break;
			case 'positionsFocusedOn':
				isCurrentlyOpen = showPositionsFocusedOn;
				break;
			case 'numberOfPeople':
				isCurrentlyOpen = showNumberOfPeople;
				break;
			case 'suggestedLengths':
				isCurrentlyOpen = showSuggestedLengths;
				break;
			case 'hasImages':
				isCurrentlyOpen = showHasImages;
				break;
			case 'drillTypes':
				isCurrentlyOpen = showDrillTypes;
				break;
			case 'phaseOfSeason':
				if (filterType === 'practice-plans') isCurrentlyOpen = showPhaseOfSeason;
				break;
			case 'practiceGoals':
				if (filterType === 'practice-plans') isCurrentlyOpen = showPracticeGoals;
				break;
			case 'estimatedParticipants':
				if (filterType === 'practice-plans') isCurrentlyOpen = showEstimatedParticipants;
				break;
			case 'containsDrill':
				if (filterType === 'practice-plans') isCurrentlyOpen = showContainsDrill;
				break;
		}

		console.log(
			`[FilterPanel] isCurrentlyOpen before: ${isCurrentlyOpen}, showSkillLevels before: ${showSkillLevels}`
		);
		// Always close all filters first
		closeAllFilters();
		console.log(`[FilterPanel] After closeAllFilters, showSkillLevels: ${showSkillLevels}`);

		// If the target filter wasn't the one that was open, open it now.
		if (!isCurrentlyOpen) {
			switch (filterName) {
				case 'skillLevels':
					showSkillLevels = true;
					break;
				case 'drillComplexity':
					showDrillComplexity = true;
					break;
				case 'skillsFocusedOn':
					showSkillsFocusedOn = true;
					break;
				case 'positionsFocusedOn':
					showPositionsFocusedOn = true;
					break;
				case 'numberOfPeople':
					showNumberOfPeople = true;
					break;
				case 'suggestedLengths':
					showSuggestedLengths = true;
					break;
				case 'hasImages':
					showHasImages = true;
					break;
				case 'drillTypes':
					showDrillTypes = true;
					break;
				case 'phaseOfSeason':
					if (filterType === 'practice-plans') showPhaseOfSeason = true;
					break;
				case 'practiceGoals':
					if (filterType === 'practice-plans') showPracticeGoals = true;
					break;
				case 'estimatedParticipants':
					if (filterType === 'practice-plans') showEstimatedParticipants = true;
					break;
				case 'containsDrill':
					if (filterType === 'practice-plans') showContainsDrill = true;
					break;
			}
		}
		console.log(`[FilterPanel] At end of toggleFilter, showSkillLevels: ${showSkillLevels}`);
		// If it *was* open, closeAllFilters() already handled closing it.
	}

	function closeAllFilters() {
		// Close Drills Filters
		showSkillLevels = false;
		showDrillComplexity = false;
		showSkillsFocusedOn = false;
		showPositionsFocusedOn = false;
		showNumberOfPeople = false;
		showSuggestedLengths = false;
		showHasImages = false;
		showDrillTypes = false;

		// Close Practice Plans Filters
		showPhaseOfSeason = false;
		showPracticeGoals = false;
		showEstimatedParticipants = false;
		showContainsDrill = false;
	}

	function handleClickOutside(event) {
		// Close all filters if clicking outside
		closeAllFilters();
	}

	// Prevent click events from propagating to the overlay
	function handleCheckboxClick(event) {
		event.stopPropagation();
	}

	// Handle Escape key to close all filters
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			closeAllFilters();
		}
	}

	// Reactive statements to initialize selectedSuggestedLengthsMin and Max
	$: if (effectiveSuggestedLengths.min != null && $selectedSuggestedLengthsMin === 0) {
		selectedSuggestedLengthsMin.set(effectiveSuggestedLengths.min);
	}

	$: if (effectiveSuggestedLengths.max != null && $selectedSuggestedLengthsMax === 120) {
		selectedSuggestedLengthsMax.set(effectiveSuggestedLengths.max);
	}

	// Subscribe to Practice Plans Filters if needed

	// Fetch drill suggestions
	async function fetchDrillSuggestions() {
		if (!mounted) return; // Ensure client-side execution
		try {
			const queryParam =
				drillSearchTerm.trim() === '' ? '' : `?query=${encodeURIComponent(drillSearchTerm)}`;
			const drills = await apiFetch(`/api/drills/search${queryParam}`);
			drillSuggestions = drills.filter((drill) => !selectedDrills.some((d) => d.id === drill.id));
		} catch (error) {
			console.error(error);
		}
	}

	const debouncedFetchDrillSuggestions = debounce(fetchDrillSuggestions, 300);

	function addDrillToSelected(drill) {
		onDrillSelect(drill);
		drillSearchTerm = '';
		drillSuggestions = [];
	}

	function removeDrillFromSelected(drillId) {
		onDrillRemove(drillId);
	}

	export let drillTypes = [];

	function toggleDrillTypeState(type, newState) {
		selectedDrillTypes.update((selected) => {
			const updated = { ...selected };
			if (newState === FILTER_STATES.NEUTRAL) {
				delete updated[type];
			} else {
				updated[type] = newState;
			}
			return updated;
		});
               triggerFilterChange();
       }

	// Helper function for updating DRILL filter states
	function updateFilterState(store) {
		return (value, newState) => {
			store.update((current) => {
				const updated = { ...current };
				if (newState === FILTER_STATES.NEUTRAL) {
					delete updated[value];
				} else {
					updated[value] = newState;
				}
				return updated;
			});
                       triggerFilterChange();
               };
       }

	// Create update handlers for each filter type
	const updateSkillLevel = updateFilterState(selectedSkillLevels);
	const updateComplexity = updateFilterState(selectedComplexities);
	const updateSkillsFocused = updateFilterState(selectedSkillsFocusedOn);
	const updatePositionsFocused = updateFilterState(selectedPositionsFocusedOn);
	const updatePhaseOfSeason = updatePracticePlanFilterState(selectedPhaseOfSeason);
	const updatePracticeGoals = updatePracticePlanFilterState(selectedPracticeGoals);

	// Add handlers for estimated participants changes
	function handleEstimatedParticipantsChange(event) {
		selectedEstimatedParticipantsMin.set(estimatedParticipantsRange[0]);
		selectedEstimatedParticipantsMax.set(estimatedParticipantsRange[1]);
               triggerFilterChange();
       }

	// Update the range slider handlers
	function handleNumberOfPeopleChange(event) {
		selectedNumberOfPeopleMin.set(numberOfPeopleRange[0]);
		selectedNumberOfPeopleMax.set(numberOfPeopleRange[1]);
               triggerFilterChange();
       }

	function handleSuggestedLengthsChange(event) {
		selectedSuggestedLengthsMin.set(suggestedLengthsRange[0]);
		selectedSuggestedLengthsMax.set(suggestedLengthsRange[1]);
               triggerFilterChange();
       }

	let skillsSearchTerm = '';

	$: filteredSkills = (skillsFocusedOn || [])
		.map((skill) => (typeof skill === 'object' ? skill.skill : skill))
		.filter(
			(skill, index, self) =>
				// Remove duplicates
				self.indexOf(skill) === index &&
				// Filter by search term
				skill.toLowerCase().includes(skillsSearchTerm.toLowerCase())
		);

	// Helper function to subscribe to multiple stores
	function subscribe(stores, callback) {
		const unsubscribes = stores.map((store) => store.subscribe(() => callback()));
		return () => unsubscribes.forEach((unsub) => unsub());
	}

	// Helper to toggle tri‑state boolean filters (null → true → false → null)
	function toggleBooleanFilter(store) {
               store.update((current) => (current === null ? true : current === true ? false : null));
               triggerFilterChange();
       }

	function toggleHasVideo() {
		toggleBooleanFilter(selectedHasVideo);
	}

	function toggleHasDiagrams() {
		toggleBooleanFilter(selectedHasDiagrams);
	}

	function toggleHasImages() {
		toggleBooleanFilter(selectedHasImages);
	}
</script>

<!-- Filter Buttons -->
<div class={`flex flex-wrap gap-2 mb-4 relative ${customClass}`} on:keydown={handleKeydown}>
       {#if $filterApplying}
               <div class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
                       <div class="flex items-center space-x-2">
                               <Spinner size="sm" color="blue" />
                               <span class="text-sm text-gray-600">Applying filters...</span>
                       </div>
               </div>
       {/if}
	<!-- Drills Filters -->
	{#if filterType === 'drills' && (skillLevels.length || complexities.length || skillsFocusedOn.length || positionsFocusedOn.length || numberOfPeopleOptions.min !== null || numberOfPeopleOptions.max !== null || suggestedLengths.min !== null || suggestedLengths.max !== null || $selectedHasVideo || $selectedHasDiagrams || $selectedHasImages)}
		<!-- Skill Levels Filter -->
		{#if skillLevels.length}
			<div class="relative">
				<button
					class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showSkillLevels ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
					on:click={() => toggleFilter('skillLevels')}
					aria-expanded={showSkillLevels}
					aria-controls="skillLevels-content"
					data-testid="filter-category-skillLevels"
				>
					Skill Levels
					{#if Object.keys($selectedSkillLevels).length > 0}
						<span
							class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2"
						>
							({Object.keys($selectedSkillLevels).length})
						</span>
					{/if}
				</button>

				{#if showSkillLevels}
					<div
						id="skillLevels-content"
						class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
						on:click|stopPropagation
						role="menu"
						tabindex="0"
					>
						{#each skillLevels as level}
							{@const currentState = $selectedSkillLevels[level] || FILTER_STATES.NEUTRAL}
							<ThreeStateCheckbox
								value={level}
								state={currentState}
								label={level}
								onChange={updateSkillLevel}
							/>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Complexity Filter -->
		{#if complexities.length}
			<div class="relative">
				<button
					class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showDrillComplexity ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
					on:click={() => toggleFilter('drillComplexity')}
					aria-expanded={showDrillComplexity}
					aria-controls="drillComplexity-content"
				>
					Complexity
					{#if Object.keys($selectedComplexities).length > 0}
						<span
							class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2"
						>
							({Object.keys($selectedComplexities).length})
						</span>
					{/if}
				</button>

				{#if showDrillComplexity}
					<div
						id="drillComplexity-content"
						class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
						on:click|stopPropagation
						role="menu"
						tabindex="0"
					>
						{#each complexities as complexity}
							{@const currentState = $selectedComplexities[complexity] || FILTER_STATES.NEUTRAL}
							<ThreeStateCheckbox
								value={complexity}
								state={currentState}
								label={complexity}
								onChange={updateComplexity}
							/>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Skills Focused On Filter -->
		{#if skillsFocusedOn.length}
			<div class="relative">
				<button
					class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showSkillsFocusedOn ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
					on:click={() => toggleFilter('skillsFocusedOn')}
					aria-expanded={showSkillsFocusedOn}
					aria-controls="skillsFocusedOn-content"
				>
					Skills Focused On
					{#if Object.keys($selectedSkillsFocusedOn).length > 0}
						<span
							class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2"
						>
							({Object.keys($selectedSkillsFocusedOn).length})
						</span>
					{/if}
				</button>

				{#if showSkillsFocusedOn}
					<div
						id="skillsFocusedOn-content"
						class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
						on:click|stopPropagation
						role="menu"
						tabindex="0"
					>
						<input
							type="text"
							placeholder="Search skills..."
							class="w-full p-2 border border-gray-300 rounded-md mb-2"
							bind:value={skillsSearchTerm}
						/>
						{#each filteredSkills as skill}
							{@const skillValue = typeof skill === 'object' ? skill.skill : skill}
							{@const currentState = $selectedSkillsFocusedOn[skillValue] || FILTER_STATES.NEUTRAL}
							<ThreeStateCheckbox
								value={skillValue}
								state={currentState}
								label={skillValue}
								onChange={updateSkillsFocused}
							/>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Positions Focused On Filter -->
		{#if positionsFocusedOn.length}
			<div class="relative">
				<button
					class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showPositionsFocusedOn ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
					on:click={() => toggleFilter('positionsFocusedOn')}
					aria-expanded={showPositionsFocusedOn}
					aria-controls="positionsFocusedOn-content"
				>
					Positions Focused On
					{#if Object.keys($selectedPositionsFocusedOn).length > 0}
						<span
							class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2"
						>
							({Object.keys($selectedPositionsFocusedOn).length})
						</span>
					{/if}
				</button>

				{#if showPositionsFocusedOn}
					<div
						id="positionsFocusedOn-content"
						class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
						on:click|stopPropagation
						role="menu"
						tabindex="0"
					>
						{#each positionsFocusedOn as position}
							{@const currentState = $selectedPositionsFocusedOn[position] || FILTER_STATES.NEUTRAL}
							<ThreeStateCheckbox
								value={position}
								state={currentState}
								label={position}
								onChange={updatePositionsFocused}
							/>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Number of Participants Filter -->
		<div class="relative">
			<button
				class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showNumberOfPeople ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
				on:click={() => toggleFilter('numberOfPeople')}
				aria-expanded={showNumberOfPeople}
				aria-controls="numberOfPeople-content"
			>
				Number of Participants
				<span class="ml-2 text-sm font-semibold">
					{$selectedNumberOfPeopleMin === effectiveNumberOfPeopleOptions.min
						? 'Any'
						: $selectedNumberOfPeopleMin} - {$selectedNumberOfPeopleMax ===
					effectiveNumberOfPeopleOptions.max
						? 'Any'
						: $selectedNumberOfPeopleMax}
				</span>
			</button>

			{#if showNumberOfPeople}
				<div
					id="numberOfPeople-content"
					class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg z-10 w-64"
					on:click|stopPropagation
					role="menu"
					tabindex="0"
				>
					<label class="block text-sm font-medium text-gray-700 mb-2">Participants Range</label>
					<RangeSlider
						bind:values={numberOfPeopleRange}
						min={effectiveNumberOfPeopleOptions.min ?? 0}
						max={effectiveNumberOfPeopleOptions.max ?? 100}
						step={1}
						float
						pips
						first="label"
						last="label"
						rest={false}
						hoverable
						on:change={handleNumberOfPeopleChange}
					/>
					<div class="text-center mt-2 text-sm font-medium text-gray-700">
						Current: {numberOfPeopleRange[0]} - {numberOfPeopleRange[1]}
					</div>
				</div>
			{/if}
		</div>

		<!-- Suggested Lengths Filter -->
		<div class="relative">
			<button
				class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showSuggestedLengths ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
				on:click={() => toggleFilter('suggestedLengths')}
				aria-expanded={showSuggestedLengths}
				aria-controls="suggestedLengths-content"
			>
				Suggested Lengths
				<span class="ml-2 text-sm font-semibold">
					<!-- Debug Log -->
					{#if ($selectedSuggestedLengthsMin === null || $selectedSuggestedLengthsMin === effectiveSuggestedLengths.min) && ($selectedSuggestedLengthsMax === null || $selectedSuggestedLengthsMax === effectiveSuggestedLengths.max)}
						Any Length
					{:else if $selectedSuggestedLengthsMin === null || $selectedSuggestedLengthsMin === effectiveSuggestedLengths.min}
						Up to {$selectedSuggestedLengthsMax} mins
					{:else if $selectedSuggestedLengthsMax === null || $selectedSuggestedLengthsMax === effectiveSuggestedLengths.max}
						{$selectedSuggestedLengthsMin}+ mins
					{:else}
						{$selectedSuggestedLengthsMin}-{$selectedSuggestedLengthsMax} mins
					{/if}
				</span>
			</button>

			{#if showSuggestedLengths}
				<div
					id="suggestedLengths-content"
					class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg z-10 w-64"
					on:click|stopPropagation
					role="menu"
					tabindex="0"
				>
					<label class="block text-sm font-medium text-gray-700 mb-2">Length Range (mins)</label>
					<RangeSlider
						bind:values={suggestedLengthsRange}
						min={effectiveSuggestedLengths.min}
						max={effectiveSuggestedLengths.max}
						step={5}
						float
						pips
						all="label"
						first="label"
						last="label"
						rest="pip"
						pipstep={15}
						on:change={handleSuggestedLengthsChange}
					/>
				</div>
			{/if}
		</div>
		<!-- Has Video Filter -->
		<div class="relative">
			<button
				class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 
                   ${$selectedHasVideo === true ? 'bg-blue-500 text-white' : $selectedHasVideo === false ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
				on:click={toggleHasVideo}
				aria-pressed={$selectedHasVideo === true
					? 'true'
					: $selectedHasVideo === false
						? 'mixed'
						: 'false'}
			>
				Has Video {$selectedHasVideo === true ? '(Yes)' : $selectedHasVideo === false ? '(No)' : ''}
			</button>
		</div>

		<!-- Has Diagrams Filter -->
		<div class="relative">
			<button
				class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 
                   ${$selectedHasDiagrams === true ? 'bg-blue-500 text-white' : $selectedHasDiagrams === false ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
				on:click={toggleHasDiagrams}
				aria-pressed={$selectedHasDiagrams === true
					? 'true'
					: $selectedHasDiagrams === false
						? 'mixed'
						: 'false'}
			>
				Has Diagrams {$selectedHasDiagrams === true
					? '(Yes)'
					: $selectedHasDiagrams === false
						? '(No)'
						: ''}
			</button>
		</div>

		<!-- Has Images Filter -->
		<div class="relative">
			<button
				class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 
                   ${$selectedHasImages === true ? 'bg-blue-500 text-white' : $selectedHasImages === false ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
				on:click={toggleHasImages}
				aria-pressed={$selectedHasImages === true
					? 'true'
					: $selectedHasImages === false
						? 'mixed'
						: 'false'}
			>
				Has Images {$selectedHasImages === true
					? '(Yes)'
					: $selectedHasImages === false
						? '(No)'
						: ''}
			</button>
		</div>

		<!-- Drill Types Filter -->
		{#if drillTypes && drillTypes.length > 0}
			<div class="relative">
				<button
					class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showDrillTypes ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
					on:click={() => toggleFilter('drillTypes')}
					aria-expanded={showDrillTypes}
					aria-controls="drillTypes-content"
				>
					Drill Types
					{#if Object.keys($selectedDrillTypes).length > 0}
						<span
							class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2"
						>
							({Object.keys($selectedDrillTypes).length})
						</span>
					{/if}
				</button>

				{#if showDrillTypes}
					<div
						id="drillTypes-content"
						class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
						on:click|stopPropagation
						role="menu"
						tabindex="0"
					>
						{#each drillTypes as type}
							{@const currentState = $selectedDrillTypes[type] || FILTER_STATES.NEUTRAL}
							<ThreeStateCheckbox
								value={type}
								state={currentState}
								label={type}
								onChange={toggleDrillTypeState}
							/>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Reset Filters Button (Always visible) -->
		<button
			class="inline-flex items-center bg-red-500 text-white border border-red-600 rounded-full px-4 py-2 cursor-pointer hover:bg-red-600 transition-colors duration-300"
			on:click={resetFilters}
		>
			Reset Filters
		</button>
	{/if}

	<!-- Practice Plans Filters -->
	{#if filterType === 'practice-plans' && (phaseOfSeasonOptions.length || practiceGoalsOptions.length || selectedEstimatedParticipantsMin !== null || selectedEstimatedParticipantsMax !== null)}
		<!-- Phase of Season Filter -->
		{#if phaseOfSeasonOptions.length}
			<div class="relative">
				<button
					class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showPhaseOfSeason ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
					on:click={() => toggleFilter('phaseOfSeason')}
					aria-expanded={showPhaseOfSeason}
					aria-controls="phaseOfSeason-content"
				>
					Phase of Season
					{#if Object.keys($selectedPhaseOfSeason).length > 0}
						<span
							class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2"
						>
							({Object.keys($selectedPhaseOfSeason).length})
						</span>
					{/if}
				</button>

				{#if showPhaseOfSeason}
					<div
						id="phaseOfSeason-content"
						class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
						on:click|stopPropagation
						role="menu"
						tabindex="0"
					>
						{#each phaseOfSeasonOptions as phase}
							<ThreeStateCheckbox
								value={phase}
								state={$selectedPhaseOfSeason[phase] || FILTER_STATES.NEUTRAL}
								label={phase}
								onChange={updatePhaseOfSeason}
							/>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Practice Goals Filter -->
		{#if practiceGoalsOptions.length}
			<div class="relative">
				<button
					class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showPracticeGoals ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
					on:click={() => toggleFilter('practiceGoals')}
					aria-expanded={showPracticeGoals}
					aria-controls="practiceGoals-content"
				>
					Practice Goals
					{#if selectedPracticeGoals.length > 0}
						<span
							class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2"
						>
							({selectedPracticeGoals.length})
						</span>
					{/if}
				</button>

				{#if showPracticeGoals}
					<div
						id="practiceGoals-content"
						class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
						on:click|stopPropagation
						role="menu"
						tabindex="0"
					>
						{#each practiceGoalsOptions as goal}
							<ThreeStateCheckbox
								value={goal}
								state={$selectedPracticeGoals[goal] || FILTER_STATES.NEUTRAL}
								label={goal}
								onChange={updatePracticeGoals}
							/>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Estimated Participants Filter -->
		<div class="relative">
			<button
				class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showEstimatedParticipants ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
				on:click={() => toggleFilter('estimatedParticipants')}
				aria-expanded={showEstimatedParticipants}
				aria-controls="estimatedParticipants-content"
			>
				Estimated Participants
				<span class="ml-2 text-sm font-semibold">
					{$selectedEstimatedParticipantsMin === 1 ? 'Any' : $selectedEstimatedParticipantsMin} - {$selectedEstimatedParticipantsMax ===
					100
						? 'Any'
						: $selectedEstimatedParticipantsMax}
				</span>
			</button>

			{#if showEstimatedParticipants}
				<div
					id="estimatedParticipants-content"
					class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg z-10 w-64"
					on:click|stopPropagation
					role="menu"
					tabindex="0"
				>
					<label class="block text-sm font-medium text-gray-700 mb-2">Participants Range</label>
					<RangeSlider
						bind:values={estimatedParticipantsRange}
						min={1}
						max={100}
						step={1}
						float
						pips
						first="label"
						last="label"
						rest={false}
						hoverable
						on:change={handleEstimatedParticipantsChange}
					/>
					<div class="text-center mt-2 text-sm font-medium text-gray-700">
						Current: {estimatedParticipantsRange[0]} - {estimatedParticipantsRange[1]}
					</div>
				</div>
			{/if}
		</div>

		<!-- Contains Drill Filter -->
		<div class="relative">
			<button
				class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showContainsDrill ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
				on:click={() => toggleFilter('containsDrill')}
				aria-expanded={showContainsDrill}
				aria-controls="containsDrill-content"
			>
				Contains Drill
				{#if selectedDrills.length > 0}
					<span
						class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2"
					>
						({selectedDrills.length})
					</span>
				{/if}
			</button>

			{#if showContainsDrill}
				<div
					id="containsDrill-content"
					class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg z-10 w-64"
					on:click|stopPropagation
					role="menu"
					tabindex="0"
				>
					<input
						type="text"
						placeholder="Search for drills..."
						class="w-full p-2 border border-gray-300 rounded-md mb-2"
						bind:value={drillSearchTerm}
						on:input={debouncedFetchDrillSuggestions}
					/>
					{#if drillSuggestions.length > 0}
						<ul class="max-h-48 overflow-y-auto">
							{#each drillSuggestions as drill}
								<li
									class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-100"
									on:click={() => addDrillToSelected(drill)}
								>
									<span class="font-normal block truncate">{drill.name}</span>
								</li>
							{/each}
						</ul>
					{/if}
					{#if drillSuggestions.length === 0 && drillSearchTerm.trim() !== ''}
						<p class="text-gray-500">No drills found.</p>
					{/if}
					{#if selectedDrills.length > 0}
						<div class="mt-2">
							<h4 class="font-semibold mb-1">Selected Drills:</h4>
							{#each selectedDrills as drill}
								<div class="flex items-center justify-between bg-blue-100 p-2 rounded mb-1">
									<span>{drill.name}</span>
									<button
										class="text-red-600 hover:text-red-800"
										on:click={() => removeDrillFromSelected(drill.id)}
									>
										&times;
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Overlay to close dropdown when clicking outside -->
	{#if (filterType === 'drills' && (showSkillLevels || showDrillComplexity || showSkillsFocusedOn || showPositionsFocusedOn || showNumberOfPeople || showSuggestedLengths || showHasImages || showDrillTypes)) || (filterType === 'practice-plans' && (showPhaseOfSeason || showPracticeGoals || showEstimatedParticipants || showContainsDrill))}
		<div
			class="fixed inset-0 bg-transparent z-0"
			on:click={closeAllFilters}
			aria-label="Close filters"
		></div>
	{/if}
</div>

<style>
	/* ... existing styles ... */
</style>
