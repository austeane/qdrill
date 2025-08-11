import { BaseEntityService } from './baseEntityService.js';
import { kyselyDb } from '$lib/server/db'; // Import Kysely instance
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { sql } from 'kysely'; // Import sql tag
import {
	NotFoundError,
	ForbiddenError,
	ValidationError,
	DatabaseError,
	ConflictError
} from '$lib/server/errors';
import { z } from 'zod'; // Import Zod
import { practicePlanSchema } from '$lib/validation/practicePlanSchema'; // Import the Zod schema
import { dev } from '$app/environment';

/**
 * Service for managing practice plans
 * Extends the BaseEntityService with practice plan-specific functionality
 */
export class PracticePlanService extends BaseEntityService {
	/**
	 * Creates a new PracticePlanService
	 */
	constructor() {
		const allowedColumns = [
			'name',
			'description',
			'practice_goals',
			'phase_of_season',
			'estimated_number_of_participants',
			'created_by',
			'visibility',
			'is_editable_by_others',
			'start_time',
			'created_at',
			'updated_at',
			'search_vector' // Add search_vector for FTS
		];

		const columnTypes = {
			practice_goals: 'array' // Assuming practice_goals is stored as text[]
		};

		// Configure standard permissions (using default column names/values)
		const permissionConfig = {
			// userIdColumn: 'created_by', // default
			// visibilityColumn: 'visibility', // default
			// publicValue: 'public', // default
			// unlistedValue: 'unlisted', // default
			// privateValue: 'private', // default
			// editableByOthersColumn: 'is_editable_by_others' // default
		};

		super('practice_plans', 'id', ['*'], allowedColumns, columnTypes, permissionConfig);
	}

