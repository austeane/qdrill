import { json } from '@sveltejs/kit';

const API_BASE_URL = 'http://127.0.0.1:5000';

export async function POST({ request }) {
    let drill;
    try {
        drill = await request.json();
    } catch (error) {
        console.error('Error parsing JSON request:', error);
        return json({ error: 'Failed to parse JSON request' }, { status: 400 });
    }
    console.log('Request body:', drill);
    const response = await fetch(`${API_BASE_URL}/api/drills`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(drill)
    });

    try {
        if (response.ok) {
            const data = await response.json();
            console.log('Response status:', response.status);
            console.log('Response body:', data);
            return json(data);
        } else {
            console.log('Response status:', response.status);
            const errorData = await response.json();
            console.log('Response body:', errorData);
            return json({ error: 'Failed to create drill' }, { status: response.status });
        }
    } catch (error) {
        console.error('Error parsing JSON response:', error);
        return json({ error: 'Failed to parse JSON response' }, { status: 500 });
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
