import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService';
import { handleApiError } from '../../utils/handleApiError.js';

export const GET = async ({ url, locals }) => {
	const session = locals.session;
	const userId = session?.user?.id;

	const query = url.searchParams.get('query') || '';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '10');
	const includePagination = url.searchParams.get('includePagination') === 'true';

	try {
		// Use getFilteredDrills for consistency, applying search via filters.searchQuery
		const filters = { searchQuery: query };
		if (userId) filters.userId = userId; // Apply userId for visibility

		const options = {
			page,
			limit,
			columns: ['id', 'name', 'brief_description'] // Return id, name, and brief description
		};

		const results = await drillService.getFilteredDrills(filters, options);

		// Return with or without pagination info based on the request
		return includePagination ? json(results) : json(results?.items || []); // Return items array or empty array if no results
	} catch (err) {
		// Use the centralized error handler
		return handleApiError(err);
	}
};
