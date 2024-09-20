import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';

const client = createClient();
await client.connect();

export async function POST({ request }) {
    const practicePlan = await request.json();
    const { name, description, drills } = practicePlan;

    // Data validation
    if (!name || !drills || !Array.isArray(drills) || drills.length === 0) {
        return json({ error: 'Invalid practice plan data' }, { status: 400 });
    }

    try {
        // Start a transaction
        await client.query('BEGIN');

        // Insert the practice plan
        const planResult = await client.query(
            `INSERT INTO practice_plans (name, description) 
            VALUES ($1, $2) RETURNING id`,
            [name, description]
        );
        
        const planId = planResult.rows[0].id;

        // Insert the drills associated with this plan
        for (let i = 0; i < drills.length; i++) {
            const drill = drills[i];
            if (drill.type === 'drill') {
                // Ensure duration is present
                const duration = drill.duration || (drill.min_duration && drill.max_duration 
                    ? Math.floor((drill.min_duration + drill.max_duration) / 2) 
                    : null);
                
                if (!duration) {
                    throw new Error(`Duration not specified for drill ID ${drill.id}`);
                }

                await client.query(
                    `INSERT INTO practice_plan_drills (practice_plan_id, drill_id, order_in_plan, duration) 
                    VALUES ($1, $2, $3, $4)`,
                    [planId, drill.id, i + 1, duration]
                );
            } else if (drill.type === 'break') {
                await client.query(
                    `INSERT INTO practice_plan_breaks (practice_plan_id, order_in_plan, duration) 
                    VALUES ($1, $2, $3)`,
                    [planId, i + 1, drill.duration]
                );
            }
        }

        // Commit the transaction
        await client.query('COMMIT');

        console.log(`Practice plan created successfully. ID: ${planId}`);
        return json({ id: planId, message: 'Practice plan created successfully' }, { status: 201 });
    } catch (error) {
        // Rollback the transaction in case of error
        await client.query('ROLLBACK');
        console.error('Error occurred while inserting practice plan:', error);
        return json({ error: 'An error occurred while creating the practice plan', details: error.toString() }, { status: 500 });
    }
}

export async function GET() {
    try {
        const result = await client.query(`
            SELECT pp.*, 
                   array_agg(ppd.drill_id ORDER BY ppd.order_in_plan) as drills,
                   array_agg(ppd.duration ORDER BY ppd.order_in_plan) as drill_durations
            FROM practice_plans pp
            LEFT JOIN practice_plan_drills ppd ON pp.id = ppd.practice_plan_id
            GROUP BY pp.id
            ORDER BY pp.created_at DESC
        `);
        console.log(`Retrieved ${result.rows.length} practice plans`);
        return json(result.rows);
    } catch (error) {
        console.error('Error occurred while fetching practice plans:', error);
        return json({ error: 'Failed to retrieve practice plans', details: error.toString() }, { status: 500 });
    }
}
