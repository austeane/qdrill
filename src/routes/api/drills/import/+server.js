import { json } from '@sveltejs/kit';
// import pkg from 'pg'; // Remove manual pool import
// const { Pool } = pkg;
import { v4 as uuidv4 } from 'uuid'; // Keep uuid for now, service generates source ID differently
import { authGuard } from '$lib/server/authGuard';
import { drillService } from '$lib/server/services/drillService'; // Import drill service
// import * as db from '$lib/server/db'; // No longer need db directly

// Remove manual pool creation
// const pool = new Pool({
//   connectionString: process.env.POSTGRES_URL,
//   ssl: {
//     rejectUnauthorized: false
//   }
// });

export const POST = authGuard(async ({ request, locals }) => {
  console.log("Received request to import drills...");
  const session = locals.session;
  const userId = session?.user?.id;

  try {
    // Get data from request
    const { drills, fileName, visibility = 'public' } = await request.json();

    // Basic validation (service will also validate)
    if (!Array.isArray(drills) || drills.length === 0) {
      return json({ error: 'No drills provided for import' }, { status: 400 });
    }
    if (!fileName) {
      return json({ error: 'File name is required for import source tracking' }, { status: 400 });
    }

    // Call the service method to handle the import
    const result = await drillService.importDrills(drills, fileName, userId, visibility);

    // Return the result from the service
    return json(result, { status: 200 });

  } catch (error) {
    console.error('Error processing import request:', error);
    // Determine error type and status code
    let status = 500;
    let message = 'Failed to import drills';
    if (error instanceof Error) {
        message = error.message;
        // Simple check for validation error from service
        if (message === 'No drills provided for import') {
            status = 400;
        }
    } else if (typeof error === 'string') { 
        // Handle potential string errors from JSON parsing or elsewhere
        message = error;
        status = 400; 
    }
    
    return json({ error: message, details: error.toString() }, { status });
  }
});
