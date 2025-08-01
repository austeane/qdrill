import { BaseEntityService } from './baseEntityService.js';
import * as db from '$lib/server/db';
import { upsertSkillCounts } from './skillSql.js';
import {
	NotFoundError,
	ForbiddenError,
	ValidationError,
	DatabaseError,
	ConflictError,
	AppError
} from '$lib/server/errors.js'; // Added import
import { dev } from '$app/environment'; // Import dev environment variable
import { json } from '@sveltejs/kit';
import { kyselyDb, sql } from '$lib/server/db';

/**
 * Service for managing drills
 * Extends the BaseEntityService with drill-specific functionality
 */
export class DrillService extends BaseEntityService {
	/**
	 * Creates a new DrillService
	 */
	constructor() {
		const allowedColumns = [
			'name',
			'brief_description',
			'detailed_description',
			'skill_level',
			'complexity',
			'number_of_people_min',
			'number_of_people_max',
			'skills_focused_on',
			'positions_focused_on',
			'drill_type',
			'created_by',
			'visibility',
			'date_created',
			'is_editable_by_others',
			'parent_drill_id',
			'video_link',
			'diagrams',
			'images',
			'upload_source',
			'search_vector',
			'suggested_length_min',
			'suggested_length_max'
		];

		const columnTypes = {
			diagrams: 'json',
			skills_focused_on: 'array',
			positions_focused_on: 'array',
			skill_level: 'array',
			drill_type: 'array',
			images: 'array'
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

		// Explicitly define default columns for DrillService
		// to ensure _executeSearch fallback selects them correctly with similarity_score
		const defaultDrillColumns = [
			'id',
			'name',
			'brief_description',
			'detailed_description',
			'skill_level',
			'complexity',
			'number_of_people_min',
			'number_of_people_max',
			'skills_focused_on',
			'positions_focused_on',
			'drill_type',
			'created_by',
			'visibility',
			'date_created',
			'is_editable_by_others',
			'parent_drill_id',
			'video_link',
			'diagrams',
			'images',
			'upload_source',
			'suggested_length_min',
			'suggested_length_max'
			// 'search_vector' is usually not needed in direct output
		];

		super('drills', 'id', defaultDrillColumns, allowedColumns, columnTypes, permissionConfig);

		// Define array fields for normalization
		this.arrayFields = [
			'skill_level',
			'skills_focused_on',
			'positions_focused_on',
			'drill_type',
			'images',
			'diagrams'
		];
	}

	/**
	 * Create a new drill
	 * @param {Object} drillData - Drill data
	 * @param {number|null} userId - User ID creating the drill (null if anonymous)
	 * @returns {Promise<Object>} - The created drill
	 */
	async createDrill(drillData, userId = null) {
		const dataWithMeta = {
			...drillData,
			created_by: userId,
			date_created: new Date()
		};
		const normalizedData = this.normalizeDrillData(dataWithMeta);

		return this.withTransaction(async (client) => {
			const drill = await this.create(normalizedData, client); // Pass client
			const skills = normalizedData.skills_focused_on || [];
			await this.updateSkills(skills, drill.id, client); // Pass client
			return drill;
		});
	}

	/**
	 * Update an existing drill
	 * @param {number} id - Drill ID
	 * @param {Object} drillData - Updated drill data
	 * @param {number} userId - User ID updating the drill
	 * @returns {Promise<Object>} - The updated drill
	 * @throws {NotFoundError} - If drill not found
	 * @throws {ForbiddenError} - If user not authorized
	 */
	async updateDrill(id, drillData, userId) {
		return this.withTransaction(async (client) => {
			await this.canUserEdit(id, userId, client);
			const existingDrill = await this.getById(id, this.defaultColumns, userId, client); // Use defaultColumns, pass client
			if (!existingDrill) {
				throw new NotFoundError('Drill not found');
			}
			const existingSkills = existingDrill.skills_focused_on || [];
			const normalizedData = this.normalizeDrillData(drillData);

			if (existingDrill.created_by === null && userId) {
				normalizedData.created_by = userId;
			}

			const updatedDrill = await this.update(id, normalizedData, client); // Pass client

			const skillsToRemove = existingSkills.filter(
				(skill) => !normalizedData.skills_focused_on?.includes(skill)
			);
			const skillsToAdd =
				normalizedData.skills_focused_on?.filter((skill) => !existingSkills.includes(skill)) || [];

			await this.updateSkillCounts(skillsToAdd, skillsToRemove, id, client); // Pass client

			if (normalizedData.name && normalizedData.name !== existingDrill.name) {
				await client.query(`UPDATE votes SET item_name = $1 WHERE drill_id = $2`, [
					normalizedData.name,
					id
				]);
			}
			return updatedDrill;
		});
	}

	/**
	 * Delete a drill by ID
	 * @param {number} id - Drill ID to delete
	 * @param {number} userId - User ID attempting the deletion
	 * @param {Object} options - Additional options
	 * @param {boolean} [options.deleteRelated=false] - Whether to delete related votes and comments
	 * @returns {Promise<boolean>} - True if successful, false if not found
	 * @throws {ForbiddenError} - If user not authorized
	 */
	async deleteDrill(id, userId, options = { deleteRelated: false }) {
		return this.withTransaction(async (client) => {
			let drill;
			if (options.deleteRelated && dev) {
				// Check for dev environment as well
				// In dev mode with deleteRelated, fetch without user ID check
				console.log(`[DEV MODE - deleteDrill] Bypassing permission checks for drill ${id}`);
				try {
					// Directly fetch the needed columns to avoid permission checks in getById
					const result = await client.query(
						`SELECT ${this.permissionConfig.userIdColumn} as created_by, skills_focused_on FROM drills WHERE id = $1`,
						[id]
					);
					if (result.rows.length === 0) {
						throw new NotFoundError(`Drill not found for deletion (dev mode): ${id}`);
					}
					drill = result.rows[0];
				} catch (error) {
					if (error instanceof NotFoundError) {
						throw error; // Re-throw as NotFoundError already handled
					}
					throw error; // Re-throw other errors
				}
			} else {
				// Ensure client is passed to getById for permission check within transaction
				drill = await this.getById(
					id,
					[this.permissionConfig.userIdColumn, 'skills_focused_on'],
					userId,
					client
				);
			}

			if (!drill) {
				throw new NotFoundError(`Drill not found to delete: ${id}`);
			}

			if (!(options.deleteRelated && dev) && drill[this.permissionConfig.userIdColumn] !== userId) {
				throw new ForbiddenError(
					`Unauthorized to delete this drill: ${id}. User ${userId} is not owner ${drill[this.permissionConfig.userIdColumn]}.`
				);
			}

			if (options.deleteRelated) {
				// Delete related votes
				await client.query('DELETE FROM votes WHERE drill_id = $1', [id]);
				// Delete related comments
				await client.query('DELETE FROM comments WHERE drill_id = $1', [id]);
				// Potentially delete from practice_plan_drills, etc. if needed
				// TODO: Add deletion from practice_plan_drills if required
			}

			// Delete the drill itself using the base service method with the client
			await this.delete(id, client);

			// Decrement skill counts (only if deletion was successful)
			const skillsToDecrement = drill.skills_focused_on || [];
			if (skillsToDecrement.length > 0) {
				// Passing an empty array for skillsToAdd
				await this.updateSkillCounts([], skillsToDecrement, id, client);
			}

			return true; // Successfully deleted
		});
	}

	/**
	 * Get a drill with its variations and creator names
	 * @param {number} id - Drill ID
	 * @returns {Promise<Object>} - Drill with variations and creator names
	 */
	async getDrillWithVariations(id) {
		const drill = await this.getById(id);
		if (!drill) {
			return null;
		}

		// Get variations of this drill
		const variationsQuery = `
      SELECT d.*, 
             (SELECT COUNT(*) FROM drills v WHERE v.parent_drill_id = d.id) as variation_count
      FROM drills d
      WHERE d.parent_drill_id = $1
      ORDER BY d.date_created DESC
    `;

		const variationsResult = await db.query(variationsQuery, [id]);
		drill.variations = variationsResult.rows;

		// Fetch creator names for variations if any exist
		if (drill.variations && drill.variations.length > 0) {
			const userIds = [...new Set(drill.variations.map((v) => v.created_by).filter(Boolean))];

			if (userIds.length > 0) {
				try {
					// Fetch user names using a separate service or direct query for now
					// TODO: Consider a dedicated UserService for this
					const usersResult = await db.query(`SELECT id, name FROM users WHERE id = ANY($1)`, [
						userIds
					]);

					const userMap = {};
					usersResult.rows.forEach((user) => {
						userMap[user.id] = user.name;
					});

					// Add creator_name to each variation
					drill.variations.forEach((variation) => {
						if (variation.created_by) {
							variation.creator_name = userMap[variation.created_by] || 'Unknown User';
						}
					});
				} catch (userError) {
					console.error(`Error fetching user names for variations of drill ${id}:`, userError);
					// Proceed without creator names if fetching fails
					drill.variations.forEach((variation) => {
						variation.creator_name = 'Error fetching name';
					});
				}
			}
		}

		return drill;
	}

	/**
	 * Create a variation of an existing drill
	 * @param {number} parentId - Parent drill ID
	 * @param {Object} variationData - Variation drill data
	 * @param {number} userId - User ID creating the variation
	 * @returns {Promise<Object>} - The created variation
	 * @throws {NotFoundError} - If parent drill not found
	 */
	async createVariation(parentId, variationData, userId) {
		const parentDrill = await this.getById(parentId);
		if (!parentDrill) {
			// Throw NotFoundError instead of generic Error
			throw new NotFoundError('Parent drill not found');
		}

		// Create a new drill as a variation
		const normalizedData = this.normalizeDrillData({
			...variationData,
			parent_drill_id: parentId,
			created_by: userId,
			date_created: new Date()
		});

		const variation = await this.create(normalizedData);

		// Update skills used in this variation
		if (normalizedData.skills_focused_on && normalizedData.skills_focused_on.length > 0) {
			await this.updateSkills(normalizedData.skills_focused_on, variation.id);
		}

		return variation;
	}

	/**
	 * Get options for drill filters (distinct values, ranges).
	 * @returns {Promise<Object>} - Object containing filter options.
	 */
	async getDrillFilterOptions() {
		try {
			// Helper function to process distinct values
			const processDistinctResults = (rows) => {
				return rows
					.map((row) => row.value)
					.filter(Boolean) // Ensure value is not null/undefined/empty string
					.sort();
			};

			// Query for distinct values (using LOWER + TRIM in SQL)
			const skillLevelsQuery = `SELECT DISTINCT LOWER(TRIM(UNNEST(skill_level))) as value FROM drills WHERE array_length(skill_level, 1) > 0 ORDER BY value;`;
			const complexitiesQuery = `SELECT DISTINCT LOWER(TRIM(complexity)) as value FROM drills WHERE complexity IS NOT NULL ORDER BY value;`;
			const skillsFocusedQuery = `SELECT DISTINCT LOWER(TRIM(UNNEST(skills_focused_on))) as value FROM drills WHERE array_length(skills_focused_on, 1) > 0 ORDER BY value;`;
			const positionsFocusedQuery = `SELECT DISTINCT LOWER(TRIM(UNNEST(positions_focused_on))) as value FROM drills WHERE array_length(positions_focused_on, 1) > 0 ORDER BY value;`;
			const drillTypesQuery = `SELECT DISTINCT LOWER(TRIM(UNNEST(drill_type))) as value FROM drills WHERE array_length(drill_type, 1) > 0 ORDER BY value;`;

			// Query for min/max number of people
			const peopleRangeQuery = `
        SELECT 
          MIN(number_of_people_min) as min_people,
          MAX(number_of_people_max) as max_people
        FROM drills
        WHERE number_of_people_min IS NOT NULL OR number_of_people_max IS NOT NULL;
      `;

			// Query for min/max suggested length
			const lengthRangeQuery = `
        SELECT 
          MIN(suggested_length_min) as min_length,
          MAX(suggested_length_max) as max_length
        FROM drills
        WHERE suggested_length_min IS NOT NULL OR suggested_length_max IS NOT NULL;
      `;

			// Execute all queries in parallel
			const [
				skillLevelsResult,
				complexitiesResult,
				skillsFocusedResult,
				positionsFocusedResult,
				drillTypesResult,
				peopleRangeResult,
				lengthRangeResult // Add lengthRangeResult
			] = await Promise.all([
				db.query(skillLevelsQuery),
				db.query(complexitiesQuery),
				db.query(skillsFocusedQuery),
				db.query(positionsFocusedQuery),
				db.query(drillTypesQuery),
				db.query(peopleRangeQuery),
				db.query(lengthRangeQuery) // Execute length query
			]);

			return {
				skillLevels: processDistinctResults(skillLevelsResult.rows),
				complexities: processDistinctResults(complexitiesResult.rows),
				skillsFocusedOn: processDistinctResults(skillsFocusedResult.rows),
				positionsFocusedOn: processDistinctResults(positionsFocusedResult.rows),
				drillTypes: processDistinctResults(drillTypesResult.rows),
				numberOfPeopleOptions: {
					min: peopleRangeResult.rows[0]?.min_people ?? 0, // Use nullish coalescing
					max: peopleRangeResult.rows[0]?.max_people ?? 100 // Use nullish coalescing
				},
				// Update suggestedLengths based on DB query
				suggestedLengths: {
					min: lengthRangeResult.rows[0]?.min_length ?? 0, // Default to 0 if null
					max: lengthRangeResult.rows[0]?.max_length ?? 120 // Default to 120 if null
				}
			};
		} catch (error) {
			console.error('Error in drillService.getDrillFilterOptions:', error);
			// Re-throw the error to be handled by the API route
			throw new DatabaseError('Failed to retrieve filter options from database.', error);
		}
	}

	/**
	 * Search drills by name, description, and other criteria
	 * @param {string} searchTerm - Search term
	 * @param {Object} options - Search options including filters
	 * @returns {Promise<Object>} - Search results with pagination
	 */
	async searchDrills(searchTerm, options = {}) {
		// Consolidate search logic into getFilteredDrills
		const filters = {
			...(options.filters || {}), // Preserve any existing filters from options
			searchQuery: searchTerm
		};
		// Remove options.filters if it exists, as it's merged into the main filters object
		const { filters: _, ...remainingOptions } = options;
		return this.getFilteredDrills(filters, remainingOptions);
	}

	/**
	 * Get drills with advanced filtering, sorting, and pagination
	 * Overrides base getAll functionality for complex drill filtering
	 * @param {Object} [filters={}] - Filters object
	 * @param {string[]} [filters.skill_level] - Skill levels to filter by (match any)
	 * @param {string} [filters.complexity] - Complexity level
	 * @param {string[]} [filters.skills_focused_on] - Skills to filter by (match any)
	 * @param {string[]} [filters.positions_focused_on] - Positions to filter by (match any)
	 * @param {string[]} [filters.drill_type] - Drill types to filter by (match any)
	 * @param {number} [filters.number_of_people_min] - Minimum number of people
	 * @param {number} [filters.number_of_people_max] - Maximum number of people
	 * @param {number} [filters.suggested_length_min] - Minimum suggested length (e.g., minutes)
	 * @param {number} [filters.suggested_length_max] - Maximum suggested length (e.g., minutes)
	 * @param {boolean} [filters.hasVideo] - Filter by presence of video
	 * @param {boolean} [filters.hasDiagrams] - Filter by presence of diagrams
	 * @param {boolean} [filters.hasImages] - Filter by presence of images
	 * @param {string} [filters.searchQuery] - Text search query (searches name, descriptions)
	 * @param {Object} [options={}] - Sorting and pagination options
	 * @param {string} [options.sortBy='date_created'] - Column to sort by (e.g., 'name', 'date_created')
	 * @param {'asc'|'desc'} [options.sortOrder='desc'] - Sort order
	 * @param {number} [options.page=1] - Page number
	 * @param {number} [options.limit=10] - Items per page
	 * @param {number|null} [options.userId] - User ID for permission filtering
	 * @param {string[]} [options.columns] - Columns to include in the result
	 * @returns {Promise<Object>} - Object containing `items` array and `pagination` info
	 */
	async getFilteredDrills(filters = {}, options = {}) {
		const {
			page = 1,
			limit = 10,
			sortBy = 'date_created',
			sortOrder = 'desc',
			columns = ['*'],
			userId = null
		} = options;

		const offset = (page - 1) * limit;

		// Helper to build the Kysely base query with specific drill table and common filters.
		const buildDrillBaseQuery = () => {
			let qb = kyselyDb.selectFrom('drills').selectAll(); // Start with selectAll, specific columns handled by _executeSearch or defaultColumns

			// Apply standard visibility/ownership filters from BaseEntityService
			// This part needs to be aligned with how _buildWhereClause works or be replicated if _buildWhereClause is not Kysely-native.
			// For now, assuming _buildWhereClause is not Kysely native and permissions are applied here directly for Kysely.
			if (this.useStandardPermissions && this.permissionConfig) {
				const { visibilityColumn, publicValue, unlistedValue, privateValue, userIdColumn } =
					this.permissionConfig;
				qb = qb.where((eb) => {
					const conditions = [
						eb(visibilityColumn, '=', publicValue),
						eb(visibilityColumn, '=', unlistedValue)
					];
					if (userId) {
						conditions.push(
							eb.and([eb(visibilityColumn, '=', privateValue), eb(userIdColumn, '=', userId)])
						);
					}
					return eb.or(conditions);
				});
			}

			// Apply specific drill filters using Kysely
			if (filters.skill_level?.length) qb = qb.where(sql`skill_level && $1`, [filters.skill_level]); // Array overlap
			if (filters.complexity) qb = qb.where('complexity', '=', filters.complexity);
			if (filters.skills_focused_on?.length)
				qb = qb.where(sql`skills_focused_on && $1`, [filters.skills_focused_on]);
			if (filters.positions_focused_on?.length)
				qb = qb.where(sql`positions_focused_on && $1`, [filters.positions_focused_on]);
			if (filters.drill_type?.length) qb = qb.where(sql`drill_type && $1`, [filters.drill_type]);
			if (filters.number_of_people_min != null)
				qb = qb.where('number_of_people_min', '>=', filters.number_of_people_min);
			if (filters.number_of_people_max != null)
				qb = qb.where('number_of_people_max', '<=', filters.number_of_people_max);
			if (filters.suggested_length_min != null)
				qb = qb.where('suggested_length_min', '>=', filters.suggested_length_min);
			if (filters.suggested_length_max != null)
				qb = qb.where('suggested_length_max', '<=', filters.suggested_length_max);
			if (filters.hasVideo === true)
				qb = qb.where('video_link', 'is not', null).where('video_link', '!=', '');
			if (filters.hasVideo === false)
				qb = qb.where((eb) => eb.or([eb('video_link', 'is', null), eb('video_link', '=', '')]));
			if (filters.hasDiagrams === true)
				qb = qb.where(sql`jsonb_typeof(diagrams) = 'array' AND jsonb_array_length(diagrams) > 0`);
			if (filters.hasDiagrams === false)
				qb = qb.where(sql`jsonb_typeof(diagrams) != 'array' OR jsonb_array_length(diagrams) = 0`);
			if (filters.hasImages === true) qb = qb.where(sql`array_length(images, 1) > 0`);
			if (filters.hasImages === false)
				qb = qb.where((eb) =>
					eb.or([
						eb('images', 'is', null),
						eb(sql`array_length(images, 1) IS NULL`),
						eb(sql`array_length(images, 1) = 0`)
					])
				);

			return qb;
		};

		const baseQuery = buildDrillBaseQuery();
		const baseQueryForFallback = buildDrillBaseQuery(); // Separate instance for fallback path

		const ftsQueryBuilder = this._buildSearchQuery(
			baseQuery,
			filters.searchQuery,
			'search_vector',
			'english',
			['name', 'brief_description', 'detailed_description'] // Columns for pg_trgm fallback
		);

		// Apply sorting - _executeSearch handles similarity sort for fallback
		let finalQuery = ftsQueryBuilder;
		if (
			!ftsQueryBuilder._ftsAppliedInfo ||
			(options.sortBy && options.sortBy !== 'similarity_score')
		) {
			const validSortColumns = ['name', 'date_created', 'complexity' /* other allowed columns */];
			const sortCol = validSortColumns.includes(sortBy) ? sortBy : 'date_created';
			const direction = sortOrder === 'asc' ? 'asc' : 'desc';
			finalQuery = finalQuery.orderBy(sortCol, direction).orderBy('id', direction); // Add secondary sort by ID
		}

		const { items, usedFallback } = await this._executeSearch(finalQuery, baseQueryForFallback, {
			limit,
			offset
		});

		await this._addVariationCounts(items); // Add variation counts to results

		// Count total items matching the successful search strategy
		let countQueryBaseForFiltersOnly = buildDrillBaseQuery(); // Rebuild for count to ensure filters are clean
		// We need a new Kysely instance for count that doesn't have prior .selectAll()
		let countQuery = kyselyDb
			.selectFrom('drills')
			.select(kyselyDb.fn.count('drills.id').as('total'));

		// Apply WHERE clauses from countQueryBaseForFiltersOnly to the new countQuery
		// This is a bit manual; Kysely doesn't have a direct way to copy just WHERE clauses.
		// We re-apply filters based on the logic in buildDrillBaseQuery and search conditions.

		// Re-apply visibility/ownership from buildDrillBaseQuery structure
		if (this.useStandardPermissions && this.permissionConfig) {
			const { visibilityColumn, publicValue, unlistedValue, privateValue, userIdColumn } =
				this.permissionConfig;
			countQuery = countQuery.where((eb) => {
				const conditions = [
					eb(visibilityColumn, '=', publicValue),
					eb(visibilityColumn, '=', unlistedValue)
				];
				if (userId) {
					conditions.push(
						eb.and([eb(visibilityColumn, '=', privateValue), eb(userIdColumn, '=', userId)])
					);
				}
				return eb.or(conditions);
			});
		}
		// Re-apply specific drill filters
		if (filters.skill_level?.length)
			countQuery = countQuery.where(sql`skill_level && $1`, [filters.skill_level]);
		if (filters.complexity) countQuery = countQuery.where('complexity', '=', filters.complexity);
		if (filters.skills_focused_on?.length)
			countQuery = countQuery.where(sql`skills_focused_on && $1`, [filters.skills_focused_on]);
		if (filters.positions_focused_on?.length)
			countQuery = countQuery.where(sql`positions_focused_on && $1`, [
				filters.positions_focused_on
			]);
		if (filters.drill_type?.length)
			countQuery = countQuery.where(sql`drill_type && $1`, [filters.drill_type]);
		if (filters.number_of_people_min != null)
			countQuery = countQuery.where('number_of_people_min', '>=', filters.number_of_people_min);
		if (filters.number_of_people_max != null)
			countQuery = countQuery.where('number_of_people_max', '<=', filters.number_of_people_max);
		if (filters.suggested_length_min != null)
			countQuery = countQuery.where('suggested_length_min', '>=', filters.suggested_length_min);
		if (filters.suggested_length_max != null)
			countQuery = countQuery.where('suggested_length_max', '<=', filters.suggested_length_max);
		if (filters.hasVideo === true)
			countQuery = countQuery.where('video_link', 'is not', null).where('video_link', '!=', '');
		if (filters.hasVideo === false)
			countQuery = countQuery.where((eb) =>
				eb.or([eb('video_link', 'is', null), eb('video_link', '=', '')])
			);
		if (filters.hasDiagrams === true)
			countQuery = countQuery.where(
				sql`jsonb_typeof(diagrams) = 'array' AND jsonb_array_length(diagrams) > 0`
			);
		if (filters.hasDiagrams === false)
			countQuery = countQuery.where(
				sql`jsonb_typeof(diagrams) != 'array' OR jsonb_array_length(diagrams) = 0`
			);
		if (filters.hasImages === true) countQuery = countQuery.where(sql`array_length(images, 1) > 0`);
		if (filters.hasImages === false)
			countQuery = countQuery.where((eb) =>
				eb.or([
					eb('images', 'is', null),
					eb(sql`array_length(images, 1) IS NULL`),
					eb(sql`array_length(images, 1) = 0`)
				])
			);

		if (filters.searchQuery) {
			const cleanedSearchTerm = filters.searchQuery.trim();
			if (cleanedSearchTerm) {
				if (usedFallback) {
					countQuery = countQuery.where((eb) =>
						eb.or([
							eb(sql`similarity(name, ${cleanedSearchTerm})`, '>', 0.3),
							eb(sql`similarity(brief_description, ${cleanedSearchTerm})`, '>', 0.3),
							eb(sql`similarity(detailed_description, ${cleanedSearchTerm})`, '>', 0.3)
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
							sql`search_vector @@ to_tsquery('english', ${tsQuerySearchTerm})`
						);
					}
				}
			}
		}

		const countResult = await countQuery.executeTakeFirst();
		const totalItems = parseInt(countResult?.total ?? '0', 10);

		return {
			items: items,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				totalItems,
				totalPages: Math.ceil(totalItems / limit)
			}
		};
	}

	/**
	 * Helper method to add variation counts to an array of drills
	 * @param {Array<Object>} drills - Array of drill objects
	 * @returns {Promise<void>}
	 * @private
	 */
	async _addVariationCounts(drills) {
		if (!drills || !drills.length) return;

		try {
			// Get all drill IDs
			const drillIds = drills.map((drill) => drill.id);

			// Get variation counts for all drills in a single query
			const query = `
        SELECT parent_drill_id, COUNT(*) AS count
        FROM drills
        WHERE parent_drill_id = ANY($1)
        GROUP BY parent_drill_id
      `;

			const result = await db.query(query, [drillIds]);

			// Create a map of drill ID to variation count
			const countMap = {};

			// Safely process query results
			if (result && result.rows) {
				result.rows.forEach((row) => {
					countMap[row.parent_drill_id] = parseInt(row.count);
				});
			}

			// Set variation counts on drill objects
			drills.forEach((drill) => {
				drill.variation_count = countMap[drill.id] || 0;
			});
		} catch (error) {
			console.error('Error while adding variation counts:', error);
			// Don't let variation count errors disrupt the main functionality
			// Just ensure all drills have a variation_count property
			drills.forEach((drill) => {
				if (!drill.hasOwnProperty('variation_count')) {
					drill.variation_count = 0;
				}
			});
		}
	}

	/**
	 * Fetches all drill names and their IDs.
	 * Used for mapping generated names to existing drills or providing context.
	 * @returns {Promise<Array<{id: number, name: string}>>}
	 */
	async getAllDrillNames() {
		try {
			const drills = await kyselyDb
				.selectFrom('drills')
				.select(['id', 'name'])
				.orderBy('name', 'asc')
				.execute();

			return drills;
		} catch (error) {
			console.error('Error fetching drill names:', error);
			// Consider throwing a specific error type
			throw new DatabaseError('Failed to fetch drill names', error);
		}
	}

	/**
	 * Fetches detailed information for drills, suitable for AI context.
	 * Excludes large fields like diagrams.
	 * @param {number|null} [userId=null] - The ID of the user requesting the drills.
	 * @returns {Promise<Array<Object>>} - Array of drill detail objects.
	 */
	async getAllDrillDetailsForAI(userId = null) {
		try {
			// Define columns to select, excluding diagrams and non-existent ones
			const columnsToSelect = [
				'id',
				'name',
				'brief_description',
				'detailed_description',
				'skill_level',
				'complexity',
				'suggested_length_min',
				'suggested_length_max',
				'number_of_people_min',
				'number_of_people_max',
				'skills_focused_on',
				'positions_focused_on',
				'drill_type',
				'visibility',
				'is_editable_by_others'
				// Removed created_by, date_created, parent_id, upload_source, search_vector for brevity
			];

			const drills = await kyselyDb
				.selectFrom('drills')
				.select(columnsToSelect)
				.orderBy('name', 'asc') // Keep ordering consistent
				// Add WHERE clause for visibility/ownership
				.$if(userId !== null, (qb) =>
					qb
						// If userId is provided, get public drills OR drills created by this user
						.where((eb) => eb.or([eb('visibility', '=', 'public'), eb('created_by', '=', userId)]))
				)
				.$if(userId === null, (qb) =>
					qb
						// If no userId (anonymous), only get public drills
						.where('visibility', '=', 'public')
				)
				.execute();

			// No need for JS filtering anymore, SQL handles it.
			return drills;
		} catch (error) {
			console.error('Error fetching detailed drill data for AI:', error);
			throw new DatabaseError('Failed to fetch detailed drill data', error);
		}
	}

	/**
	 * Set a drill as the primary variant
	 * @param {number} drillId - Drill ID to make primary
	 * @param {number} userId - User attempting the action
	 * @returns {Promise<Object>} - Updated drill
	 * @throws {NotFoundError} - If drill not found
	 * @throws {ValidationError} - If the drill is not a variation
	 * @throws {ForbiddenError} - If user not authorized
	 */
	async setAsPrimaryVariant(drillId, userId) {
		return this.withTransaction(async (client) => {
			const drill = await this.getById(drillId, ['*', 'parent_drill_id'], userId, client);
			if (!drill) {
				// Throw NotFoundError instead of generic Error
				throw new NotFoundError('Drill not found');
			}

			if (!drill.parent_drill_id) {
				// Throw ValidationError instead of generic Error
				throw new ValidationError('This drill is not a variation');
			}

			const parentDrill = await this.getById(drill.parent_drill_id, ['*'], userId, client);
			// Add check for parentDrill existence (though getById should handle it)
			if (!parentDrill) {
				throw new NotFoundError('Parent drill not found');
			}

			// Use transaction helper for the swap operation
			const tempId = -drill.id;

			// Set drill ID to temporary ID
			await client.query(`UPDATE drills SET id = $1 WHERE id = $2`, [tempId, drill.id]);

			// Set parent ID to drill's original ID
			await client.query(`UPDATE drills SET id = $1 WHERE id = $2`, [drill.id, parentDrill.id]);

			// Set temporary ID to parent's original ID
			await client.query(`UPDATE drills SET id = $1 WHERE id = $2`, [parentDrill.id, tempId]);

			// Update references to maintain relationships
			await client.query(`UPDATE drills SET parent_drill_id = $1 WHERE parent_drill_id = $2`, [
				drill.id,
				parentDrill.id
			]);

			// Return the updated drill
			return this.getById(parentDrill.id);
		});
	}

	/**
	 * Update skills usage counts
	 * @param {Array<string>} skillsToAdd - Skills to increment
	 * @param {Array<string>} skillsToRemove - Skills to decrement
	 * @param {number} drillId - Drill ID
	 * @param {pg.Client} [client=null] - Optional DB client for transactions
	 * @returns {Promise<void>}
	 */
	async updateSkillCounts(skillsToAdd, skillsToRemove, drillId, client = null) {
		const dbInterface = client || db;
		// Add new skills
		if (skillsToAdd && skillsToAdd.length > 0) {
			// Pass client to updateSkills
			await this.updateSkills(skillsToAdd, drillId, client);
		}

		// Remove skills no longer used
		if (skillsToRemove && skillsToRemove.length > 0) {
			for (const skill of skillsToRemove) {
				await dbInterface.query(
					// Use dbInterface (client or db)
					`UPDATE skills SET drills_used_in = drills_used_in - 1 WHERE skill = $1`,
					[skill]
				);
			}
		}
	}

	/**
	 * Update skills for a drill
	 * @param {Array<string>} skills - Skills to update
	 * @param {number} drillId - Drill ID
	 * @param {pg.Client} [client=null] - Optional DB client for transactions
	 * @returns {Promise<void>}
	 */
	async updateSkills(skills, drillId, client = null) {
		// Use the provided client or the default db module
		const dbInterface = client || db;

		for (const skill of skills) {
			await upsertSkillCounts(dbInterface, skill, drillId);
		}
	}

	/**
	 * Toggle upvote for a drill
	 * @param {number} drillId - Drill ID
	 * @param {number} userId - User ID performing the upvote
	 * @returns {Promise<Object>} - Updated vote count
	 * @throws {ValidationError} - If IDs are missing
	 * @throws {NotFoundError} - If drill not found
	 */
	async toggleUpvote(drillId, userId) {
		if (!drillId || !userId) {
			// Throw ValidationError instead of generic Error
			throw new ValidationError('Both drill ID and user ID are required');
		}

		return this.withTransaction(async (client) => {
			// First verify the drill exists using the base method (which might throw NotFoundError itself)
			try {
				// Pass undefined for columns to use default, null for userId, then the client
				await this.getById(drillId, undefined, null, client);
			} catch (err) {
				if (err instanceof NotFoundError) {
					throw new NotFoundError('Drill not found for upvoting');
				}
				throw err; // Re-throw other unexpected errors
			}

			// Check if user has already voted
			const voteCheckQuery = `
        SELECT * FROM votes 
        WHERE user_id = $1 AND drill_id = $2
      `;
			const voteCheck = await client.query(voteCheckQuery, [userId, drillId]);

			if (voteCheck.rows.length > 0) {
				// User has already voted, remove their vote
				await client.query('DELETE FROM votes WHERE user_id = $1 AND drill_id = $2', [
					userId,
					drillId
				]);
			} else {
				// Add new vote
				await client.query('INSERT INTO votes (user_id, drill_id, vote) VALUES ($1, $2, $3)', [
					userId,
					drillId,
					1
				]);
			}

			// Get updated vote count
			const voteCountQuery = `
        SELECT COUNT(CASE WHEN vote = 1 THEN 1 END) as upvotes
        FROM votes 
        WHERE drill_id = $1
      `;
			const result = await client.query(voteCountQuery, [drillId]);

			return {
				upvotes: parseInt(result.rows[0].upvotes),
				hasVoted: voteCheck.rows.length === 0 // True if we just added a vote
			};
		});
	}

	/**
	 * Set variant relationship for a drill
	 * @param {number} drillId - Drill ID to update
	 * @param {number|null} parentDrillId - Parent drill ID or null to remove the relationship
	 * @returns {Promise<Object>} - Updated drill with variant relationship
	 * @throws {ValidationError} - If drill ID is missing
	 * @throws {NotFoundError} - If drill or parent drill not found
	 * @throws {ConflictError} - If trying to make a parent a variant, or a variant a parent, or self-parenting
	 */
	async setVariant(drillId, parentDrillId) {
		if (!drillId) {
			// Throw ValidationError instead of generic Error
			throw new ValidationError('Drill ID is required');
		}

		return this.withTransaction(async (client) => {
			// Check if the current drill exists and get its details
			const drillQuery = `
        SELECT d.*, 
               (SELECT COUNT(*) FROM drills WHERE parent_drill_id = d.id) as child_count
        FROM drills d 
        WHERE d.id = $1
      `;
			const drillResult = await client.query(drillQuery, [drillId]);

			if (drillResult.rows.length === 0) {
				// Throw NotFoundError instead of generic Error
				throw new NotFoundError('Drill not found');
			}

			const currentDrill = drillResult.rows[0];

			if (parentDrillId) {
				// Check if the parent drill exists and is valid
				const parentQuery = `
          SELECT d.*, 
                 (SELECT COUNT(*) FROM drills WHERE parent_drill_id = d.id) as child_count
          FROM drills d 
          WHERE d.id = $1
        `;
				const parentResult = await client.query(parentQuery, [parentDrillId]);

				if (parentResult.rows.length === 0) {
					// Throw NotFoundError instead of generic Error
					throw new NotFoundError('Parent drill not found');
				}

				const parentDrill = parentResult.rows[0];

				// Validate constraints
				if (currentDrill.child_count > 0) {
					// Throw ConflictError instead of generic Error
					throw new ConflictError('Cannot make a parent drill into a variant');
				}

				if (parentDrill.parent_drill_id) {
					// Throw ConflictError instead of generic Error
					throw new ConflictError('Cannot set a variant as a parent');
				}

				// Prevent drill from being its own parent
				if (parentDrillId === drillId) {
					// Throw ConflictError instead of generic Error
					throw new ConflictError('Drill cannot be its own parent');
				}
			}

			// Update the parent_drill_id
			const updateQuery = `
        UPDATE drills 
        SET parent_drill_id = $1 
        WHERE id = $2 
        RETURNING *, 
          (SELECT name FROM drills WHERE id = $1) as parent_drill_name
      `;
			const result = await client.query(updateQuery, [parentDrillId, drillId]);

			return result.rows[0];
		});
	}

	/**
	 * Normalize drill data for consistent database storage
	 * @param {Object} data - Raw drill data
	 * @returns {Object} - Normalized data
	 */
	normalizeDrillData(data) {
		let normalizedData = { ...data };

		// Remove id field if it's null or undefined
		if (normalizedData.id === null || normalizedData.id === undefined) {
			delete normalizedData.id;
		}

		// Use base helper to normalize array fields to ensure they are arrays
		normalizedData = this.normalizeArrayFields(normalizedData, this.arrayFields);

		// Convert diagrams to JSON strings (only if not already strings)
		if (normalizedData.diagrams && Array.isArray(normalizedData.diagrams)) {
			normalizedData.diagrams = normalizedData.diagrams.map((diagram) =>
				typeof diagram === 'object' && diagram !== null ? JSON.stringify(diagram) : diagram
			);
		} else if (normalizedData.diagrams === null || normalizedData.diagrams === undefined) {
			// Ensure it's an empty array if null/undefined before DB insert
			normalizedData.diagrams = [];
		}

		// For enum-like array fields, ensure items are trimmed. Lowercasing is re-added.
		['skill_level', 'skills_focused_on', 'positions_focused_on', 'drill_type'].forEach((field) => {
			if (normalizedData[field] && Array.isArray(normalizedData[field])) {
				normalizedData[field] = normalizedData[field]
					.map(
						(item) => (typeof item === 'string' ? item.trim().toLowerCase() : item) // RE-ADDED .toLowerCase()
					)
					.filter(Boolean); // Remove empty strings after trimming
			} else if (normalizedData[field] === null || normalizedData[field] === undefined) {
				normalizedData[field] = [];
			}
		});

		// Ensure images is an array
		if (normalizedData.images === null || normalizedData.images === undefined) {
			normalizedData.images = [];
		}

		// Handle special number fields
		if (
			normalizedData.number_of_people_max === '' ||
			normalizedData.number_of_people_max === undefined
		) {
			normalizedData.number_of_people_max = null;
		} else {
			const parsedMax = parseInt(normalizedData.number_of_people_max);
			normalizedData.number_of_people_max = !isNaN(parsedMax) ? parsedMax : null;
		}

		if (
			normalizedData.number_of_people_min === '' ||
			normalizedData.number_of_people_min === undefined
		) {
			normalizedData.number_of_people_min = null;
		} else {
			const parsedMin = parseInt(normalizedData.number_of_people_min);
			normalizedData.number_of_people_min = !isNaN(parsedMin) ? parsedMin : null;
		}

		// --- Map suggested_length object to min/max columns ---
		if (normalizedData.suggested_length && typeof normalizedData.suggested_length === 'object') {
			const { min, max } = normalizedData.suggested_length;

			const parsedMin = parseInt(min);
			const parsedMax = parseInt(max);

			normalizedData.suggested_length_min = !isNaN(parsedMin) ? parsedMin : null;
			normalizedData.suggested_length_max = !isNaN(parsedMax) ? parsedMax : null;

			// Remove the original object
			delete normalizedData.suggested_length;
		} else {
			// Ensure columns exist even if input object is missing/invalid
			if (!normalizedData.hasOwnProperty('suggested_length_min')) {
				normalizedData.suggested_length_min = null;
			}
			if (!normalizedData.hasOwnProperty('suggested_length_max')) {
				normalizedData.suggested_length_max = null;
			}
			// Still remove the original field if it existed but wasn't an object
			if (normalizedData.hasOwnProperty('suggested_length')) {
				delete normalizedData.suggested_length;
			}
		}

		return normalizedData;
	}

	/**
	 * Associate an anonymously created drill with a user
	 * @param {number} id - Drill ID
	 * @param {number} userId - User ID to associate with
	 * @returns {Promise<Object>} - The updated drill
	 * @throws {NotFoundError} - If drill not found
	 */
	async associateDrill(id, userId) {
		const drill = await this.getById(id);

		if (!drill) {
			// getById should throw NotFoundError, but double-check
			throw new NotFoundError('Drill not found for association');
		}

		// Check if already owned
		if (drill.created_by !== null) {
			// Return existing drill if already owned
			return drill;
		}

		// Update the created_by field
		return await this.update(id, { created_by: userId });
	}

	/**
	 * Import multiple drills from an array.
	 * @param {Array<Object>} drillsData - Array of drill objects to import.
	 * @param {string} fileName - Original name of the file being imported.
	 * @param {number|null} userId - ID of the user performing the import.
	 * @param {string} visibility - Default visibility for imported drills.
	 * @returns {Promise<Object>} - Object containing importedCount and uploadSource.
	 * @throws {ValidationError} - If input data is invalid or missing required fields
	 * @throws {DatabaseError} - If database insertion fails
	 */
	async importDrills(drillsData, fileName, userId, visibility = 'public') {
		if (!Array.isArray(drillsData) || drillsData.length === 0) {
			// Throw ValidationError instead of generic Error
			throw new ValidationError('No drills provided for import');
		}

		// Generate a unique upload_source ID (using timestamp + partial UUID for uniqueness)
		const uploadSource = `${fileName}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

		return this.withTransaction(async (client) => {
			try {
				const insertPromises = drillsData.map(async (drillInput) => {
					// Mark inner function as async
					// Destructure and prepare data for insertion
					const {
						name,
						brief_description,
						detailed_description,
						skill_level,
						complexity,
						suggested_length, // Keep the object here initially
						number_of_people,
						skills_focused_on,
						positions_focused_on,
						video_link,
						images,
						diagrams,
						drill_type // Add drill_type
					} = drillInput;

					// Basic validation for required fields within the service
					if (!name || !brief_description) {
						// Throw ValidationError instead of generic Error
						throw new ValidationError(
							`Drill missing required field (name or brief_description): ${JSON.stringify(drillInput)}`
						);
					}

					// Prepare data object for normalization
					let drillToNormalize = {
						name,
						brief_description,
						detailed_description: detailed_description || null,
						skill_level,
						complexity: complexity || null,
						suggested_length: suggested_length, // Pass the object for normalization
						number_of_people_min: number_of_people?.min, // Extract min/max before normalization handles defaults
						number_of_people_max: number_of_people?.max,
						skills_focused_on,
						positions_focused_on,
						drill_type, // Include drill_type
						video_link: video_link || null,
						images: images || [],
						diagrams: diagrams || [], // Ensure diagrams is an array
						upload_source: uploadSource,
						created_by: userId,
						visibility,
						is_editable_by_others: false, // Default for imported drills
						date_created: new Date() // Add creation timestamp
					};

					// Normalize the individual drill data
					let drillToInsert = this.normalizeDrillData(drillToNormalize);

					// Use base create method logic for consistency
					// Assuming base `create` can work within the transaction using the passed client.
					// Ensure base `create` accepts a client argument.
					return this.create(drillToInsert, client);
				});

				// Wait for all insertions to complete
				const results = await Promise.all(insertPromises);
				// The base `create` method now returns the created object directly (not wrapped in rows)
				const insertedDrills = results;

				// Optionally, update skill counts for all imported drills
				for (const drill of insertedDrills) {
					if (drill.skills_focused_on && drill.skills_focused_on.length > 0) {
						// Use the existing updateSkills method, passing the client for transaction safety
						await this.updateSkills(drill.skills_focused_on, drill.id, client);
					}
				}

				return { importedCount: drillsData.length, uploadSource };
			} catch (error) {
				// Add specific error wrapping for import failures
				if (
					error instanceof ValidationError ||
					error instanceof DatabaseError ||
					error instanceof AppError
				) {
					throw error; // Re-throw known app errors
				}
				console.error('Error during bulk drill import:', error);
				throw new DatabaseError('Failed during bulk drill import.', error);
			}
		});
	}
}

// Export a singleton instance of the service
export const drillService = new DrillService();
