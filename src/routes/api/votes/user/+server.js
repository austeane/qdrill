import { json } from '@sveltejs/kit';
import * as db from '$lib/server/db';

export async function GET({ url, locals }) {
    const session = locals.session;
    const userId = session?.user?.id;
    
    if (!userId) {
        return json(null);
    }

    const drillId = url.searchParams.get('drillId');
    const practicePlanId = url.searchParams.get('practicePlanId');

    if (!drillId && !practicePlanId) {
        return json({ error: 'Missing drillId or practicePlanId' }, { status: 400 });
    }

    try {
        let query = '';
        let params = [];

        if (drillId) {
            query = 'SELECT vote FROM votes WHERE user_id = $1 AND drill_id = $2';
            params = [userId, drillId];
        } else {
            query = 'SELECT vote FROM votes WHERE user_id = $1 AND practice_plan_id = $2';
            params = [userId, practicePlanId];
        }

        const result = await db.query(query, params);
        return json(result.rows[0] || { vote: 0 });
    } catch (error) {
        console.error('Error fetching user vote:', error);
        return json({ error: 'Failed to fetch user vote' }, { status: 500 });
    }
} 