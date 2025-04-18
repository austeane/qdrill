import { json } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService.js';

export async function POST({ params, locals }) {
    const { id: planId } = params;
    const session = locals.session;
    const userId = session?.user?.id;

    if (!userId) {
        return json(
            { error: 'User not authenticated' },
            { status: 401 }
        );
    }

    try {
        const result = await practicePlanService.duplicatePracticePlan(planId, userId);
        
        return json({ 
            success: true, 
            message: 'Practice plan duplicated successfully',
            id: result.id
        });
    } catch (error) {
        console.error('Error duplicating practice plan:', error);
        
        if (error.message === 'Practice plan not found') {
            return json({ error: error.message }, { status: 404 });
        }
        
        return json(
            { error: 'Failed to duplicate practice plan', details: error.toString() },
            { status: 500 }
        );
    }
}