import { BaseEntityService } from './baseEntityService.js';
import * as db from '$lib/server/db';
import { DatabaseError, ValidationError, NotFoundError } from '$lib/server/errors';

/**
 * Service for managing skills
 * Extends the BaseEntityService with skill-specific functionality
 */
export class SkillService extends BaseEntityService {
  /**
   * Creates a new SkillService
   */
  constructor() {
    // Table name is 'skills', primary key is 'skill' (assuming skill name is unique)
    // Selectable columns: skill, usage_count, drills_used_in
    // Writable columns: skill (only on create)
    super('skills', 'skill', 
      ['skill', 'usage_count', 'drills_used_in'], 
      ['skill', 'usage_count', 'drills_used_in']); // Added usage_count and drills_used_in
  }

  /**
   * Get all skills, ordered by usage count descending, then by name
   * @param {Object} [options={}] - Options for pagination, filtering etc. (passed to base getAll)
   * @returns {Promise<Object>} - Result object containing skills list and pagination info
   */
  async getAllSkills(options = {}) {
    // Default sort order specific to this method
    const defaultOptions = {
      all: true, // Fetch all skills by default for this method
      sortBy: 'usage_count', 
      sortOrder: 'desc',
      columns: ['skill', 'usage_count', 'drills_used_in']
    };
    // Merge provided options with defaults
    const effectiveOptions = { ...defaultOptions, ...options }; 

    // Use the base service's getAll method
    // Base service automatically adds primary key (skill) ASC as secondary sort if sortBy matches
    // Note: If sortBy is usage_count, secondary sort will be skill DESC. If primary ASC needed, modify base or keep custom query.
    // Since the original query used skill ASC, let's check if base service provides this secondary sort.
    // Base sorts by `primaryKey DESC` or `primaryKey ASC` depending on sortOrder. Here it will be `skill DESC`.
    // To match the original `skill ASC`, we might need to stick with the custom query or adjust base.
    // Let's stick with the custom query for now to ensure exact behavior match.
    try {
      const query = `
        SELECT skill, usage_count, drills_used_in 
        FROM skills 
        ORDER BY usage_count DESC, skill ASC
      `;
      const result = await db.query(query);
      // Return in a format consistent with base getAll if possible (though options are different)
      return { items: result.rows, pagination: null }; // Mimic { items: [], pagination: null } for `all: true`
    } catch (error) {
      console.error('Error fetching all skills:', error);
      throw new DatabaseError('Failed to fetch skills', error);
    }
  }

  /**
   * Add a new skill or increment its usage count if it exists.
   * Handles the logic previously in DrillForm.svelte's addSkill function.
   * @param {string} skillName - The name of the skill to add.
   * @returns {Promise<Object>} - The created or updated skill object.
   * @throws {ValidationError} If skillName is invalid
   * @throws {DatabaseError} On database error
   */
  async addOrIncrementSkill(skillName) {
    if (!skillName || typeof skillName !== 'string') {
      throw new ValidationError('Invalid skill name provided');
    }
    const trimmedSkill = skillName.trim();
    if (trimmedSkill === '') {
      throw new ValidationError('Skill name cannot be empty');
    }

    try {
      // Use ON CONFLICT to handle existing skills
      const query = `
        INSERT INTO skills (skill, usage_count, drills_used_in)
        VALUES ($1, 1, 0) 
        ON CONFLICT (skill) DO UPDATE SET
          usage_count = skills.usage_count + 1
        RETURNING skill, usage_count, drills_used_in;
      `;
      const result = await db.query(query, [trimmedSkill]);
      if (result.rows.length === 0) {
        throw new DatabaseError('Failed to add or update skill in database, no rows returned.');
      }
      return result.rows[0];
    } catch (error) {
      console.error(`Error adding or incrementing skill "${trimmedSkill}":`, error);
      // Check for specific DB errors if needed (e.g., constraints)
      throw new DatabaseError('Database error while saving skill', error);
    }
  }

