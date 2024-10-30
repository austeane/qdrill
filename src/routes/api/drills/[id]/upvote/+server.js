import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';
import { error } from '@sveltejs/kit';

const client = createClient();
await client.connect();

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
        // First verify the drill exists
        const drillExists = await client.query(
            'SELECT id FROM drills WHERE id = $1',
            [drillId]
        );

        if (drillExists.rows.length === 0) {
            throw error(404, 'Drill not found');
        }

        // Check if user has already voted
        const voteCheck = await client.query(
            'SELECT * FROM votes WHERE user_id = $1 AND drill_id = $2',
            [userId, drillId]
        );

        if (voteCheck.rows.length > 0) {
            // User has already voted, remove their vote
            await client.query(
                'DELETE FROM votes WHERE user_id = $1 AND drill_id = $2',
                [userId, drillId]
            );
        } else {
            // Add new vote
            await client.query(
                'INSERT INTO votes (user_id, drill_id, vote) VALUES ($1, $2, $3)',
                [userId, drillId, 1]
            );
        }

        // Get updated vote count
        const result = await client.query(
            `SELECT COUNT(CASE WHEN vote = 1 THEN 1 END) as upvotes
             FROM votes 
             WHERE drill_id = $1`,
            [drillId]
        );

        return json({ upvotes: result.rows[0].upvotes });
    } catch (error) {
        console.error('Error upvoting drill:', error);
        if (error.status) throw error;
        return json({ error: 'Failed to upvote drill' }, { status: 500 });
    }
} 