import { error, redirect } from '@sveltejs/kit';
import { formationService } from '$lib/server/services/formationService.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals }) {
  const session = await locals.getSession();
  const userId = session?.user?.id;
  
  try {
    const formation = await formationService.getById(params.id);
    
    if (!formation) {
      throw error(404, 'Formation not found');
    }
    
    // Check if user has permission to edit
    const canEdit = 
      formation.is_editable_by_others || 
      formation.created_by === userId || 
      formation.created_by === null;
    
    if (!canEdit) {
      throw redirect(303, `/formations/${params.id}`);
    }
    
    return { formation };
  } catch (err) {
    console.error('Error loading formation for edit:', err);
    throw error(500, 'Error loading formation');
  }
}