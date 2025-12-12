import * as db from '$lib/server/db.js';
import {
	NotFoundError,
	ValidationError,
	DatabaseError,
	InternalServerError,
	ForbiddenError
} from '$lib/server/errors.js';
import { sql } from 'kysely'; // Ensure sql is imported from Kysely

/**
 * Base service class for entity operations
 * Provides common CRUD functionality that can be extended by specific entity services
 */
export class BaseEntityService {
	/**
	 * @param {string} tableName - Database table name for this entity
	 * @param {string} primaryKey - Primary key column name (default: 'id')
	 * @param {Array<string>} defaultColumns - Columns to return by default (default: ['*'])
	 * @param {Array<string>} allowedColumns - Columns that can be used for filtering and sorting
	 * @param {Object} columnTypes - Map of column names to their types (e.g., { tags: 'array' })
	 * @param {Object} [permissionConfig=null] - Configuration for standard permissions
	 * @param {string} [permissionConfig.userIdColumn='created_by'] - Column for user ID
	 * @param {string} [permissionConfig.visibilityColumn='visibility'] - Column for visibility status
	 * @param {any} [permissionConfig.publicValue='public'] - Value for public visibility
	 * @param {any} [permissionConfig.unlistedValue='unlisted'] - Value for unlisted visibility
	 * @param {any} [permissionConfig.privateValue='private'] - Value for private visibility
	 */
	constructor(
		tableName,
		primaryKey = 'id',
		defaultColumns = ['*'],
		allowedColumns = [],
		columnTypes = {},
		permissionConfig = null
	) {
		this.tableName = tableName;
		this.primaryKey = primaryKey;
		this.defaultColumns = defaultColumns;
		this.allowedColumns = [...allowedColumns, primaryKey];
		this.columnTypes = columnTypes;

		// Track if this entity uses common permissions model
		this.permissionConfig = permissionConfig;
		this.useStandardPermissions = !!permissionConfig;

		// Default permission settings if enabled but not fully configured
		if (this.useStandardPermissions) {
			this.permissionConfig = {
				userIdColumn: permissionConfig?.userIdColumn || 'created_by',
				visibilityColumn: permissionConfig?.visibilityColumn || 'visibility',
				publicValue: permissionConfig?.publicValue ?? 'public', // Use ?? to allow null/false
				unlistedValue: permissionConfig?.unlistedValue ?? 'unlisted',
				privateValue: permissionConfig?.privateValue ?? 'private',
				editableByOthersColumn: permissionConfig?.editableByOthersColumn || 'is_editable_by_others' // Added for canUserEdit
			};
		}
	}

	/**
	 * Enable standard permissions model
	 * This assumes the entity has created_by and is_editable_by_others columns
	 * DEPRECATED: Pass permissionConfig to constructor instead.
	 */
	enableStandardPermissions() {
		this.useStandardPermissions = true;
		// Apply default config if enabled this way (for backward compatibility, though discouraged)
		if (!this.permissionConfig) {
			this.permissionConfig = {
				userIdColumn: 'created_by',
				visibilityColumn: 'visibility',
				publicValue: 'public',
				unlistedValue: 'unlisted',
				privateValue: 'private',
				editableByOthersColumn: 'is_editable_by_others'
			};
		}
		console.warn(
			'enableStandardPermissions() is deprecated. Pass permission configuration to the BaseEntityService constructor instead.'
		);
	}

	/**
	 * Validates if a column name is allowed for filtering and sorting
	 * @param {string} columnName - Column name to validate
	 * @returns {boolean} - True if column is allowed
	 */
	isColumnAllowed(columnName) {
		// If no allowed columns are specified, only allow the primary key
		if (this.allowedColumns.length === 0) {
			return columnName === this.primaryKey;
		}
		return this.allowedColumns.includes(columnName);
	}

	/**
	 * Validates and sanitizes sort order
	 * @param {string} sortOrder - Sort order to validate
	 * @returns {string} - Sanitized sort order
	 */
	validateSortOrder(sortOrder) {
		const order = sortOrder.toLowerCase();
		return order === 'asc' ? 'ASC' : 'DESC';
	}

