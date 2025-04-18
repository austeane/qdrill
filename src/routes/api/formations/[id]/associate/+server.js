import { json } from '@sveltejs/kit';
import { formationService } from '$lib/server/services/formationService.js';

/**
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ params, request, locals }) {
  const parentId = params.id;
  const { childId, associationType } = await request.json();
  const session = locals.session;
  const userId = session?.user?.id;

  if (!userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formationId = parseInt(parentId);

  if (isNaN(formationId)) {
    return json({ error: 'Invalid Formation ID' }, { status: 400 });
  }

  try {
    const updatedFormation = await formationService.associateFormation(formationId, userId);
    return json(updatedFormation, { status: 200 });
  } catch (error) {
    console.error(`Error associating formation ${formationId} with user ${userId}:`, error);
    if (error.message === 'Formation not found') {
      return json({ error: 'Formation not found' }, { status: 404 });
    }
    // Don't return error if it's already owned, just return the formation
    if (error.message === 'Formation already has an owner') {
       const formation = await formationService.getById(formationId);
       return json(formation, { status: 200 });
    }
    return json({ error: 'Failed to associate formation' }, { status: 500 });
  }
} 