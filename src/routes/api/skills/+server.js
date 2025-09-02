import { json } from '@sveltejs/kit';
// Remove unused imports if PREDEFINED_SKILLS and db are no longer directly used.
// import { PREDEFINED_SKILLS } from '$lib/constants/skills';
// import * as db from '$lib/server/db';
import { skillService } from '$lib/server/services/skillService';
import { handleApiError } from '../utils/handleApiError.js';

// Remove standardizeSkill helper if service handles standardization.
// function standardizeSkill(skill) {
//   if (!skill) return '';
//   return skill.trim().toLowerCase().replace(/\s+/g, '-');
// }

export async function GET({ url }) {
	try {
		// Check for recommendation request
		const recommendForParam = url.searchParams.get('recommendFor');
		const limit = parseInt(url.searchParams.get('limit') || '5');

		if (recommendForParam) {
			// Handle recommendation request
			const currentSkills = recommendForParam
				.split(',')
				.map((s) => s.trim())
				.filter((s) => s);
			const recommendations = await skillService.getSkillRecommendations(currentSkills, limit);
			return json(recommendations);
		} else {
			// Default: Fetch all skills from the database via the service
			const skills = await skillService.getAllSkills();
			return json(skills);
		}
	} catch (err) {
		// Use the centralized error handler for any errors from the service or parsing
		return handleApiError(err);
	}
}

export async function POST({ request }) {
	try {
		const body = await request.json();
		const skillName = body?.skill; // Safely access skill property

		// Service method handles validation (e.g., non-empty string) and DB errors
		const result = await skillService.addOrIncrementSkill(skillName);

		// Return 200 OK with the resulting skill object (created or updated)
		return json(result, { status: 200 });
	} catch (err) {
		// Handle known errors (like ValidationError from service) or unexpected errors
		return handleApiError(err);
	}
}
