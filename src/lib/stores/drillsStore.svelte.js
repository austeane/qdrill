import { PREDEFINED_SKILLS } from '$lib/constants/skills';

export class DrillsStore {
	// Pagination
	currentPage = $state(1);
	totalPages = $state(1);
	totalItems = $state(0);
	drillsPerPage = $state(10);
	isLoading = $state(false);

	// Filters
	selectedSkillLevels = $state({});
	selectedComplexities = $state({});
	selectedSkillsFocusedOn = $state({});
	selectedPositionsFocusedOn = $state({});
	selectedNumberOfPeopleMin = $state(null);
	selectedNumberOfPeopleMax = $state(null);
	selectedSuggestedLengthsMin = $state(null);
	selectedSuggestedLengthsMax = $state(null);
	selectedHasVideo = $state(null);
	selectedHasDiagrams = $state(null);
	selectedHasImages = $state(null);
	searchQuery = $state('');
	selectedDrillTypes = $state({});

	// Skills
	allSkills = $state(PREDEFINED_SKILLS);

	get sortedSkills() {
		return [...this.allSkills].sort((a, b) => a.name.localeCompare(b.name));
	}

	resetFilters() {
		this.selectedSkillLevels = {};
		this.selectedComplexities = {};
		this.selectedSkillsFocusedOn = {};
		this.selectedPositionsFocusedOn = {};
		this.selectedNumberOfPeopleMin = null;
		this.selectedNumberOfPeopleMax = null;
		this.selectedSuggestedLengthsMin = null;
		this.selectedSuggestedLengthsMax = null;
		this.selectedHasVideo = null;
		this.selectedHasDiagrams = null;
		this.selectedHasImages = null;
		this.searchQuery = '';
		this.selectedDrillTypes = {};
	}
}

export const drillsStore = new DrillsStore();
