import { json } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService.js';
import { FILTER_STATES } from '$lib/constants'; // Import FILTER_STATES
import { z } from 'zod'; // Import zod
import { createPracticePlanSchema } from '$lib/validation/practicePlanSchema'; // Import Zod schema
import { AppError, DatabaseError, ValidationError, NotFoundError } from '$lib/server/errors'; // Import error types
import { handleApiError } from '../utils/handleApiError.js';

// Previously contained a local copy of handleApiError and a custom
// PracticePlanError class. All routes now import the shared utility
// from ../utils/handleApiError.js for consistent behavior.

export async function GET({ url, locals }) {
	const userId = locals.user?.id;

	// Extract query parameters
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = parseInt(url.searchParams.get('limit') || '10', 10);
	const sortBy = url.searchParams.get('sortBy') || 'created_at';
	const sortOrder = url.searchParams.get('sortOrder') || 'desc';
	const searchQuery = url.searchParams.get('search') || '';

	// Extract filters
	const filters = {
		searchQuery: searchQuery || undefined,
		phase_of_season: extractFilterParam(url.searchParams, 'phase'),
		practice_goals: extractFilterParam(url.searchParams, 'goal'),
		min_participants: parseIntOrNull(url.searchParams.get('minP')),
		max_participants: parseIntOrNull(url.searchParams.get('maxP')),
		drill_ids: url.searchParams
			.getAll('drillId')
			.map((id) => parseInt(id, 10))
			.filter((id) => !isNaN(id))
	};

	// Handle team_id parameter - expect UUID only (internal use)
	const teamIdParam = url.searchParams.get('team_id');
	if (teamIdParam) {
		filters.team_id = teamIdParam;
	}

	// Handle is_template filter
	const isTemplate = url.searchParams.get('is_template');
	if (isTemplate !== null) {
		filters.is_template = isTemplate === 'true';
	}

	// Remove empty drill_ids array
	if (filters.drill_ids.length === 0) {
		delete filters.drill_ids;
	}

	try {
		const result = await practicePlanService.getAll({
			userId,
			page,
			limit,
			sortBy,
			sortOrder,
			filters
		});
		// Return the whole result object including items and pagination
		return json(result);
	} catch (err) {
		// Use the centralized error handler
		return handleApiError(err);
	}
}

/**
 * Helper to parse integer or return null
 * @param {string | null} value
 * @returns {number | null}
 */
function parseIntOrNull(value) {
	if (value === null || value === undefined || value === '') return null;
	const parsed = parseInt(value, 10);
	return isNaN(parsed) ? null : parsed;
}

/**
 * Helper to extract multi-state filter parameters
 * e.g., phase_req=Offseason&phase_exc=Mid season
 * @param {URLSearchParams} searchParams
 * @param {string} baseParamName e.g., 'phase'
 * @returns {{ required: string[], excluded: string[] } | undefined}
 */
function extractFilterParam(searchParams, baseParamName) {
	const required = searchParams.getAll(`${baseParamName}_req`);
	const excluded = searchParams.getAll(`${baseParamName}_exc`);

	if (required.length === 0 && excluded.length === 0) {
		return undefined; // No filter applied for this param
	}

	return {
		required,
		excluded
	};
}

export const POST = async ({ request, locals }) => {
	try {
		const rawData = await request.json();
		const userId = locals.user?.id;

		// --- Hydrate parallel group timeline data ---
		// FIXED: Preserve parallel_timeline values from the request
		if (rawData.sections && Array.isArray(rawData.sections)) {
			rawData.sections.forEach((section) => {
				if (section.items && Array.isArray(section.items)) {
					// Group items by parallel_group_id to collect all timelines
					const parallelGroups = new Map();

					// First pass: collect all timelines for each group
					section.items.forEach((item) => {
						if (item.parallel_group_id) {
							if (!parallelGroups.has(item.parallel_group_id)) {
								parallelGroups.set(item.parallel_group_id, new Set());
							}
							// Use the parallel_timeline if provided, otherwise use group_id
							const timeline = item.parallel_timeline || item.parallel_group_id;
							parallelGroups.get(item.parallel_group_id).add(timeline);
						}
					});

					// Second pass: set groupTimelines for all items in parallel groups
					section.items.forEach((item) => {
						if (item.parallel_group_id && parallelGroups.has(item.parallel_group_id)) {
							// Convert Set to Array for groupTimelines
							item.groupTimelines = Array.from(parallelGroups.get(item.parallel_group_id));
							// Preserve the parallel_timeline if it was already set
							// Only set it to group_id if it's not provided
							if (!item.parallel_timeline) {
								item.parallel_timeline = item.parallel_group_id;
							}
						}
					});
				}
			});
		}
		// --- End hydration ---

		// Add userId before validation
		const dataWithUser = { ...rawData, created_by: userId };

		// Validate using Zod schema
		const validationResult = createPracticePlanSchema.safeParse(dataWithUser);

		if (!validationResult.success) {
			// Throw ZodError to be caught by handleApiError
			throw validationResult.error;
		}

		// Use the validated data
		const validatedData = validationResult.data;

		// --- Add order to sections before calling the service ---
		if (validatedData.sections && Array.isArray(validatedData.sections)) {
			validatedData.sections = validatedData.sections.map((section, index) => ({
				...section,
				order: index // Add order based on array index
			}));
		}
		// --- End adding order to sections ---

		// Create practice plan using the service
		// Pass validated data (now with ordered sections) to the service
		const result = await practicePlanService.createPracticePlan(validatedData, userId);

		return json({ id: result.id, message: 'Practice plan created successfully' }, { status: 201 });
	} catch (err) {
		// Use the centralized error handler
		return handleApiError(err);
	}
};
