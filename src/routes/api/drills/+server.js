import { json, error as svelteKitError } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import { drillService } from '$lib/server/services/drillService';
import { AppError, DatabaseError, ValidationError, NotFoundError } from '$lib/server/errors'; // Import NotFoundError
import { z } from 'zod'; // Import zod
import { createDrillSchema, updateDrillSchema } from '$lib/validation/drillSchema'; // Import Zod schemas
import { sanitizeHtml } from '$lib/utils/sanitizeHtml.js';

// Helper function to convert AppError to SvelteKit error response
function handleApiError(err) {
	// Handle Zod validation errors specifically
	if (err instanceof z.ZodError) {
		console.warn(`[API Warn] Validation failed:`, err.flatten());
		// Convert Zod errors to the format expected by the frontend/ValidationError
		const details = err.flatten().fieldErrors;
		const validationError = new ValidationError('Validation failed', details);
		return json(
			{
				error: {
					code: validationError.code,
					message: validationError.message,
					details: validationError.details
				}
			},
			{ status: validationError.status }
		);
	}
	// Handle custom AppErrors
	else if (err instanceof AppError) {
		console.warn(`[API Warn] (${err.status} ${err.code}): ${err.message}`);
		const body = { error: { code: err.code, message: err.message } };
		if (err instanceof ValidationError && err.details) {
			body.error.details = err.details;
		}
		return json(body, { status: err.status });
	}
	// Handle generic errors
	else {
		console.error('[API Error] Unexpected error:', err);
		return json(
			{
				error: {
					code: 'INTERNAL_SERVER_ERROR',
					message: 'An unexpected internal server error occurred'
				}
			},
			{ status: 500 }
		);
	}
}

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

	filters.skill_level = parseCommaSeparated('skillLevel');
	filters.complexity = url.searchParams.get('complexity')?.toLowerCase();
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

	// Add userId to filters
	if (userId) filters.userId = userId;

	// Remove undefined filters
	Object.keys(filters).forEach((key) => filters[key] === undefined && delete filters[key]);

	// Build options objects for the service
	const options = {
		page,
		limit,
		sortBy,
		sortOrder
	};

	try {
		// Call the enhanced getFilteredDrills method
		const result = await drillService.getFilteredDrills(filters, options);

		// Sanitize brief descriptions in the list
		const sanitized = {
			...result,
			items: (result.items || []).map((d) => ({
				...d,
				brief_description: sanitizeHtml(d.brief_description)
			}))
		};

		// Return structure matches the frontend expectation from Phase 2 plan
		return json(sanitized);
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
		let userId = session?.user?.id || null;

		// Ensure userId is a number if it exists and is a string representation of a number
		if (userId && typeof userId === 'string') {
			const parsedUserId = parseInt(userId, 10);
			if (!isNaN(parsedUserId)) {
				userId = parsedUserId;
			} else {
				// Handle case where userId is a string but not a valid number - perhaps error or set to null
				console.warn(`Invalid string user ID found: ${userId}. Treating as null.`);
				userId = null;
			}
		}

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

		return json(drill, { status: 201 }); // Return 201 Created
	} catch (err) {
		// Renamed variable to err
		// Use the helper function
		return handleApiError(err);
	}
};

export const PUT = authGuard(async ({ request, locals }) => {
	try {
		const rawData = await request.json();
		const session = locals.session;
		const userId = session.user.id;

		console.log('--- RAW DATA for Zod Validation (PUT) ---', JSON.stringify(rawData, null, 2)); // Log rawData

		// Validate data using Zod schema
		const validationResult = updateDrillSchema.safeParse(rawData);

		// --- TEMPORARY LOGGING ---
		console.log('--- Zod Validation Result (PUT) ---', JSON.stringify(validationResult, null, 2));
		if (validationResult.success) {
			console.log(
				'--- Zod Validated Data (PUT) ---',
				JSON.stringify(validationResult.data, null, 2)
			);
		} else {
			console.error(
				'--- Zod Validation Errors (PUT) ---',
				JSON.stringify(validationResult.error.flatten(), null, 2)
			);
		}
		// --- END TEMPORARY LOGGING ---

		if (!validationResult.success) {
			console.error(
				'Zod validation failed in PUT /api/drills, throwing error:',
				validationResult.error.flatten()
			);
			throw validationResult.error;
		}

		// Use the validated data
		const validatedData = validationResult.data;

		// Use the DrillService to update the drill
		// Pass the drill ID and the rest of the validated data separately
		const updatedDrill = await drillService.updateDrill(validatedData.id, validatedData, userId);

		return json(updatedDrill);
	} catch (err) {
		// Renamed variable to err
		// Use the helper function
		return handleApiError(err);
	}
});

export const DELETE = authGuard(async ({ params, request, locals }) => {
	// Prefer ID from URL parameter if available (e.g., if route was /api/drills/[id])
	let drillId = params.id ? parseInt(params.id) : null;

	// If ID not in params, try getting from body (less standard for DELETE)
	if (!drillId) {
		try {
			const { id } = await request.json();
			if (id) drillId = parseInt(id);
		} catch (e) {
			// Ignore errors reading body if it's empty or not JSON
		}
	}

	if (!drillId || isNaN(drillId)) {
		return handleApiError(
			new ValidationError(
				'Valid Drill ID must be provided either in the URL or request body for DELETE'
			)
		);
	}

	const session = locals.session;
	const userId = session.user.id;

	try {
		// Use the DrillService to delete the drill
		const success = await drillService.deleteDrill(drillId, userId, { deleteRelated: false }); // Default to not deleting related

		if (!success) {
			// If deleteDrill returns false, it means not found or not permitted
			// Distinguish between NotFound and Forbidden if possible, otherwise default to NotFound
			return handleApiError(
				new NotFoundError(`Drill with ID ${drillId} not found or access denied for deletion.`)
			);
		}

		return json({ message: 'Drill deleted successfully' }, { status: 200 }); // Use 200 OK or 204 No Content
	} catch (err) {
		// Renamed variable to err
		// Use the helper function
		return handleApiError(err);
	}
});
