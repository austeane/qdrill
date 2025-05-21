import { BaseEntityService } from './baseEntityService.js';
import * as db from '$lib/server/db';
import { NotFoundError, DatabaseError, ConflictError, ValidationError } from '$lib/server/errors';
import { kyselyDb, sql } from '$lib/server/db'; // Ensure sql is imported

/**
 * Service for managing formations
 * Extends the BaseEntityService with formation-specific functionality
 */
export class FormationService extends BaseEntityService {
	/**
	 * Creates a new FormationService
	 */
	constructor() {
		// Define allowed columns for the formations table
		const allowedFormationColumns = [
			'id', // Ensure primary key is always allowed
			'name',
			'brief_description',
			'detailed_description',
			'diagrams',
			'tags',
			'is_editable_by_others',
			'visibility',
			'formation_type',
			'created_by',
			'created_at',
			'updated_at',
			'search_vector' // Allow search vector column
		];

		// Standard permission configuration
		const permissionConfig = {
			userIdColumn: 'created_by',
			visibilityColumn: 'visibility',
			publicValue: 'public',
			unlistedValue: 'unlisted',
			privateValue: 'private',
			editableByOthersColumn: 'is_editable_by_others' // For canUserEdit check
		};

		// Explicitly define default columns for FormationService
		const defaultFormationColumns = [
			'id',
			'name',
			'brief_description',
			'detailed_description',
			'diagrams',
			'tags',
			'is_editable_by_others',
			'visibility',
			'formation_type',
			'created_by',
			'created_at',
			'updated_at'
		];

		super(
			'formations',
			'id',
			defaultFormationColumns, // Use explicit default columns
			allowedFormationColumns,
			{
				diagrams: 'json',
				tags: 'array'
			},
			permissionConfig // Pass permission config
		);
	}

