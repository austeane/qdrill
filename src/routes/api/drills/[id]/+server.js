import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';
import { dev } from '$app/environment';

const client = createClient();
await client.connect();

const ERROR_MESSAGES = {
    NOT_FOUND: (id) => `Drill with ID ${id} not found`,
    UNAUTHORIZED: 'Unauthorized access',
    DB_ERROR: 'Database operation failed',
    INVALID_INPUT: 'Invalid input data'
};

// Helper function for error responses
function errorResponse(message, status = 500) {
    console.error(`[Error] ${message}`);
    return json({ error: message }, { status });
}

export async function GET({ params, locals, url }) {
    const { id } = params;
    const includeVariants = url.searchParams.get('includeVariants') === 'true';
    
    if (!id || isNaN(parseInt(id))) {
        return errorResponse(ERROR_MESSAGES.INVALID_INPUT, 400);
    }

    try {
        // First fetch the main drill
        const drillResult = await client.query(
            `SELECT d.* 
             FROM drills d 
             WHERE d.id = $1`,
            [id]
        );

        if (drillResult.rows.length === 0) {
            return errorResponse(ERROR_MESSAGES.NOT_FOUND(id), 404);
        }

        const drill = drillResult.rows[0];

        // Check visibility and ownership (skip in development)
        if (!dev && drill.visibility === 'private') {
            const session = await locals.getSession();
            const userId = session?.user?.id;
            
            // If private drill and no user session, or user is not the owner
            if (!userId || drill.created_by !== userId) {
                return json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        // Only fetch variants if requested
        if (includeVariants) {
            // Add variations data separately
            if (!drill.parent_drill_id) {
                // This is a parent drill - get its variations
                const variationsResult = await client.query(
                    `SELECT d.*, u.name as creator_name
                     FROM drills d
                     LEFT JOIN users u ON d.created_by = u.id
                     WHERE d.parent_drill_id = $1
                     ORDER BY d.upvotes DESC`,
                    [id]
                );
                drill.variations = variationsResult.rows;
                drill.variation_count = variationsResult.rows.length;
            } else {
                // This is a variation - get parent name and siblings
                const parentResult = await client.query(
                    `SELECT name FROM drills WHERE id = $1`,
                    [drill.parent_drill_id]
                );
                drill.parent_drill_name = parentResult.rows[0]?.name;
            }
        }

        return json(drill);
    } catch (error) {
        console.error(`[Database Error] Fetching drill ${id}:`, error);
        return errorResponse(ERROR_MESSAGES.DB_ERROR);
    }
}

export async function PUT({ params, request, locals }) {
    const { id } = params;
    
    try {
        const drill = await request.json();
        
        // Basic input validation
        if (!drill.name || !drill.drill_type) {
            return errorResponse('Required fields missing', 400);
        }

        await client.query('BEGIN');

        try {
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
            throw error; // Re-throw to be caught by outer catch
        }
    } catch (error) {
        console.error(`[Update Error] Drill ${id}:`, error);
        return errorResponse(
            error.code === '23505' ? 'Duplicate entry found' : ERROR_MESSAGES.DB_ERROR
        );
    }
}

export async function DELETE({ params, locals }) {
    const { id } = params;
    
    try {
        await client.query('BEGIN');

        try {
            // Check if user owns the drill (skip in development)
            if (!dev) {
                const checkResult = await client.query(
                    'SELECT created_by FROM drills WHERE id = $1',
                    [id]
                );

                if (checkResult.rows.length === 0) {
                    return json({ error: 'Drill not found' }, { status: 404 });
                }

                if (checkResult.rows[0].created_by !== locals.userId) {
                    return json({ error: 'Unauthorized' }, { status: 403 });
                }
            }

            // Delete the drill
            await client.query('DELETE FROM drills WHERE id = $1', [id]);
            
            await client.query('COMMIT');
            return json({ success: true });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error(`[Delete Error] Drill ${id}:`, error);
        return errorResponse(
            error.code === '23503' ? 'Cannot delete: drill is referenced by other items' : 
            ERROR_MESSAGES.DB_ERROR
        );
    }
}
