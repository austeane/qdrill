import { json } from '@sveltejs/kit';
import { formationService } from '$lib/server/services/formationService.js';
import { authGuard } from '$lib/server/authGuard';
import { dev } from '$app/environment';
import { handleApiError } from '../../utils/handleApiError.js';
import { NotFoundError, ForbiddenError } from '$lib/server/errors';

/**
 * GET handler for retrieving a specific formation
 */
export async function GET({ params, locals }) {
  try {
    const { id } = params;
    const session = await locals.auth();
    const userId = session?.user?.id;

    const formationId = parseInt(id);
    if (isNaN(formationId)) {
      return json({ error: 'Invalid formation ID' }, { status: 400 });
    }

    const formation = await formationService.getById(formationId);

    if (!formationService.canUserView(formation, userId)) {
      throw new NotFoundError('Formation not found');
    }

    return json(formation);
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * PUT handler for updating a formation
 */
export const PUT = authGuard(async ({ params, request, locals }) => {
  try {
    const { id } = params;
    const formationData = await request.json();
    const session = await locals.auth();
    const userId = session?.user?.id;

    const formationId = parseInt(id);
    if (isNaN(formationId)) {
      return json({ error: 'Invalid formation ID' }, { status: 400 });
    }

    if (!userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const updatedFormation = await formationService.updateFormation(formationId, formationData);
    return json(updatedFormation);
  } catch (err) {
    return handleApiError(err);
  }
});

/**
 * DELETE handler for deleting a formation
 */
export const DELETE = authGuard(async ({ params, locals }) => {
  try {
    const { id } = params;
    const session = await locals.auth();
    const userId = session?.user?.id;

    const formationId = parseInt(id);
    if (isNaN(formationId)) {
      return json({ error: 'Invalid formation ID' }, { status: 400 });
    }

    if (!userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    await formationService.canUserEdit(formationId, userId);

    const formation = await formationService.getById(formationId);
    if (formation.created_by !== userId) {
      throw new ForbiddenError('Only the creator can delete this formation');
    }

    await formationService.delete(formationId);

    return new Response(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
});