import { json } from '@sveltejs/kit';
// import { fabricToExcalidraw } from '$lib/utils/diagramMigration'; // No longer needed directly
// import * as db from '$lib/server/db'; // No longer needed directly
import { drillService } from '$lib/server/services/drillService'; // Import the service
import { handleApiError } from '../../utils/handleApiError.js'; // Import the helper
import { dev } from '$app/environment'; // Import dev
import { ForbiddenError } from '$lib/server/errors.js'; // Import ForbiddenError

// This is a potentially long-running operation, consider running it async
// or providing progress feedback if used interactively.
// Also, adding protection (e.g., admin only or dev mode only)
export async function POST() {
  // Restrict to development mode for safety
  if (!dev) {
    return handleApiError(new ForbiddenError('Diagram migration is only allowed in development mode.'));
  }
  
  try {
    // Service method handles potential database errors
    const result = await drillService.migrateAllDiagramsToExcalidraw();
    
    return json({ 
      success: true, 
      message: `Successfully migrated diagrams for ${result.migratedCount} drills.` 
    });
  } catch (err) {
    // Use the centralized error handler
    return handleApiError(err);
  }
} 