import { json } from '@sveltejs/kit';
import { saveFeedback, getAllFeedback } from '$lib/server/feedback.js';
import { handleApiError } from '../utils/handleApiError.js';

export async function GET() {
	try {
		const feedback = await getAllFeedback();
		return json(feedback);
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST({ request }) {
	try {
		const data = await request.json();
		if (!data.feedback || !data.feedbackType) {
			return json(
				{ error: { code: 'BAD_REQUEST', message: 'Feedback text and type are required.' } },
				{ status: 400 }
			);
		}
		const savedFeedback = await saveFeedback(data);
		return json(savedFeedback, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}
