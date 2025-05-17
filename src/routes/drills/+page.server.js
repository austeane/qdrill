import { drillService } from '$lib/server/services/drillService.js';

export async function load({ fetch, url, locals }) {
	try {
		// Get session info
		const session = locals.session;
		const userId = session?.user?.id;

		// Pagination
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');

		// Sorting
		const sortBy = url.searchParams.get('sort'); // e.g., 'name', 'date_created'
		const sortOrder = url.searchParams.get('order') || 'desc'; // 'asc' or 'desc'

		// Filters - Parse all specified filters from URL
		const filters = {};
		const parseCommaSeparated = (param) =>
			url.searchParams.has(param)
				? url.searchParams
						.get(param)
						.split(',')
						.map((t) => t.trim().toLowerCase())
						.filter((t) => t)
				: undefined;
		const parseInteger = (param) => {
			const value = url.searchParams.get(param);
			return value ? parseInt(value) : undefined;
		};
		const parseBooleanFilter = (param) => {
			const value = url.searchParams.get(param)?.toLowerCase();
			return value === 'true' ? true : value === 'false' ? false : undefined;
		};

		filters.skill_level = parseCommaSeparated('skillLevel');
		filters.complexity = url.searchParams.get('complexity')?.toLowerCase();
		filters.skills_focused_on = parseCommaSeparated('skills');
		filters.positions_focused_on = parseCommaSeparated('positions');
		filters.drill_type = parseCommaSeparated('types');

		filters.number_of_people_min = parseInteger('minPeople');
		filters.number_of_people_max = parseInteger('maxPeople');
		filters.suggested_length_min = parseInteger('minLength');
		filters.suggested_length_max = parseInteger('maxLength');

		filters.hasVideo = parseBooleanFilter('hasVideo');
		filters.hasDiagrams = parseBooleanFilter('hasDiagrams');
		filters.hasImages = parseBooleanFilter('hasImages');

		filters.searchQuery = url.searchParams.get('q');

		// Remove undefined filters
		Object.keys(filters).forEach((key) => filters[key] === undefined && delete filters[key]);

		console.log('Loading drills page with:', {
			page,
			limit,
			sortBy,
			sortOrder,
			filters
		});

		// Define options for the service call (pagination + sorting)
		const serviceOptions = { page, limit, sortBy, sortOrder, userId };

		// Fetch drills using the parsed filters/options and filter options in parallel
		const [drillsResult, filterOptionsResponse] = await Promise.all([
			drillService.getFilteredDrills(filters, serviceOptions), // Pass parsed filters here
			fetch('/api/drills/filter-options') // Keep fetching filter options for UI
		]);

		if (!filterOptionsResponse.ok) {
			// Log error but potentially continue without filter options?
			console.error(`Failed to fetch filter options: ${filterOptionsResponse.status}`);
			// Or throw error if filter options are critical:
			// throw new Error('Failed to fetch filter options');
		}

		// Process results
		const drillsData = drillsResult; // Service returns { items, pagination }
		const filterOptions = filterOptionsResponse.ok ? await filterOptionsResponse.json() : {}; // Default if fetch failed

		return {
			// Follow the structure { items: [], pagination: {} } for consistency
			items: drillsData.items,
			pagination: drillsData.pagination,
			filterOptions // Pass filter options to the page component
		};
	} catch (error) {
		console.error('Error loading drills page:', error);
		// Return an error structure that the page component can handle
		return {
			status: 500, // You can set a status code
			error: 'Failed to load drills', // Provide an error message
			items: [], // Ensure items and pagination are present even on error
			pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
			filterOptions: {} // Provide empty filter options
		};
	}
}
