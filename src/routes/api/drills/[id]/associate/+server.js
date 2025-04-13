import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService.js';
import { getSession } from '@auth/sveltekit';

/**
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ params, request, locals }) {
  const session = await getSession({ request });

  if (!session?.user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const drillId = parseInt(params.id);
  const userId = session.user.id;

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