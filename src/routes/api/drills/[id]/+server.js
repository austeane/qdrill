import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';

const client = createClient();
await client.connect();

export async function GET({ params, locals }) {
    const { id } = params;
    const session = await locals.getSession();
    const userId = session?.user?.id;

    try {
        // Fetch the main drill
        const drillResult = await client.query(
            `SELECT d.*, 
                    (SELECT COUNT(*) FROM drills WHERE parent_drill_id = d.id) as variation_count,
                    (SELECT name FROM drills WHERE id = d.parent_drill_id) as parent_drill_name
             FROM drills d 
             WHERE d.id = $1`,
            [id]
        );

        if (drillResult.rows.length === 0) {
            return json({ error: `Drill with ID ${id} not found` }, { status: 404 });
        }

        const drill = drillResult.rows[0];

        // Check visibility and ownership
        if (drill.visibility === 'private' && drill.created_by !== userId) {
            return json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Fetch variations if this is a parent drill
        if (!drill.parent_drill_id) {
            const variationsResult = await client.query(
                `SELECT d.*, u.name as creator_name
                 FROM drills d
                 LEFT JOIN users u ON d.created_by = u.id
                 WHERE d.parent_drill_id = $1
                 ORDER BY d.upvotes DESC`,
                [id]
            );
            drill.variations = variationsResult.rows;
        } else {
            // If this is a variation, fetch the parent and sibling variations
            const relatedResult = await client.query(
                `SELECT d.*, u.name as creator_name,
                        CASE WHEN d.id = $1 THEN 'current'
                             WHEN d.id = $2 THEN 'parent'
                             ELSE 'sibling'
                        END as relationship
                 FROM drills d
                 LEFT JOIN users u ON d.created_by = u.id
                 WHERE d.id = $2 
                    OR d.id = $1
                    OR (d.parent_drill_id = $2 AND d.id != $1)
                 ORDER BY d.upvotes DESC`,
                [id, drill.parent_drill_id]
            );
            drill.related_variations = relatedResult.rows;
        }

        return json(drill);
    } catch (error) {
        console.error(`Error occurred while fetching drill with ID ${id}:`, error);
        return json({ error: 'An error occurred while fetching the drill' }, { status: 500 });
    }
}

export async function PUT({ params, request }) {
    const { id } = params;
    const drill = await request.json();

    try {
        // Start a transaction since we're updating multiple tables
        await client.query('BEGIN');

        // Update the drill
        const result = await client.query(
            `UPDATE drills SET 
            name = $1, brief_description = $2, detailed_description = $3, 
            skill_level = $4, complexity = $5, suggested_length = $6, 
            number_of_people_min = $7, number_of_people_max = $8, 
            skills_focused_on = $9, positions_focused_on = $10, 
            video_link = $11, images = $12, diagrams = $13, drill_type = $14,
            is_editable_by_others = $15, visibility = $16
            WHERE id = $17 RETURNING *`,
            [
                drill.name,
                drill.brief_description,
                drill.detailed_description,
                drill.skill_level,
                drill.complexity,
                drill.suggested_length,
                drill.number_of_people_min,
                drill.number_of_people_max,
                drill.skills_focused_on,
                drill.positions_focused_on,
                drill.video_link,
                drill.images,
                drill.diagrams,
                drill.drill_type,
                drill.is_editable_by_others,
                drill.visibility,
                id
            ]
        );

        // Update the name in votes table if it exists
        await client.query(
            `UPDATE votes 
             SET item_name = $1 
             WHERE drill_id = $2`,
            [drill.name, id]
        );

        await client.query('COMMIT');
        return json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating drill:', error);
        return json({ error: 'Failed to update drill' }, { status: 500 });
    }
}
