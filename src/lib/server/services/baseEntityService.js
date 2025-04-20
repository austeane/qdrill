import * as db from '$lib/server/db';
import { NotFoundError, ValidationError, DatabaseError, InternalServerError } from '$lib/server/errors';

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
   */
  constructor(tableName, primaryKey = 'id', defaultColumns = ['*'], allowedColumns = [], columnTypes = {}) {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.defaultColumns = defaultColumns;
    this.allowedColumns = [...allowedColumns, primaryKey];
    this.columnTypes = columnTypes;
    
    // Track if this entity uses common permissions model
    this.useStandardPermissions = false;
  }
  
  /**
   * Enable standard permissions model
   * This assumes the entity has created_by and is_editable_by_others columns
   */
  enableStandardPermissions() {
    this.useStandardPermissions = true;
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
   * Get all entities with optional filtering and pagination
   * @param {Object} options - Query options
   * @param {number} options.page - Page number starting from 1 (default: 1)
   * @param {number} options.limit - Items per page (default: 10)
   * @param {boolean} options.all - Whether to return all records (default: false)
   * @param {Object} options.filters - Filter conditions
   * @param {string} options.sortBy - Column to sort by
   * @param {string} options.sortOrder - Sort order ('asc' or 'desc', default: 'desc')
   * @param {Array<string>} options.columns - Columns to return (default: this.defaultColumns)
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
      columns = this.defaultColumns
    } = options;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query conditions from filters
    const conditions = [];
    const queryParams = [];
    let paramCount = 0;

    // Process filters
    Object.entries(filters).forEach(([key, value]) => {
      // Skip undefined, null values, or disallowed columns
      if (value === undefined || value === null || !this.isColumnAllowed(key)) {
        return;
      }

      paramCount++;
      
      // Handle array columns differently
      if (this.columnTypes[key] === 'array') {
        if (Array.isArray(value)) {
          // If the filter value is an array, use ANY operator
          conditions.push(`$${paramCount} = ANY(${key})`);
        } else {
          // If the filter value is a single value, still use ANY
          conditions.push(`$${paramCount} = ANY(${key})`);
        }
      } else {
        // Regular column comparison
        conditions.push(`${key} = $${paramCount}`);
      }
      
      queryParams.push(value);
    });

    // Add WHERE clause if there are conditions
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause with validation
    let orderBy;
    if (sortBy && this.isColumnAllowed(sortBy)) {
      const sanitizedSortOrder = this.validateSortOrder(sortOrder);
      orderBy = `ORDER BY ${sortBy} ${sanitizedSortOrder}, ${this.primaryKey} ${sanitizedSortOrder}`;
    } else {
      orderBy = `ORDER BY ${this.primaryKey} DESC`;
    }

    // Validate columns to return
    const validColumns = columns.filter(col => 
      col === '*' || this.isColumnAllowed(col)
    );

    // If no valid columns, default to primary key
    if (validColumns.length === 0) {
      validColumns.push(this.primaryKey);
    }

    try {
      return this.withTransaction(async (client) => {
        let results;
        let pagination = {};

        // Prepare query parameters once
        const preparedQueryParams = [...queryParams];

        if (!all) {
          // Get total count for pagination
          const countQuery = `
            SELECT COUNT(*)
            FROM ${this.tableName}
            ${whereClause}
          `;

          const countResult = await client.query(countQuery, preparedQueryParams);
          const totalItems = parseInt(countResult.rows[0].count);

          pagination = {
            page: parseInt(page),
            limit: parseInt(limit),
            totalItems,
            totalPages: Math.ceil(totalItems / limit)
          };

          // Main query with pagination
          const query = `
            SELECT ${validColumns.join(', ')}
            FROM ${this.tableName}
            ${whereClause}
            ${orderBy}
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
          `;

          // Add pagination parameters
          const allParams = [...preparedQueryParams, limit, offset];
          const result = await client.query(query, allParams);
          results = result.rows;
        } else {
          // Query without pagination
          const query = `
            SELECT ${validColumns.join(', ')}
            FROM ${this.tableName}
            ${whereClause}
            ${orderBy}
          `;

          const result = await client.query(query, preparedQueryParams);
          results = result.rows;
        }

        return {
          items: results,
          pagination: all ? null : pagination
        };
      });
    } catch (error) {
      console.error(`Error in ${this.tableName}.getAll():`, error);
      throw new DatabaseError(`Failed to retrieve ${this.tableName}`, error);
    }
  }

  /**
   * Get a single entity by ID
   * @param {number|string} id - Entity ID
   * @param {Array<string>} columns - Columns to return (default: this.defaultColumns)
   * @returns {Promise<Object>} - Entity object
   * @throws {NotFoundError} If entity not found
   * @throws {DatabaseError} On database error
   */
  async getById(id, columns = this.defaultColumns) {
    try {
      // Validate columns to return
      const validColumns = columns.filter(col => 
        col === '*' || this.isColumnAllowed(col)
      );

      // If no valid columns, default to primary key
      if (validColumns.length === 0) {
        validColumns.push(this.primaryKey);
      }

      const query = `
        SELECT ${validColumns.join(', ')}
        FROM ${this.tableName}
        WHERE ${this.primaryKey} = $1
      `;
      
      const result = await db.query(query, [id]);
      
      // Throw NotFoundError if no rows are returned
      if (result.rows.length === 0) {
        throw new NotFoundError(`${this.tableName.slice(0, -1)} with ID ${id} not found`);
      }

      return result.rows[0];
    } catch (error) {
      // Re-throw NotFoundError directly
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error(`Error in ${this.tableName}.getById(${id}):`, error);
      // Wrap other errors as DatabaseError
      throw new DatabaseError(`Failed to retrieve ${this.tableName.slice(0, -1)} with ID ${id}`, error);
    }
  }

  /**
   * Create a new entity
   * @param {Object} data - Entity data
   * @returns {Promise<Object>} - Created entity
   */
  async create(data) {
    try {
      // Create a copy of the data
      const dataCopy = { ...data };
      
      // Remove id field if it exists - let the database generate it
      if (this.primaryKey in dataCopy) {
        delete dataCopy[this.primaryKey];
      }
      
      // Filter out undefined values and validate columns
      const columns = Object.keys(dataCopy)
        .filter(key => dataCopy[key] !== undefined && this.isColumnAllowed(key));
      const values = columns.map(column => dataCopy[column]);
      
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
      
      const result = await db.query(query, values);
      
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
   * @returns {Promise<Object>} - Updated entity
   * @throws {NotFoundError} If entity not found
   * @throws {DatabaseError} On database error
   * @throws {ValidationError} If no valid data provided
   */
  async update(id, data) {
    try {
      // Filter out undefined values and validate columns
      const columns = Object.keys(data).filter(key => 
        data[key] !== undefined && key !== this.primaryKey && this.isColumnAllowed(key)
      );
      
      if (columns.length === 0) {
        throw new ValidationError('No valid data provided for update');
      }
      
      const values = columns.map(column => data[column]);
      
      const setClause = columns
        .map((column, index) => `${column} = $${index + 2}`)
        .join(', ');
      
      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE ${this.primaryKey} = $1
        RETURNING *
      `;
      
      const result = await db.query(query, [id, ...values]);
      
      // Throw NotFoundError if no rows were affected (entity didn't exist)
      if (result.rows.length === 0) {
         throw new NotFoundError(`${this.tableName.slice(0, -1)} with ID ${id} not found for update`);
      }

      return result.rows[0];
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error in ${this.tableName}.update(${id}):`, error);
      throw new DatabaseError(`Failed to update ${this.tableName.slice(0, -1)} with ID ${id}`, error);
    }
  }

  /**
   * Delete an entity by ID
   * @param {number|string} id - Entity ID
   * @returns {Promise<void>} - Resolves if successful
   * @throws {NotFoundError} If entity not found
   * @throws {DatabaseError} On database error
   */
  async delete(id) {
    try {
      // Ensure the primary key is allowed (it should be by default)
      if (!this.isColumnAllowed(this.primaryKey)) {
        throw new InternalServerError(`Primary key ${this.primaryKey} is not in the allowed columns list for ${this.tableName}`);
      }

      const query = `
        DELETE FROM ${this.tableName}
        WHERE ${this.primaryKey} = $1
        RETURNING ${this.primaryKey}
      `;
      
      const result = await db.query(query, [id]);
      
      // Throw NotFoundError if no rows were deleted (entity didn't exist)
      if (result.rows.length === 0) {
        throw new NotFoundError(`${this.tableName.slice(0, -1)} with ID ${id} not found for deletion`);
      }
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError || error instanceof InternalServerError) {
        throw error;
      }
      console.error(`Error in ${this.tableName}.delete(${id}):`, error);
      throw new DatabaseError(`Failed to delete ${this.tableName.slice(0, -1)} with ID ${id}`, error);
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
   * @param {Array<string>} searchColumns - Columns to search in
   * @param {Object} options - Additional options (page, limit, etc.)
   * @returns {Promise<Object>} - Search results with pagination
   */
  async search(searchTerm, searchColumns, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = null,
        sortOrder = 'desc',
        columns = this.defaultColumns
      } = options;
      
      // Validate search columns
      const validSearchColumns = searchColumns.filter(col => this.isColumnAllowed(col));
      
      if (validSearchColumns.length === 0) {
        throw new ValidationError('No valid search columns provided');
      }
      
      // Validate columns to return
      const validColumns = columns.filter(col => 
        col === '*' || this.isColumnAllowed(col)
      );

      // If no valid columns, default to primary key
      if (validColumns.length === 0) {
        validColumns.push(this.primaryKey);
      }
      
      const offset = (page - 1) * limit;
      const searchPattern = `%${searchTerm.toLowerCase()}%`;
      
      // Build search conditions
      const searchConditions = validSearchColumns
        .map((column, index) => `LOWER(${column}) LIKE $${index + 1}`)
        .join(' OR ');
      
      // Count total matches
      const countQuery = `
        SELECT COUNT(*)
        FROM ${this.tableName}
        WHERE ${searchConditions}
      `;
      
      const countParams = validSearchColumns.map(() => searchPattern);
      const countResult = await db.query(countQuery, countParams);
      const totalItems = parseInt(countResult.rows[0].count);
      
      // Build ORDER BY clause with validation
      let orderBy;
      if (sortBy && this.isColumnAllowed(sortBy)) {
        const sanitizedSortOrder = this.validateSortOrder(sortOrder);
        orderBy = `ORDER BY ${sortBy} ${sanitizedSortOrder}, ${this.primaryKey} ${sanitizedSortOrder}`;
      } else {
        orderBy = `ORDER BY ${this.primaryKey} DESC`;
      }
      
      // Main search query
      const query = `
        SELECT ${validColumns.join(', ')}
        FROM ${this.tableName}
        WHERE ${searchConditions}
        ${orderBy}
        LIMIT $${validSearchColumns.length + 1} OFFSET $${validSearchColumns.length + 2}
      `;
      
      const queryParams = [...countParams, limit, offset];
      const result = await db.query(query, queryParams);
      
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
   * @returns {Promise<boolean>} - True if user can edit
   */
  async canUserEdit(entityId, userId) {
    if (!this.useStandardPermissions) {
      console.warn(`Standard permissions not enabled for ${this.tableName} service - allowing edit`);
      return true;
    }
    
    try {
      const entity = await this.getById(entityId);

      // Can edit if:
      // 1. User created the entity
      // 2. Entity is editable by others
      // 3. Entity has no creator (created_by is null)
      return entity.created_by === userId || 
             entity.is_editable_by_others === true || 
             entity.created_by === null;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error(`Error checking edit permission for ${this.tableName} ${entityId}:`, error);
      throw new DatabaseError(`Failed to check edit permission for ${this.tableName.slice(0, -1)}`, error);
    }
  }
  
  /**
   * Check if user has permission to view entity
   * @param {Object} entity - The entity to check
   * @param {number|null} userId - User ID requesting access
   * @returns {boolean} - True if user can view
   */
  canUserView(entity, userId) {
    if (!this.useStandardPermissions || !entity) {
      return true;
    }
    
    // Public entities can be viewed by anyone
    if (entity.visibility === 'public' || entity.visibility === 'unlisted') {
      return true;
    }
    
    // Private entities can only be viewed by creator
    return entity.created_by === userId;
  }
  
  /**
   * Normalize array fields in data
   * @param {Object} data - Raw data with potential arrays
   * @param {Array<string>} arrayFields - Fields to ensure are arrays
   * @returns {Object} - Data with normalized arrays
   */
  normalizeArrayFields(data, arrayFields) {
    const normalized = { ...data };
    
    arrayFields.forEach(field => {
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
}