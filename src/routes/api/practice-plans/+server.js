import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';

const client = createClient();
await client.connect();

export async function POST({ request }) {
    const practicePlan = await request.json();
    const { name, practice_goals, phase_of_season, number_of_participants, level_of_experience, skills_focused_on, overview, time_per_drill, breaks_between_drills, total_practice_time, drills } = practicePlan;

    try {
        // First, insert the practice plan
        const planResult = await client.query(
            `INSERT INTO practice_plans (name, practice_goals, phase_of_season, number_of_participants, level_of_experience, skills_focused_on, overview, time_per_drill, breaks_between_drills, total_practice_time) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [name, practice_goals, phase_of_season, number_of_participants, level_of_experience, skills_focused_on, overview, time_per_drill, breaks_between_drills, total_practice_time]
        );
        
        const planId = planResult.rows[0].id;

        // Then, insert the drills associated with this plan
        for (const drill of drills) {
            await client.query(
                `INSERT INTO practice_plan_drills (practice_plan_id, drill_id, order_in_plan) 
                VALUES ($1, $2, $3)`,
                [planId, drill.id, drill.order]
            );
        }

        return json({ id: planId, message: 'Practice plan created successfully' });
    } catch (error) {
        console.error('Error occurred while inserting practice plan:', error);
        return json({ error: 'An error occurred while creating the practice plan', details: error.toString() }, { status: 500 });
    }
}

export async function GET() {
    try {
        const result = await client.query('SELECT * FROM practice_plans');
        return json(result.rows);
    } catch (error) {
        console.error('Error occurred while fetching practice plans:', error);
        return json({ error: 'Failed to retrieve practice plans', details: error.toString() }, { status: 500 });
    }
}
