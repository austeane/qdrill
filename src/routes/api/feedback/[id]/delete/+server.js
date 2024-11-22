import { json } from '@sveltejs/kit';
import { deleteFeedback } from '$lib/server/feedback.js';

export async function DELETE({ params }) {
    // In production, you'd want proper auth checking here
    // For localhost/development, we'll allow all deletions
    const { id } = params;
    try {
        const deletedFeedback = await deleteFeedback(id);
        return json(deletedFeedback);
    } catch (error) {
        console.error('Error deleting feedback:', error);
        return json({ error: 'Failed to delete feedback' }, { status: 500 });
    }
}