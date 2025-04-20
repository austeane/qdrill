import { json } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import * as db from '$lib/server/db';
import { handleApiError } from '../utils/handleApiError.js';
import { NotFoundError } from '$lib/server/errors.js';

// POST: Cast or update a vote
export const POST = authGuard(async ({ request, locals }) => {
    const session = locals.session;
    const userId = session.user.id;
    const body = await request.json();
    
    const { drillId, practicePlanId, vote } = body;

    if ((!drillId && !practicePlanId) || ![1, -1].includes(vote)) {
        console.error('Invalid vote input:', { drillId, practicePlanId, vote });
        return json({ error: { code: 'BAD_REQUEST', message: 'Invalid input: Requires drillId or practicePlanId, and vote must be 1 or -1' } }, { status: 400 });
    }

    try {
        if (drillId) {
            const drillResult = await db.query('SELECT name FROM drills WHERE id = $1', [drillId]);
            if (drillResult.rows.length === 0) {
                throw new NotFoundError('Drill not found');
            }
            const drillName = drillResult.rows[0].name;

            await db.query(
                `INSERT INTO votes (user_id, drill_id, vote, item_name) 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (user_id, drill_id) 
                 DO UPDATE SET vote = EXCLUDED.vote, updated_at = CURRENT_TIMESTAMP`,
                [userId, drillId, vote, drillName]
            );
        } else {
            const planResult = await db.query('SELECT name FROM practice_plans WHERE id = $1', [practicePlanId]);
            if (planResult.rows.length === 0) {
                throw new NotFoundError('Practice plan not found');
            }
            const planName = planResult.rows[0].name;

            await db.query(
                `INSERT INTO votes (user_id, practice_plan_id, vote, item_name) 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (user_id, practice_plan_id) 
                 DO UPDATE SET vote = EXCLUDED.vote, updated_at = CURRENT_TIMESTAMP`,
                [userId, practicePlanId, vote, planName]
            );
        }

        return json({ message: 'Vote recorded successfully' });
    } catch (error) {
        return handleApiError(error);
    }
});

// DELETE: Remove a vote
export const DELETE = authGuard(async ({ url, locals }) => {
    const session = locals.session;
    const userId = session?.user?.id;

    const drillId = url.searchParams.get('drillId');
    const practicePlanId = url.searchParams.get('practicePlanId');

    if (!drillId && !practicePlanId) {
        return json({ error: { code: 'BAD_REQUEST', message: 'Missing drillId or practicePlanId' } }, { status: 400 });
    }

    try {
        if (drillId) {
            await db.query(
                'DELETE FROM votes WHERE user_id = $1 AND drill_id = $2',
                [userId, parseInt(drillId, 10)]
            );
        } else {
            await db.query(
                'DELETE FROM votes WHERE user_id = $1 AND practice_plan_id = $2',
                [userId, parseInt(practicePlanId, 10)]
            );
        }

        return new Response(null, { status: 204 });
    } catch (error) {
        return handleApiError(error);
    }
});

// GET: Fetch vote counts for a drill or practice plan
export async function GET({ url }) {
    const drillId = url.searchParams.get('drillId');
    const practicePlanId = url.searchParams.get('practicePlanId');

    if (!drillId && !practicePlanId) {
        return json({ error: { code: 'BAD_REQUEST', message: 'Missing drillId or practicePlanId' } }, { status: 400 });
    }

    try {
        let query = '';
        let params = [];
        if (drillId) {
            query = `
                SELECT 
                    COALESCE(SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
                    COALESCE(SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END), 0) AS downvotes
                FROM votes
                WHERE drill_id = $1
            `;
            params.push(parseInt(drillId, 10));
        } else {
            query = `
                SELECT 
                    COALESCE(SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
                    COALESCE(SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END), 0) AS downvotes
                FROM votes
                WHERE practice_plan_id = $1
            `;
            params.push(parseInt(practicePlanId, 10));
        }

        const result = await db.query(query, params);
        const data = result.rows[0] || { upvotes: 0, downvotes: 0 };
        return json(data);
    } catch (error) {
        return handleApiError(error);
    }
}