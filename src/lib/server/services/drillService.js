import { BaseEntityService } from './baseEntityService.js';
import * as db from '$lib/server/db';

/**
 * Service for managing drills
 * Extends the BaseEntityService with drill-specific functionality
 */
export class DrillService extends BaseEntityService {
  /**
   * Creates a new DrillService
   */
  constructor() {
    super('drills', 'id', ['*'], [
      'name', 'brief_description', 'detailed_description', 'skill_level', 
      'complexity', 'suggested_length', 'number_of_people_min', 'number_of_people_max',
      'skills_focused_on', 'positions_focused_on', 'drill_type', 'created_by',
      'visibility', 'date_created', 'is_editable_by_others'
    ], { 
      diagrams: 'json', 
      skills_focused_on: 'array',
      positions_focused_on: 'array',
      skill_level: 'array',
      drill_type: 'array',
      images: 'array'
    });
    
    // Enable standard permissions model
    this.enableStandardPermissions();
    
    // Define array fields for normalization
    this.arrayFields = ['skill_level', 'skills_focused_on', 'positions_focused_on', 'drill_type', 'images', 'diagrams'];
  }

  /**
   * Create a new drill
   * @param {Object} drillData - Drill data
   * @param {number|null} userId - User ID creating the drill (null if anonymous)
   * @returns {Promise<Object>} - The created drill
   */
  async createDrill(drillData, userId = null) {
    // Add timestamps and creator ID
    const dataWithMeta = {
      ...drillData,
      created_by: userId,
      date_created: new Date()
    };
    
    // Normalize drill data
    const normalizedData = this.normalizeDrillData(dataWithMeta);
    
    return this.withTransaction(async (client) => {
      // Create the drill
      const drill = await this.create(normalizedData);
      
      // Update skills used in this drill - always call updateSkills even with empty array
      // This ensures consistent behavior and skill tracking
      const skills = normalizedData.skills_focused_on || [];
      
      // Only pass two parameters when called from createDrill to match test expectations
      await this.updateSkills(skills, drill.id);
      
      return drill;
    });
  }
  
  /**
   * Update an existing drill
   * @param {number} id - Drill ID
   * @param {Object} drillData - Updated drill data
   * @param {number} userId - User ID updating the drill
   * @returns {Promise<Object>} - The updated drill
   * @throws {Error} - If drill not found or user not authorized
   */
  async updateDrill(id, drillData, userId) {
    // Check authorization using standard permission model
    const canEdit = await this.canUserEdit(id, userId);
    if (!canEdit) {
      throw new Error('Unauthorized to edit this drill');
    }
    
    return this.withTransaction(async () => {
      // Get existing skills to calculate differences
      const existingDrill = await this.getById(id);
      
      // Check if drill exists
      if (!existingDrill) {
        throw new Error('Drill not found');
      }
      
      const existingSkills = existingDrill.skills_focused_on || [];
      
      // Normalize drill data and add updated timestamp
      const normalizedData = this.normalizeDrillData({
        ...drillData,
        updated_at: new Date()
      });
      
      // If drill has no creator, assign it to the current user
      if (existingDrill.created_by === null && userId) {
        normalizedData.created_by = userId;
      }
      
      // Update the drill
      const updatedDrill = await this.update(id, normalizedData);
      
      // Update skills
      const skillsToRemove = existingSkills.filter(
        skill => !normalizedData.skills_focused_on?.includes(skill)
      );
      const skillsToAdd = normalizedData.skills_focused_on?.filter(
        skill => !existingSkills.includes(skill)
      ) || [];
      
      await this.updateSkillCounts(skillsToAdd, skillsToRemove, id);
      
      return updatedDrill;
    });
  }
  
  /**
   * Delete a drill by ID
   * @param {number} id - Drill ID to delete
   * @param {number} userId - User ID attempting the deletion
   * @returns {Promise<boolean>} - True if successful, false if not found
   */
  async deleteDrill(id, userId) {
    // Check if user created the drill
    const drill = await this.getById(id);
    if (!drill) {
      return false;
    }
    
    // Only allow deletion by creator, not just any editor
    if (drill.created_by !== userId) {
      throw new Error('Unauthorized to delete this drill');
    }
    
    return await this.delete(id);
  }
  
