import { json } from '@sveltejs/kit';
import { fabricToExcalidraw } from '$lib/utils/diagramMigration';
import { dev } from '$app/environment';

export async function POST({ request }) {
    // Only allow in development mode
    if (!dev) {
        return json({ error: 'Not available in production' }, { status: 403 });
    }

    try {
        const { diagram } = await request.json();
        const convertedDiagram = fabricToExcalidraw(diagram);
        return json(convertedDiagram);
    } catch (error) {
        console.error('Error in test migration:', error);
        return json({ error: error.message }, { status: 500 });
    }
} 