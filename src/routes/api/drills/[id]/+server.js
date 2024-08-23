import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';

const client = createClient();
await client.connect();

export async function GET({ params }) {
    const { id } = params;
    console.log(`Fetching drill with ID: ${id}`);
    const drillId = parseInt(id, 10);
    try {
        const result = await client.query('SELECT * FROM drills WHERE id = $1', [drillId]);
        if (result.rows.length > 0) {
            const data = result.rows[0];
            data.comments = Array.isArray(data.comments) ? data.comments : [];
            data.images = Array.isArray(data.images) ? data.images : [];
            return json(data);
        } else {
            return json({ error: `Drill with ID ${drillId} not found` }, { status: 404 });
        }
    } catch (error) {
        console.error(`Error occurred while fetching drill with ID ${drillId}:`, error);
        return json({ error: 'An error occurred while fetching the drill', details: error.toString() }, { status: 500 });
    }
}
