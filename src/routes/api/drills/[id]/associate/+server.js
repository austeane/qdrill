import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService.js';
import { authGuard } from '$lib/server/authGuard';
import { handleApiError } from '../../../utils/handleApiError.js';
import { ForbiddenError, ValidationError } from '$lib/server/errors.js';
import { verifyClaimToken } from '$lib/server/utils/claimTokens.js';

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

		const body = await request.json().catch(() => ({}));
		const claimToken = body?.claimToken;

		if (!verifyClaimToken('drill', drillId, claimToken)) {
			throw new ForbiddenError('Invalid or missing claim token for drill association');
		}

		const updatedDrill = await drillService.associateDrill(drillId, userId);
		return json(updatedDrill, { status: 200 });
	} catch (err) {
		return handleApiError(err);
	}
});
