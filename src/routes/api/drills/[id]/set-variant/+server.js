import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService';

export async function PUT({ params, request }) {
    const drillId = parseInt(params.id);
    const { parentDrillId } = await request.json();
    
    // Validate drill ID
    if (!drillId || isNaN(drillId)) {
        return json({ error: 'Invalid drill ID' }, { status: 400 });
    }

    try {
        // Use the drillService to handle setting the variant relationship
        const result = await drillService.setVariant(drillId, parentDrillId);
        
        return json(result);
    } catch (err) {
        console.error('Error setting variant relationship:', err);
        
        // Handle specific errors with appropriate status codes
        if (err.message === 'Drill not found') {
            return json({ error: 'Drill not found' }, { status: 404 });
        }
        
        if (err.message === 'Parent drill not found') {
            return json({ error: 'Parent drill not found' }, { status: 404 });
        }
        
        if (err.message === 'Cannot make a parent drill into a variant') {
            return json({ error: 'Cannot make a parent drill into a variant' }, { status: 400 });
        }
        
        if (err.message === 'Cannot set a variant as a parent') {
            return json({ error: 'Cannot set a variant as a parent' }, { status: 400 });
        }
        
        if (err.message === 'Drill cannot be its own parent') {
            return json({ error: 'Drill cannot be its own parent' }, { status: 400 });
        }
        
        return json({ error: 'Failed to set variant relationship' }, { status: 500 });
    }
}