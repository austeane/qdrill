import { json } from '@sveltejs/kit';
import { formationService } from '$lib/server/services/formationService.js';
import { authGuard } from '$lib/server/authGuard';
import { dev } from '$app/environment';

/**
 * GET handler for retrieving a specific formation
 */
export async function GET({ params }) {
  const { id } = params;

  try {
    const formation = await formationService.getById(id);
    
    if (!formation) {
      return json({ error: 'Formation not found' }, { status: 404 });
    }
    
    return json(formation);
  } catch (error) {
    console.error(`Error fetching formation ${id}:`, error);
    return json(
      { error: 'An error occurred while fetching the formation', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing a formation
 * Requires authentication and proper permissions
 */
export const DELETE = authGuard(async ({ params, locals }) => {
  const { id } = params;
  const session = locals.session;
  const userId = session?.user?.id;

  try {
    // Check if the formation exists and if the user has permission to delete it
    const formation = await formationService.getById(id);
    
    if (!formation) {
      return json({ error: 'Formation not found' }, { status: 404 });
    }
    
    // Only allow deletion if the user created the formation OR if in dev mode
    if (formation.created_by !== userId) {
      return json({ error: 'Forbidden: You do not own this formation' }, { status: 403 });
    }
    
    const deleted = await formationService.delete(id);
    
    if (!deleted) {
      return json({ error: 'Failed to delete formation' }, { status: 500 });
    }
    
    return json({ message: 'Formation deleted successfully' });
  } catch (error) {
    console.error(`Error deleting formation ${id}:`, error);
    return json(
      { error: 'An error occurred while deleting the formation', details: error.message },
      { status: 500 }
    );
  }
});