import { json } from '@sveltejs/kit';
// import { error } from '@sveltejs/kit'; // No longer using SvelteKit error helper directly
import { drillService } from '$lib/server/services/drillService';
import { authGuard } from '$lib/server/authGuard'; // Import authGuard
import { handleApiError } from '../../../utils/handleApiError.js'; // Import the helper
import { ValidationError } from '$lib/server/errors.js';

// Apply authGuard
export const POST = authGuard(async ({ params, locals }) => {
	const session = locals.session;
	const userId = session?.user?.id; // Guard ensures userId exists

	try {
		const drillId = parseInt(params.id);

		if (!params.id || isNaN(drillId)) {
			throw new ValidationError('Invalid Drill ID format');
		}

		// Service method handles NotFoundError
		const result = await drillService.toggleUpvote(drillId, userId);

		return json({
			upvotes: result.upvotes,
			hasVoted: result.hasVoted
		});
	} catch (err) {
		// Use the centralized error handler
		return handleApiError(err);
	}
});