	/**
	 * Internal helper to get the Kysely instance or transaction.
	 * @param {import('kysely').Transaction<any>|null} trx
	 */
	_db(trx = null) {
		return trx ?? db.kyselyDb;
	}

	/**
	 * Internal helper to start a select builder for this table.
	 * @param {import('kysely').Transaction<any>|null} trx
	 * @param {string|null} alias
	 */
	_selectFrom(trx = null, alias = null) {
		return this._db(trx).selectFrom(alias ?? this.tableName);
	}

	/**
	 * Apply legacy-standard read permissions (visibility/ownership) to a Kysely query.
	 * Semantics match legacy _buildWhereClause + canUserView().
	 */
	_applyReadPermissions(qb, viewerUserId = null, alias = null) {
		if (!this.useStandardPermissions || !this.permissionConfig) return qb;

		const { visibilityColumn, publicValue, unlistedValue, privateValue, userIdColumn } =
			this.permissionConfig;
		const visCol = alias ? `${alias}.${visibilityColumn}` : visibilityColumn;
		const ownerCol = alias ? `${alias}.${userIdColumn}` : userIdColumn;

		return qb.where((eb) => {
			const orConditions = [];

			if (publicValue !== undefined && publicValue !== null) {
				orConditions.push(eb(visCol, '=', publicValue));
			} else {
				orConditions.push(eb(visCol, 'is', null));
			}

			if (unlistedValue !== undefined && unlistedValue !== null) {
				orConditions.push(eb(visCol, '=', unlistedValue));
			}

			if (
				viewerUserId !== null &&
				viewerUserId !== undefined &&
				privateValue !== undefined &&
				privateValue !== null
			) {
				orConditions.push(
					eb.and([eb(visCol, '=', privateValue), eb(ownerCol, '=', viewerUserId)])
				);
			}

			return eb.or(orConditions);
		});
	}

	/**
	 * Apply legacy filter DSL to a Kysely query.
	 * Supported operators match legacy _buildWhereClause.
	 */
	_applyFilters(qb, filters = {}, alias = null) {
		if (!filters || typeof filters !== 'object') return qb;

		for (const [rawKey, value] of Object.entries(filters)) {
			if (value === undefined) continue;

			let columnName = rawKey;
			let operator = 'exact';
			const parts = rawKey.split('__');
			if (parts.length === 2) {
				columnName = parts[0];
				operator = parts[1];
			}

			if (!this.isColumnAllowed(columnName)) {
				continue;
			}

			if (value === null && operator !== 'isnull') {
				continue;
			}

				const colRef = alias ? `${alias}.${columnName}` : columnName;

				// Back-compat for legacy array filtering:
				// - scalar value => `${value} = ANY(col)`
				// - array value => `col && value`
				if (
					(this.columnTypes[columnName] === 'array' &&
						(operator === 'exact' || operator === 'eq')) ||
					(operator === 'any' && this.columnTypes[columnName] === 'array')
				) {
					if (Array.isArray(value)) {
						qb = qb.where(sql`${sql.ref(colRef)} && ${value}`);
					} else {
						qb = qb.where(sql`${value} = ANY(${sql.ref(colRef)})`);
					}
					continue;
				}

				switch (operator) {
					case 'exact':
					case 'eq':
						qb = qb.where(colRef, '=', value);
						break;
				case 'neq':
					qb = qb.where(colRef, '!=', value);
					break;
				case 'gt':
					qb = qb.where(colRef, '>', value);
					break;
				case 'gte':
					qb = qb.where(colRef, '>=', value);
					break;
				case 'lt':
					qb = qb.where(colRef, '<', value);
					break;
				case 'lte':
					qb = qb.where(colRef, '<=', value);
					break;
				case 'like':
					qb = qb.where(colRef, 'like', value);
					break;
				case 'ilike':
					qb = qb.where(colRef, 'ilike', value);
					break;
				case 'isnull':
					qb = value ? qb.where(colRef, 'is', null) : qb.where(colRef, 'is not', null);
					break;
				case 'in':
					if (Array.isArray(value) && value.length > 0) {
						qb = qb.where(colRef, 'in', value);
					}
					break;
					default:
						qb = qb.where(colRef, '=', value);
				}
			}

		return qb;
	}

