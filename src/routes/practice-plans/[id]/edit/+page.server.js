import { error } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService';

export async function load({ params, locals }) {
    const { id } = params;
    const userId = locals.user?.id;
  
    try {
        const planId = parseInt(id);
        if (isNaN(planId)) {
            throw error(400, 'Invalid Practice Plan ID');
        }

        // Fetch the plan using the service (includes canUserView check)
        const practicePlan = await practicePlanService.getPracticePlanById(planId, userId);
        
        // Explicitly check if the user can edit this plan
        const canEdit = await practicePlanService.canUserEdit(planId, userId);
        if (!canEdit) {
            // Use 403 Forbidden if user can view but not edit
            throw error(403, 'You do not have permission to edit this practice plan'); 
        }
    
        // Return the plan data if authorized
        return { practicePlan };
    } catch (err) {
        console.error('[Edit Practice Plan Page Server] Error:', err);
        // Re-throw SvelteKit errors or specific service errors
        if (err.status) {
            throw error(err.status, err.body?.message || 'Error loading practice plan');
        } 
        // Handle specific error messages from the service if needed
        if (err.message === 'Practice plan not found') {
            throw error(404, 'Practice plan not found');
        } 
        if (err.message === 'Unauthorized') { // From canUserView check within getPracticePlanById
             throw error(403, 'You do not have permission to view this practice plan');
        }
        // Fallback to generic 500
        throw error(500, 'Internal Server Error while loading practice plan edit page');
    }
}