import { PREDEFINED_SKILLS } from '$lib/constants/skills.js';

export async function load() {
	// Define skill options
	const skillOptions = [
		{ value: 'beginner', label: 'Beginner' },
		{ value: 'intermediate', label: 'Intermediate' },
		{ value: 'advanced', label: 'Advanced' },
		{ value: 'expert', label: 'Expert' }
	];

	// Use PREDEFINED_SKILLS for focus areas
	const focusAreaOptions = PREDEFINED_SKILLS.map((skill) => ({ value: skill, label: skill }));

	return {
		skillOptions,
		focusAreaOptions
	};
}
