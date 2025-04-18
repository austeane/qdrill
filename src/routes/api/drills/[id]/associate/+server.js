import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService.js';

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

  const drillId = parseInt(params.id);

  if (isNaN(drillId)) {
    return json({ error: 'Invalid Drill ID' }, { status: 400 });
  }

  try {
    const updatedDrill = await drillService.associateDrill(drillId, userId);
    return json(updatedDrill, { status: 200 });
  } catch (error) {
    console.error(`Error associating drill ${drillId} with user ${userId}:`, error);
    if (error.message === 'Drill not found') {
      return json({ error: 'Drill not found' }, { status: 404 });
    }
    // Handle case where drill might already be owned (associateDrill returns it)
    if (error.message === 'Drill already has an owner') {
        const drill = await drillService.getById(drillId);
        return json(drill, { status: 200 });
    }
    return json({ error: 'Failed to associate drill' }, { status: 500 });
  }
} 