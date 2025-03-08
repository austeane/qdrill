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
      
      // Update skills used in this drill
      if (normalizedData.skills_focused_on && normalizedData.skills_focused_on.length > 0) {
        await this.updateSkills(normalizedData.skills_focused_on, drill.id, client);
      }
      
      return drill;
    });
  }
  
  /**
   * Update an existing drill
   * @param {number} id - Drill ID
   * @param {Object} drillData - Updated drill data
   * @param {number} userId - User ID updating the drill
   * @returns {Promise<Object>} - The updated drill
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
   * Get drills with advanced filtering
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Additional options like pagination
   * @returns {Promise<Object>} - Filtered drills with pagination
   */
  async getFilteredDrills(filters = {}, options = {}) {
    // Transform any array-based filter parameters
    const transformedFilters = { ...filters };
    
    // Get drills with filter parameters
    const results = await this.getAll({
      ...options,
      filters: transformedFilters
    });
    
    // Add variation counts if there are results
    if (results && results.items && results.items.length > 0) {
      await this._addVariationCounts(results.items);
    }
    
    return results;
  }
  
  /**
   * Helper method to add variation counts to an array of drills
   * @param {Array<Object>} drills - Array of drill objects
   * @returns {Promise<void>}
   * @private
   */
  async _addVariationCounts(drills) {
    if (!drills || !drills.length) return;
    
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
    result.rows.forEach(row => {
      countMap[row.parent_drill_id] = parseInt(row.count);
    });
    
    // Set variation counts on drill objects
    drills.forEach(drill => {
      drill.variation_count = countMap[drill.id] || 0;
    });
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
}

// Export a singleton instance of the service
export const drillService = new DrillService();