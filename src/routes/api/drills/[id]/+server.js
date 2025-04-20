import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService';
import { dev } from '$app/environment';
import * as db from '$lib/server/db';
import { authGuard } from '$lib/server/authGuard';

const ERROR_MESSAGES = {
    NOT_FOUND: (id) => `Drill with ID ${id} not found`,
    UNAUTHORIZED: 'Unauthorized access',
    DB_ERROR: 'Database operation failed',
    INVALID_INPUT: 'Invalid input data'
};

// Helper function for error responses
function errorResponse(message, status = 500) {
    console.error(`[Error] ${message}`);
    return json({ error: message }, { status });
}

export async function GET({ params, locals, url }) {
    const { id } = params;
    const includeVariants = url.searchParams.get('includeVariants') === 'true';
    const session = locals.session;
    const userId = session?.user?.id;
    
    if (!id || isNaN(parseInt(id))) {
        return errorResponse(ERROR_MESSAGES.INVALID_INPUT, 400);
    }

    try {
        let drill;
        if (includeVariants) {
            drill = await drillService.getDrillWithVariations(id);
        } else {
            drill = await drillService.getById(id);
        }

        if (!drill) {
            return errorResponse(ERROR_MESSAGES.NOT_FOUND(id), 404);
        }

        // Check visibility and ownership (skip in development)
        if (!dev && drill.visibility === 'private') {
            if (!userId || drill.created_by !== userId) {
                return json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        // If this is a variation, get the parent name
        if (drill.parent_drill_id && !drill.variations) {
            const parentDrill = await drillService.getById(drill.parent_drill_id);
            if (parentDrill) {
                drill.parent_drill_name = parentDrill.name;
            }
        }

        return json(drill);
    } catch (error) {
        console.error(`[Database Error] Fetching drill ${id}:`, error);
        return errorResponse(ERROR_MESSAGES.DB_ERROR);
    }
}

// Wrap PUT handler with authGuard
export const PUT = authGuard(async ({ params, request, locals }) => {
    const { id } = params;
    const session = locals.session;
    const userId = session?.user?.id;
    
    try {
        const drillData = await request.json();
        
        if (!drillData.name || !drillData.drill_type) {
            return errorResponse('Required fields missing', 400);
        }

        // Use DrillService to update the drill (now also updates votes)
        const updatedDrill = await drillService.updateDrill(id, drillData, userId);
        
        return json(updatedDrill);
    } catch (error) {
        console.error(`[Update Error] Drill ${id}:`, error);
        
        if (error.message === 'Unauthorized to edit this drill') {
            return errorResponse(ERROR_MESSAGES.UNAUTHORIZED, 403);
        } else if (error.message.includes('not found')) {
            return errorResponse(ERROR_MESSAGES.NOT_FOUND(id), 404);
        } else if (error.code === '23505') {
            return errorResponse('Duplicate entry found', 400);
        }
        
        return errorResponse(ERROR_MESSAGES.DB_ERROR);
    }
});

// Define core delete logic (used by guarded handler)
const handleDelete = async ({ params, locals }) => {
    const { id } = params;
    const session = locals.session;
    const userId = session?.user?.id;
    
    try {
        // Normal flow with auth check (authGuard handles the check)
        // Pass userId for authorization check within the service
        const result = await drillService.deleteDrill(id, userId);
        
        if (!result) {
            // Service returns false if not found, true if deleted
            return errorResponse(ERROR_MESSAGES.NOT_FOUND(id), 404);
        }
        
        return json({ success: true });
    } catch (error) {
        console.error(`[Delete Error] Drill ${id}:`, error);
        
        // Handle specific errors thrown by the service
        if (error.message === 'Unauthorized to delete this drill') {
            return errorResponse(ERROR_MESSAGES.UNAUTHORIZED, 403);
        } else if (error.code === '23503' || error.message.includes('referenced by other items')) {
            // Catch potential FK constraint errors if service doesn't delete related items
            return errorResponse('Cannot delete: drill is referenced by other items', 400);
        } else if (error.message.includes('not found')) {
            return errorResponse(ERROR_MESSAGES.NOT_FOUND(id), 404);
        }
        
        return errorResponse(ERROR_MESSAGES.DB_ERROR);
    }
};

// Export DELETE handler, applying authGuard only when not in dev mode
export const DELETE = async (event) => {
    const { id } = event.params;
    const session = event.locals.session;
    // Use a placeholder or known admin ID for dev mode deletion if strict user check is needed
    // Or rely on the service logic that allows deletion if unowned + deleteRelated is true
    const devUserId = session?.user?.id || null; // Pass null if no session, service handles unowned check

    if (dev) {
        console.log(`[DEV MODE BYPASS] Attempting deletion for drill ${id} with related data.`);
        try {
            // Call the service method with deleteRelated: true
            // Pass devUserId (can be null) - service checks if drill.created_by === devUserId OR (drill.created_by === null AND deleteRelated)
            const result = await drillService.deleteDrill(id, devUserId, { deleteRelated: true });
            
            if (!result) {
                // Service handles not found case
                return errorResponse(ERROR_MESSAGES.NOT_FOUND(id), 404);
            }
            
            return json({ success: true, message: 'Drill and related data deleted (dev mode)' });
        } catch (error) {
             console.error(`[DEV MODE] Error deleting drill ${id}:`, error);
             // Handle specific errors from service call in dev mode
             if (error.message === 'Unauthorized to delete this drill') {
                 // This might happen if the drill IS owned, but not by devUserId
                 return errorResponse(ERROR_MESSAGES.UNAUTHORIZED + ' (dev mode - owned by different user?)', 403);
             } else if (error.code === '23503' || error.message.includes('referenced by other items')) {
                 return errorResponse('Cannot delete: drill is referenced by other items (dev mode)', 400);
             }
             return errorResponse(ERROR_MESSAGES.DB_ERROR + ' (dev mode)');
        } 
        // Remove manual DB deletion logic
        /*
        const client = await db.getClient();
        try {
            // ... old client query logic ...
        } catch (error) {
            // ... old error handling ...
        } finally {
            client.release();
        }
        */
    } else {
        // In production, use the authGuard with the original handleDelete logic
        const guardedDelete = authGuard(handleDelete);
        return guardedDelete(event);
    }
};
