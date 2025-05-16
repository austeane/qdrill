import { json } from '@sveltejs/kit';
// import pkg from 'pg'; // Remove manual pool import
// const { Pool } = pkg;
// import { v4 as uuidv4 } from 'uuid'; // Service handles source ID generation
import { authGuard } from '$lib/server/authGuard';
import { drillService } from '$lib/server/services/drillService'; // Import drill service
// import * as db from '$lib/server/db'; // No longer need db directly
import { handleApiError } from '../../utils/handleApiError.js'; // Import the helper
import { ValidationError } from '$lib/server/errors.js';

// Remove manual pool creation
// const pool = new Pool({
//   connectionString: process.env.POSTGRES_URL,
//   ssl: {
//     rejectUnauthorized: false
//   }
// });

export const POST = authGuard(async ({ request, locals }) => {
	console.log('Received request to import drills...');
	const session = locals.session;
	const userId = session?.user?.id; // Guard ensures userId exists

	try {
		// Get data from request
		const { drills, fileName, visibility = 'public' } = await request.json();

		// Basic validation (service will also validate)
		if (!Array.isArray(drills) || drills.length === 0) {
			throw new ValidationError('No drills provided for import');
		}
		if (!fileName) {
			throw new ValidationError('File name is required for import source tracking');
		}

		// Service method handles validation errors (e.g., missing fields) and DB errors
		const result = await drillService.importDrills(drills, fileName, userId, visibility);

		// Return the result from the service (e.g., { importedCount, uploadSource })
		return json(result, { status: 200 }); // Use 200 OK for successful import
	} catch (err) {
		// Use the centralized error handler
		return handleApiError(err);
	}
});
