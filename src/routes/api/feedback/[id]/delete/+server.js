import { json } from '@sveltejs/kit';
import { deleteFeedback } from '$lib/server/feedback.js';
import { handleApiError } from '../../../utils/handleApiError.js';
import { NotFoundError } from '$lib/server/errors.js';
import { authGuard } from '$lib/server/authGuard.js';
import { requireAdmin } from '$lib/server/auth/permissions.js';

export const DELETE = authGuard(async (event) => {
	// Require admin role
	await requireAdmin({ locals: event.locals });
	const { id } = event.params;
	try {
		// Assuming deleteFeedback might throw NotFoundError if the ID doesn't exist
		await deleteFeedback(id);
		// Return 204 No Content for successful deletions
		return new Response(null, { status: 204 });
	} catch (error) {
		return handleApiError(error);
	}
});