	/**
	 * Get all entities with optional filtering and pagination
	 * @param {Object} options - Query options
	 * @param {number} options.page - Page number starting from 1 (default: 1)
	 * @param {number} options.limit - Items per page (default: 10)
	 * @param {boolean} options.all - Whether to return all records (default: false)
	 * @param {Object} options.filters - Filter conditions
	 * @param {string} options.sortBy - Column to sort by
	 * @param {string} options.sortOrder - Sort order ('asc' or 'desc', default: 'desc')
	 * @param {Array<string>} options.columns - Columns to return (default: this.defaultColumns)
	 * @param {number|null} options.userId - User ID for permission checking (if applicable)
	 * @returns {Promise<Object>} - Results with pagination info
	 */
	async getAll(options = {}) {
		const {
			page = 1,
			limit = 10,
			all = false,
			filters = {},
			sortBy = null,
			sortOrder = 'desc',
			columns = this.defaultColumns,
			userId = null // For permission filtering
		} = options;

		const offset = (page - 1) * limit;

		// Validate columns to return
		const validColumns = columns.filter((col) => col === '*' || this.isColumnAllowed(col));
		if (validColumns.length === 0) {
			if (this.primaryKey) validColumns.push(this.primaryKey);
			else validColumns.push('*');
		}

		try {
			let qb = this._selectFrom();

			if (validColumns.includes('*')) {
				qb = qb.selectAll();
			} else {
				qb = qb.select(validColumns);
			}

			qb = this._applyFilters(qb, filters);
			qb = this._applyReadPermissions(qb, userId);

			// Apply ordering
			if (sortBy && this.isColumnAllowed(sortBy)) {
				const direction = this.validateSortOrder(sortOrder).toLowerCase();
				qb = qb.orderBy(sortBy, direction);
				if (this.primaryKey) {
					qb = qb.orderBy(this.primaryKey, direction);
				}
			} else if (this.primaryKey) {
				qb = qb.orderBy(this.primaryKey, 'desc');
			}

			if (all) {
				const items = await qb.execute();
				return { items, pagination: null };
			}

				const countQb = qb
					.clearSelect()
					.clearOrderBy()
					.select((eb) => eb.fn.countAll().as('count'));

			const countResult = await countQb.executeTakeFirst();
			const totalItems = parseInt(countResult?.count ?? '0', 10);

			const items = await qb.limit(limit).offset(offset).execute();

			return {
				items,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					totalItems,
					totalPages: Math.ceil(totalItems / limit)
				}
			};
		} catch (error) {
			console.error(`Error in ${this.tableName}.getAll():`, error);
			throw new DatabaseError(`Failed to retrieve ${this.tableName}`, error);
		}
	}

	/**
	 * Get a single entity by ID
	 * @param {number|string} id - Entity ID
	 * @param {Array<string>} columns - Columns to return (default: this.defaultColumns)
	 * @param {number|null} [userId=null] - User ID for permission checking (if applicable)
	 * @param {pg.Client} [client=null] - Optional DB client for transactions
	 * @returns {Promise<Object>} - Entity object
	 * @throws {NotFoundError} If entity not found
	 * @throws {DatabaseError} On database error
	 */
	async getById(id, columns = this.defaultColumns, userId = null, client = null) {
		try {
			if (!this.primaryKey) {
				throw new ValidationError(
					`Cannot getById for ${this.tableName}: no primary key configured`
				);
			}

			// Validate columns to return
			const validColumns = columns.filter((col) => col === '*' || this.isColumnAllowed(col));
			if (validColumns.length === 0) {
				if (this.primaryKey) validColumns.push(this.primaryKey);
				else validColumns.push('*');
			}

			let qb = this._selectFrom(client);
			if (validColumns.includes('*')) {
				qb = qb.selectAll();
			} else {
				qb = qb.select(validColumns);
			}

			const entity = await qb.where(this.primaryKey, '=', id).executeTakeFirst();

			if (!entity) {
				throw new NotFoundError(`${this.tableName.slice(0, -1)} with ID ${id} not found`);
			}

			if (this.useStandardPermissions && !this.canUserView(entity, userId)) {
				throw new ForbiddenError(
					`User not authorized to view ${this.tableName.slice(0, -1)} with ID ${id}`
				);
			}

			return entity;
		} catch (error) {
			if (error instanceof NotFoundError || error instanceof ForbiddenError) {
				throw error;
			}
			console.error(`Error in ${this.tableName}.getById(${id}):`, error);
			throw new DatabaseError(
				`Failed to retrieve ${this.tableName.slice(0, -1)} with ID ${id}`,
				error
			);
		}
	}

	/**
	 * Create a new entity
	 * @param {Object} data - Entity data
	 * @param {pg.Client} [client=null] - Optional DB client for transactions
	 * @returns {Promise<Object>} - Created entity
	 */
	async create(data, client = null) {
		const dbInterface = this._db(client);
		try {
			const dataCopy = { ...data };

			if (this.primaryKey && this.primaryKey in dataCopy) {
				delete dataCopy[this.primaryKey];
			}

			const insertData = {};
			for (const [key, val] of Object.entries(dataCopy)) {
				if (val !== undefined && this.isColumnAllowed(key)) {
					insertData[key] = val;
				}
			}

			if (Object.keys(insertData).length === 0) {
				throw new ValidationError('No valid data provided for insertion');
			}

			const created = await dbInterface
				.insertInto(this.tableName)
				.values(insertData)
				.returningAll()
				.executeTakeFirst();

			return created;
		} catch (error) {
			console.error(`Error in ${this.tableName}.create():`, error);
			throw new DatabaseError(`Failed to create ${this.tableName.slice(0, -1)}`, error);
		}
	}

	/**
	 * Update an entity
	 * @param {number|string} id - Entity ID
	 * @param {Object} data - Updated entity data
	 * @param {pg.Client} [client=null] - Optional DB client for transactions
	 * @returns {Promise<Object>} - Updated entity
	 * @throws {NotFoundError} If entity not found
	 * @throws {DatabaseError} On database error
	 * @throws {ValidationError} If no valid data provided
	 */
	async update(id, data, client = null) {
		const dbInterface = this._db(client);
		try {
			if (!this.primaryKey) {
				throw new ValidationError(
					`Cannot update ${this.tableName}: no primary key configured`
				);
			}

			const updateData = {};
			for (const [key, val] of Object.entries(data)) {
				if (
					val !== undefined &&
					key !== this.primaryKey &&
					this.isColumnAllowed(key)
				) {
					updateData[key] = val;
				}
			}

			if (Object.keys(updateData).length === 0) {
				throw new ValidationError('No valid data provided for update');
			}

			const updated = await dbInterface
				.updateTable(this.tableName)
				.set(updateData)
				.where(this.primaryKey, '=', id)
				.returningAll()
				.executeTakeFirst();

			if (!updated) {
				throw new NotFoundError(
					`${this.tableName.slice(0, -1)} with ID ${id} not found for update`
				);
			}

			return updated;
		} catch (error) {
			if (error instanceof NotFoundError || error instanceof ValidationError) {
				throw error;
			}
			console.error(`Error in ${this.tableName}.update(${id}):`, error);
			throw new DatabaseError(
				`Failed to update ${this.tableName.slice(0, -1)} with ID ${id}`,
				error
			);
		}
	}

	/**
	 * Delete an entity by ID
	 * @param {number|string} id - Entity ID
	 * @param {pg.Client} [client=null] - Optional DB client for transactions
	 * @returns {Promise<void>} - Resolves if successful
	 * @throws {NotFoundError} If entity not found
	 * @throws {DatabaseError} On database error
	 */
	async delete(id, client = null) {
		const dbInterface = this._db(client);
		try {
			if (!this.primaryKey) {
				throw new InternalServerError(
					`Cannot delete from ${this.tableName}: no primary key configured`
				);
			}

			if (!this.isColumnAllowed(this.primaryKey)) {
				throw new InternalServerError(
					`Primary key ${this.primaryKey} is not in the allowed columns list for ${this.tableName}`
				);
			}

			const deleted = await dbInterface
				.deleteFrom(this.tableName)
				.where(this.primaryKey, '=', id)
				.returning(this.primaryKey)
				.executeTakeFirst();

			if (!deleted) {
				throw new NotFoundError(
					`${this.tableName.slice(0, -1)} with ID ${id} not found for deletion`
				);
			}

			return true;
		} catch (error) {
			if (error instanceof NotFoundError || error instanceof InternalServerError) {
				throw error;
			}
			console.error(`Error in ${this.tableName}.delete(${id}):`, error);
			throw new DatabaseError(
				`Failed to delete ${this.tableName.slice(0, -1)} with ID ${id}`,
				error
			);
		}
	}

	/**
	 * Check if an entity with given ID exists
	 * @param {number|string} id - Entity ID
	 * @returns {Promise<boolean>} - True if exists
	 */
	async exists(id) {
		try {
			if (!this.primaryKey) {
				throw new Error(`Cannot exists() for ${this.tableName}: no primary key configured`);
			}

			if (!this.isColumnAllowed(this.primaryKey)) {
				throw new Error(`Primary key ${this.primaryKey} is not in the allowed columns list`);
			}

			const row = await this._selectFrom()
				.select(this.primaryKey)
				.where(this.primaryKey, '=', id)
				.limit(1)
				.executeTakeFirst();

			return !!row;
		} catch (error) {
			console.error(`Error in ${this.tableName}.exists(${id}):`, error);
			return false;
		}
	}

	/**
	 * Execute a function within a database transaction
	 * @param {Function} callback - Async function to execute within transaction
	 * @returns {Promise<any>} - Result of the callback function
	 */
	async withTransaction(callback) {
		return db.kyselyDb.transaction().execute(async (trx) => {
			return await callback(trx);
		});
	}

	/**
	 * Check if a user can edit an entity
	 * Requires that the entity has created_by and is_editable_by_others columns
	 * @param {number|string} entityId - Entity ID
	 * @param {number|null} userId - User ID attempting edit
	 * @param {pg.Client} [client=null] - Optional DB client for transactions
	 * @returns {Promise<boolean>} - True if user can edit
	 * @throws {ForbiddenError} If user is not authorized
	 */
	async canUserEdit(entityId, userId, client = null) {
		const dbInterface = this._db(client);

		// Check if user is admin
		if (userId) {
			const userRow = await dbInterface
				.selectFrom('users')
				.select('role')
				.where('id', '=', userId)
				.executeTakeFirst();
			if (userRow?.role === 'admin') {
				return true;
			}
		}

		if (!this.useStandardPermissions) {
			// If permissions aren't configured, default to allowing (or throw error?)
			// console.warn(`Standard permissions not enabled for ${this.tableName} service - allowing edit by default`);
			return true;
		}

		if (!this.permissionConfig) {
			console.error(
				`Cannot check edit permission: Permission config missing for ${this.tableName}`
			);
			throw new InternalServerError(`Permission configuration error for ${this.tableName}`);
		}

		const { userIdColumn, editableByOthersColumn } = this.permissionConfig;

		try {
			if (!this.primaryKey) {
				throw new InternalServerError(
					`Cannot check edit permission for ${this.tableName}: no primary key configured`
				);
			}

			const entity = await dbInterface
				.selectFrom(this.tableName)
				.select([userIdColumn, editableByOthersColumn])
				.where(this.primaryKey, '=', entityId)
				.executeTakeFirst();

			if (!entity) {
				throw new NotFoundError(
					`${this.tableName.slice(0, -1)} with ID ${entityId} not found for permission check`
				);
			}

			// Can edit if:
			// 1. User created the entity (and userId is not null)
			// 2. Entity is editable by others
			// 3. Entity has no creator (creator column is null)
			// 4. User is admin (already checked above)
			const isCreator =
				userId !== null &&
				entity[userIdColumn] !== null &&
				String(entity[userIdColumn]) === String(userId);
			const isEditable = entity[editableByOthersColumn] === true;
			const isUnowned = entity[userIdColumn] === null;

			if (!(isCreator || isEditable || isUnowned)) {
				throw new ForbiddenError(
					`User ${userId} is not authorized to edit ${this.tableName.slice(0, -1)} ${entityId}`
				);
			}

			return true;
		} catch (error) {
			if (
				error instanceof NotFoundError ||
				error instanceof ForbiddenError ||
				error instanceof InternalServerError
			) {
				throw error; // Re-throw specific errors
			}
			console.error(`Error checking edit permission for ${this.tableName} ${entityId}:`, error);
			throw new DatabaseError(
				`Failed to check edit permission for ${this.tableName.slice(0, -1)}`,
				error
			);
		}
	}

	/**
	 * Check if user has permission to view entity
	 * @param {Object} entity - The entity to check
	 * @param {number|null} userId - User ID requesting access
	 * @returns {boolean} - True if user can view
	 */
	canUserView(entity, userId) {
		// If permissions aren't configured, or no entity provided, default to allowing view
		if (!this.useStandardPermissions || !this.permissionConfig || !entity) {
			return true;
		}

		const { visibilityColumn, publicValue, unlistedValue, privateValue, userIdColumn } =
			this.permissionConfig;
		const visibility = entity[visibilityColumn];

		// Public or Unlisted entities can be viewed by anyone (including null/undefined visibility if public/unlisted values are not set)
		const isPublic =
			publicValue !== undefined && publicValue !== null
				? visibility === publicValue
				: visibility === null || visibility === undefined;
		const isUnlisted =
			unlistedValue !== undefined && unlistedValue !== null ? visibility === unlistedValue : false;

		if (isPublic || isUnlisted) {
			return true;
		}

		// Private entities can only be viewed by the creator (if privateValue and userId are valid)
		const isPrivate =
			privateValue !== undefined && privateValue !== null ? visibility === privateValue : false;
		return (
			isPrivate &&
			userId !== null &&
			entity[userIdColumn] !== null &&
			String(entity[userIdColumn]) === String(userId)
		);
	}

	/**
	 * Normalize array fields in data
	 * @param {Object} data - Raw data with potential arrays
	 * @param {Array<string>} arrayFields - Fields to ensure are arrays
	 * @returns {Object} - Data with normalized arrays
	 */
	normalizeArrayFields(data, arrayFields) {
		const normalized = { ...data };

		arrayFields.forEach((field) => {
			// Skip if field is not in data
			if (!(field in normalized)) {
				return;
			}

			// Convert string to array if needed
			if (typeof normalized[field] === 'string') {
				normalized[field] = [normalized[field]];
			}

			// Ensure field is an array
			if (!Array.isArray(normalized[field])) {
				normalized[field] = normalized[field] ? [normalized[field]] : [];
			}
		});

		return normalized;
	}

	/**
	 * Add timestamp fields to entity data
	 * @param {Object} data - Entity data
	 * @param {boolean} isNew - Whether this is a new entity
	 * @returns {Object} - Data with timestamps
	 */
	addTimestamps(data, isNew = true) {
		const now = new Date();
		const result = { ...data };

		if (isNew) {
			result.created_at = now;
		}

		result.updated_at = now;
		return result;
	}

	/**
	 * Builds Kysely query conditions for Full-Text Search (FTS) with prefix matching.
	 * It attaches an '_ftsAppliedInfo' object to the queryBuilder if a search term is processed.
	 * This info is used by _executeSearch for potential fallback.
	 *
	 * @param {import('kysely').SelectQueryBuilder<any, any, any>} queryBuilder - The Kysely query builder instance.
	 * @param {string | undefined | null} searchQuery - The raw search term.
	 * @param {string} [vectorColumn='search_vector'] - The tsvector column in the table.
	 * @param {string} [textSearchConfig='english'] - The PostgreSQL text search configuration.
	 * @param {string[]} [columnsToRankForFallback=['name', 'description']] - Columns for pg_trgm fallback.
	 * @param {number} [trigramThresholdForFallback=0.3] - Similarity threshold for pg_trgm.
	 * @returns {import('kysely').SelectQueryBuilder<any, any, any>} - The modified query builder.
	 */
	_buildSearchQuery(
		queryBuilder,
		searchQuery,
		vectorColumn = 'search_vector',
		textSearchConfig = 'english',
		columnsToRankForFallback = ['name', 'description'], // Default fallback columns
		trigramThresholdForFallback = 0.3
	) {
		const cleanedSearchTerm = searchQuery?.trim();

		if (!cleanedSearchTerm) {
			return queryBuilder;
		}

		const tsQuerySearchTerm = cleanedSearchTerm
			.split(/\s+/)
			.filter(Boolean)
			.map((term) => term + ':*') // Add prefix matching to each term
			.join(' & '); // Combine with AND operator

		if (tsQuerySearchTerm) {
			const qbWithFTS = queryBuilder.where(
				sql`${sql.ref(vectorColumn)} @@ to_tsquery(${textSearchConfig}, ${tsQuerySearchTerm})`
			);
			// Attach info needed for potential fallback search
			qbWithFTS._ftsAppliedInfo = {
				originalSearchTerm: cleanedSearchTerm,
				tsQueryUsed: tsQuerySearchTerm,
				textSearchConfig,
				columnsToRankForFallback,
				trigramThresholdForFallback,
				vectorColumn
			};
			return qbWithFTS;
		}
		return queryBuilder;
	}

	/**
	 * Executes a search query, attempting FTS first, then falling back to pg_trgm similarity search
	 * if FTS yields no results and was applicable.
	 *
	 * @param {import('kysely').SelectQueryBuilder<any, any, any>} ftsQueryBuilder - Query builder with FTS conditions applied by _buildSearchQuery.
	 * @param {import('kysely').SelectQueryBuilder<any, any, any>} baseQueryBuilderForFallback - The original query builder *before* any search conditions were applied, to be used for fallback.
	 * @param {object} paginationOptions - Options for limit and offset.
	 * @param {number} paginationOptions.limit - Max items per page.
	 * @param {number} paginationOptions.offset - Offset for pagination.
	 * @returns {Promise<{items: Array<any>, usedFallback: boolean}>} - The search results and a flag indicating if fallback was used.
	 */
	async _executeSearch(ftsQueryBuilder, baseQueryBuilderForFallback, { limit, offset }) {
		const ftsAppliedInfo = ftsQueryBuilder._ftsAppliedInfo;

		let items = await ftsQueryBuilder.limit(limit).offset(offset).execute();
		let usedFallback = false;

		if (items.length === 0 && ftsAppliedInfo) {
			console.log(
				`[BaseEntityService] FTS on ${this.tableName} returned 0 results for '${ftsAppliedInfo.originalSearchTerm}', trying pg_trgm fallback...`
			);
			usedFallback = true;

			const { originalSearchTerm, columnsToRankForFallback, trigramThresholdForFallback } =
				ftsAppliedInfo;

			// Ensure columnsToRankForFallback are valid columns of the current table.
			// This is a basic check; more robust validation might involve checking schema.
			const validFallbackColumns = columnsToRankForFallback.filter((col) =>
				this.isColumnAllowed(col)
			);
			if (validFallbackColumns.length === 0) {
				console.warn(
					`[BaseEntityService] pg_trgm fallback for ${this.tableName} skipped: no valid columns to rank were provided or allowed.`
				);
				return { items, usedFallback: false }; // Return original (empty) items
			}

			let fallbackQuery = baseQueryBuilderForFallback // Start from the base query, *without* FTS conditions
				.where((eb) =>
					eb.or(
						validFallbackColumns.map((col) =>
							eb(
								sql`similarity(${sql.ref(col)}, ${originalSearchTerm})`,
								'>',
								trigramThresholdForFallback
							)
						)
					)
				)
				// Do not re-select columns here; baseQueryBuilderForFallback already has its selects.
				// Just append similarity_score to avoid duplicate/ambiguous selects.
				.select((eb) =>
					eb.fn
						.greatest(
							...validFallbackColumns.map(
								(col) => sql`similarity(${sql.ref(col)}, ${originalSearchTerm})`
							)
						)
						.as('similarity_score')
				)
				.orderBy('similarity_score', 'desc');
			items = await fallbackQuery.limit(limit).offset(offset).execute();
		}

		// Clean up the temporary property from the FTS query builder if it exists
		if (ftsQueryBuilder && '_ftsAppliedInfo' in ftsQueryBuilder) {
			delete ftsQueryBuilder._ftsAppliedInfo;
		}

		return { items, usedFallback };
	}
}
