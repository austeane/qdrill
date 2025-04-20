import { json } from '@sveltejs/kit';
// import * as db from '$lib/server/db'; // No longer needed directly
import { drillService } from '$lib/server/services/drillService'; // Import the service
import { handleApiError } from '../utils/handleApiError.js'; // Import the helper

export async function GET() {
    try {
        // Service method handles potential database errors
        const filterOptions = await drillService.getDrillFilterOptions();
        return json(filterOptions);
    } catch (err) {
        // Use the centralized error handler
        return handleApiError(err);
    }
} 