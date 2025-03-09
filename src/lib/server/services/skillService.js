import { BaseEntityService } from './baseEntityService.js';
import * as db from '$lib/server/db';

/**
 * Service for managing skills
 * Extends the BaseEntityService with skill-specific functionality
 */
export class SkillService extends BaseEntityService {
  /**
   * Creates a new SkillService
   */
  constructor() {
    super('skills', 'id', ['*'], [
      'skill', 'drills_used_in', 'usage_count'
    ]);
  }

  /**
   * Get all skills with usage statistics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Skills with usage statistics
   */
  async getAllSkills(options = {}) {
    try {
      const result = await this.getAll({
        ...options,
        sortBy: options.sortBy || 'usage_count',
        sortOrder: options.sortOrder || 'desc'
      });
      
      return result;
    } catch (error) {
      console.error('Error in getAllSkills:', error);
      throw error;
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
        return [];
      }
      
      return result.rows[0].skills_focused_on || [];
    } catch (error) {
      console.error('Error in getSkillsForDrill:', error);
      throw error;
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
      throw error;
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
      throw error;
    }
  }
}

// Export a singleton instance of the service
export const skillService = new SkillService();