	/**
	 * Get practice plans with optional filtering/pagination/sorting
	 * @param {Object} options - Options for fetching plans
	 * @param {number} [options.userId=null] - User ID for visibility checks
	 * @param {number} [options.page=1] - Page number
	 * @param {number} [options.limit=10] - Items per page
	 * @param {string} [options.sortBy='created_at'] - Field to sort by
	 * @param {'asc' | 'desc'} [options.sortOrder='desc'] - Sort order
	 * @param {Object} [options.filters={}] - Filtering criteria
	 * @param {string[]} [options.filters.phase_of_season] - Filter by phase of season
	 * @param {string[]} [options.filters.practice_goals] - Filter by practice goals
	 * @param {number} [options.filters.min_participants] - Min estimated participants
	 * @param {number} [options.filters.max_participants] - Max estimated participants
	 * @param {number[]} [options.filters.drill_ids] - Filter by contained drill IDs
	 * @param {string} [options.filters.searchQuery] - Search query for name/description
	 * @returns {Promise<{items: Array<Object>, pagination: Object}>} - List of plans and pagination info
	 */
	async getAll(options = {}) {
		const {
			userId = null,
			page = 1,
			limit = 10,
			sortBy = 'created_at',
			sortOrder = 'desc',
			filters = {}
		} = options;

		const offset = (page - 1) * limit;

		// Helper to build the base query (before search and pagination)
		const buildBaseQueryWithFilters = () => {
			let q = kyselyDb
				.selectFrom('practice_plans as pp')
				.leftJoin('practice_plan_drills as ppd', 'pp.id', 'ppd.practice_plan_id')
				.select([
					'pp.id',
					'pp.name',
					'pp.description',
					'pp.practice_goals',
					'pp.phase_of_season',
					'pp.estimated_number_of_participants',
					'pp.created_by',
					'pp.visibility',
					'pp.is_editable_by_others',
					'pp.start_time',
					'pp.created_at',
					'pp.updated_at'
				])
				.select(sql`array_agg(DISTINCT ppd.drill_id)`.as('drills'))
				.groupBy('pp.id');

			// Apply visibility filters from permissionConfig
			const { visibilityColumn, publicValue, unlistedValue, privateValue, userIdColumn } =
				this.permissionConfig;
			q = q.where((eb) => {
				const conditions = [
					eb(`pp.${visibilityColumn}`, '=', publicValue),
					eb(`pp.${visibilityColumn}`, '=', unlistedValue)
				];
				if (userId) {
					conditions.push(
						eb.and([
							eb(`pp.${visibilityColumn}`, '=', privateValue),
							eb(`pp.${userIdColumn}`, '=', userId)
						])
					);
				}
				return eb.or(conditions);
			});

			// Apply specific filters (excluding search, which is handled by _buildSearchQuery)
			if (filters.phase_of_season?.required?.length) {
				q = q.where('pp.phase_of_season', 'in', filters.phase_of_season.required);
			}
			if (filters.phase_of_season?.excluded?.length) {
				q = q.where('pp.phase_of_season', 'not in', filters.phase_of_season.excluded);
			}
			if (filters.practice_goals?.required?.length) {
				filters.practice_goals.required.forEach((goal) => {
					q = q.where(sql`pp.practice_goals @> ARRAY[${goal}]::text[]`);
				});
			}
			if (filters.practice_goals?.excluded?.length) {
				q = q.where(
					sql`NOT (pp.practice_goals && ARRAY[${filters.practice_goals.excluded.join(',')}]::text[])`
				);
			}
			if (filters.min_participants != null) {
				q = q.where('pp.estimated_number_of_participants', '>=', filters.min_participants);
			}
			if (filters.max_participants != null) {
				q = q.where('pp.estimated_number_of_participants', '<=', filters.max_participants);
			}
			if (filters.drill_ids?.length) {
				q = q.where((eb) =>
					eb.exists(
						eb
							.selectFrom('practice_plan_drills as sub_ppd')
							.select(sql`1`.as('one'))
							.whereRef('sub_ppd.practice_plan_id', '=', 'pp.id')
							.where('sub_ppd.drill_id', 'in', filters.drill_ids)
							.groupBy('sub_ppd.practice_plan_id')
							.having(sql`count(DISTINCT sub_ppd.drill_id)`, '=', filters.drill_ids.length)
					)
				);
			}
			return q;
		};

		// --- Main Query Execution ---
		const baseQuery = buildBaseQueryWithFilters();
		// Clone baseQuery for fallback, as _buildSearchQuery modifies its input and _executeSearch might clear its where clause
		const baseQueryForFallback = buildBaseQueryWithFilters();

		const ftsQuery = this._buildSearchQuery(
			baseQuery, // Pass the original baseQuery here
			filters.searchQuery,
			'search_vector',
			'english',
			['name', 'description'], // Columns for pg_trgm fallback
			0.3 // Trigram threshold
		);

		// Apply sorting - if fallback is used, _executeSearch will sort by similarity_score
		// If FTS is used, or no search, apply standard sorting.
		let finalQuery = ftsQuery;
		if (
			!ftsQuery._ftsAppliedInfo ||
			(ftsQuery._ftsAppliedInfo && items.length > 0 && !usedFallback)
		) {
			// only apply if FTS was not used or if FTS found items and fallback wasn't used
			const validSortColumns = [
				'name',
				'created_at',
				'estimated_number_of_participants',
				'updated_at'
			];
			const sortCol = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
			const direction = sortOrder === 'asc' ? 'asc' : 'desc';
			finalQuery = finalQuery.orderBy(`pp.${sortCol}`, direction);
		}

		const { items, usedFallback } = await this._executeSearch(finalQuery, baseQueryForFallback, {
			limit,
			offset
		});

		// --- Count Query Execution ---
		let countQuery = kyselyDb
			.selectFrom('practice_plans as pp') // Must match the alias used in buildBaseQueryWithFilters if reusing parts of it
			.select(kyselyDb.fn.count('pp.id').distinct().as('total'));

		// Apply the same non-search filters to countQuery as were applied to baseQuery
		const { visibilityColumn, publicValue, unlistedValue, privateValue, userIdColumn } =
			this.permissionConfig;
		countQuery = countQuery.where((eb) => {
			const conditions = [
				eb(`pp.${visibilityColumn}`, '=', publicValue),
				eb(`pp.${visibilityColumn}`, '=', unlistedValue)
			];
			if (userId) {
				conditions.push(
					eb.and([
						eb(`pp.${visibilityColumn}`, '=', privateValue),
						eb(`pp.${userIdColumn}`, '=', userId)
					])
				);
			}
			return eb.or(conditions);
		});
		if (filters.phase_of_season?.required?.length) {
			countQuery = countQuery.where('pp.phase_of_season', 'in', filters.phase_of_season.required);
		}
		if (filters.phase_of_season?.excluded?.length) {
			countQuery = countQuery.where(
				'pp.phase_of_season',
				'not in',
				filters.phase_of_season.excluded
			);
		}
		if (filters.practice_goals?.required?.length) {
			filters.practice_goals.required.forEach((goal) => {
				countQuery = countQuery.where(sql`pp.practice_goals @> ARRAY[${goal}]::text[]`);
			});
		}
		if (filters.practice_goals?.excluded?.length) {
			countQuery = countQuery.where(
				sql`NOT (pp.practice_goals && ARRAY[${filters.practice_goals.excluded.join(',')}]::text[])`
			);
		}
		if (filters.min_participants != null) {
			countQuery = countQuery.where(
				'pp.estimated_number_of_participants',
				'>=',
				filters.min_participants
			);
		}
		if (filters.max_participants != null) {
			countQuery = countQuery.where(
				'pp.estimated_number_of_participants',
				'<=',
				filters.max_participants
			);
		}
		if (filters.drill_ids?.length) {
			countQuery = countQuery.where((eb) =>
				eb.exists(
					eb
						.selectFrom('practice_plan_drills as sub_ppd')
						.select(sql`1`.as('one'))
						.whereRef('sub_ppd.practice_plan_id', '=', 'pp.id')
						.where('sub_ppd.drill_id', 'in', filters.drill_ids)
						.groupBy('sub_ppd.practice_plan_id')
						.having(sql`count(DISTINCT sub_ppd.drill_id)`, '=', filters.drill_ids.length)
				)
			);
		}

		// Apply the correct search condition to the count query based on what was used for items
		if (filters.searchQuery) {
			const cleanedSearchTerm = filters.searchQuery.trim();
			if (cleanedSearchTerm) {
				if (usedFallback) {
					countQuery = countQuery.where((eb) =>
						eb.or([
							eb(sql`similarity(pp.name, ${cleanedSearchTerm})`, '>', 0.3),
							eb(sql`similarity(pp.description, ${cleanedSearchTerm})`, '>', 0.3)
						])
					);
				} else {
					const tsQuerySearchTerm = cleanedSearchTerm
						.split(/\s+/)
						.filter(Boolean)
						.map((term) => term + ':*')
						.join(' & ');
					if (tsQuerySearchTerm) {
						countQuery = countQuery.where(
							sql`pp.search_vector @@ to_tsquery('english', ${tsQuerySearchTerm})`
						);
					}
				}
			}
		}

		const countResult = await countQuery.executeTakeFirst();
		const totalItems = parseInt(countResult?.total ?? '0', 10);
		const totalPages = Math.ceil(totalItems / limit);

		return {
			items: items,
			pagination: {
				page: page,
				limit: limit,
				totalItems: totalItems,
				totalPages: totalPages
			}
		};
	}

