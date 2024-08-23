import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';

const client = createClient();
await client.connect();

export async function POST({ request }) {
    const drill = await request.json();
    let { name, brief_description, detailed_description, skill_level, complexity, suggested_length, number_of_people, skills_focused_on, positions_focused_on, video_link, images } = drill;

    if (typeof skills_focused_on === 'string') {
        skills_focused_on = [skills_focused_on];
    }

    if (typeof positions_focused_on === 'string') {
        positions_focused_on = [positions_focused_on];
    }

    if (!Array.isArray(images)) {
        images = [];
    }

    try {
        const result = await client.query(
            `INSERT INTO drills (name, brief_description, detailed_description, skill_level, complexity, suggested_length, number_of_people_min, number_of_people_max, skills_focused_on, positions_focused_on, video_link, images) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [name, brief_description, detailed_description, skill_level, complexity, suggested_length, number_of_people.min, number_of_people.max, skills_focused_on, positions_focused_on, video_link, images]
        );
        return json(result.rows[0]);
    } catch (error) {
        console.error('Error occurred while inserting drill:', error);
        return json({ error: 'An error occurred while creating the drill', details: error.toString() }, { status: 500 });
    }
}

export async function GET() {
    try {
        const result = await client.query('SELECT * FROM drills');
        const drills = result.rows.map(drill => {
            drill.comments = Array.isArray(drill.comments) ? drill.comments : [];
            drill.images = Array.isArray(drill.images) ? drill.images : [];
            return drill;
        });
        return json(drills);
    } catch (error) {
        console.error('Error occurred while fetching drills:', error);
        return json({ error: 'Failed to retrieve drills', details: error.toString() }, { status: 500 });
    }
}
