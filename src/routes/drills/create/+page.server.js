import { error } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService.js';
import { skillService } from '$lib/server/services/skillService.js'; // Assuming SkillService exists

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
	try {
		const prefilledName = url.searchParams.get('name'); // Get 'name' from query params
		const practicePlanId = url.searchParams.get('practice_plan_id');
		const practicePlanItemId = url.searchParams.get('practice_plan_item_id');

		const skillsResult = await skillService.getAllSkills({ all: true }); // Fetch all skills
		const namesResult = await drillService.getAllDrillNames(); // Fetch all drill names

		// Extract items if the service returns the { items: [...] } structure,
		// otherwise, assume it's already the array (or handle other cases if necessary).
		let allSkills = Array.isArray(skillsResult?.items)
			? skillsResult.items
			: Array.isArray(skillsResult)
				? skillsResult
				: [];

		let allDrillNames = Array.isArray(namesResult?.items)
			? namesResult.items
			: Array.isArray(namesResult)
				? namesResult
				: [];

		// Log warnings if the data wasn't in the expected { items: [...] } format or an array
		if (!Array.isArray(skillsResult?.items) && !Array.isArray(skillsResult)) {
			console.warn(
				'skillService.getAllSkills() did not return an array or {items: [...]}, defaulting to []. Received:',
				skillsResult
			);
		}
		if (!Array.isArray(namesResult?.items) && !Array.isArray(namesResult)) {
			console.warn(
				'drillService.getAllDrillNames() did not return an array or {items: [...]}, defaulting to []. Received:',
				namesResult
			);
		}

		return {
			prefilledName, // Pass the prefilledName to the page
			practicePlanId, // Pass practicePlanId
			practicePlanItemId, // Pass practicePlanItemId
			allSkills,
			allDrillNames
		};
	} catch (err) {
		console.error('Error loading data for drill creation page:', err);
		// Return empty arrays or throw an error, depending on desired behavior
		throw error(500, 'Failed to load necessary data for creating a drill');
	}
}
