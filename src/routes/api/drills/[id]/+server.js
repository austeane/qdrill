import { json } from '@sveltejs/kit';

const API_BASE_URL = 'http://127.0.0.1:5000';

export async function GET({ params }) {
    const { id } = params;
    try {
        const response = await fetch(`${API_BASE_URL}/api/drills/${id}`);
        if (response.ok) {
            const data = await response.json();
            return json(data);
        } else {
            return json({ error: `Drill with ID ${id} not found` }, { status: 404 });
        }
    } catch (error) {
        console.error(`Error occurred while fetching drill with ID ${id}:`, error);
        return json({ error: 'An error occurred while fetching the drill', details: error.toString() }, { status: 500 });
    }
}
