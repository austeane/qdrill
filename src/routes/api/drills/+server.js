import { json } from '@sveltejs/kit';

const API_BASE_URL = 'http://localhost:5000';

export async function POST({ request }) {
    const drill = await request.json();
    const response = await fetch(`${API_BASE_URL}/api/drills`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(drill)
    });

    if (response.ok) {
        const data = await response.json();
        return json(data);
    } else {
        return json({ error: 'Failed to create drill' }, { status: response.status });
    }
}

export async function GET() {
    const response = await fetch(`${API_BASE_URL}/api/drills`);

    if (response.ok) {
        const data = await response.json();
        return json(data);
    } else {
        return json({ error: 'Failed to retrieve drills' }, { status: response.status });
    }
}