	/**
	 * Get formations with optional filtering/pagination/searching.
	 * This now uses the base service search helpers.
	 */
	async getAllFormations(options = {}) {
		const {
			page = 1,
			limit = 10,
			sortBy = 'created_at',
			sortOrder = 'desc',
			userId = null,
			filters = {} // Contains specific formation filters AND filters.searchQuery
		} = options;

		const offset = (page - 1) * limit;

		const buildFormationBaseQuery = () => {
			let qb = kyselyDb.selectFrom('formations').selectAll(); // Select all initially

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
			// Apply other formation-specific filters from options.filters if any
			if (filters.formation_type) {
				qb = qb.where('formation_type', '=', filters.formation_type);
			}
			if (filters.tags && filters.tags.length > 0) {
				qb = qb.where(sql`tags && $1`, [filters.tags]); // Array overlap for tags
			}
			// Add more specific filters here as needed

			return qb;
		};

		const baseQuery = buildFormationBaseQuery();
		const baseQueryForFallback = buildFormationBaseQuery(); // Clone for fallback

		const ftsQueryBuilder = this._buildSearchQuery(
			baseQuery,
			filters.searchQuery, // Pass searchQuery from the filters object
			'search_vector',
			'english',
			['name', 'brief_description', 'detailed_description', 'tags'] // Include 'tags' in fallback ranking
		);

		let finalQuery = ftsQueryBuilder;
		if (
			!ftsQueryBuilder._ftsAppliedInfo ||
			(options.sortBy && options.sortBy !== 'similarity_score')
		) {
			const validSortColumns = ['name', 'created_at', 'formation_type'];
			const sortCol = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
			const direction = sortOrder === 'asc' ? 'asc' : 'desc';
			finalQuery = finalQuery.orderBy(sortCol, direction).orderBy('id', direction);
		}

		const { items, usedFallback } = await this._executeSearch(finalQuery, baseQueryForFallback, {
			limit,
			offset
		});

		// Count logic
		let countQueryBase = buildFormationBaseQuery();
		if (filters.searchQuery) {
			const cleanedSearchTerm = filters.searchQuery.trim();
			if (cleanedSearchTerm) {
				if (usedFallback) {
					countQueryBase = countQueryBase.where((eb) =>
						eb.or([
							eb(sql`similarity(name, ${cleanedSearchTerm})`, '>', 0.3),
							eb(sql`similarity(brief_description, ${cleanedSearchTerm})`, '>', 0.3),
							eb(sql`similarity(detailed_description, ${cleanedSearchTerm})`, '>', 0.3)
							// For tags, similarity might not be ideal as it's an array.
							// Consider converting tags to a single string for similarity or use array operators.
							// For simplicity, we can check array overlap with a fuzzy term for tags if desired, or stick to name/desc for similarity.
						])
					);
				} else {
					const tsQuerySearchTerm = cleanedSearchTerm
						.split(/\s+/)
						.filter(Boolean)
						.map((term) => term + ':*')
						.join(' & ');
					if (tsQuerySearchTerm) {
						countQueryBase = countQueryBase.where(
							sql`search_vector @@ to_tsquery('english', ${tsQuerySearchTerm})`
						);
					}
				}
			}
		}
		const countResult = await countQueryBase
			.select(kyselyDb.fn.count('id').as('total'))
			.executeTakeFirst();
		const totalItems = parseInt(countResult?.total ?? '0', 10);

		return {
			items,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				totalItems,
				totalPages: Math.ceil(totalItems / limit)
			}
		};
	}

	/**
	 * getAll method now forwards to getAllFormations with all options.
	 * This keeps compatibility if something was calling `super.getAll()` before,
	 * but new calls should prefer `getAllFormations` for clarity.
	 */
	async getAll(options = {}) {
		return this.getAllFormations(options);
	}

	/**
	 * Create a new formation
	 * @param {Object} formationData - Formation data
	 * @param {number|null} userId - User ID creating the formation (null if anonymous)
	 * @returns {Promise<Object>} - The created formation
	 */
	async createFormation(formationData, userId = null) {
		// Make a copy of the data and remove the id field if it exists
		const { id, ...dataWithoutId } = formationData;

		// Normalize formation data
		const normalizedData = this.normalizeFormationData({
			...dataWithoutId,
			created_by: userId,
			created_at: new Date(),
			updated_at: new Date()
		});

		return await this.create(normalizedData);
	}

	/**
	 * Update an existing formation
	 * @param {number} id - Formation ID
	 * @param {Object} formationData - Updated formation data
	 * @returns {Promise<Object>} - The updated formation
	 */
	async updateFormation(id, formationData) {
		// Normalize formation data
		const normalizedData = this.normalizeFormationData({
			...formationData,
			updated_at: new Date()
		});

		return await this.update(id, normalizedData);
	}

	/**
	 * Search formations by name or description
	 * @param {string} searchTerm - Search term
	 * @param {Object} options - Optional search options (pagination, etc.)
	 * @returns {Promise<Object>} - Search results with pagination
	 * @throws {DatabaseError} On database error
	 * @throws {ValidationError} If search term is invalid
	 */
	async searchFormations(searchTerm, options = {}) {
		if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
			// Allow empty search term to effectively list all items via getAllFormations
			// throw new ValidationError('Invalid search term provided.');
		}
		// Consolidate into getAllFormations by passing searchTerm in filters
		const combinedFilters = {
			...(options.filters || {}),
			searchQuery: searchTerm || null // Pass null if empty to avoid triggering search logic unnecessarily
		};
		const { filters, ...remainingOptions } = options; // remove original filters from options
		return this.getAllFormations({ ...remainingOptions, filters: combinedFilters });
	}

	/**
	 * Get formations by created user
	 * @param {number} userId - User ID
	 * @param {Object} options - Optional search options (pagination, etc.)
	 * @returns {Promise<Object>} - Formations created by this user
	 */
	async getFormationsByUser(userId, options = {}) {
		const filters = { ...options.filters, created_by__eq: userId }; // Use __eq operator
		// Directly use the base getAll method with the filter
		return await this.getAll({ ...options, filters });
	}

	/**
	 * Normalize formation data for consistent database storage
	 * @param {Object} data - Raw formation data
	 * @returns {Object} - Normalized data
	 */
	normalizeFormationData(data) {
		if (!data || typeof data !== 'object') {
			return data;
		}

		const normalized = { ...data };

		// Remove id if it is null or undefined so that callers don't accidentally overwrite.
		if (normalized.id === null || normalized.id === undefined) {
			delete normalized.id;
		}

		// Ensure diagrams is always an array (of objects or strings)
		if (normalized.diagrams === null || normalized.diagrams === undefined) {
			normalized.diagrams = [];
		} else if (!Array.isArray(normalized.diagrams)) {
			normalized.diagrams = [normalized.diagrams];
		}

		// Ensure tags is always an array of strings
		if (normalized.tags === null || normalized.tags === undefined) {
			normalized.tags = [];
		} else if (typeof normalized.tags === 'string') {
			normalized.tags = [normalized.tags];
		} else if (!Array.isArray(normalized.tags)) {
			normalized.tags = [normalized.tags];
		}

		// Ensure all tags are strings
		normalized.tags = normalized.tags.map((tag) => String(tag));

		return normalized;
	}

	/**
	 * Associate an anonymously created formation with a user
	 * @param {number|string} id - Formation ID
	 * @param {number} userId - User ID to associate with
	 * @returns {Promise<Object>} - The updated formation
	 * @throws {NotFoundError} - If formation not found
	 * @throws {ConflictError} - If formation already owned by another user
	 * @throws {DatabaseError} - On database error
	 */
	async associateFormation(id, userId) {
		// getById will throw NotFoundError if formation doesn't exist
		const formation = await this.getById(id);

		// Check if already owned by a *different* user
		if (formation.created_by !== null && formation.created_by !== userId) {
			// Use ConflictError
			throw new ConflictError('Formation is already associated with another user.');
		}

		// If already owned by the *same* user, return (idempotent)
		if (formation.created_by === userId) {
			return formation;
		}

		// Update the created_by field using base update method
		// This will also throw NotFoundError if the formation disappears
		try {
			return await this.update(id, { created_by: userId });
		} catch (error) {
			// Re-throw known errors (NotFoundError)
			if (error instanceof NotFoundError) {
				throw error;
			}
			// Wrap others as DatabaseError
			console.error(`Error associating formation ${id} with user ${userId}:`, error);
			throw new DatabaseError('Failed to associate formation', error);
		}
	}
}

// Export a singleton instance of the service
export const formationService = new FormationService();
