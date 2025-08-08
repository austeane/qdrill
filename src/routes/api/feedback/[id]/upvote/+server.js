import { json } from '@sveltejs/kit';
import { upvoteFeedback } from '$lib/server/feedback.js';
import { handleApiError } from '../../../utils/handleApiError.js';
import { authGuard } from '$lib/server/authGuard.js';

export const POST = authGuard(async ({ params }) => {
	try {
		const { id } = params;
		const result = await upvoteFeedback(id);
		return json(result);
	} catch (error) {
		return handleApiError(error);
	}
});
