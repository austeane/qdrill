import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';

const client = createClient();
await client.connect();

export async function POST({ params, locals }) {
    const { id } = params;
    const session = await locals.getSession();
    const userId = session?.user?.id;

    try {
        await client.query('BEGIN');

        // First fetch the original practice plan
        const planResult = await client.query(
            `SELECT * FROM practice_plans WHERE id = $1`,
            [id]
        );

        if (planResult.rows.length === 0) {
            return json({ error: 'Practice plan not found' }, { status: 404 });
        }

        const originalPlan = planResult.rows[0];

        // Create new practice plan with copied data
        const newPlanResult = await client.query(
            `INSERT INTO practice_plans (
                name, description, practice_goals, phase_of_season,
                estimated_number_of_participants, created_by,
                visibility, is_editable_by_others, start_time
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                `${originalPlan.name} (Copy)`,
                originalPlan.description,
                originalPlan.practice_goals,
                originalPlan.phase_of_season,
                originalPlan.estimated_number_of_participants,
                userId,
                originalPlan.visibility,
                originalPlan.is_editable_by_others,
                originalPlan.start_time
            ]
        );

        const newPlanId = newPlanResult.rows[0].id;

        // Copy sections
        const sectionsResult = await client.query(
            `SELECT * FROM practice_plan_sections 
             WHERE practice_plan_id = $1 
             ORDER BY "order"`,
            [id]
        );

        for (const section of sectionsResult.rows) {
            // Insert section
            const newSectionResult = await client.query(
                `INSERT INTO practice_plan_sections 
                 (practice_plan_id, name, "order", goals, notes)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id`,
                [newPlanId, section.name, section.order, section.goals, section.notes]
            );

            const newSectionId = newSectionResult.rows[0].id;

            // Copy drills for this section
            const drillsResult = await client.query(
                `SELECT * FROM practice_plan_drills 
                 WHERE practice_plan_id = $1 AND section_id = $2
                 ORDER BY order_in_plan`,
                [id, section.id]
            );

            for (const drill of drillsResult.rows) {
                await client.query(
                    `INSERT INTO practice_plan_drills 
                     (practice_plan_id, section_id, drill_id, order_in_plan, 
                      duration, type, diagram_data, parallel_group_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        newPlanId,
                        newSectionId,
                        drill.drill_id,
                        drill.order_in_plan,
                        drill.duration,
                        drill.type,
                        drill.diagram_data,
                        drill.parallel_group_id
                    ]
                );
            }
        }

        await client.query('COMMIT');
        return json({ 
            success: true, 
            message: 'Practice plan duplicated successfully',
            id: newPlanId
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error duplicating practice plan:', error);
        return json(
            { error: 'Failed to duplicate practice plan', details: error.toString() },
            { status: 500 }
        );
    }
} 