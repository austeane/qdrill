import { json } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import { createClient } from '@vercel/postgres';

const client = createClient();
await client.connect();

export const GET = authGuard(async (event) => {
    const session = await event.locals.getSession();
    const userId = session.user.id;

    try {
        // Fetch drills created by the user
        const drillsResult = await client.query(
            `SELECT * FROM drills WHERE created_by = $1`,
            [userId]
        );
        const drills = drillsResult.rows;

        // Fetch practice plans created by the user
        const practicePlansResult = await client.query(
            `SELECT * FROM practice_plans WHERE created_by = $1`,
            [userId]
        );
        const practicePlans = practicePlansResult.rows;

        // Fetch votes made by the user
        const votesResult = await client.query(
            `SELECT v.*, 
                    CASE 
                        WHEN v.drill_id IS NOT NULL THEN 'drill' 
                        WHEN v.practice_plan_id IS NOT NULL THEN 'practice_plan' 
                    END AS type 
             FROM votes v 
             WHERE v.user_id = $1`,
            [userId]
        );
        const votes = votesResult.rows;

        // Fetch comments made by the user
        const commentsResult = await client.query(
            `SELECT c.*, 
                    CASE 
                        WHEN c.drill_id IS NOT NULL THEN 'drill' 
                        WHEN c.practice_plan_id IS NOT NULL THEN 'practice_plan' 
                    END AS type,
                    d.name AS drill_name,
                    pp.name AS practice_plan_name
             FROM comments c 
             LEFT JOIN drills d ON c.drill_id = d.id 
             LEFT JOIN practice_plans pp ON c.practice_plan_id = pp.id 
             WHERE c.user_id = $1
             ORDER BY c.created_at DESC`,
            [userId]
        );
        const comments = commentsResult.rows;

        return json({
            drills,
            practicePlans,
            votes,
            comments
        });
    } catch (error) {
        console.error('Error fetching user profile data:', error);
        return json({ error: 'Failed to fetch profile data' }, { status: 500 });
    }
});