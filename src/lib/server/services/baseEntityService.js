import * as db from '$lib/server/db';

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
      let results;
      let pagination = {};

      if (!all) {
        // Get total count for pagination
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

        // Main query with pagination
        const query = `
          SELECT ${validColumns.join(', ')}
          FROM ${this.tableName}
          ${whereClause}
          ${orderBy}
          LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;

        // Add pagination parameters
        const allParams = [...queryParams, limit, offset];
        const result = await db.query(query, allParams);
        results = result.rows;
      } else {
        // Query without pagination
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
      throw error;
    }
  }

  /**
   * Get a single entity by ID
   * @param {number|string} id - Entity ID
   * @param {Array<string>} columns - Columns to return (default: this.defaultColumns)
   * @returns {Promise<Object>} - Entity object or null if not found
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
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error in ${this.tableName}.getById():`, error);
      throw error;
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
        throw new Error('No valid data provided for insertion');
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
      throw error;
    }
  }

  /**
   * Update an entity
   * @param {number|string} id - Entity ID
   * @param {Object} data - Updated entity data
   * @returns {Promise<Object>} - Updated entity
   */
  async update(id, data) {
    try {
      // Filter out undefined values and validate columns
      const columns = Object.keys(data).filter(key => 
        data[key] !== undefined && key !== this.primaryKey && this.isColumnAllowed(key)
      );
      
      if (columns.length === 0) {
        return this.getById(id);
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
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error in ${this.tableName}.update():`, error);
      throw error;
    }
  }

  /**
   * Delete an entity by ID
   * @param {number|string} id - Entity ID
   * @returns {Promise<boolean>} - True if successful, false if entity not found
   */
  async delete(id) {
    try {
      // Ensure the primary key is allowed (it should be by default)
      if (!this.isColumnAllowed(this.primaryKey)) {
        throw new Error(`Primary key ${this.primaryKey} is not in the allowed columns list`);
      }

      const query = `
        DELETE FROM ${this.tableName}
        WHERE ${this.primaryKey} = $1
        RETURNING ${this.primaryKey}
      `;
      
      const result = await db.query(query, [id]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error in ${this.tableName}.delete():`, error);
      throw error;
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
      console.error(`Error in ${this.tableName}.exists():`, error);
      throw error;
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
        throw new Error('No valid search columns provided');
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
      console.error(`Error in ${this.tableName}.search():`, error);
      throw error;
    }
  }
}