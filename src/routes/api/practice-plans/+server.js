import { json } from '@sveltejs/kit';

const API_BASE_URL = 'http://localhost:8000';

export async function POST({ request }) {
    const practicePlan = await request.json();
    const response = await fetch(`${API_BASE_URL}/api/practice-plans`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(practicePlan)
    });

    if (response.ok) {
        const data = await response.json();
        return json(data);
    } else {
        return json({ error: 'Failed to create practice plan' }, { status: response.status });
    }
}

export async function GET() {
    const response = await fetch(`${API_BASE_URL}/api/practice-plans`);

    if (response.ok) {
        const data = await response.json();
        return json(data);
    } else {
        return json({ error: 'Failed to retrieve practice plans' }, { status: response.status });
    }
}
