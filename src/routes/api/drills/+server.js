import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService';
import { createDrillSchema } from '$lib/validation/drillSchema'; // Import Zod schemas
import { handleApiError } from '../utils/handleApiError.js';
import { generateClaimToken } from '$lib/server/utils/claimTokens.js';

// Centralized error handler imported from ../utils/handleApiError.js

export const GET = async ({ url, locals }) => {
	// Get session info to pass userId for filtering
	const session = locals.session;
	const userId = session?.user?.id;

	// Pagination
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '10');

	// Sorting
	const sortBy = url.searchParams.get('sort'); // e.g., 'name', 'date_created'
	const sortOrder = url.searchParams.get('order') || 'desc'; // 'asc' or 'desc'

	// Filters - Parse all specified filters from performance.md
	const filters = {};
	const parseCommaSeparated = (param) =>
		url.searchParams.has(param)
			? url.searchParams
					.get(param)
					.split(',')
					.map((t) => t.trim().toLowerCase())
					.filter((t) => t)
			: undefined;
	const toTitleCase = (value) =>
		typeof value === 'string' && value.length
			? value.charAt(0).toUpperCase() + value.slice(1)
			: value;

	filters.skill_level = parseCommaSeparated('skillLevel');
	const complexities = parseCommaSeparated('complexity');
	filters.complexity = complexities ? complexities.map(toTitleCase) : undefined;
	filters.skills_focused_on = parseCommaSeparated('skills');
	filters.positions_focused_on = parseCommaSeparated('positions');
	filters.drill_type = parseCommaSeparated('types');

	const minPeople = url.searchParams.get('minPeople');
	const maxPeople = url.searchParams.get('maxPeople');
	if (minPeople) filters.number_of_people_min = parseInt(minPeople);
	if (maxPeople) filters.number_of_people_max = parseInt(maxPeople);

	const minLength = url.searchParams.get('minLength');
	const maxLength = url.searchParams.get('maxLength');
	// Assuming suggested_length is stored in minutes (or some numeric unit)
	if (minLength) filters.suggested_length_min = parseInt(minLength);
	if (maxLength) filters.suggested_length_max = parseInt(maxLength);

	const parseBooleanFilter = (param) => {
		const value = url.searchParams.get(param)?.toLowerCase();
		return value === 'true' ? true : value === 'false' ? false : undefined;
	};
	filters.hasVideo = parseBooleanFilter('hasVideo');
	filters.hasDiagrams = parseBooleanFilter('hasDiagrams');
	filters.hasImages = parseBooleanFilter('hasImages');

	filters.searchQuery = url.searchParams.get('q');

	// Remove undefined filters
	Object.keys(filters).forEach((key) => filters[key] === undefined && delete filters[key]);

	// Build options objects for the service
	const options = {
		page,
		limit,
		sortBy,
		sortOrder,
		userId
	};

	try {
		// Call the enhanced getFilteredDrills method
		const result = await drillService.getFilteredDrills(filters, options);

		// Return structure matches the frontend expectation from Phase 2 plan
		return json(result);
	} catch (err) {
		// Renamed variable to err
		// Use the helper function
		return handleApiError(err);
	}
};

export const POST = async (event) => {
	try {
		const rawData = await event.request.json();
		const session = event.locals.session;
		const userId = session?.user?.id || null;

		// Add userId to the data before validation if not present
		const dataWithUser = { ...rawData, created_by: userId };

		// Validate data using Zod schema
		// Use safeParse to handle validation errors explicitly
		const validationResult = createDrillSchema.safeParse(dataWithUser);

		if (!validationResult.success) {
			// Throw ZodError to be caught by handleApiError
			throw validationResult.error;
		}

		// Use the validated data
		const validatedData = validationResult.data;

		// Use the DrillService to create the drill
		const drill = await drillService.createDrill(validatedData, userId); // Pass validatedData

		// If created anonymously, issue a claim token so the creator can later associate ownership
		if (!userId && drill?.id) {
			drill.claimToken = generateClaimToken('drill', drill.id);
		}

		return json(drill, { status: 201 }); // Return 201 Created
	} catch (err) {
		// Renamed variable to err
		// Use the helper function
		return handleApiError(err);
	}
};

// PUT and DELETE are handled in src/routes/api/drills/[id]/+server.js
