<script>
	import RangeSlider from 'svelte-range-slider-pips';
	import { drillsStore } from '$lib/stores/drillsStore';
	import { onMount } from 'svelte';
	import { sortStore } from '$lib/stores/sortStore';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import ThreeStateCheckbox from '$lib/components/ThreeStateCheckbox.svelte';
	import { FILTER_STATES } from '$lib/constants';
	import {
		practicePlanFilterStore,
		updateFilterState as updatePracticePlanFilterState
	} from '$lib/stores/practicePlanFilterStore';
	import debounce from 'lodash/debounce';

	let {
		customClass = '',
		filterType = 'drills', // drills | practice-plans
		selectedDrills = $bindable([]),
		onDrillSelect = () => {},
		onDrillRemove = () => {},
		skillLevels = [],
		complexities = [],
		skillsFocusedOn = [],
		positionsFocusedOn = [],
		numberOfPeopleOptions = { min: 0, max: 100 },
		suggestedLengths = { min: 0, max: 120 },
		phaseOfSeasonOptions = [],
		practiceGoalsOptions = [],
		sortOptions = [],
		drillTypes = [],
		onFilterChange = () => {}
	} = $props();

	// Drill filter state (shared)
	const selectedSkillLevels = $derived(drillsStore.selectedSkillLevels);
	const selectedComplexities = $derived(drillsStore.selectedComplexities);
	const selectedSkillsFocusedOn = $derived(drillsStore.selectedSkillsFocusedOn);
	const selectedPositionsFocusedOn = $derived(drillsStore.selectedPositionsFocusedOn);
	const selectedNumberOfPeopleMin = $derived(drillsStore.selectedNumberOfPeopleMin);
	const selectedNumberOfPeopleMax = $derived(drillsStore.selectedNumberOfPeopleMax);
	const selectedSuggestedLengthsMin = $derived(drillsStore.selectedSuggestedLengthsMin);
	const selectedSuggestedLengthsMax = $derived(drillsStore.selectedSuggestedLengthsMax);
	const selectedHasVideo = $derived(drillsStore.selectedHasVideo);
	const selectedHasDiagrams = $derived(drillsStore.selectedHasDiagrams);
	const selectedHasImages = $derived(drillsStore.selectedHasImages);
	const selectedDrillTypes = $derived(drillsStore.selectedDrillTypes);

	// Practice plan filter state (shared)
	const selectedPhaseOfSeason = $derived(practicePlanFilterStore.selectedPhaseOfSeason);
	const selectedPracticeGoals = $derived(practicePlanFilterStore.selectedPracticeGoals);
	const selectedEstimatedParticipantsMin = $derived(
		practicePlanFilterStore.selectedEstimatedParticipantsMin
	);
	const selectedEstimatedParticipantsMax = $derived(
		practicePlanFilterStore.selectedEstimatedParticipantsMax
	);

	// Toggle states for drill filters
	let showSkillLevels = $state(false);
	let showDrillComplexity = $state(false);
	let showSkillsFocusedOn = $state(false);
	let showPositionsFocusedOn = $state(false);
	let showNumberOfPeople = $state(false);
	let showSuggestedLengths = $state(false);
	let showHasImages = $state(false);
	let showDrillTypes = $state(false);

	// Toggle states for practice plans filters
	let showPhaseOfSeason = $state(false);
	let showPracticeGoals = $state(false);
	let showEstimatedParticipants = $state(false);
	let showContainsDrill = $state(false);
	let showSortBy = $state(false);

	// Provide safe defaults in case props are undefined
	const fallbackNumberOfPeople = { min: 0, max: 100 };
	const fallbackSuggestedLengths = { min: 0, max: 120 };

	// Effective options (merge prop with fallback)
	const effectiveNumberOfPeopleOptions = $derived({
		min: numberOfPeopleOptions?.min ?? fallbackNumberOfPeople.min,
		max: numberOfPeopleOptions?.max ?? fallbackNumberOfPeople.max
	});

	const effectiveSuggestedLengths = $derived({
		min: suggestedLengths?.min ?? fallbackSuggestedLengths.min,
		max: suggestedLengths?.max ?? fallbackSuggestedLengths.max
	});

	// Set up variables for the sliders
	let numberOfPeopleRange = $state([0, 0]);
	let suggestedLengthsRange = $state([0, 0]);
	let estimatedParticipantsRange = $state([1, 100]);

	// Variables for Contains Drill filter
	let drillSearchTerm = $state('');
	let drillSuggestions = $state([]);
	let drillLoading = $state(false);
	let drillError = $state(null);

	// Reactive checks for active filters
	const hasActiveDrillFilters = $derived(
		Object.keys(selectedSkillLevels).length > 0 ||
			Object.keys(selectedComplexities).length > 0 ||
			Object.keys(selectedSkillsFocusedOn).length > 0 ||
			Object.keys(selectedPositionsFocusedOn).length > 0 ||
			selectedNumberOfPeopleMin !== effectiveNumberOfPeopleOptions.min ||
			selectedNumberOfPeopleMax !== effectiveNumberOfPeopleOptions.max ||
			selectedSuggestedLengthsMin !== effectiveSuggestedLengths.min ||
			selectedSuggestedLengthsMax !== effectiveSuggestedLengths.max ||
			selectedHasVideo !== null ||
			selectedHasDiagrams !== null ||
			selectedHasImages !== null ||
			Object.keys(selectedDrillTypes).length > 0
	);

	const hasActivePracticePlanFilters = $derived(
		Object.keys(selectedPhaseOfSeason).length > 0 ||
			Object.keys(selectedPracticeGoals).length > 0 ||
			selectedEstimatedParticipantsMin !== 1 ||
			selectedEstimatedParticipantsMax !== 100 ||
			selectedDrills.length > 0
	);

	let mounted = false;

	onMount(() => {
		mounted = true;
		// Initialize slider ranges from store values in case they were loaded from URL
		numberOfPeopleRange = [
			selectedNumberOfPeopleMin ?? effectiveNumberOfPeopleOptions.min,
			selectedNumberOfPeopleMax ?? effectiveNumberOfPeopleOptions.max
		];
		suggestedLengthsRange = [
			selectedSuggestedLengthsMin ?? effectiveSuggestedLengths.min,
			selectedSuggestedLengthsMax ?? effectiveSuggestedLengths.max
		];
	});

	// Function to reset all filters
	function resetFilters() {
		drillsStore.selectedSkillLevels = {};
		drillsStore.selectedComplexities = {};
		drillsStore.selectedSkillsFocusedOn = {};
		drillsStore.selectedPositionsFocusedOn = {};
		drillsStore.selectedNumberOfPeopleMin = effectiveNumberOfPeopleOptions.min;
		drillsStore.selectedNumberOfPeopleMax = effectiveNumberOfPeopleOptions.max;
		drillsStore.selectedSuggestedLengthsMin = effectiveSuggestedLengths.min;
		drillsStore.selectedSuggestedLengthsMax = effectiveSuggestedLengths.max;
		drillsStore.selectedHasVideo = null;
		drillsStore.selectedHasDiagrams = null;
		drillsStore.selectedHasImages = null;
		drillsStore.selectedDrillTypes = {};

		// Reset local slider state
		numberOfPeopleRange = [effectiveNumberOfPeopleOptions.min, effectiveNumberOfPeopleOptions.max];
		suggestedLengthsRange = [effectiveSuggestedLengths.min, effectiveSuggestedLengths.max];

		if (filterType === 'practice-plans') {
			practicePlanFilterStore.selectedPhaseOfSeason = {};
			practicePlanFilterStore.selectedPracticeGoals = {};
			practicePlanFilterStore.selectedEstimatedParticipantsMin = 1;
			practicePlanFilterStore.selectedEstimatedParticipantsMax = 100;
			selectedDrills = [];
		}
		closeAllFilters();
		onFilterChange();
	}

	// Function to handle toggling filters
	function toggleFilter(filterName) {
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
			case 'sortBy':
				if (filterType === 'practice-plans') isCurrentlyOpen = showSortBy;
				break;
		}

		// Always close all filters first
		closeAllFilters();

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
				case 'sortBy':
					if (filterType === 'practice-plans') showSortBy = true;
					break;
			}
		}
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
		showSortBy = false;
	}

	// Handle Escape key to close all filters
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			closeAllFilters();
		}
	}

	// Reactive statements to initialize selectedSuggestedLengthsMin and Max
	$effect(() => {
		if (effectiveSuggestedLengths.min != null && selectedSuggestedLengthsMin === 0) {
			drillsStore.selectedSuggestedLengthsMin = effectiveSuggestedLengths.min;
		}

		if (effectiveSuggestedLengths.max != null && selectedSuggestedLengthsMax === 120) {
			drillsStore.selectedSuggestedLengthsMax = effectiveSuggestedLengths.max;
		}
	});

	// Subscribe to Practice Plans Filters if needed

	// Fetch drill suggestions
	async function fetchDrillSuggestions() {
		if (!mounted) return; // Ensure client-side execution
		drillLoading = true;
		drillError = null;
		try {
			const queryParam =
				drillSearchTerm.trim() === '' ? '' : `?query=${encodeURIComponent(drillSearchTerm)}`;
			const drills = await apiFetch(`/api/drills/search${queryParam}`);
			drillSuggestions = drills.filter((drill) => !selectedDrills.some((d) => d.id === drill.id));
		} catch (error) {
			drillError = 'Failed to fetch drills';
			console.error(error);
		} finally {
			drillLoading = false;
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

	function toggleDrillTypeState(type, newState) {
		const updated = { ...(drillsStore.selectedDrillTypes || {}) };
		if (newState === FILTER_STATES.NEUTRAL) {
			delete updated[type];
		} else {
			updated[type] = newState;
		}
		drillsStore.selectedDrillTypes = updated;
		onFilterChange();
	}

	// Helper function for updating DRILL filter states
	function updateFilterState(field) {
		return (value, newState) => {
			const current = drillsStore[field] || {};
			const updated = { ...current };
			if (newState === FILTER_STATES.NEUTRAL) {
				delete updated[value];
			} else {
				updated[value] = newState;
			}
			drillsStore[field] = updated;
			onFilterChange();
		};
	}

	// Create update handlers for each filter type
	const updateSkillLevel = updateFilterState('selectedSkillLevels');
	const updateComplexity = updateFilterState('selectedComplexities');
	const updateSkillsFocused = updateFilterState('selectedSkillsFocusedOn');
	const updatePositionsFocused = updateFilterState('selectedPositionsFocusedOn');

	const applyPhaseOfSeason = updatePracticePlanFilterState('selectedPhaseOfSeason');
	const updatePhaseOfSeason = (value, newState) => {
		applyPhaseOfSeason(value, newState);
		onFilterChange();
	};

	const applyPracticeGoals = updatePracticePlanFilterState('selectedPracticeGoals');
	const updatePracticeGoals = (value, newState) => {
		applyPracticeGoals(value, newState);
		onFilterChange();
	};

	// Keep range filter stores in sync with slider bindings.
	// (RangeSlider dispatches legacy component events; in runes mode we react to the bound values instead.)
	$effect(() => {
		const [min, max] = numberOfPeopleRange;

		if (selectedNumberOfPeopleMin == null || selectedNumberOfPeopleMax == null) {
			drillsStore.selectedNumberOfPeopleMin = min;
			drillsStore.selectedNumberOfPeopleMax = max;
			return;
		}

		if (min === selectedNumberOfPeopleMin && max === selectedNumberOfPeopleMax) return;

		drillsStore.selectedNumberOfPeopleMin = min;
		drillsStore.selectedNumberOfPeopleMax = max;
		onFilterChange();
	});

	$effect(() => {
		const [min, max] = suggestedLengthsRange;

		if (selectedSuggestedLengthsMin == null || selectedSuggestedLengthsMax == null) {
			drillsStore.selectedSuggestedLengthsMin = min;
			drillsStore.selectedSuggestedLengthsMax = max;
			return;
		}

		if (min === selectedSuggestedLengthsMin && max === selectedSuggestedLengthsMax) return;

		drillsStore.selectedSuggestedLengthsMin = min;
		drillsStore.selectedSuggestedLengthsMax = max;
		onFilterChange();
	});

	$effect(() => {
		const [min, max] = estimatedParticipantsRange;

		if (selectedEstimatedParticipantsMin == null || selectedEstimatedParticipantsMax == null) {
			practicePlanFilterStore.selectedEstimatedParticipantsMin = min;
			practicePlanFilterStore.selectedEstimatedParticipantsMax = max;
			return;
		}

		if (min === selectedEstimatedParticipantsMin && max === selectedEstimatedParticipantsMax)
			return;

		practicePlanFilterStore.selectedEstimatedParticipantsMin = min;
		practicePlanFilterStore.selectedEstimatedParticipantsMax = max;
		onFilterChange();
	});

	let skillsSearchTerm = $state('');

	const filteredSkills = $derived(
		(skillsFocusedOn || [])
			.map((skill) => (typeof skill === 'object' ? skill.skill : skill))
			.filter(
				(skill, index, self) =>
					// Remove duplicates
					self.indexOf(skill) === index &&
					// Filter by search term
					skill.toLowerCase().includes(skillsSearchTerm.toLowerCase())
			)
	);

	// Helper to toggle tri‑state boolean filters (null → true → false → null)
	function toggleBooleanFilter(field) {
		const current = drillsStore[field];
		drillsStore[field] = current === null ? true : current === true ? false : null;
		onFilterChange();
	}

	function toggleHasVideo() {
		toggleBooleanFilter('selectedHasVideo');
	}

	function toggleHasDiagrams() {
		toggleBooleanFilter('selectedHasDiagrams');
	}

	function toggleHasImages() {
		toggleBooleanFilter('selectedHasImages');
	}
</script>

<!-- Filter Buttons -->
<div
	class={`flex flex-wrap gap-2 mb-4 relative ${customClass}`}
	role="toolbar"
	aria-label="Filters"
	tabindex="0"
	onkeydown={handleKeydown}
>
	<!-- Drills Filters -->
	{#if filterType === 'drills' && (skillLevels.length || complexities.length || skillsFocusedOn.length || positionsFocusedOn.length || numberOfPeopleOptions.min !== null || numberOfPeopleOptions.max !== null || suggestedLengths.min !== null || suggestedLengths.max !== null || selectedHasVideo || selectedHasDiagrams || selectedHasImages)}
		<!-- Skill Levels Filter -->
		{#if skillLevels.length}
			<div class="relative">
				<button
					class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showSkillLevels ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
					onclick={() => toggleFilter('skillLevels')}
					aria-expanded={showSkillLevels}
					aria-controls="skillLevels-content"
					data-testid="filter-category-skillLevels"
				>
					Skill Levels
					{#if Object.keys(selectedSkillLevels).length > 0}
						<span
							class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2"
						>
							({Object.keys(selectedSkillLevels).length})
						</span>
					{/if}
				</button>

				{#if showSkillLevels}
					<div
						id="skillLevels-content"
						class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
						role="menu"
						tabindex="0"
					>
						{#each skillLevels as level (level)}
							{@const currentState = selectedSkillLevels[level] || FILTER_STATES.NEUTRAL}
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
					onclick={() => toggleFilter('drillComplexity')}
					aria-expanded={showDrillComplexity}
					aria-controls="drillComplexity-content"
				>
					Complexity
					{#if Object.keys(selectedComplexities).length > 0}
						<span
							class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2"
						>
							({Object.keys(selectedComplexities).length})
						</span>
					{/if}
				</button>

				{#if showDrillComplexity}
					<div
						id="drillComplexity-content"
						class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
						role="menu"
						tabindex="0"
					>
						{#each complexities as complexity (complexity)}
							{@const currentState = selectedComplexities[complexity] || FILTER_STATES.NEUTRAL}
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
					onclick={() => toggleFilter('skillsFocusedOn')}
					aria-expanded={showSkillsFocusedOn}
					aria-controls="skillsFocusedOn-content"
				>
					Skills Focused On
					{#if Object.keys(selectedSkillsFocusedOn).length > 0}
						<span
							class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2"
						>
							({Object.keys(selectedSkillsFocusedOn).length})
						</span>
					{/if}
				</button>

				{#if showSkillsFocusedOn}
					<div
						id="skillsFocusedOn-content"
						class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
						role="menu"
						tabindex="0"
					>
						<input
							type="text"
							placeholder="Search skills..."
							class="w-full p-2 border border-gray-300 rounded-md mb-2"
							bind:value={skillsSearchTerm}
						/>
						{#each filteredSkills as skill (typeof skill === 'object' ? skill.skill : skill)}
							{@const skillValue = typeof skill === 'object' ? skill.skill : skill}
							{@const currentState = selectedSkillsFocusedOn[skillValue] || FILTER_STATES.NEUTRAL}
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
					onclick={() => toggleFilter('positionsFocusedOn')}
					aria-expanded={showPositionsFocusedOn}
					aria-controls="positionsFocusedOn-content"
				>
					Positions Focused On
					{#if Object.keys(selectedPositionsFocusedOn).length > 0}
						<span
							class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2"
						>
							({Object.keys(selectedPositionsFocusedOn).length})
						</span>
					{/if}
				</button>

				{#if showPositionsFocusedOn}
					<div
						id="positionsFocusedOn-content"
						class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
						role="menu"
						tabindex="0"
					>
						{#each positionsFocusedOn as position (position)}
							{@const currentState = selectedPositionsFocusedOn[position] || FILTER_STATES.NEUTRAL}
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
				onclick={() => toggleFilter('numberOfPeople')}
				aria-expanded={showNumberOfPeople}
				aria-controls="numberOfPeople-content"
			>
				Number of Participants
				<span class="ml-2 text-sm font-semibold">
					{selectedNumberOfPeopleMin === effectiveNumberOfPeopleOptions.min
						? 'Any'
						: selectedNumberOfPeopleMin} - {selectedNumberOfPeopleMax ===
					effectiveNumberOfPeopleOptions.max
						? 'Any'
						: selectedNumberOfPeopleMax}
				</span>
			</button>

			{#if showNumberOfPeople}
				<div
					id="numberOfPeople-content"
					class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg z-10 w-64"
					role="menu"
					tabindex="0"
				>
					<span class="block text-sm font-medium text-gray-700 mb-2">Participants Range</span>
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
				onclick={() => toggleFilter('suggestedLengths')}
				aria-expanded={showSuggestedLengths}
				aria-controls="suggestedLengths-content"
			>
				Suggested Lengths
				<span class="ml-2 text-sm font-semibold">
					<!-- Debug Log -->
					{#if (selectedSuggestedLengthsMin === null || selectedSuggestedLengthsMin === effectiveSuggestedLengths.min) && (selectedSuggestedLengthsMax === null || selectedSuggestedLengthsMax === effectiveSuggestedLengths.max)}
						Any Length
					{:else if selectedSuggestedLengthsMin === null || selectedSuggestedLengthsMin === effectiveSuggestedLengths.min}
						Up to {selectedSuggestedLengthsMax} mins
					{:else if selectedSuggestedLengthsMax === null || selectedSuggestedLengthsMax === effectiveSuggestedLengths.max}
						{selectedSuggestedLengthsMin}+ mins
					{:else}
						{selectedSuggestedLengthsMin}-{selectedSuggestedLengthsMax} mins
					{/if}
				</span>
			</button>

			{#if showSuggestedLengths}
				<div
					id="suggestedLengths-content"
					class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg z-10 w-64"
					role="menu"
					tabindex="0"
				>
					<span class="block text-sm font-medium text-gray-700 mb-2">Length Range (mins)</span>
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
					/>
				</div>
			{/if}
		</div>
		<!-- Has Video Filter -->
		<div class="relative">
			<button
				class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 
                   ${selectedHasVideo === true ? 'bg-blue-500 text-white' : selectedHasVideo === false ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
				onclick={toggleHasVideo}
				aria-pressed={selectedHasVideo === true
					? 'true'
					: selectedHasVideo === false
						? 'mixed'
						: 'false'}
			>
				Has Video {selectedHasVideo === true ? '(Yes)' : selectedHasVideo === false ? '(No)' : ''}
			</button>
		</div>

		<!-- Has Diagrams Filter -->
		<div class="relative">
			<button
				class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 
                   ${selectedHasDiagrams === true ? 'bg-blue-500 text-white' : selectedHasDiagrams === false ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
				onclick={toggleHasDiagrams}
				aria-pressed={selectedHasDiagrams === true
					? 'true'
					: selectedHasDiagrams === false
						? 'mixed'
						: 'false'}
			>
				Has Diagrams {selectedHasDiagrams === true
					? '(Yes)'
					: selectedHasDiagrams === false
						? '(No)'
						: ''}
			</button>
		</div>

		<!-- Has Images Filter -->
		<div class="relative">
			<button
				class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 
                   ${selectedHasImages === true ? 'bg-blue-500 text-white' : selectedHasImages === false ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
				onclick={toggleHasImages}
				aria-pressed={selectedHasImages === true
					? 'true'
					: selectedHasImages === false
						? 'mixed'
						: 'false'}
			>
				Has Images {selectedHasImages === true
					? '(Yes)'
					: selectedHasImages === false
						? '(No)'
						: ''}
			</button>
		</div>

		<!-- Drill Types Filter -->
		{#if drillTypes && drillTypes.length > 0}
			<div class="relative">
				<button
					class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showDrillTypes ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
					onclick={() => toggleFilter('drillTypes')}
					aria-expanded={showDrillTypes}
					aria-controls="drillTypes-content"
				>
					Drill Types
					{#if Object.keys(selectedDrillTypes).length > 0}
						<span
							class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2"
						>
							({Object.keys(selectedDrillTypes).length})
						</span>
					{/if}
				</button>

				{#if showDrillTypes}
					<div
						id="drillTypes-content"
						class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
						role="menu"
						tabindex="0"
					>
						{#each drillTypes as type (type)}
							{@const currentState = selectedDrillTypes[type] || FILTER_STATES.NEUTRAL}
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
	{/if}

	<!-- Practice Plans Filters -->
	{#if filterType === 'practice-plans' && (phaseOfSeasonOptions.length || practiceGoalsOptions.length || selectedEstimatedParticipantsMin !== null || selectedEstimatedParticipantsMax !== null)}
		<!-- Phase of Season Filter -->
		{#if phaseOfSeasonOptions.length}
			<div class="relative">
				<button
					class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${showPhaseOfSeason ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
					onclick={() => toggleFilter('phaseOfSeason')}
					aria-expanded={showPhaseOfSeason}
					aria-controls="phaseOfSeason-content"
				>
					Phase of Season
					{#if Object.keys(selectedPhaseOfSeason).length > 0}
						<span
							class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2"
						>
							({Object.keys(selectedPhaseOfSeason).length})
						</span>
					{/if}
				</button>

				{#if showPhaseOfSeason}
					<div
						id="phaseOfSeason-content"
						class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
						role="menu"
						tabindex="0"
					>
						{#each phaseOfSeasonOptions as phase (phase)}
							<ThreeStateCheckbox
								value={phase}
								state={selectedPhaseOfSeason[phase] || FILTER_STATES.NEUTRAL}
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
					onclick={() => toggleFilter('practiceGoals')}
					aria-expanded={showPracticeGoals}
					aria-controls="practiceGoals-content"
				>
					Practice Goals
					{#if Object.keys(selectedPracticeGoals).length > 0}
						<span
							class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2"
						>
							({Object.keys(selectedPracticeGoals).length})
						</span>
					{/if}
				</button>

				{#if showPracticeGoals}
					<div
						id="practiceGoals-content"
						class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg max-h-72 overflow-y-auto z-10 w-64"
						role="menu"
						tabindex="0"
					>
						{#each practiceGoalsOptions as goal (goal)}
							<ThreeStateCheckbox
								value={goal}
								state={selectedPracticeGoals[goal] || FILTER_STATES.NEUTRAL}
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
				onclick={() => toggleFilter('estimatedParticipants')}
				aria-expanded={showEstimatedParticipants}
				aria-controls="estimatedParticipants-content"
			>
				Estimated Participants
				<span class="ml-2 text-sm font-semibold">
					{selectedEstimatedParticipantsMin === 1 ? 'Any' : selectedEstimatedParticipantsMin} - {selectedEstimatedParticipantsMax ===
					100
						? 'Any'
						: selectedEstimatedParticipantsMax}
				</span>
			</button>

			{#if showEstimatedParticipants}
				<div
					id="estimatedParticipants-content"
					class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg z-10 w-64"
					role="menu"
					tabindex="0"
				>
					<span class="block text-sm font-medium text-gray-700 mb-2">Participants Range</span>
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
				onclick={() => toggleFilter('containsDrill')}
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
					role="menu"
					tabindex="0"
				>
					<input
						type="text"
						placeholder="Search for drills..."
						class="w-full p-2 border border-gray-300 rounded-md mb-2"
						bind:value={drillSearchTerm}
						oninput={debouncedFetchDrillSuggestions}
					/>
					{#if drillLoading}
						<p class="text-gray-500">Loading...</p>
					{:else if drillError}
						<p class="text-red-500">{drillError}</p>
					{:else if drillSuggestions.length > 0}
						<ul class="max-h-48 overflow-y-auto">
							{#each drillSuggestions as drill (drill.id)}
								<li class="relative">
									<button
										type="button"
										role="menuitem"
										class="w-full text-left cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-blue-100"
										onclick={() => addDrillToSelected(drill)}
									>
										<span class="font-normal block truncate">{drill.name}</span>
									</button>
								</li>
							{/each}
						</ul>
					{:else if drillSearchTerm.trim() !== ''}
						<p class="text-gray-500">No drills found.</p>
					{/if}
					{#if selectedDrills.length > 0}
						<div class="mt-2">
							<h4 class="font-semibold mb-1">Selected Drills:</h4>
							{#each selectedDrills as drill (drill.id)}
								<div class="flex items-center justify-between bg-blue-100 p-2 rounded mb-1">
									<span>{drill.name}</span>
									<button
										class="text-red-600 hover:text-red-800"
										onclick={() => removeDrillFromSelected(drill.id)}
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

	<!-- Sort Dropdown for Practice Plans -->
	{#if filterType === 'practice-plans' && sortOptions.length > 0}
		<div class="relative">
			<button
				class="inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
				onclick={() => toggleFilter('sortBy')}
				aria-expanded={showSortBy}
				aria-controls="sortBy-content"
			>
				Sort by: {sortOptions.find((opt) => opt.value === sortStore.selectedSortOption)?.label ||
					'Date Created'}
				<span class="ml-2">
					{#if sortStore.selectedSortOrder === 'desc'}
						↓
					{:else}
						↑
					{/if}
				</span>
			</button>

			{#if showSortBy}
				<div
					id="sortBy-content"
					class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg z-10 w-64"
					role="menu"
					tabindex="0"
				>
					<div class="space-y-2">
						{#each sortOptions as option (option.value)}
							<label class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
								<input
									type="radio"
									name="sortBy"
									value={option.value}
									checked={sortStore.selectedSortOption === option.value}
									onchange={() => {
										sortStore.selectedSortOption = option.value;
										onFilterChange();
									}}
									class="mr-2"
								/>
								<span>{option.label}</span>
							</label>
						{/each}
					</div>
					<div class="mt-4 pt-4 border-t border-gray-200">
						<label class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
							<input
								type="checkbox"
								checked={sortStore.selectedSortOrder === 'asc'}
								onchange={() => {
									sortStore.toggleOrder();
									onFilterChange();
								}}
								class="mr-2"
							/>
							<span>Ascending order</span>
						</label>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	{#if (filterType === 'drills' && hasActiveDrillFilters) || (filterType === 'practice-plans' && hasActivePracticePlanFilters)}
		<button
			class="inline-flex items-center bg-red-500 text-white border border-red-600 rounded-full px-4 py-2 cursor-pointer hover:bg-red-600 transition-colors duration-300"
			onclick={resetFilters}
		>
			Reset Filters
		</button>
	{/if}

	<!-- Overlay to close dropdown when clicking outside -->
	{#if (filterType === 'drills' && (showSkillLevels || showDrillComplexity || showSkillsFocusedOn || showPositionsFocusedOn || showNumberOfPeople || showSuggestedLengths || showHasImages || showDrillTypes)) || (filterType === 'practice-plans' && (showPhaseOfSeason || showPracticeGoals || showEstimatedParticipants || showContainsDrill || showSortBy))}
		<button
			type="button"
			class="fixed inset-0 bg-transparent z-0"
			onclick={closeAllFilters}
			aria-label="Close filters"
		></button>
	{/if}
</div>

<style>
	/* ... existing styles ... */
</style>
