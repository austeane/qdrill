import { writable, derived } from 'svelte/store';
import { PREDEFINED_SKILLS } from '$lib/constants/skills';

// Pagination stores
export const currentPage = writable(1);
export const totalPages = writable(1);
export const totalItems = writable(0);
export const drillsPerPage = writable(10);
export const isLoading = writable(false);

// Filter stores
export const selectedSkillLevels = writable({});
export const selectedComplexities = writable({});
export const selectedSkillsFocusedOn = writable({});
export const selectedPositionsFocusedOn = writable({});
export const selectedNumberOfPeopleMin = writable(null);
export const selectedNumberOfPeopleMax = writable(null);
export const selectedSuggestedLengthsMin = writable(null);
export const selectedSuggestedLengthsMax = writable(null);
export const selectedHasVideo = writable(null);
export const selectedHasDiagrams = writable(null);
export const selectedHasImages = writable(null);
export const searchQuery = writable('');
export const selectedDrillTypes = writable({});

// Skills store
export const allSkills = writable(PREDEFINED_SKILLS);
export const sortedSkills = derived(allSkills, ($allSkills) =>
	[...$allSkills].sort((a, b) => a.name.localeCompare(b.name))
);