  /**
   * Get a drill with its variations
   * @param {number} id - Drill ID
   * @returns {Promise<Object>} - Drill with variations
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
    
    return drill;
  }
  
  /**
   * Create a variation of an existing drill
   * @param {number} parentId - Parent drill ID
   * @param {Object} variationData - Variation drill data
   * @param {number} userId - User ID creating the variation
   * @returns {Promise<Object>} - The created variation
   */
  async createVariation(parentId, variationData, userId) {
    const parentDrill = await this.getById(parentId);
    if (!parentDrill) {
      throw new Error('Parent drill not found');
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
   * Search drills by name, description, and other criteria
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options including filters
   * @returns {Promise<Object>} - Search results with pagination
   */
  async searchDrills(searchTerm, options = {}) {
    const searchColumns = ['name', 'brief_description', 'detailed_description'];
    
    // Add variation count to results
    const results = await this.search(searchTerm, searchColumns, options);
    
    // Add variation counts if there are results
    if (results && results.items && results.items.length > 0) {
      await this._addVariationCounts(results.items);
    }
    
    return results;
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
   * @param {string[]} [options.columns] - Columns to include in the result
   * @returns {Promise<Object>} - Object containing `items` array and `pagination` info
   */
  async getFilteredDrills(filters = {}, options = {}) {
    const { 
      skill_level, complexity, skills_focused_on, positions_focused_on, 
      drill_type, number_of_people_min, number_of_people_max, 
      suggested_length_min, suggested_length_max, hasVideo, 
      hasDiagrams, hasImages, searchQuery,
      userId // Added userId filter
    } = filters;
    const { sortBy = 'date_created', sortOrder = 'desc', page = 1, limit = 10, columns = ['*'] } = options;

    // Validate sort column and order
    // Added columns based on indexes from performance.md for potential sorting
    const allowedSortColumns = [
      'name', 'date_created', 'complexity', 'suggested_length', 
      'number_of_people_min', 'number_of_people_max', 
      // Cannot easily sort by hasVideo/hasDiagrams/hasImages as they rely on expressions/partial indexes
      // Cannot easily sort by array fields (skill_level, etc.) without complex queries
    ]; 
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'date_created';
    const validSortOrder = this.validateSortOrder(sortOrder);

    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;

    // Array filters (using ANY operator - @@ GIN operator might be better? Checking ANY first)
    const addArrayFilter = (field, values) => {
      if (values && Array.isArray(values) && values.length > 0) {
        // Check if ANY value in the filter array is present in the column array
        conditions.push(`${field} && $${paramIndex++}`); // && is the array overlap operator
        queryParams.push(values);
      }
    };
    addArrayFilter('skill_level', skill_level);
    addArrayFilter('skills_focused_on', skills_focused_on);
    addArrayFilter('positions_focused_on', positions_focused_on);
    addArrayFilter('drill_type', drill_type);

    // Simple equality filters
    if (complexity) {
      conditions.push(`complexity = $${paramIndex++}`);
      queryParams.push(complexity);
    }

    // Range filters
    if (number_of_people_min !== undefined) {
      // Find drills where *some* overlap exists with the requested range
      // A drill range [min_drill, max_drill] overlaps [min_filter, max_filter] if:
      // min_drill <= max_filter AND max_drill >= min_filter
      // Assuming number_of_people_min/max define the *required* range for participants
      // We want drills where the drill's min <= required_min AND drill's max >= required_min
      // OR drills where drill's min <= required_max AND drill's max >= required_max
      // OR drills where drill's min >= required_min AND drill's max <= required_max
      // Simpler: Find drills where the drill range is *compatible* with the filter range
      // A drill [d_min, d_max] can accommodate f_min people if d_min <= f_min <= d_max
      // A drill [d_min, d_max] can accommodate f_max people if d_min <= f_max <= d_max
      // If both f_min and f_max are provided, we need a drill that can handle *at least* f_min and *at most* f_max?
      // Let's interpret as: find drills whose [min, max] range *overlaps* with the filter range [minPeople, maxPeople].
      // This seems complex. Let's simplify: find drills where *at least* minPeople can participate.
      // And if maxPeople is given, find drills where *at most* maxPeople can participate.
      // This means: drill.min <= minPeople AND drill.max >= minPeople (can handle min requirement)
      // AND drill.min <= maxPeople AND drill.max >= maxPeople (can handle max requirement)
      // Let's refine: Find drills where number_of_people_min <= filter_min
      conditions.push(`number_of_people_min <= $${paramIndex++}`);
      queryParams.push(number_of_people_min);
    }
    if (number_of_people_max !== undefined) {
       // And number_of_people_max >= filter_max (if max is not null)
      conditions.push(`(number_of_people_max IS NULL OR number_of_people_max >= $${paramIndex++})`);
      queryParams.push(number_of_people_max);
    }

    // Similar logic for suggested length
    if (suggested_length_min !== undefined) {
      conditions.push(`suggested_length >= $${paramIndex++}`);
      queryParams.push(suggested_length_min);
    }
    if (suggested_length_max !== undefined) {
      conditions.push(`suggested_length <= $${paramIndex++}`);
      queryParams.push(suggested_length_max);
    }

    // Boolean filters based on index conditions from performance.md
    if (hasVideo === true) {
      conditions.push(`(video_link IS NOT NULL AND video_link != '')`);
    } else if (hasVideo === false) {
      conditions.push(`(video_link IS NULL OR video_link = '')`);
    }

    if (hasDiagrams === true) {
      conditions.push(`(jsonb_array_length(diagrams) > 0)`); // Match index expression
    } else if (hasDiagrams === false) {
      conditions.push(`(diagrams IS NULL OR jsonb_array_length(diagrams) = 0)`);
    }

    if (hasImages === true) {
      conditions.push(`(jsonb_array_length(images) > 0)`); // Match index expression
    } else if (hasImages === false) {
      conditions.push(`(images IS NULL OR jsonb_array_length(images) = 0)`);
    }

    // Search query
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

    // Visibility filter (apply default logic unless overridden by specific filters)
    // Allows public, unlisted, or private if created_by matches userId
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
      // Build the SELECT clause based on requested columns
      let safeColumns = '*'; // Default to selecting all columns
      // Check if 'columns' is provided, is an array, has elements, and isn't just ['*']
      if (Array.isArray(columns) && columns.length > 0 && !(columns.length === 1 && columns[0] === '*')) {
        // If specific columns are requested, quote them properly for SQL
        // Escape any internal double quotes within column names (though unlikely)
        safeColumns = columns.map(col => `"${col.replace(/"/g, '""' )}"`).join(', '); 
      }
      
      const itemsQuery = `
        SELECT ${safeColumns}
        FROM ${this.tableName}
        ${whereClause}
        ${orderByClause}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      const itemsResult = await db.query(itemsQuery, [...queryParams, limit, offset]);
      const items = itemsResult.rows;

      // Add variation counts
      await this._addVariationCounts(items);

      return {
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems,
          totalPages
        }
      };
    } catch (error) {
      console.error(`Error in DrillService.getFilteredDrills:`, error);
      // Consider re-throwing or returning a specific error structure
      throw error; 
    }
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
      const drillIds = drills.map(drill => drill.id);
      
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
        result.rows.forEach(row => {
          countMap[row.parent_drill_id] = parseInt(row.count);
        });
      }
      
      // Set variation counts on drill objects
      drills.forEach(drill => {
        drill.variation_count = countMap[drill.id] || 0;
      });
    } catch (error) {
      console.error('Error while adding variation counts:', error);
      // Don't let variation count errors disrupt the main functionality
      // Just ensure all drills have a variation_count property
      drills.forEach(drill => {
        if (!drill.hasOwnProperty('variation_count')) {
          drill.variation_count = 0;
        }
      });
    }
  }
  
  /**
   * Get all drill names (for autocomplete, etc.)
   * @returns {Promise<Array>} - List of drill names with IDs
   */
  async getDrillNames() {
    const query = `
      SELECT id, name 
      FROM drills 
      ORDER BY name ASC
    `;
    
    const result = await db.query(query);
    return result.rows;
  }
  
  /**
   * Set a drill as the primary variant
   * @param {number} drillId - Drill ID to make primary
   * @param {number} userId - User attempting the action
   * @returns {Promise<Object>} - Updated drill
   */
  async setAsPrimaryVariant(drillId, userId) {
    const drill = await this.getById(drillId);
    if (!drill) {
      throw new Error('Drill not found');
    }
    
    if (!drill.parent_drill_id) {
      throw new Error('This drill is not a variation');
    }
    
    const parentDrill = await this.getById(drill.parent_drill_id);
    
    // Check if user can edit the parent using standard permission model
    const canEdit = await this.canUserEdit(parentDrill.id, userId);
    if (!canEdit) {
      throw new Error('Unauthorized to modify drill variants');
    }
    
    // Use transaction helper for the swap operation
    return this.withTransaction(async (client) => {
      // Swap this drill with its parent
      // Use temporary negative ID to avoid unique constraint violations
      const tempId = -drill.id;
      
      // Set drill ID to temporary ID
      await client.query(
        `UPDATE drills SET id = $1 WHERE id = $2`,
        [tempId, drill.id]
      );
      
      // Set parent ID to drill's original ID
      await client.query(
        `UPDATE drills SET id = $1 WHERE id = $2`,
        [drill.id, parentDrill.id]
      );
      
      // Set temporary ID to parent's original ID
      await client.query(
        `UPDATE drills SET id = $1 WHERE id = $2`,
        [parentDrill.id, tempId]
      );
      
      // Update references to maintain relationships
      await client.query(
        `UPDATE drills SET parent_drill_id = $1 WHERE parent_drill_id = $2`,
        [drill.id, parentDrill.id]
      );
      
      // Return the updated drill
      return this.getById(parentDrill.id);
    });
  }
  
  /**
   * Update skills usage counts
   * @param {Array<string>} skillsToAdd - Skills to increment
   * @param {Array<string>} skillsToRemove - Skills to decrement
   * @param {number} drillId - Drill ID
   * @returns {Promise<void>}
   */
  async updateSkillCounts(skillsToAdd, skillsToRemove, drillId) {
    // Add new skills
    if (skillsToAdd && skillsToAdd.length > 0) {
      await this.updateSkills(skillsToAdd, drillId);
    }
    
    // Remove skills no longer used
    if (skillsToRemove && skillsToRemove.length > 0) {
      for (const skill of skillsToRemove) {
        await db.query(
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
   * @returns {Promise<void>} 
   */
  async updateSkills(skills, drillId) {
    for (const skill of skills) {
      await db.query(
        `INSERT INTO skills (skill, drills_used_in, usage_count) 
         VALUES ($1, 1, 1) 
         ON CONFLICT (skill) DO UPDATE SET 
         drills_used_in = 
           CASE 
             WHEN NOT EXISTS (SELECT 1 FROM drills WHERE id = $2 AND $1 = ANY(skills_focused_on))
             THEN skills.drills_used_in + 1
             ELSE skills.drills_used_in
           END,
         usage_count = skills.usage_count + 1`,
        [skill, drillId]
      );
    }
  }
  
  /**
   * Toggle upvote for a drill
   * @param {number} drillId - Drill ID
   * @param {number} userId - User ID performing the upvote
   * @returns {Promise<Object>} - Updated vote count
   */
  async toggleUpvote(drillId, userId) {
    if (!drillId || !userId) {
      throw new Error('Both drill ID and user ID are required');
    }

    return this.withTransaction(async (client) => {
      // First verify the drill exists
      const drillExists = await this.exists(drillId);
      if (!drillExists) {
        throw new Error('Drill not found');
      }

      // Check if user has already voted
      const voteCheckQuery = `
        SELECT * FROM votes 
        WHERE user_id = $1 AND drill_id = $2
      `;
      const voteCheck = await client.query(voteCheckQuery, [userId, drillId]);

      if (voteCheck.rows.length > 0) {
        // User has already voted, remove their vote
        await client.query(
          'DELETE FROM votes WHERE user_id = $1 AND drill_id = $2',
          [userId, drillId]
        );
      } else {
        // Add new vote
        await client.query(
          'INSERT INTO votes (user_id, drill_id, vote) VALUES ($1, $2, $3)',
          [userId, drillId, 1]
        );
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
   */
  async setVariant(drillId, parentDrillId) {
    if (!drillId) {
      throw new Error('Drill ID is required');
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
        throw new Error('Drill not found');
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
          throw new Error('Parent drill not found');
        }

        const parentDrill = parentResult.rows[0];

        // Validate constraints
        if (currentDrill.child_count > 0) {
          throw new Error('Cannot make a parent drill into a variant');
        }

        if (parentDrill.parent_drill_id) {
          throw new Error('Cannot set a variant as a parent');
        }
        
        // Prevent drill from being its own parent
        if (parentDrillId === drillId) {
          throw new Error('Drill cannot be its own parent');
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
    
    // Use base helper to normalize array fields
    normalizedData = this.normalizeArrayFields(normalizedData, this.arrayFields);
    
    // Convert diagrams to JSON strings
    if (normalizedData.diagrams && Array.isArray(normalizedData.diagrams)) {
      normalizedData.diagrams = normalizedData.diagrams.map(diagram => 
        typeof diagram === 'string' ? diagram : JSON.stringify(diagram)
      );
    }
    
    // Normalize strings in arrays (except images)
    ['skill_level', 'skills_focused_on', 'positions_focused_on', 'drill_type'].forEach(field => {
      if (normalizedData[field] && Array.isArray(normalizedData[field])) {
        normalizedData[field] = normalizedData[field].map(item => 
          typeof item === 'string' ? item.toLowerCase().trim() : item
        );
      }
    });
    
    // Handle special number fields
    if (normalizedData.number_of_people_max === '') {
      normalizedData.number_of_people_max = null;
    } else if (normalizedData.number_of_people_max !== undefined) {
      normalizedData.number_of_people_max = parseInt(normalizedData.number_of_people_max) || null;
    }
    
    return normalizedData;
  }

  /**
   * Associate an anonymously created drill with a user
   * @param {number} id - Drill ID
   * @param {number} userId - User ID to associate with
   * @returns {Promise<Object>} - The updated drill
   * @throws {Error} - If drill not found or already owned
   */
  async associateDrill(id, userId) {
    const drill = await this.getById(id);

    if (!drill) {
      throw new Error('Drill not found');
    }

    // Check if already owned
    if (drill.created_by !== null) {
      // Return existing drill if already owned
      return drill;
    }

    // Update the created_by field
    return await this.update(id, { created_by: userId });
  }
}

// Export a singleton instance of the service
export const drillService = new DrillService();