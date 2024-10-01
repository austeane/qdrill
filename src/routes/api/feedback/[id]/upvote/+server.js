import { json } from '@sveltejs/kit';
import { upvoteFeedback } from '$lib/server/feedback.js';

export async function POST({ params }) {
    const { id } = params;
    try {
        const updatedFeedback = await upvoteFeedback(id);
        return json(updatedFeedback);
    } catch (error) {
        console.error('Error upvoting feedback:', error);
        return json({ error: 'Failed to upvote feedback' }, { status: 500 });
    }
}