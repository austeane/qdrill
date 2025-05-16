import { json } from '@sveltejs/kit';
import { upvoteFeedback } from '$lib/server/feedback.js';
import { handleApiError } from '../../../utils/handleApiError.js';
import { NotFoundError } from '$lib/server/errors.js';

export async function POST({ params }) {
	const { id } = params;
	try {
		const updatedFeedback = await upvoteFeedback(id);
		return json(updatedFeedback);
	} catch (error) {
		return handleApiError(error);
	}
}
