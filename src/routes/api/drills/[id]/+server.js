import { json } from '@sveltejs/kit';

const API_BASE_URL = 'http://127.0.0.1:5000';

export async function GET({ params }) {
    const { id } = params;
    console.log(`Fetching drill with ID: ${id}`);
    const drillId = parseInt(id, 10);
    try {
        const response = await fetch(`${API_BASE_URL}/api/drills/${drillId}`);
        if (response.ok) {
            const data = await response.json();
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
