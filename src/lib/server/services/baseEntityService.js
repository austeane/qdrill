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
	 * Builds the WHERE clause and parameters for a query based on filters and permissions.
	 * @param {Object} filters - Filter conditions (e.g., { name__like: '%test%', age__gt: 18 })
	 * @param {number|null} [userId=null] - ID of the user making the request (for permission checks)
	 * @param {number} [initialParamCount=0] - Starting index for query parameters.
	 * @returns {{ whereClause: string, queryParams: Array<any>, paramCount: number }}
	 */
	_buildWhereClause(filters = {}, userId = null, initialParamCount = 0) {
		const conditions = [];
		const queryParams = [];
		let paramCount = initialParamCount;

		// Define supported operators and their SQL generation logic
		const operators = {
			exact: (col, val) => ({ clause: `${col} = $${paramCount + 1}`, params: [val] }),
			eq: (col, val) => ({ clause: `${col} = $${paramCount + 1}`, params: [val] }),
			neq: (col, val) => ({ clause: `${col} != $${paramCount + 1}`, params: [val] }),
			gt: (col, val) => ({ clause: `${col} > $${paramCount + 1}`, params: [val] }),
			gte: (col, val) => ({ clause: `${col} >= $${paramCount + 1}`, params: [val] }),
			lt: (col, val) => ({ clause: `${col} < $${paramCount + 1}`, params: [val] }),
			lte: (col, val) => ({ clause: `${col} <= $${paramCount + 1}`, params: [val] }),
			like: (col, val) => ({ clause: `${col} LIKE $${paramCount + 1}`, params: [val] }),
			ilike: (col, val) => ({ clause: `${col} ILIKE $${paramCount + 1}`, params: [val] }),
			isnull: (col, val) => ({ clause: `${col} IS ${val ? 'NULL' : 'NOT NULL'}`, params: [] }), // Value is boolean true/false
			in: (col, val) => {
				// Expects value to be an array
				if (!Array.isArray(val) || val.length === 0) return null; // Or throw error?
				const placeholders = val.map((_, i) => `$${paramCount + 1 + i}`).join(', ');
				return { clause: `${col} IN (${placeholders})`, params: val };
			},
			any: (col, val) => {
				// Specific to PostgreSQL ANY operator for array membership
				if (!Array.isArray(val) && this.columnTypes[col] === 'array') {
					// If filter value is single for an array col, check membership
					return { clause: `$${paramCount + 1} = ANY(${col})`, params: [val] };
				} else if (Array.isArray(val) && this.columnTypes[col] === 'array') {
					// If filter value is array for array col, check overlap (&&)
					return { clause: `${col} && $${paramCount + 1}`, params: [val] };
				}
				// Fallback or error for non-array columns/values?
				console.warn(`Unsupported 'any' filter for column '${col}' with value:`, val);
				return null;
			}
			// TODO: Add support for other operators like 'between', 'not in', etc.
		};

		// Process filters
		Object.entries(filters).forEach(([key, value]) => {
			// Skip undefined values (allow null for isnull)
			if (value === undefined) {
				return;
			}

			let columnName = key;
			let operator = 'exact'; // Default operator

			// Check for operator suffix (e.g., "name__like")
			const parts = key.split('__');
			if (parts.length === 2 && operators[parts[1]]) {
				columnName = parts[0];
				operator = parts[1];
			}

			// Validate column
			if (!this.isColumnAllowed(columnName)) {
				console.warn(`Filter key '${key}' uses disallowed column '${columnName}'. Skipping.`);
				return;
			}

			// Skip null values unless using isnull operator
			if (value === null && operator !== 'isnull') {
				return;
			}

			// Get the clause and params from the operator function
			const opFunc = operators[operator];
			const result = opFunc(columnName, value);

			if (result && result.clause) {
				conditions.push(result.clause);
				queryParams.push(...result.params);
				paramCount += result.params.length; // Increment count by number of params added
			}
		});

		// Add standard permission filtering if enabled
		if (this.useStandardPermissions && this.permissionConfig) {
			const { visibilityColumn, publicValue, unlistedValue, privateValue, userIdColumn } =
				this.permissionConfig;
			const visibilityConditions = [];

			// Always allow public (if defined)
			if (publicValue !== undefined && publicValue !== null) {
				visibilityConditions.push(`${visibilityColumn} = $${paramCount + 1}`);
				queryParams.push(publicValue);
				paramCount++;
			} else {
				// If public not defined, maybe allow NULL? Or require explicit public value?
				// For now, let's assume NULL is implicitly public if publicValue isn't set.
				visibilityConditions.push(`${visibilityColumn} IS NULL`);
			}

			// Always allow unlisted (if defined)
			if (unlistedValue !== undefined && unlistedValue !== null) {
				visibilityConditions.push(`${visibilityColumn} = $${paramCount + 1}`);
				queryParams.push(unlistedValue);
				paramCount++;
			}

			// Allow private if userId matches and privateValue is defined
			if (userId !== null && privateValue !== undefined && privateValue !== null) {
				visibilityConditions.push(
					`(${visibilityColumn} = $${paramCount + 1} AND ${userIdColumn} = $${paramCount + 2})`
				);
				queryParams.push(privateValue, userId);
				paramCount += 2;
			}

			if (visibilityConditions.length > 0) {
				conditions.push(`(${visibilityConditions.join(' OR ')})`);
			} else if (userId === null && privateValue !== undefined) {
				// If user is not logged in and private items exist, explicitly exclude them
				conditions.push(`${visibilityColumn} != $${paramCount + 1}`);
				queryParams.push(privateValue);
				paramCount++;
			}
		}

		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
		return { whereClause, queryParams, paramCount };
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

		// Calculate offset for pagination
		const offset = (page - 1) * limit;

		const { whereClause, queryParams, paramCount } = this._buildWhereClause(filters, userId, 0);

		// Build ORDER BY clause with validation
		let orderBy;
		if (sortBy && this.isColumnAllowed(sortBy)) {
			const sanitizedSortOrder = this.validateSortOrder(sortOrder);
			if (this.primaryKey) {
				orderBy = `ORDER BY ${sortBy} ${sanitizedSortOrder}, ${this.primaryKey} ${sanitizedSortOrder}`;
			} else {
				orderBy = `ORDER BY ${sortBy} ${sanitizedSortOrder}`;
			}
		} else if (this.primaryKey) {
			orderBy = `ORDER BY ${this.primaryKey} DESC`;
		} else {
			orderBy = ''; // No ordering if no primary key
		}

		// Validate columns to return
		const validColumns = columns.filter((col) => col === '*' || this.isColumnAllowed(col));

		// If no valid columns, default to primary key (if it exists) or all allowed columns
		if (validColumns.length === 0) {
			if (this.primaryKey) {
				validColumns.push(this.primaryKey);
			} else {
				validColumns.push('*');
			}
		}

		try {
			let results;
			let pagination = {};

			if (!all) {
				const countQuery = `
            SELECT COUNT(*)
            FROM ${this.tableName}
            ${whereClause}
          `;

				const countResult = await db.query(countQuery, queryParams);
				const totalItems = parseInt(countResult.rows[0].count);

				pagination = {
					page: parseInt(page),
					limit: parseInt(limit),
					totalItems,
					totalPages: Math.ceil(totalItems / limit)
				};

				const query = `
            SELECT ${validColumns.join(', ')}
            FROM ${this.tableName}
            ${whereClause}
            ${orderBy}
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
          `;

				const allParams = [...queryParams, limit, offset];
				const result = await db.query(query, allParams);
				results = result.rows;
			} else {
				const query = `
            SELECT ${validColumns.join(', ')}
            FROM ${this.tableName}
            ${whereClause}
            ${orderBy}
          `;

				const result = await db.query(query, queryParams);
				results = result.rows;
			}

			return {
				items: results,
				pagination: all ? null : pagination
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
			// Validate columns to return
			const validColumns = columns.filter((col) => col === '*' || this.isColumnAllowed(col));

			// If no valid columns, default to primary key
			if (validColumns.length === 0) {
				validColumns.push(this.primaryKey);
			}

			// Use the provided client or the default db connection
			const dbInterface = client || db;

			const query = `
        SELECT ${validColumns.join(', ')}
        FROM ${this.tableName}
        WHERE ${this.primaryKey} = $1
      `;

			const result = await dbInterface.query(query, [id]);

			// Throw NotFoundError if no rows are returned
			if (result.rows.length === 0) {
				throw new NotFoundError(`${this.tableName.slice(0, -1)} with ID ${id} not found`);
			}

			const entity = result.rows[0];

			// Check view permission if standard permissions are enabled
			if (this.useStandardPermissions && !this.canUserView(entity, userId)) {
				throw new ForbiddenError(
					`User not authorized to view ${this.tableName.slice(0, -1)} with ID ${id}`
				);
			}

			return result.rows[0];
		} catch (error) {
			// Re-throw NotFoundError directly
			if (error instanceof NotFoundError) {
				throw error;
			}
			console.error(`Error in ${this.tableName}.getById(${id}):`, error);
			// Wrap other errors as DatabaseError
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
		const dbInterface = client || db;
		try {
			// Create a copy of the data
			const dataCopy = { ...data };

			// Remove id field if it exists - let the database generate it
			if (this.primaryKey in dataCopy) {
				delete dataCopy[this.primaryKey];
			}

			// Filter out undefined values and validate columns
			const columns = Object.keys(dataCopy).filter(
				(key) => dataCopy[key] !== undefined && this.isColumnAllowed(key)
			);
			const values = columns.map((column) => dataCopy[column]);

			// No columns to insert
			if (columns.length === 0) {
				throw new ValidationError('No valid data provided for insertion');
			}

			const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

			const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

			const result = await dbInterface.query(query, values);

			return result.rows[0];
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
		const dbInterface = client || db;
		try {
			// Filter out undefined values and validate columns
			const columns = Object.keys(data).filter(
				(key) => data[key] !== undefined && key !== this.primaryKey && this.isColumnAllowed(key)
			);

			if (columns.length === 0) {
				throw new ValidationError('No valid data provided for update');
			}

			const values = columns.map((column) => data[column]);

			const setClause = columns.map((column, index) => `${column} = $${index + 2}`).join(', ');

			const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE ${this.primaryKey} = $1
        RETURNING *
      `;

			const result = await dbInterface.query(query, [id, ...values]);

			// Throw NotFoundError if no rows were affected (entity didn't exist)
			if (result.rows.length === 0) {
				throw new NotFoundError(
					`${this.tableName.slice(0, -1)} with ID ${id} not found for update`
				);
			}

			return result.rows[0];
		} catch (error) {
			// Re-throw known errors
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
		const dbInterface = client || db;
		try {
			// Ensure the primary key is allowed (it should be by default)
			if (!this.isColumnAllowed(this.primaryKey)) {
				throw new InternalServerError(
					`Primary key ${this.primaryKey} is not in the allowed columns list for ${this.tableName}`
				);
			}

			const query = `
        DELETE FROM ${this.tableName}
        WHERE ${this.primaryKey} = $1
        RETURNING ${this.primaryKey}
      `;

			const result = await dbInterface.query(query, [id]);

			// Throw NotFoundError if no rows were deleted (entity didn't exist)
			if (result.rows.length === 0) {
				throw new NotFoundError(
					`${this.tableName.slice(0, -1)} with ID ${id} not found for deletion`
				);
			}
			return true; // Explicitly return true on success
		} catch (error) {
			// Re-throw known errors
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
			// Ensure the primary key is allowed (it should be by default)
			if (!this.isColumnAllowed(this.primaryKey)) {
				throw new Error(`Primary key ${this.primaryKey} is not in the allowed columns list`);
			}

			const query = `
        SELECT 1 
        FROM ${this.tableName}
        WHERE ${this.primaryKey} = $1
        LIMIT 1
      `;

			const result = await db.query(query, [id]);

			return result.rows.length > 0;
		} catch (error) {
			console.error(`Error in ${this.tableName}.exists(${id}):`, error);
			return false;
		}
	}

	/**
	 * Search entities by text columns
	 * @param {string} searchTerm - Search term
	 * @param {Array<string>} searchColumns - Columns to search in (DEPRECATED: use searchVectorColumn)
	 * @param {string} [searchVectorColumn='search_vector'] - The tsvector column to search against.
	 * @param {string} [searchConfig='english'] - The text search configuration.
	 * @param {Object} options - Additional options (page, limit, etc.)
	 * @param {number|null} [options.userId=null] - User ID for permission checking.
	 * @returns {Promise<Object>} - Search results with pagination
	 */
	async search(
		searchTerm,
		searchColumns,
		options = {},
		searchVectorColumn = 'search_vector',
		searchConfig = 'english'
	) {
		try {
			const {
				page = 1,
				limit = 10,
				sortBy = null,
				sortOrder = 'desc',
				columns = this.defaultColumns,
				userId = null // For permission checking
			} = options;

			// --- BEGIN DEPRECATION WARNING for searchColumns ---
			if (searchColumns && Array.isArray(searchColumns) && searchColumns.length > 0) {
				console.warn(`The 'searchColumns' parameter in BaseEntityService.search() is DEPRECATED and will be removed. 
          Configure a tsvector column ('${searchVectorColumn}') in your database and service instead.`);
				// Optional: Fallback to old LIKE search if searchVectorColumn check fails?
				// For now, we proceed assuming tsvector is preferred.
			}
			// --- END DEPRECATION WARNING ---

			// Validate tsvector column existence (basic check - assumes it exists in DB)
			// A more robust check might involve querying information_schema, but adds overhead.
			// We also need to ensure it's allowed if specific columns are enforced.
			// if (!this.isColumnAllowed(searchVectorColumn)) { // Optional: uncomment if searchVectorColumn must be in allowedColumns
			//   throw new ValidationError(`Search vector column '${searchVectorColumn}' is not allowed.`);
			// }

			// Validate columns to return
			const validColumns = columns.filter((col) => col === '*' || this.isColumnAllowed(col));

			// If no valid columns, default to primary key
			if (validColumns.length === 0) {
				validColumns.push(this.primaryKey);
			}

			const offset = (page - 1) * limit;
			// Prepare the search term for tsquery (plainto_tsquery handles basic parsing and stemming)
			const tsQueryParam = searchTerm;

			// Build search conditions
			// Use tsquery for full-text search
			const searchCondition = `${searchVectorColumn} @@ plainto_tsquery($1, $2)`;
			const initialParams = [searchConfig, tsQueryParam];
			let currentParamCount = initialParams.length;

			// Combine with permission and other filters using _buildWhereClause
			// Pass the search condition as a raw filter (needs careful handling)
			// TODO: How to best integrate raw SQL conditions with _buildWhereClause?
			// Option 1: Add a special filter key like '__raw'.
			// Option 2: Modify _buildWhereClause to accept initial conditions.
			// Option 3: Build search and filter WHERE clauses separately and combine.
			// Let's try Option 3 for now.

			const {
				whereClause: filterWhereClause,
				queryParams: filterQueryParams,
				paramCount: filterParamCount
			} = this._buildWhereClause(options.filters || {}, userId, currentParamCount);

			// Combine conditions
			const combinedConditions = [searchCondition];
			if (filterWhereClause) {
				// Extract conditions from filterWhereClause (remove 'WHERE ')
				combinedConditions.push(filterWhereClause.substring(6));
			}
			const finalWhereClause = `WHERE ${combinedConditions.join(' AND ')}`;
			const finalQueryParams = [...initialParams, ...filterQueryParams];
			currentParamCount = filterParamCount; // Update param count

			// Count total matches
			const countQuery = `
        SELECT COUNT(*)
        FROM ${this.tableName}
        ${finalWhereClause}
      `;

			const countResult = await db.query(countQuery, finalQueryParams);
			const totalItems = parseInt(countResult.rows[0].count);

			// Build ORDER BY clause with validation
			let orderBy;
			if (sortBy && this.isColumnAllowed(sortBy)) {
				const sanitizedSortOrder = this.validateSortOrder(sortOrder);
				orderBy = `ORDER BY ${sortBy} ${sanitizedSortOrder}, ${this.primaryKey} ${sanitizedSortOrder}`;
			} else {
				// Default sort by relevance when searching
				orderBy = `ORDER BY ts_rank_cd(${searchVectorColumn}, plainto_tsquery($1, $2)) DESC, ${this.primaryKey} DESC`;
			}

			// Main search query
			const query = `
        SELECT ${validColumns.join(', ')}
        FROM ${this.tableName}
        ${finalWhereClause}
        ${orderBy}
        LIMIT $${currentParamCount + 1} OFFSET $${currentParamCount + 2}
      `;

			const result = await db.query(query, [...finalQueryParams, limit, offset]);

			return {
				items: result.rows,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					totalItems,
					totalPages: Math.ceil(totalItems / limit)
				}
			};
		} catch (error) {
			// Re-throw known errors
			if (error instanceof ValidationError) {
				throw error;
			}
			console.error(`Error in ${this.tableName}.search():`, error);
			throw new DatabaseError(`Failed to search ${this.tableName}`, error);
		}
	}

	/**
	 * Execute a function within a database transaction
	 * @param {Function} callback - Async function to execute within transaction
	 * @returns {Promise<any>} - Result of the callback function
	 */
	async withTransaction(callback) {
		const client = await db.getClient();
		try {
			await client.query('BEGIN');
			const result = await callback(client);
			await client.query('COMMIT');
			return result;
		} catch (error) {
			await client.query('ROLLBACK');
			console.error(`Transaction error in ${this.tableName}:`, error);
			throw error;
		} finally {
			client.release();
		}
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
		// Use the provided client or the default db connection
		const dbInterface = client || db;

		// Check if user is admin
		if (userId) {
			const userResult = await dbInterface.query('SELECT role FROM users WHERE id = $1', [userId]);
			if (userResult.rows.length > 0 && userResult.rows[0].role === 'admin') {
				return true; // Admins can edit anything
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
			// Fetch only necessary columns for permission check
			const query = `SELECT ${userIdColumn}, ${editableByOthersColumn} FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;
			const result = await dbInterface.query(query, [entityId]);

			if (result.rows.length === 0) {
				throw new NotFoundError(
					`${this.tableName.slice(0, -1)} with ID ${entityId} not found for permission check`
				);
			}
			const entity = result.rows[0];

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

			return true; // Return true if no ForbiddenError was thrown
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