	/**
	 * Create a new practice plan
	 * @param {Object} planData - Practice plan data
	 * @param {number|null} userId - User ID creating the plan (null if anonymous)
	 * @returns {Promise<Object>} - The created practice plan with ID
	 * @throws {ValidationError} If validation fails
	 * @throws {ForbiddenError} If anonymous user tries to create non-public plan
	 * @throws {DatabaseError} On database error
	 */
	async createPracticePlan(planData, userId = null) {
		// Reinstate validation call - Now using Zod schema at the API boundary, but keep internal check for direct service usage?
		// Decide whether to keep this internal validation. For now, let's assume validation happens *before* calling the service.
		// If direct service calls are possible elsewhere without API validation, this should be reinstated:
		// this.validatePracticePlan(planData);

		// If user is not logged in, force public visibility and editable by others
		if (!userId) {
			planData.visibility = 'public';
			planData.is_editable_by_others = true;
		}

		// Validate visibility
		const validVisibilities = ['public', 'unlisted', 'private'];
		if (!planData.visibility || !validVisibilities.includes(planData.visibility)) {
			// Use ValidationError for invalid visibility input
			throw new ValidationError('Invalid visibility setting provided.', {
				visibility: 'Must be public, unlisted, or private'
			});
		}

		// If user is logged out, they can only create public plans
		if (!userId && planData.visibility !== 'public') {
			// Use ForbiddenError as anonymous users are not allowed this action
			throw new ForbiddenError('Anonymous users can only create public plans');
		}

		const {
			name,
			description,
			practice_goals,
			phase_of_season,
			estimated_number_of_participants,
			is_editable_by_others = false,
			visibility = 'public',
			sections = [],
			start_time = null
		} = planData;

		// Use transaction helper
		return this.withTransaction(async (client) => {
			// Add timestamps and metadata
			const planWithTimestamps = this.addTimestamps(
				{
					name,
					description,
					practice_goals,
					phase_of_season,
					estimated_number_of_participants,
					created_by: userId,
					visibility,
					is_editable_by_others,
					start_time
				},
				true
			);

			// Insert practice plan
			const planResult = await client.query(
				`INSERT INTO practice_plans (
          name, description, practice_goals, phase_of_season, 
          estimated_number_of_participants, created_by, 
          visibility, is_editable_by_others, start_time, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING id`,
				[
					planWithTimestamps.name,
					planWithTimestamps.description,
					planWithTimestamps.practice_goals,
					planWithTimestamps.phase_of_season,
					planWithTimestamps.estimated_number_of_participants,
					planWithTimestamps.created_by,
					planWithTimestamps.visibility,
					planWithTimestamps.is_editable_by_others,
					planWithTimestamps.start_time,
					planWithTimestamps.created_at,
					planWithTimestamps.updated_at
				]
			);

			const planId = planResult.rows[0].id;

			// Insert sections and their items
			for (const section of sections) {
				// Validate section data before inserting?
				if (!section || typeof section.name !== 'string' || typeof section.order !== 'number') {
					// Rollback transaction and throw ValidationError
					throw new ValidationError('Invalid section data provided.', {
						section: section?.name || 'unknown'
					});
				}

				const sectionResult = await client.query(
					`INSERT INTO practice_plan_sections 
           (practice_plan_id, name, "order", goals, notes)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
					[planId, section.name, section.order, section.goals, section.notes]
				);

				const dbSectionId = sectionResult.rows[0].id;

				// Insert items for this section
				if (section.items?.length > 0) {
					for (const [index, item] of section.items.entries()) {
						// Validate item data before inserting?
						if (!item || typeof item.duration !== 'number' || typeof item.type !== 'string') {
							// Rollback transaction and throw ValidationError
							throw new ValidationError('Invalid item data provided in section.', {
								item: item?.name || 'unknown'
							});
						}

						await client.query(
							`INSERT INTO practice_plan_drills 
               (practice_plan_id, section_id, drill_id, formation_id, order_in_plan, duration, type, diagram_data, parallel_group_id, parallel_timeline, group_timelines, name)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
							[
								planId,
								dbSectionId,
								// Logic for determining drill_id
								(() => {
									// For one-off items, use null
									if (item.type === 'one-off' || (typeof item.id === 'number' && item.id < 0)) {
										return null;
									}
									// For drills, use drill_id, item.id, or drill.id if available
									if (item.type === 'drill') {
										return item.drill_id || item.id || item.drill?.id || null;
									}
									// For other types (e.g., breaks), use null
									return null;
								})(),
								// Logic for determining formation_id
								item.type === 'formation' ? item.formation_id || item.formation?.id || null : null,
								index,
								item.duration,
								// Map 'one-off' type to 'drill' to conform to database constraints
								item.type === 'one-off' || item.type === 'activity' ? 'drill' : item.type,
								item.diagram_data,
								item.parallel_group_id,
								item.parallel_timeline,
								item.groupTimelines ? `{${item.groupTimelines.join(',')}}` : null,
								// Save the name field
								item.name ||
									(item.type === 'drill' && item.drill?.name
										? item.drill.name
										: item.type === 'formation' && item.formation?.name
											? item.formation.name
											: item.type === 'one-off'
												? 'Quick Activity'
												: 'Break')
							]
						);
					}
				}
			}

			return { id: planId };
		}); // Transaction automatically handles rollback on error
	}

	/**
	 * Validate a practice plan using the Zod schema.
	 * This is kept for potential direct service usage, but primary validation should be at API boundary.
	 * @param {Object} plan - Practice plan to validate
	 * @throws {ValidationError} If validation fails
	 */
	validatePracticePlan(plan) {
		const result = practicePlanSchema.safeParse(plan);
		if (!result.success) {
			// Format Zod errors into the structure expected by ValidationError
			const formattedErrors = result.error.flatten().fieldErrors;
			console.warn('[Service Validation Warn] Practice plan validation failed:', formattedErrors);
			throw new ValidationError('Practice plan validation failed', formattedErrors);
		}
		// No return value needed, throws on failure
	}

	/**
	 * Get a practice plan with all its details
	 * @param {number} id - Practice plan ID
	 * @param {number|null} userId - User ID requesting the plan
	 * @returns {Promise<Object>} - Complete practice plan with sections and items
	 * @throws {NotFoundError} If plan not found
	 * @throws {ForbiddenError} If user lacks permission to view
	 * @throws {DatabaseError} On database error
	 */
	async getPracticePlanById(id, userId = null) {
		try {
			// First fetch the practice plan using base service method
			// Pass userId here to enforce view permissions early via getById
			// This will throw NotFoundError if the plan doesn't exist.
			// It will throw ForbiddenError if user cannot view.
			const practicePlan = await this.getById(id, ['*'], userId);

			// Fetch sections and items within a transaction for consistency
			return this.withTransaction(async (client) => {
				// Fetch sections
				const sectionsResult = await client.query(
					`SELECT * FROM practice_plan_sections 
           WHERE practice_plan_id = $1 
           ORDER BY "order"`,
					[id]
				);

				// Fetch items with their section assignments
				const itemsResult = await client.query(
					`SELECT 
            ppd.id,
            ppd.practice_plan_id,
            ppd.section_id,
            ppd.drill_id,
	            ppd.formation_id,
	            ppd.order_in_plan,
            ppd.duration AS item_duration,
            ppd.type,
            ppd.name,
            ppd.parallel_group_id,
            ppd.parallel_timeline,
            ppd.diagram_data AS ppd_diagram_data,
            ppd.group_timelines::text[] AS "groupTimelines",
            d.id AS drill_id,
            d.name AS drill_name,
            d.brief_description,
            d.detailed_description,
            d.suggested_length_min,
            d.suggested_length_max,
            d.skill_level,
            d.complexity,
            d.number_of_people_min,
            d.number_of_people_max,
            d.skills_focused_on,
            d.positions_focused_on,
            d.video_link,
            d.diagrams,
	            f.id AS formation_id,
	            f.name AS formation_name,
	            f.brief_description AS formation_brief_description,
	            f.detailed_description AS formation_detailed_description,
	            f.diagrams AS formation_diagrams
	           FROM practice_plan_drills ppd
	           LEFT JOIN drills d ON ppd.drill_id = d.id
	           LEFT JOIN formations f ON ppd.formation_id = f.id
           WHERE ppd.practice_plan_id = $1
           ORDER BY ppd.section_id, ppd.order_in_plan`,
					[id]
				);

				// Organize items by section
				const sections = sectionsResult.rows.map((section) => ({
					...section,
					items: itemsResult.rows
						.filter((item) => item.section_id === section.id)
						.map((item) => this.formatDrillItem(item))
				}));

				// Calculate duration for each section
				sections.forEach((section) => {
					section.duration = this.calculateSectionDuration(section.items);
				});

				// If no sections exist, create a default one
				if (sections.length === 0) {
					const defaultSection = {
						id: 'default',
						name: 'Main Section',
						order: 0,
						goals: [],
						notes: '',
						items: itemsResult.rows.map((item) => this.formatDrillItem(item))
					};
					defaultSection.duration = this.calculateSectionDuration(defaultSection.items);
					sections.push(defaultSection);
				}

				// Add sections to practice plan
				practicePlan.sections = sections;

				return practicePlan;
			}); // End transaction
		} catch (error) {
			// Re-throw known errors (NotFoundError, ForbiddenError from above)
			if (error instanceof NotFoundError || error instanceof ForbiddenError) {
				throw error;
			}
			// Wrap other potential errors (e.g., DB errors during section/item fetch) in DatabaseError
			console.error(`Error fetching practice plan details for ID ${id}:`, error);
			throw new DatabaseError('Failed to fetch practice plan details', error);
		}
	}

	/**
	 * Update a practice plan
	 * @param {number} id - Practice plan ID
	 * @param {Object} planData - Updated practice plan data
	 * @param {number|null} userId - User ID updating the plan
	 * @returns {Promise<Object>} - Updated practice plan
	 * @throws {NotFoundError} If plan not found
	 * @throws {ForbiddenError} If user lacks permission to edit
	 * @throws {ValidationError} If validation fails
	 * @throws {DatabaseError} On database error
	 */
	async updatePracticePlan(id, planData, userId = null) {
		// Validate incoming data structure (basic checks)
		// More specific validation (like visibility) happens later
		if (!planData || typeof planData !== 'object') {
			throw new ValidationError('Invalid update data provided.');
		}

		// Use base canUserEdit which now throws errors
		try {
			await this.canUserEdit(id, userId);
		} catch (error) {
			// Re-throw NotFoundError or ForbiddenError from canUserEdit
			if (error instanceof NotFoundError || error instanceof ForbiddenError) {
				throw error;
			}
			// Wrap other errors (e.g., DB error during permission check) as DatabaseError
			console.error(`Error checking edit permission for plan ${id}:`, error);
			throw new DatabaseError('Failed to check edit permission', error);
		}

		// If anonymous user, force public visibility and editable
		if (!userId) {
			planData.visibility = 'public';
			planData.is_editable_by_others = true;
		}

		// Use transaction helper
		return this.withTransaction(async (client) => {
			// --- Check permissions again inside transaction ---
			await this.canUserEdit(id, userId, client);

			// --- Prepare data for update ---
			// Exclude sections and items from the main plan update data
			const { sections, ...planUpdateData } = planData;
			const planWithTimestamp = this.addTimestamps(planUpdateData, false);

			// Remove fields that shouldn't be directly updated or are handled by permissions/logic
			delete planWithTimestamp.created_by; // Don't allow changing creator
			// visibility and is_editable_by_others might be updated based on logic above

			// --- Update the main practice_plans table using base method ---
			// const result = await client.query(
			//   `UPDATE practice_plans SET
			//    name = $1,
			//    description = $2,
			//    practice_goals = $3,
			//    phase_of_season = $4,
			//    estimated_number_of_participants = $5,
			//    is_editable_by_others = $6,
			//    visibility = $7,
			//    start_time = $8,
			//    updated_at = $9
			//    WHERE id = $10 -- Permission check moved to canUserEdit
			//    RETURNING *`,
			//   [
			//     planWithTimestamp.name,
			//     planWithTimestamp.description,
			//     planWithTimestamp.practice_goals,
			//     planWithTimestamp.phase_of_season,
			//     planWithTimestamp.estimated_number_of_participants,
			//     planWithTimestamp.is_editable_by_others,
			//     planWithTimestamp.visibility,
			//     planWithTimestamp.start_time,
			//     planWithTimestamp.updated_at,
			//     id
			//   ]
			// );

			// Use base update method, passing the client
			const updatedPlan = await this.update(id, planWithTimestamp, client);

			// --- Update sections and drills (delete and re-insert) ---
			// Note: This delete/re-insert is simple but can be inefficient for large plans.
			// A more complex update strategy could compare/update/insert/delete rows individually.

			// Delete existing sections and drills for this plan
			await client.query(`DELETE FROM practice_plan_drills WHERE practice_plan_id = $1`, [id]);
			await client.query(`DELETE FROM practice_plan_sections WHERE practice_plan_id = $1`, [id]);

			// Insert sections
			if (sections?.length > 0) {
				for (const section of sections) {
					// Validate section data before inserting?
					if (!section || typeof section.name !== 'string' || typeof section.order !== 'number') {
						throw new ValidationError('Invalid section data provided during update.', {
							section: section?.name || 'unknown'
						});
					}

					// Insert section
					const sectionResult = await client.query(
						`INSERT INTO practice_plan_sections 
             (practice_plan_id, id, name, "order", goals, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
						[id, section.id, section.name, section.order, section.goals, section.notes]
					);

					// Insert items with explicit ordering
					if (section.items?.length > 0) {
						for (const [index, item] of section.items.entries()) {
							// Validate item data before inserting?
							if (!item || typeof item.duration !== 'number' || typeof item.type !== 'string') {
								throw new ValidationError('Invalid item data provided in section during update.', {
									item: item?.name || 'unknown'
								});
							}

							await client.query(
								`INSERT INTO practice_plan_drills 
	                 (practice_plan_id, section_id, drill_id, formation_id, order_in_plan, duration, type, 
	                  parallel_group_id, parallel_timeline, group_timelines, name, diagram_data)
	                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
								[
									id,
									section.id,
									(() => {
										// For one-off items, use null
										if (item.type === 'one-off' || (typeof item.id === 'number' && item.id < 0)) {
											return null;
										}
										// For drills, use drill_id, item.id, or drill.id if available
										if (item.type === 'drill') {
											return item.drill_id || item.id || item.drill?.id || null;
										}
										// For other types (e.g., breaks), use null
										return null;
									})(),
									// Logic for determining formation_id
									// For formation items, use formation_id
									item.type === 'formation'
										? item.formation_id || item.formation?.id || null
										: null,
									index,
									item.duration || item.selected_duration,
									// Map 'one-off' type to 'drill' to conform to database constraints
									item.type === 'one-off' || item.type === 'activity' ? 'drill' : item.type,
									item.parallel_group_id,
									item.parallel_timeline || null,
									item.groupTimelines ? `{${item.groupTimelines.join(',')}}` : null,
									// Name field
									item.name ||
										(item.type === 'drill' && item.drill?.name
											? item.drill.name
											: item.type === 'one-off'
												? 'Quick Activity'
												: 'Break'),
									// Diagram data
									item.diagram_data
								]
							);
						}
						// Call resequence after inserting all items for this section
						await this._resequenceItems(section.id, client);
					}
				}
			}

			// Return the result from the base update method
			return updatedPlan;
		}); // Transaction handles rollback
	}

	/**
	 * Resequence the order_in_plan for items within a specific section.
	 * Ensures the order is sequential (0, 1, 2...) based on the current order.
	 * This is a protected method, intended for internal use or subclass overrides, and for testing purposes.
	 * @param {string|number} sectionId - The ID of the section to resequence.
	 * @param {object} client - The database transaction client.
	 * @returns {Promise<void>}
	 * @private // This @private is now more of a convention, as it's _resequenceItems
	 */
	async _resequenceItems(sectionId, client) {
		try {
			// Get item IDs in their current order within the section
			const itemsResult = await client.query(
				`SELECT id 
         FROM practice_plan_drills 
         WHERE section_id = $1 
         ORDER BY order_in_plan ASC`,
				[sectionId]
			);

			const itemIds = itemsResult.rows.map((row) => row.id);

			// If there are items, build and execute an UPDATE query with CASE
			if (itemIds.length > 0) {
				let caseStatement = 'CASE id ';
				const values = [sectionId]; // Start parameters array with sectionId
				itemIds.forEach((id, index) => {
					caseStatement += `WHEN $${values.length + 1} THEN $${values.length + 2} `;
					values.push(id, index); // Add id and new order to parameters
				});
				caseStatement += 'END';

				const updateQuery = `
          UPDATE practice_plan_drills 
          SET order_in_plan = (${caseStatement})::integer
          WHERE section_id = $1 AND id = ANY($${values.length + 1}::int[])`;

				// Add the array of item IDs as the last parameter
				values.push(itemIds);

				await client.query(updateQuery, values);
			}
			// No need to do anything if there are no items
		} catch (error) {
			// Log the error but don't necessarily halt the entire update if resequencing fails,
			// though it indicates a potential data integrity issue. Consider how critical this is.
			console.error(`Error resequencing items for section ${sectionId}:`, error);
			// Re-throwing might be appropriate depending on desired error handling strategy
			// throw new DatabaseError('Failed to resequence items', error);
		}
	}

	/**
	 * Delete a practice plan
	 * @param {number} id - Practice plan ID
	 * @param {number} userId - User ID requesting deletion
	 * @returns {Promise<void>} - Resolves if successful
	 * @throws {NotFoundError} If plan not found
	 * @throws {ForbiddenError} If user lacks permission to delete
	 * @throws {DatabaseError} On database error
	 */
	async deletePracticePlan(id, userId) {
		// Ensure user is authenticated for deletion, unless in dev mode where we might allow anonymous deletion for testing.
		if (!userId && !dev) {
			// Modified to allow no userId in dev
			throw new ForbiddenError('Authentication required to delete practice plans.');
		}

		// Use transaction helper for the entire deletion process
		try {
			return await this.withTransaction(async (client) => {
				// Fetch the plan's creator and visibility directly.
				// This serves as an existence check and gets necessary data for permission validation.
				const planDetailsQuery = `
          SELECT "${this.permissionConfig.userIdColumn}", "${this.permissionConfig.visibilityColumn}"
          FROM ${this.tableName}
          WHERE ${this.primaryKey} = $1
        `;
				const planDetailsResult = await client.query(planDetailsQuery, [id]);

				if (planDetailsResult.rows.length === 0) {
					throw new NotFoundError(`${this.tableName.slice(0, -1)} with ID ${id} not found.`);
				}
				const plan = planDetailsResult.rows[0];

				// Explicitly check if the current user is the creator.
				// is_editable_by_others does not grant delete permission.
				// Bypass this check in development mode.
				if (!dev) {
					// Check if NOT in dev mode for the following conditions
					if (!userId) {
						// If not in dev, userId is strictly required
						throw new ForbiddenError('Authentication required to delete this practice plan.');
					}
					if (plan[this.permissionConfig.userIdColumn] !== userId) {
						throw new ForbiddenError('Only the creator can delete this practice plan.');
					}
				} else {
					// In dev mode, log if bypassing creator check (optional)
					if (userId && plan[this.permissionConfig.userIdColumn] !== userId) {
						console.log(
							`[DEV MODE] Bypassing creator check for deleting plan ${id}. User ${userId} is not creator ${plan[this.permissionConfig.userIdColumn]}.`
						);
					} else if (!userId && plan[this.permissionConfig.userIdColumn] !== null) {
						console.log(
							`[DEV MODE] Bypassing creator check for deleting plan ${id}. No user, plan created by ${plan[this.permissionConfig.userIdColumn]}.`
						);
					}
				}

				// If all checks pass, proceed with deletion
				// Delete related records first (important for foreign key constraints)
				await client.query('DELETE FROM practice_plan_drills WHERE practice_plan_id = $1', [id]);

				await client.query('DELETE FROM practice_plan_sections WHERE practice_plan_id = $1', [id]);

				// Finally delete the practice plan using the base method, passing the client
				// The base delete method will also throw NotFoundError if the plan somehow disappeared.
				await this.delete(id, client);

				// No return value needed, implicit resolution indicates success
			});
		} catch (error) {
			// Re-throw known errors (NotFoundError, ForbiddenError from checks or base delete)
			if (error instanceof NotFoundError || error instanceof ForbiddenError) {
				throw error;
			}
			console.error(`Error deleting practice plan ${id}:`, error);
			// Wrap other errors (e.g., DB errors during deletion) as DatabaseError
			throw new DatabaseError('Failed to delete practice plan', error);
		}
	}

	/**
	 * Duplicate a practice plan
	 * @param {number} id - Practice plan ID to duplicate
	 * @param {number|null} userId - User ID creating the duplicate
	 * @returns {Promise<Object>} - New practice plan ID
	 * @throws {NotFoundError} If original plan not found
	 * @throws {ForbiddenError} If user cannot view original plan
	 * @throws {DatabaseError} On database error
	 */
	async duplicatePracticePlan(id, userId = null) {
		// First fetch the original practice plan details, including checking view permissions
		// getPracticePlanById handles NotFoundError and ForbiddenError.
		let originalPlanWithDetails;
		try {
			originalPlanWithDetails = await this.getPracticePlanById(id, userId);
		} catch (error) {
			// Re-throw known errors
			if (error instanceof NotFoundError || error instanceof ForbiddenError) {
				throw error;
			}
			console.error(`Error fetching original plan ${id} for duplication:`, error);
			throw new DatabaseError('Failed to fetch original plan for duplication', error);
		}

		// Use transaction helper for duplication process
		try {
			return await this.withTransaction(async (client) => {
				// Create data for new plan with timestamps
				const newPlanData = this.addTimestamps(
					{
						name: `${originalPlanWithDetails.name} (Copy)`,
						description: originalPlanWithDetails.description,
						practice_goals: originalPlanWithDetails.practice_goals,
						phase_of_season: originalPlanWithDetails.phase_of_season,
						estimated_number_of_participants:
							originalPlanWithDetails.estimated_number_of_participants,
						created_by: userId,
						// New plan visibility/editability depends on user creating it, or defaults?
						// Let's default to private for the user, or public if anonymous
						visibility: userId ? 'private' : 'public',
						is_editable_by_others: !userId, // Editable if anonymous, not otherwise by default
						start_time: originalPlanWithDetails.start_time
					},
					true
				);

				// Create new practice plan
				const newPlanResult = await client.query(
					`INSERT INTO practice_plans (
            name, description, practice_goals, phase_of_season,
            estimated_number_of_participants, created_by,
            visibility, is_editable_by_others, start_time, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *`,
					[
						newPlanData.name,
						newPlanData.description,
						newPlanData.practice_goals,
						newPlanData.phase_of_season,
						newPlanData.estimated_number_of_participants,
						newPlanData.created_by,
						newPlanData.visibility,
						newPlanData.is_editable_by_others,
						newPlanData.start_time,
						newPlanData.created_at,
						newPlanData.updated_at
					]
				);

				const newPlanId = newPlanResult.rows[0].id;

				// Copy sections
				const sectionsResult = await client.query(
					`SELECT * FROM practice_plan_sections 
           WHERE practice_plan_id = $1 
           ORDER BY "order"`,
					[id]
				);

				for (const section of sectionsResult.rows) {
					// Insert section
					const newSectionResult = await client.query(
						`INSERT INTO practice_plan_sections 
             (practice_plan_id, name, "order", goals, notes)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
						[newPlanId, section.name, section.order, section.goals, section.notes]
					);

					const newSectionId = newSectionResult.rows[0].id;

					// Copy drills for this section
					const drillsResult = await client.query(
						`SELECT * FROM practice_plan_drills 
             WHERE practice_plan_id = $1 AND section_id = $2
             ORDER BY order_in_plan`,
						[id, section.id]
					);

					for (const drill of drillsResult.rows) {
						await client.query(
							`INSERT INTO practice_plan_drills 
	               (practice_plan_id, section_id, drill_id, formation_id, order_in_plan, 
	                duration, type, diagram_data, parallel_group_id, parallel_timeline,
	                group_timelines, name)
	               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
							[
								newPlanId,
								newSectionId,
								drill.drill_id,
								drill.formation_id,
								drill.order_in_plan,
								drill.duration,
								drill.type,
								drill.diagram_data,
								drill.parallel_group_id,
								drill.parallel_timeline,
								drill.group_timelines,
								drill.name
							]
						);
					}
				}

				return { id: newPlanId };
			}); // End transaction
		} catch (error) {
			console.error(`Error duplicating practice plan ${id}:`, error);
			// Wrap errors during the duplication transaction
			throw new DatabaseError('Failed to duplicate practice plan', error);
		}
	}

	/**
	 * Format a drill item from database row to client format
	 * @param {Object} item - Database row for drill item
	 * @returns {Object} - Formatted drill item
	 */
	formatDrillItem(item) {
		// Check if this is a one-off drill (when type is 'drill' but drill_id is null)
		const isOneOff = item.type === 'drill' && item.drill_id === null;

		if (item.type === 'formation') {
			return {
				id: item.id,
				practice_plan_id: item.practice_plan_id,
				type: 'formation',
				duration: item.item_duration,
				order_in_plan: item.order_in_plan,
				section_id: item.section_id,
				parallel_group_id: item.parallel_group_id,
				parallel_timeline: item.parallel_timeline,
				groupTimelines: item.groupTimelines,
				diagram_data: item.ppd_diagram_data,
				name: item.name || item.formation_name,
				formation_id: item.formation_id,
				formation: item.formation_id
					? {
							id: item.formation_id,
							name: item.formation_name,
							brief_description: item.formation_brief_description,
							detailed_description: item.formation_detailed_description,
							diagrams: item.formation_diagrams
						}
					: null
			};
		} else if (item.type === 'drill') {
			return {
				id: item.id,
				practice_plan_id: item.practice_plan_id,
				type: isOneOff ? 'one-off' : 'drill',
				duration: item.item_duration,
				order_in_plan: item.order_in_plan,
				section_id: item.section_id,
				parallel_group_id: item.parallel_group_id,
				parallel_timeline: item.parallel_timeline,
				groupTimelines: item.groupTimelines,
				diagram_data: item.ppd_diagram_data,
				name: item.name || (isOneOff ? 'Quick Activity' : item.drill_name),
				drill_id: item.drill_id,
				drill: isOneOff
					? null
					: {
							id: item.drill_id,
							name: item.drill_name,
							brief_description: item.brief_description,
							detailed_description: item.detailed_description,
							suggested_length: item.suggested_length_min,
							skill_level: item.skill_level,
							complexity: item.complexity,
							number_of_people_min: item.number_of_people_min,
							number_of_people_max: item.number_of_people_max,
							skills_focused_on: item.skills_focused_on,
							positions_focused_on: item.positions_focused_on,
							video_link: item.video_link,
							diagrams: item.diagrams
						}
			};
		} else {
			return {
				id: item.id,
				practice_plan_id: item.practice_plan_id,
				type: 'break',
				duration: item.item_duration,
				order_in_plan: item.order_in_plan,
				section_id: item.section_id,
				name: item.name || 'Break',
				parallel_group_id: item.parallel_group_id,
				parallel_timeline: item.parallel_timeline,
				groupTimelines: item.groupTimelines
			};
		}
	}

	/**
	 * Calculate section duration considering parallel drills
	 * @param {Array<Object>} items - Items in the section
	 * @returns {number} - Total section duration
	 */
	calculateSectionDuration(items) {
		const parallelGroups = new Map();
		let totalDuration = 0;

		items.forEach((item) => {
			// Skip formations - they don't contribute to duration
			if (item.type === 'formation') {
				return;
			}

			if (item.parallel_group_id) {
				const group = parallelGroups.get(item.parallel_group_id) || { duration: 0 };
				group.duration = Math.max(group.duration, item.duration || 0);
				parallelGroups.set(item.parallel_group_id, group);
			} else {
				totalDuration += item.duration || 0;
			}
		});

		// Add durations of parallel groups
		parallelGroups.forEach((group) => {
			totalDuration += group.duration;
		});

		return totalDuration;
	}

	/**
	 * Associate an anonymously created practice plan with a user
	 * @param {number} id - Practice Plan ID
	 * @param {number} userId - User ID to associate with
	 * @returns {Promise<Object>} - The updated practice plan
	 * @throws {NotFoundError} - If plan not found
	 * @throws {ConflictError} - If plan already owned by another user
	 * @throws {DatabaseError} - On database error
	 */
	async associatePracticePlan(id, userId) {
		// getById will throw NotFoundError if plan doesn't exist
		// Pass userId=null initially to fetch regardless of current owner, but check visibility
		const plan = await this.getById(id, [this.permissionConfig.userIdColumn], null);

		// Check if already owned by a *different* user
		if (
			plan[this.permissionConfig.userIdColumn] !== null &&
			plan[this.permissionConfig.userIdColumn] !== userId
		) {
			// Use ConflictError as the resource state prevents association
			throw new ConflictError('Practice plan is already associated with another user.');
		}

		// If already owned by the *same* user, return the plan (idempotent)
		if (plan[this.permissionConfig.userIdColumn] === userId) {
			return plan;
		}

		// Update the created_by field using base update method
		// This will also throw NotFoundError if the plan disappears mid-operation
		try {
			return await this.update(id, { [this.permissionConfig.userIdColumn]: userId });
		} catch (error) {
			// Re-throw known errors (like NotFoundError from update)
			if (error instanceof NotFoundError) {
				throw error;
			}
			// Wrap other errors as DatabaseError
			console.error(`Error associating plan ${id} with user ${userId}:`, error);
			throw new DatabaseError('Failed to associate practice plan', error);
		}
	}

	/**
	 * Links a practice plan item (activity) to a newly created drill.
	 * @param {number} practicePlanItemId - The ID of the item in practice_plan_drills.
	 * @param {number} newDrillId - The ID of the newly created drill to link to.
	 * @param {number} practicePlanId - The ID of the practice plan for permission checking.
	 * @param {number} userId - The ID of the user performing the action.
	 * @returns {Promise<Object>} - The updated practice plan item.
	 * @throws {NotFoundError} If practice plan or item not found.
	 * @throws {ForbiddenError} If user lacks permission to edit the practice plan.
	 * @throws {DatabaseError} On database error.
	 */
	async linkPracticePlanItemToDrill(practicePlanItemId, newDrillId, practicePlanId, userId) {
		return this.withTransaction(async (client) => {
			// 1. Check if user can edit the practice plan
			await this.canUserEdit(practicePlanId, userId, client); // Throws ForbiddenError if not allowed

			// 2. Update the practice plan item
			const updateQuery = `
        UPDATE practice_plan_drills
        SET drill_id = $1, type = 'drill' 
        WHERE id = $2 AND practice_plan_id = $3
        RETURNING *;
      `;
			// Ensure practice_plan_id condition is also met for safety, though item ID should be unique.
			const result = await client.query(updateQuery, [
				newDrillId,
				practicePlanItemId,
				practicePlanId
			]);

			if (result.rows.length === 0) {
				throw new NotFoundError(
					`Practice plan item with ID ${practicePlanItemId} in plan ${practicePlanId} not found or update failed.`
				);
			}

			// 3. Format and return the updated item (optional, could also return success status)
			// The formatDrillItem expects a row that might have joined drill data.
			// For simplicity here, we return the raw updated row from practice_plan_drills.
			// If full formatting is needed, a subsequent fetch/join might be required.
			return result.rows[0];
		});
	}
}

