import { json } from '@sveltejs/kit';

const API_BASE_URL = 'http://127.0.0.1:5000';

export async function POST({ request }) {
    const practicePlan = await request.json();
    const response = await fetch(`${API_BASE_URL}/api/practice-plans`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(practicePlan)
    });

    try {
        if (response.ok) {
            const data = await response.json();
            return json(data);
        } else {
            const errorData = await response.json();
            return json({ error: 'Failed to create practice plan' }, { status: response.status });
        }
    } catch (error) {
        console.error('Error parsing JSON response:', error);
        return json({ error: 'Failed to parse JSON response' }, { status: 500 });
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
