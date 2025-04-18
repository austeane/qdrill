import { json } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import { createClient } from '@vercel/postgres';

const client = createClient();
await client.connect();

// POST: Cast or update a vote
export const POST = authGuard(async ({ request, locals }) => {
    const session = locals.session;
    const userId = session.user.id;
    const body = await request.json();
    
    const { drillId, practicePlanId, vote } = body;

    if ((!drillId && !practicePlanId) || ![1, -1].includes(vote)) {
        console.error('Invalid vote input:', { drillId, practicePlanId, vote });
        return json({ error: 'Invalid input' }, { status: 400 });
    }

    try {
        if (drillId) {
            // Get drill name and insert vote
            const drillResult = await client.query('SELECT name FROM drills WHERE id = $1', [drillId]);
            if (drillResult.rows.length === 0) {
                return json({ error: 'Drill not found' }, { status: 404 });
            }
            const drillName = drillResult.rows[0].name;

            await client.query(
                `INSERT INTO votes (user_id, drill_id, vote, item_name) 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (user_id, drill_id) 
                 DO UPDATE SET vote = EXCLUDED.vote, updated_at = CURRENT_TIMESTAMP`,
                [userId, drillId, vote, drillName]
            );
        } else {
            // Get practice plan name and insert vote
            const planResult = await client.query('SELECT name FROM practice_plans WHERE id = $1', [practicePlanId]);
            if (planResult.rows.length === 0) {
                return json({ error: 'Practice plan not found' }, { status: 404 });
            }
            const planName = planResult.rows[0].name;

            await client.query(
                `INSERT INTO votes (user_id, practice_plan_id, vote, item_name) 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (user_id, practice_plan_id) 
                 DO UPDATE SET vote = EXCLUDED.vote, updated_at = CURRENT_TIMESTAMP`,
                [userId, practicePlanId, vote, planName]
            );
        }

        return json({ message: 'Vote recorded successfully' });
    } catch (error) {
        console.error('Error recording vote:', error);
        return json({ error: 'Failed to record vote' }, { status: 500 });
    }
});

// DELETE: Remove a vote
export const DELETE = authGuard(async ({ url, locals }) => {
    const session = locals.session;
    const userId = session?.user?.id;

    if (!userId) {
        return json({ error: 'User not authenticated' }, { status: 401 });
    }

    const drillId = url.searchParams.get('drillId');
    const practicePlanId = url.searchParams.get('practicePlanId');

    if (!drillId && !practicePlanId) {
        return json({ error: 'Missing drillId or practicePlanId' }, { status: 400 });
    }

    try {
        if (drillId) {
            await client.query(
                'DELETE FROM votes WHERE user_id = $1 AND drill_id = $2',
                [userId, parseInt(drillId, 10)]
            );
        } else {
            await client.query(
                'DELETE FROM votes WHERE user_id = $1 AND practice_plan_id = $2',
                [userId, parseInt(practicePlanId, 10)]
            );
        }

        return json({ message: 'Vote removed successfully' });
    } catch (error) {
        console.error('Error removing vote:', error);
        return json({ error: 'Failed to remove vote' }, { status: 500 });
    }
});

// GET: Fetch vote counts for a drill or practice plan
export async function GET({ url }) {
    const drillId = url.searchParams.get('drillId');
    const practicePlanId = url.searchParams.get('practicePlanId');

    if (!drillId && !practicePlanId) {
        return json({ error: 'Missing drillId or practicePlanId' }, { status: 400 });
    }

    try {
        let query = '';
        let params = [];
        if (drillId) {
            query = `
                SELECT 
                    SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) AS upvotes,
                    SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) AS downvotes
                FROM votes
                WHERE drill_id = $1
            `;
            params.push(parseInt(drillId, 10));
        } else {
            query = `
                SELECT 
                    SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) AS upvotes,
                    SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) AS downvotes
                FROM votes
                WHERE practice_plan_id = $1
            `;
            params.push(parseInt(practicePlanId, 10));
        }

        const result = await client.query(query, params);
        return json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching vote counts:', error);
        return json({ error: 'Failed to fetch vote counts' }, { status: 500 });
    }
}