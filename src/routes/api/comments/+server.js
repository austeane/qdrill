import { json } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import * as db from '$lib/server/db';

// GET: Fetch comments for a specific drill or practice plan
export async function GET({ url }) {
    const drillId = url.searchParams.get('drillId');
    const practicePlanId = url.searchParams.get('practicePlanId');

    if (!drillId && !practicePlanId) {
        return json({ error: 'Missing drillId or practicePlanId' }, { status: 400 });
    }

    try {
        let query = 'SELECT c.*, u.name AS user_name FROM comments c JOIN users u ON c.user_id = u.id WHERE ';
        let params = [];
        if (drillId) {
            query += 'c.drill_id = $1';
            params.push(parseInt(drillId, 10));
        } else {
            query += 'c.practice_plan_id = $1';
            params.push(parseInt(practicePlanId, 10));
        }
        query += ' ORDER BY c.created_at ASC';

        const result = await db.query(query, params);
        return json(result.rows);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

// POST: Add a new comment (authenticated)
export const POST = authGuard(async ({ request, locals }) => {
    const session = locals.session;
    const userId = session?.user?.id;
    const { drillId, practicePlanId, content } = await request.json();

    if (!content || (!drillId && !practicePlanId)) {
        return json({ error: 'Content and either drillId or practicePlanId are required' }, { status: 400 });
    }

    try {
        const result = await db.query(
            `INSERT INTO comments (user_id, drill_id, practice_plan_id, content) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [userId, drillId ? parseInt(drillId, 10) : null, practicePlanId ? parseInt(practicePlanId, 10) : null, content]
        );
        return json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error('Error adding comment:', error);
        return json({ error: 'Failed to add comment' }, { status: 500 });
    }
});

// DELETE: Delete a comment (authenticated and authorized)
export const DELETE = authGuard(async ({ url, locals }) => {
    const commentId = url.searchParams.get('id');
    const session = locals.session;
    const userId = session?.user?.id;

    if (!commentId) {
        return json({ error: 'Comment ID is required' }, { status: 400 });
    }

    try {
        // Check if the comment exists and belongs to the user
        const commentResult = await db.query('SELECT * FROM comments WHERE id = $1', [commentId]);
        if (commentResult.rows.length === 0) {
            return json({ error: 'Comment not found' }, { status: 404 });
        }

        const comment = commentResult.rows[0];
        if (comment.user_id !== userId) {
            return json({ error: 'Unauthorized' }, { status: 403 });
        }

        await db.query('DELETE FROM comments WHERE id = $1', [commentId]);
        return json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return json({ error: 'Failed to delete comment' }, { status: 500 });
    }
});