  /**
   * Get skills for a specific drill
   * @param {number} drillId - Drill ID
   * @returns {Promise<Array<string>>} - Array of skill names
   */
  async getSkillsForDrill(drillId) {
    try {
      const query = `
        SELECT skills_focused_on
        FROM drills
        WHERE id = $1
      `;
      
      const result = await db.query(query, [drillId]);
      
      if (result.rows.length === 0) {
        throw new NotFoundError(`Drill with ID ${drillId} not found when fetching skills.`);
      }
      
      return result.rows[0].skills_focused_on || [];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error in getSkillsForDrill:', error);
      throw new DatabaseError('Failed to get skills for drill', error);
    }
  }

  /**
   * Get most frequently used skills
   * @param {number} limit - Maximum number of skills to return
   * @returns {Promise<Array<Object>>} - Array of skill objects with usage statistics
   */
  async getMostUsedSkills(limit = 10) {
    try {
      const query = `
        SELECT skill, drills_used_in, usage_count
        FROM skills
        ORDER BY drills_used_in DESC, usage_count DESC
        LIMIT $1
      `;
      
      const result = await db.query(query, [limit]);
      
      return result.rows;
    } catch (error) {
      console.error('Error in getMostUsedSkills:', error);
      throw new DatabaseError('Failed to get most used skills', error);
    }
  }

  /**
   * Update skill usage counts when drill skills change
   * @param {Array<string>} skillsToAdd - Skills to increment
   * @param {Array<string>} skillsToRemove - Skills to decrement
   * @param {number} drillId - Drill ID
   * @returns {Promise<void>}
   */
  async updateSkillCounts(skillsToAdd = [], skillsToRemove = [], drillId) {
    return this.withTransaction(async (client) => {
      // Add new skills
      if (skillsToAdd.length > 0) {
        await this.addSkillsToDatabase(skillsToAdd, drillId, client);
      }
      
      // Remove skills no longer used
      if (skillsToRemove.length > 0) {
        for (const skill of skillsToRemove) {
          await client.query(
            `UPDATE skills 
             SET drills_used_in = drills_used_in - 1 
             WHERE skill = $1`,
            [skill]
          );
        }
      }
    });
  }

  /**
   * Add skills to the database
   * @param {Array<string>} skills - Skills to add
   * @param {number} drillId - Drill ID
   * @param {Object} client - Database client for transaction
   * @returns {Promise<void>}
   * @private
   */
  async addSkillsToDatabase(skills, drillId, client) {
    for (const skill of skills) {
      await client.query(
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
   * Get skill recommendations based on related skills
   * @param {Array<string>} currentSkills - Currently selected skills
   * @param {number} limit - Maximum number of recommendations
   * @returns {Promise<Array<string>>} - Array of recommended skill names
   */
  async getSkillRecommendations(currentSkills = [], limit = 5) {
    if (!currentSkills.length) {
      return this.getMostUsedSkills(limit).then(skills => 
        skills.map(s => s.skill)
      );
    }
    
    try {
      // Find drills that use the current skills
      const query = `
        SELECT id
        FROM drills
        WHERE skills_focused_on && $1::varchar[]
        LIMIT 100
      `;
      
      const result = await db.query(query, [currentSkills]);
      
      if (result.rows.length === 0) {
        return [];
      }
      
      // Get drill IDs
      const drillIds = result.rows.map(row => row.id);
      
      // Find other skills used in these drills
      const skillsQuery = `
        SELECT DISTINCT unnest(skills_focused_on) as skill,
               COUNT(id) as drill_count
        FROM drills
        WHERE id = ANY($1)
        AND NOT (skills_focused_on && $2::varchar[])
        GROUP BY skill
        ORDER BY drill_count DESC
        LIMIT $3
      `;
      
      const skillsResult = await db.query(skillsQuery, [drillIds, currentSkills, limit]);
      
      return skillsResult.rows.map(row => row.skill);
    } catch (error) {
      console.error('Error in getSkillRecommendations:', error);
      throw new DatabaseError('Failed to get skill recommendations', error);
    }
  }
}

// Export a singleton instance of the service
export const skillService = new SkillService();