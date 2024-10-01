import { json } from '@sveltejs/kit';
import { saveFeedback, getAllFeedback, upvoteFeedback } from '$lib/server/feedback.js';

export async function GET() {
    const feedback = await getAllFeedback();
    return json(feedback);
}

export async function POST({ request }) {
    const data = await request.json();
    if (!data.feedback || !data.feedbackType) {
        return json({ error: 'Feedback text and type are required.' }, { status: 400 });
    }
    const savedFeedback = await saveFeedback(data);
    return json(savedFeedback, { status: 201 });
}