import { error } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService';

const COOKIE_NAME = 'pendingPlanToken'; // Add cookie name constant

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals, cookies, fetch }) { // Add cookies and fetch
    const { id } = params;
    const userId = locals.user?.id;
    let pendingPlanData = null;
    let practicePlan = null;

    // --- 1. Check for Pending Plan Data --- 
    const token = cookies.get(COOKIE_NAME);
    if (token) {
        console.log(`[Load /practice-plans/edit] Found pending plan token: ${token}`);
        try {
            const response = await fetch('/api/pending-plans'); 
            if (response.ok) {
                const data = await response.json();
                if (data && data.plan) {
                    pendingPlanData = data.plan;
                    console.log('[Load /practice-plans/edit] Successfully loaded pending plan data.');
                    // Delete after load
                    try {
                        const deleteResponse = await fetch('/api/pending-plans', { method: 'DELETE' });
                        if (!deleteResponse.ok) {
                            console.error('[Load /practice-plans/edit] Failed to delete pending plan after load.');
                        } else {
                            console.log('[Load /practice-plans/edit] Pending plan deleted after load.');
                        }
                    } catch (deleteError) {
                        console.error('[Load /practice-plans/edit] Error deleting pending plan after load:', deleteError);
                    }
                } else {
                     console.log('[Load /practice-plans/edit] Pending plan data from API was null/empty.');
                     cookies.delete(COOKIE_NAME, { path: '/' });
                }
            } else {
                console.error(`[Load /practice-plans/edit] Error fetching pending plan: ${response.status}`);
                 cookies.delete(COOKIE_NAME, { path: '/' });
            }
        } catch (err) {
            console.error('[Load /practice-plans/edit] Exception fetching/processing pending plan:', err);
             cookies.delete(COOKIE_NAME, { path: '/' });
        }
    }

    // --- 2. Load Existing Practice Plan (only if no pending data loaded) --- 
    if (!pendingPlanData) { 
        try {
            const planId = parseInt(id);
            if (isNaN(planId)) {
                throw error(400, 'Invalid Practice Plan ID');
            }

            // Fetch the plan using the service
            practicePlan = await practicePlanService.getPracticePlanById(planId, userId);
            
            // Check if the user can edit this plan
            const canEdit = await practicePlanService.canUserEdit(planId, userId);
            if (!canEdit) {
                throw error(403, 'You do not have permission to edit this practice plan'); 
            }
        
        } catch (err) {
            console.error('[Edit Practice Plan Page Server] Error loading existing plan:', err);
            // Re-throw SvelteKit errors or specific service errors
            if (err.status) {
                throw error(err.status, err.body?.message || 'Error loading practice plan');
            } 
            if (err.message === 'Practice plan not found') {
                throw error(404, 'Practice plan not found');
            } 
            if (err.message === 'Unauthorized') {
                 throw error(403, 'You do not have permission to view this practice plan');
            }
            throw error(500, 'Internal Server Error while loading practice plan edit page');
        }
    }

    // --- 3. Return Data --- 
    // Prioritize pending data if it exists
    return {
        practicePlan: pendingPlanData || practicePlan,
        // Optionally add a flag if we need to distinguish between pending/existing on the client,
        // but the form initialization logic should handle pendingPlanData correctly.
        // isPendingData: !!pendingPlanData 
    };
}