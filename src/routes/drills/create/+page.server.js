import { error } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService.js';
import { skillService } from '$lib/server/services/skillService.js'; // Assuming SkillService exists

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  try {
    const allSkills = await skillService.getAllSkills(); // Fetch all skills
    const allDrillNames = await drillService.getDrillNames(); // Fetch all drill names

    return {
      allSkills,
      allDrillNames,
    };
  } catch (err) {
    console.error('Error loading data for drill creation page:', err);
    // Return empty arrays or throw an error, depending on desired behavior
    throw error(500, 'Failed to load necessary data for creating a drill');
  }
} 