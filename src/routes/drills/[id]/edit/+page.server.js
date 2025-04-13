import { error } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService.js';
import { skillService } from '$lib/server/services/skillService.js';

export async function load({ params, fetch, locals }) {
    const { id } = params;
    const userId = locals.user?.id;

    try {
        const drillId = parseInt(id);
        if (isNaN(drillId)) {
            throw error(400, 'Invalid Drill ID');
        }

        const drill = await drillService.getById(drillId);
        
        if (!drill) {
            throw error(404, 'Drill not found');
        }

        const canEdit = await drillService.canUserEdit(drillId, userId);
        if (!canEdit) {
            throw error(403, 'You do not have permission to edit this drill');
        }

        const allSkills = await skillService.getAllSkills();
        const allDrillNames = await drillService.getDrillNames();
    
        return {
            drill,
            allSkills,
            allDrillNames
        };
    } catch (err) {
        console.error('[Edit Page Server] Error:', err);
        if (err.status) {
            throw error(err.status, err.body?.message || 'Error loading drill data');
        }
        throw error(500, 'Internal Server Error while loading edit page');
    }
}