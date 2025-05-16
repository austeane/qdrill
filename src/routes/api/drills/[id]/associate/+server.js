import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService.js';
import { authGuard } from '$lib/server/authGuard';
import { handleApiError } from '../../../utils/handleApiError.js';
import { UnauthorizedError, ValidationError } from '$lib/server/errors.js';

/**
 * @type {import('./$types').RequestHandler}
 */
export const POST = authGuard(async ({ params, request, locals }) => {
	const session = locals.session;
	const userId = session?.user?.id;

	try {
		const drillId = parseInt(params.id);

		if (isNaN(drillId)) {
			throw new ValidationError('Invalid Drill ID format');
		}

		const updatedDrill = await drillService.associateDrill(drillId, userId);
		return json(updatedDrill, { status: 200 });
	} catch (err) {
		return handleApiError(err);
	}
});
