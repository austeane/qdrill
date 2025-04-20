import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService';
import { dev } from '$app/environment';
import * as db from '$lib/server/db';

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
        // Get the drill with or without variations
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
            // If private drill and no user session, or user is not the owner
            if (!userId || drill.created_by !== userId) {
                return json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        // Add creator name if variations are included
        if (includeVariants && drill.variations && drill.variations.length > 0) {
            const userIds = [...new Set(drill.variations.map(v => v.created_by).filter(id => id))];
            
            if (userIds.length > 0) {
                const usersResult = await db.query(
                    `SELECT id, name FROM users WHERE id = ANY($1)`,
                    [userIds]
                );
                
                const userMap = {};
                usersResult.rows.forEach(user => {
                    userMap[user.id] = user.name;
                });
                
                drill.variations.forEach(variation => {
                    if (variation.created_by) {
                        variation.creator_name = userMap[variation.created_by];
                    }
                });
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

export async function PUT({ params, request, locals }) {
    const { id } = params;
    const session = locals.session;
    const userId = session?.user?.id;
    
    if (!userId) {
        return json({ error: 'Authentication required' }, { status: 401 });
    }
    
    try {
        const drillData = await request.json();
        
        // Basic input validation
        if (!drillData.name || !drillData.drill_type) {
            return errorResponse('Required fields missing', 400);
        }

        // Add ID to drill data
        drillData.id = parseInt(id);
        
        // Use DrillService to update the drill
        const updatedDrill = await drillService.updateDrill(id, drillData, userId);
        
        // Update the name in votes table if it exists (this isn't in the service since it's crossing domains)
        await db.query(
            `UPDATE votes SET item_name = $1 WHERE drill_id = $2`,
            [drillData.name, id]
        );
        
        return json(updatedDrill);
    } catch (error) {
        console.error(`[Update Error] Drill ${id}:`, error);
        
        // Handle specific errors
        if (error.message === 'Unauthorized to edit this drill') {
            return errorResponse(ERROR_MESSAGES.UNAUTHORIZED, 403);
        } else if (error.message.includes('not found')) {
            return errorResponse(ERROR_MESSAGES.NOT_FOUND(id), 404);
        } else if (error.code === '23505') {
            return errorResponse('Duplicate entry found', 400);
        }
        
        return errorResponse(ERROR_MESSAGES.DB_ERROR);
    }
}

export async function DELETE({ params, locals }) {
    const { id } = params;
    const session = locals.session;
    const userId = session?.user?.id;
    
    if (!userId && !dev) {
        return json({ error: 'Authentication required' }, { status: 401 });
    }
    
    try {
        // In dev mode, we need to handle the case properly without breaking auth checks
        if (dev) {
            // In dev mode, get the drill first to check it exists
            const drill = await drillService.getById(id);
            if (!drill) {
                return errorResponse(ERROR_MESSAGES.NOT_FOUND(id), 404);
            }
            
            // For dev mode, directly use db to delete without auth check
            const client = await db.getClient();
            try {
                await client.query('DELETE FROM drills WHERE id = $1', [id]);
                // Also delete related votes and comments in dev mode for cleanup
                await client.query('DELETE FROM votes WHERE drill_id = $1', [id]);
                await client.query('DELETE FROM comments WHERE drill_id = $1', [id]);
                return json({ success: true });
            } finally {
                client.release();
            }
        }
        
        // Normal flow with auth check
        const result = await drillService.deleteDrill(id, userId);
        
        if (!result) {
            return errorResponse(ERROR_MESSAGES.NOT_FOUND(id), 404);
        }
        
        return json({ success: true });
    } catch (error) {
        console.error(`[Delete Error] Drill ${id}:`, error);
        
        if (error.message === 'Unauthorized to delete this drill') {
            return errorResponse(ERROR_MESSAGES.UNAUTHORIZED, 403);
        } else if (error.code === '23503') {
            return errorResponse('Cannot delete: drill is referenced by other items', 400);
        }
        
        return errorResponse(ERROR_MESSAGES.DB_ERROR);
    }
}
