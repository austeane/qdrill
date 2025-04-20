import { json } from '@sveltejs/kit';
// import { fabricToExcalidraw } from '$lib/utils/diagramMigration'; // No longer needed directly
// import * as db from '$lib/server/db'; // No longer needed directly
import { drillService } from '$lib/server/services/drillService'; // Import the service

export async function POST() {
  try {
    // Call the service method to perform the migration
    const result = await drillService.migrateAllDiagramsToExcalidraw();
    
    return json({ 
      success: true, 
      message: `Successfully migrated ${result.migratedCount} drills.` 
    });
  } catch (error) {
    console.error('Error migrating diagrams via service:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to migrate diagrams';
    return json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
} 