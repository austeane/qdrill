import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService';

export async function POST({ params, locals }) {
    const drillId = parseInt(params.id);
    
    // Validate drill ID
    if (!drillId || isNaN(drillId)) {
        throw error(400, 'Invalid drill ID');
    }

    const session = await locals.getSession();
    const userId = session?.user?.id;

    if (!userId) {
        return json({ error: 'Login required to upvote' }, { status: 401 });
    }

    try {
        // Use the drillService to handle the upvote logic
        const result = await drillService.toggleUpvote(drillId, userId);
        
        return json({ 
            upvotes: result.upvotes,
            hasVoted: result.hasVoted
        });
    } catch (err) {
        console.error('Error upvoting drill:', err);
        
        // Handle specific errors with appropriate status codes
        if (err.message === 'Drill not found') {
            throw error(404, 'Drill not found');
        }
        
        return json({ error: 'Failed to upvote drill' }, { status: 500 });
    }
}