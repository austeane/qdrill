import { error } from '@sveltejs/kit';
import { formationService } from '$lib/server/services/formationService.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  try {
    const formation = await formationService.getById(params.id);
    
    if (!formation) {
      throw error(404, 'Formation not found');
    }
    
    return { formation };
  } catch (err) {
    console.error('Error loading formation:', err);
    throw error(500, 'Error loading formation');
  }
}