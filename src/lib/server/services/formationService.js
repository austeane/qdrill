import { BaseEntityService } from './baseEntityService.js';
import * as db from '$lib/server/db';

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
    
    super('formations', 'id', ['*'], allowedFormationColumns, { 
      diagrams: 'json', 
      tags: 'array' 
    });
  }

  /**
   * Get formations with optional filtering/pagination
   * Overrides base getAll to include additional formation-specific logic
   */
  async getAll(options = {}) {
    const result = await super.getAll(options);
    return result;
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
   */
  async searchFormations(searchTerm, options = {}) {
    const searchColumns = ['name', 'brief_description', 'detailed_description'];
    return await this.search(searchTerm, searchColumns, options);
  }
  
  /**
   * Get formations by created user
   * @param {number} userId - User ID
   * @param {Object} options - Optional search options (pagination, etc.)
   * @returns {Promise<Object>} - Formations created by this user
   */
  async getFormationsByUser(userId, options = {}) {
    const filters = { ...options.filters, created_by: userId };
    return await this.getAll({ ...options, filters });
  }
  
  /**
   * Normalize formation data for consistent database storage
   * @param {Object} data - Raw formation data
   * @returns {Object} - Normalized data
   */
  normalizeFormationData(data) {
    const normalizedData = { ...data };
    
    // Remove id field if it's null or undefined
    if (normalizedData.id === null || normalizedData.id === undefined) {
      delete normalizedData.id;
    }
    
    // Ensure diagrams is an array
    if (!Array.isArray(normalizedData.diagrams)) {
      normalizedData.diagrams = normalizedData.diagrams ? [normalizedData.diagrams] : [];
    }
    
    // No need to stringify diagrams as they will be stored as JSONB[]
    // The database column type already handles JSON objects
    
    // Ensure tags is an array
    if (!Array.isArray(normalizedData.tags)) {
      normalizedData.tags = normalizedData.tags ? [normalizedData.tags] : [];
    }
    
    return normalizedData;
  }

  /**
   * Associate an anonymously created formation with a user
   * @param {number} id - Formation ID
   * @param {number} userId - User ID to associate with
   * @returns {Promise<Object>} - The updated formation
   * @throws {Error} - If formation not found or already owned
   */
  async associateFormation(id, userId) {
    const formation = await this.getById(id);

    if (!formation) {
      throw new Error('Formation not found');
    }

    if (formation.created_by !== null) {
      // Formation already has an owner, do nothing or throw error?
      // Let's return the existing formation for now.
      // console.warn(`Formation ${id} already associated with user ${formation.created_by}. Cannot associate with ${userId}.`);
      // throw new Error('Formation already has an owner');
      return formation; 
    }

    // Update the created_by field
    return await this.update(id, { created_by: userId });
  }

  /**
   * Get formations with advanced filtering, sorting, and pagination
   * @param {Object} [filters={}] - Filters object
   * @param {string[]} [filters.tags] - Tags to filter by (match any)
   * @param {string} [filters.formation_type] - Formation type to filter by
   * @param {string} [filters.userId] - User ID for visibility filtering
   * @param {string} [filters.searchQuery] - Text search query (searches name, description)
   * @param {Object} [sortOptions={}] - Sorting options
   * @param {string} [sortOptions.sortBy='created_at'] - Column to sort by (e.g., 'name', 'created_at')
   * @param {'asc'|'desc'} [sortOptions.sortOrder='desc'] - Sort order
   * @param {Object} [paginationOptions={}] - Pagination options
   * @param {number} [paginationOptions.page=1] - Page number
   * @param {number} [paginationOptions.limit=10] - Items per page
   * @param {string[]} [paginationOptions.columns=['*']] - Columns to select
   * @returns {Promise<Object>} - Object containing `items` array and `pagination` info
   */
  async getFilteredFormations(filters = {}, sortOptions = {}, paginationOptions = {}) {
    const { tags, formation_type, searchQuery, userId } = filters;
    const { sortBy = 'created_at', sortOrder = 'desc' } = sortOptions;
    const { page = 1, limit = 10, columns = ['*'] } = paginationOptions;

    const allowedSortColumns = ['name', 'created_at', 'updated_at', 'formation_type'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = this.validateSortOrder(sortOrder); // Use base class validator

    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (tags && Array.isArray(tags) && tags.length > 0) {
      // Assumes tags is an array of strings
      // Use && operator (contains all) instead of ANY (contains any)? Let's use ANY for now.
      // GIN index on 'tags' supports this well.
      conditions.push(`tags @> $${paramIndex++}`); // Use @> for contains operator
      queryParams.push(tags);
    }

    if (formation_type) {
      conditions.push(`formation_type = $${paramIndex++}`);
      queryParams.push(formation_type);
    }

    if (searchQuery) {
      const searchPattern = `%${searchQuery.toLowerCase()}%`;
      conditions.push(`(
        LOWER(name) ILIKE $${paramIndex} OR 
        LOWER(brief_description) ILIKE $${paramIndex} OR 
        LOWER(detailed_description) ILIKE $${paramIndex}
      )`);
      queryParams.push(searchPattern);
      paramIndex++;
    }

    // Visibility filter (similar to drillService)
    const visibilityConditions = [
      "(visibility = 'public' OR visibility IS NULL)", // Treat NULL as public
      "visibility = 'unlisted'"
    ];
    if (userId) {
      visibilityConditions.push(`(visibility = 'private' AND created_by = $${paramIndex++})`);
      queryParams.push(userId);
    }
    conditions.push(`(${visibilityConditions.join(' OR ')})`);

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderByClause = `ORDER BY ${validSortBy} ${validSortOrder}, ${this.primaryKey} ${validSortOrder}`;
    const offset = (page - 1) * limit;

    try {
      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;
      const countResult = await db.query(countQuery, queryParams);
      const totalItems = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalItems / limit);

      // Get the actual items
      const safeColumns = Array.isArray(columns) && columns.length > 0 ? columns.map(col => `"${col}"`).join(', ') : '*';
      const itemsQuery = `
        SELECT ${safeColumns}
        FROM ${this.tableName}
        ${whereClause}
        ${orderByClause}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      const itemsResult = await db.query(itemsQuery, [...queryParams, limit, offset]);

      return {
        items: itemsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems,
          totalPages
        }
      };
    } catch (error) {
      console.error(`Error in FormationService.getFilteredFormations:`, error);
      throw error;
    }
  }
}

// Export a singleton instance of the service
export const formationService = new FormationService();