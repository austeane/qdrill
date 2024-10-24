import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';

const client = createClient();
await client.connect();

export async function GET({ params, locals }) {
    const { id } = params;
    const session = await locals.getSession();
    const userId = session?.user?.id;

    try {
        const result = await client.query(
            'SELECT * FROM drills WHERE id = $1',
            [id]
        );

        if (result.rows.length > 0) {
            const drill = result.rows[0];

            // Check visibility and ownership
            if (
                drill.visibility === 'private' &&
                drill.created_by !== userId
            ) {
                return json(
                    { error: 'Unauthorized' },
                    { status: 403 }
                );
            }

            // Process drill data
            drill.comments = Array.isArray(drill.comments) ? drill.comments : [];
            drill.images = Array.isArray(drill.images) ? drill.images : [];
            drill.diagrams = Array.isArray(drill.diagrams) ? drill.diagrams.map(diagram => {
                try {
                    return typeof diagram === 'string' ? JSON.parse(diagram) : diagram;
                } catch (e) {
                    console.error('Error parsing diagram:', e);
                    return null;
                }
            }).filter(diagram => diagram !== null) : [];
            return json(drill);
        } else {
            return json({ error: `Drill with ID ${id} not found` }, { status: 404 });
        }
    } catch (error) {
        console.error(`Error occurred while fetching drill with ID ${id}:`, error);
        return json({ error: 'An error occurred while fetching the drill', details: error.toString() }, { status: 500 });
    }
}

export async function PUT({ params, request }) {
    const { id } = params;
    const drill = await request.json();
    

    try {
        // Ensure diagrams is an array of strings
        const diagrams = Array.isArray(drill.diagrams) 
            ? drill.diagrams.map(diagram => JSON.stringify(diagram))
            : drill.diagrams ? [JSON.stringify(drill.diagrams)] : [];
        

        // Update the drill in the database
        const result = await client.query(
            `UPDATE drills SET 
            name = $1, brief_description = $2, detailed_description = $3, 
            skill_level = $4, complexity = $5, suggested_length = $6, 
            number_of_people_min = $7, number_of_people_max = $8, 
            skills_focused_on = $9, positions_focused_on = $10, 
            video_link = $11, images = $12, diagrams = $13, drill_type = $14
            WHERE id = $15 RETURNING *`,
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
                diagrams,
                drill.drill_type,
                id
            ]
        );
        
        return json(result.rows[0]);
    } catch (error) {
        console.error('Error updating drill:', error);
        return json({ error: 'An error occurred while updating the drill', details: error.toString() }, { status: 500 });
    }
}