// Create and export an instance of the service
export const practicePlanService = new PracticePlanService();

// Additional methods for Season Planning (Phase 4)

PracticePlanService.prototype.getByTeamAndDate = async function(teamId, scheduledDate) {
  const result = await this.getAll({
    filters: { 
      team_id: teamId,
      scheduled_date: scheduledDate
    },
    limit: 1
  });
  return result.items[0] || null;
};

PracticePlanService.prototype.getByIdWithContent = async function(planId) {
  return await this.withTransaction(async (client) => {
    // Get plan
    const planQuery = 'SELECT * FROM practice_plans WHERE id = $1';
    const planResult = await client.query(planQuery, [planId]);
    if (planResult.rows.length === 0) return null;
    
    const plan = planResult.rows[0];
    
    // Get sections
    const sectionsQuery = `
      SELECT * FROM practice_plan_sections 
      WHERE practice_plan_id = $1 
      ORDER BY "order"
    `;
    const sectionsResult = await client.query(sectionsQuery, [planId]);
    plan.sections = sectionsResult.rows;
    
    // Get drills with details
    const drillsQuery = `
      SELECT 
        ppd.*,
        d.name as drill_name,
        d.brief_description as drill_description,
        f.name as formation_name,
        f.brief_description as formation_description,
        pps.name as section_name
      FROM practice_plan_drills ppd
      LEFT JOIN drills d ON ppd.drill_id = d.id
      LEFT JOIN formations f ON ppd.formation_id = f.id
      LEFT JOIN practice_plan_sections pps ON ppd.section_id = pps.id
      WHERE ppd.practice_plan_id = $1
      ORDER BY ppd.order_in_plan
    `;
    const drillsResult = await client.query(drillsQuery, [planId]);
    plan.drills = drillsResult.rows;
    
    return plan;
  });
};

