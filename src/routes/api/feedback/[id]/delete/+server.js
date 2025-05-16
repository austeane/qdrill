import { json } from '@sveltejs/kit';
import { deleteFeedback } from '$lib/server/feedback.js';
import { handleApiError } from '../../../utils/handleApiError.js';
import { NotFoundError } from '$lib/server/errors.js';

export async function DELETE({ params }) {
	// TODO: Implement proper authentication and authorization
	// For now, allowing deletion based on ID
	const { id } = params;
	try {
		// Assuming deleteFeedback might throw NotFoundError if the ID doesn't exist
		await deleteFeedback(id);
		// Return 204 No Content for successful deletions
		return new Response(null, { status: 204 });
	} catch (error) {
		return handleApiError(error);
	}
}
