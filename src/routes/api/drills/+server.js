import { json } from '@sveltejs/kit';

const API_BASE_URL = 'http://localhost:5000';

export async function POST({ request }) {
    const drill = await request.json();
    console.log('Request body:', drill);
    console.log('Sending request to Flask server...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/drills`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(drill)
        });
        console.log('Response received from Flask server.');
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
        console.error('Error occurred while sending request:', error);
        return json({ error: 'An error occurred while sending the request' }, { status: 500 });
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