PracticePlanService.prototype.createWithContent = async function(data, userId) {
  return await this.withTransaction(async (client) => {
    // Create the practice plan
  const planData = {
      name: data.name,
      description: data.description,
      practice_goals: data.practice_goals || [],
      phase_of_season: data.phase_of_season,
      estimated_number_of_participants: data.estimated_number_of_participants,
      created_by: userId,
      visibility: data.visibility || 'private',
      is_editable_by_others: false,
      start_time: data.start_time,
      team_id: data.team_id,
      season_id: data.season_id,
      scheduled_date: data.scheduled_date,
      is_published: data.is_published === true,
      is_template: data.is_template || false,
      template_plan_id: data.template_plan_id,
      is_edited: data.is_edited || false
    };
    
    const planQuery = `
      INSERT INTO practice_plans (
        name, description, practice_goals, phase_of_season,
        estimated_number_of_participants, created_by, visibility,
        is_editable_by_others, start_time, team_id, season_id,
        scheduled_date, is_published, is_template, template_plan_id, is_edited
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *
    `;
    
    const planResult = await client.query(planQuery, [
      planData.name,
      planData.description,
      JSON.stringify(planData.practice_goals),
      planData.phase_of_season,
      planData.estimated_number_of_participants,
      planData.created_by,
      planData.visibility,
      planData.is_editable_by_others,
      planData.start_time,
      planData.team_id,
      planData.season_id,
      planData.scheduled_date,
      planData.is_published,
      planData.is_template,
      planData.template_plan_id,
      planData.is_edited
    ]);
    
    const plan = planResult.rows[0];
    
    // Create sections
    const sectionMap = {};
    for (const section of data.sections || []) {
      const sectionQuery = `
        INSERT INTO practice_plan_sections (
          practice_plan_id, name, "order", goals, notes
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const sectionResult = await client.query(sectionQuery, [
        plan.id,
        section.name,
        section.order || 0,
        JSON.stringify(section.goals || []),
        section.notes
      ]);
      
      sectionMap[section.name] = sectionResult.rows[0].id;
    }
    
    // Create drills
    for (const drill of data.drills || []) {
      const sectionId = drill.section_name ? sectionMap[drill.section_name] : drill.section_id;
      
      const drillQuery = `
        INSERT INTO practice_plan_drills (
          practice_plan_id, drill_id, formation_id, type, name,
          selected_duration, order_in_plan, section_id, parallel_group_id,
          parallel_timeline, group_timelines
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
      
      await client.query(drillQuery, [
        plan.id,
        drill.drill_id,
        drill.formation_id,
        drill.type || 'drill',
        drill.name,
        drill.duration || 30,
        drill.order_in_plan || 0,
        sectionId,
        drill.parallel_group_id,
        drill.parallel_timeline,
        JSON.stringify(drill.group_timelines || [])
      ]);
    }
    
    return await this.getByIdWithContent(plan.id);
  });
};

PracticePlanService.prototype.publishPracticePlan = async function(planId, userId) {
  const plan = await this.getById(planId);
  
  // Check permissions
  const { teamMemberService } = await import('./teamMemberService.js');
  if (plan.team_id) {
    const member = await teamMemberService.getMember(plan.team_id, userId);
    if (!member || (member.role !== 'admin' && plan.created_by !== userId)) {
      throw new ForbiddenError('Only team admins or the creator can publish plans');
    }
  } else if (plan.created_by !== userId) {
    throw new ForbiddenError('Only the creator can publish this plan');
  }
  
  // Update published flag
  return await this.withTransaction(async (client) => {
    const query = `
      UPDATE practice_plans 
      SET is_published = true,
          published_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await client.query(query, [planId]);
    return result.rows[0];
  });
};

PracticePlanService.prototype.unpublishPracticePlan = async function(planId, userId) {
  const plan = await this.getById(planId);
  
  // Check permissions
  const { teamMemberService } = await import('./teamMemberService.js');
  if (plan.team_id) {
    const member = await teamMemberService.getMember(plan.team_id, userId);
    if (!member || (member.role !== 'admin' && plan.created_by !== userId)) {
      throw new ForbiddenError('Only team admins or the creator can unpublish plans');
    }
  } else if (plan.created_by !== userId) {
    throw new ForbiddenError('Only the creator can unpublish this plan');
  }
  
  // Update published flag back to false
  return await this.withTransaction(async (client) => {
    const query = `
      UPDATE practice_plans 
      SET is_published = false,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await client.query(query, [planId]);
    return result.rows[0];
  });
};
