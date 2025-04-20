import { json } from '@sveltejs/kit';
// import * as db from '$lib/server/db'; // No longer needed directly
import { drillService } from '$lib/server/services/drillService'; // Import the service

export async function GET() {
    try {
        // Call the service method to get filter options
        const filterOptions = await drillService.getDrillFilterOptions();
        
        return json(filterOptions);
    } catch (error) {
        console.error('Error fetching filter options via service:', error);
        // Use the error message thrown by the service or a generic one
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch filter options';
        return json({ error: errorMessage }, { status: 500 });
    }
} 