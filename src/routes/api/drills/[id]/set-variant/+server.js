import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';

const client = createClient();
await client.connect();

export async function PUT({ params, request }) {
    const { id } = params;
    const { parentDrillId } = await request.json();

    try {
        await client.query('BEGIN');

        // Check if the current drill exists and get its details
        const drillResult = await client.query(
            `SELECT d.*, 
                    (SELECT COUNT(*) FROM drills WHERE parent_drill_id = d.id) as child_count
             FROM drills d 
             WHERE d.id = $1`,
            [id]
        );

        if (drillResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return json({ error: 'Drill not found' }, { status: 404 });
        }

        const currentDrill = drillResult.rows[0];

        if (parentDrillId) {
            // Check if the parent drill exists and is valid
            const parentResult = await client.query(
                `SELECT d.*, 
                        (SELECT COUNT(*) FROM drills WHERE parent_drill_id = d.id) as child_count
                 FROM drills d 
                 WHERE d.id = $1`,
                [parentDrillId]
            );

            if (parentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return json({ error: 'Parent drill not found' }, { status: 404 });
            }

            const parentDrill = parentResult.rows[0];

            // Validate constraints
            if (currentDrill.child_count > 0) {
                await client.query('ROLLBACK');
                return json({ error: 'Cannot make a parent drill into a variant' }, { status: 400 });
            }

            if (parentDrill.parent_drill_id) {
                await client.query('ROLLBACK');
                return json({ error: 'Cannot set a variant as a parent' }, { status: 400 });
            }
        }

        // Update the parent_drill_id
        const result = await client.query(
            `UPDATE drills 
             SET parent_drill_id = $1 
             WHERE id = $2 
             RETURNING *, 
               (SELECT name FROM drills WHERE id = $1) as parent_drill_name`,
            [parentDrillId, id]
        );

        await client.query('COMMIT');
        return json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error setting variant relationship:', error);
        return json({ error: 'Failed to set variant relationship' }, { status: 500 });
    }
} 