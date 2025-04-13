import { BaseEntityService } from './baseEntityService.js';
import * as db from '$lib/server/db';

/**
 * Service for managing users
 * Extends the BaseEntityService with user-specific functionality
 */
export class UserService extends BaseEntityService {
  /**
   * Creates a new UserService
   */
  constructor() {
    super('users', 'id', ['*'], [
      'id', 'name', 'email', 'image', 'emailVerified'
    ]);
  }

  /**
   * Get user by email address
   * @param {string} email - User email
   * @returns {Promise<Object>} - User object or null
   */
  async getUserByEmail(email) {
    try {
      const query = `
        SELECT * FROM users
        WHERE email = $1
      `;
      
      const result = await db.query(query, [email]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error in getUserByEmail:', error);
      throw error;
    }
  }

  /**
   * Get user's profile with related content
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User profile with drills, plans, votes, comments
   */
  async getUserProfile(userId) {
    return this.withTransaction(async (client) => {
      // Get user basic data
      const userQuery = `
        SELECT id, name, email, image, emailVerified 
        FROM users 
        WHERE id = $1
      `;
      
      const userResult = await client.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        return null;
      }
      
      const user = userResult.rows[0];
      
      // Get drills created by user
      const drillsQuery = `
        SELECT id, name, brief_description, date_created, 
               visibility, is_editable_by_others,
               (SELECT COUNT(*) FROM drills v WHERE v.parent_drill_id = d.id) as variation_count
        FROM drills d
        WHERE created_by = $1
        ORDER BY date_created DESC
      `;
      const drillsResult = await client.query(drillsQuery, [userId]);
      
      // Get practice plans created by user
      const plansQuery = `
        SELECT id, name, description, created_at, 
               visibility, is_editable_by_others
        FROM practice_plans 
        WHERE created_by = $1
        ORDER BY created_at DESC
      `;
      const plansResult = await client.query(plansQuery, [userId]);
      
      // Get formations created by user
      const formationsQuery = `
        SELECT id, name, brief_description, created_at,
               visibility, is_editable_by_others
        FROM formations
        WHERE created_by = $1
        ORDER BY created_at DESC
      `;
      const formationsResult = await client.query(formationsQuery, [userId]);
      
      // Get votes by user
      const votesQuery = `
        SELECT 
          id,
          drill_id,
          practice_plan_id,
          vote,
          created_at,
          CASE 
            WHEN drill_id IS NOT NULL THEN 'drill' 
            WHEN practice_plan_id IS NOT NULL THEN 'practice_plan' 
          END AS type,
          COALESCE(d.name, pp.name) AS item_name
        FROM votes v
        LEFT JOIN drills d ON v.drill_id = d.id
        LEFT JOIN practice_plans pp ON v.practice_plan_id = pp.id
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const votesResult = await client.query(votesQuery, [userId]);
      
      // Get comments by user
      const commentsQuery = `
        SELECT c.*, 
          CASE 
            WHEN c.drill_id IS NOT NULL THEN 'drill' 
            WHEN c.practice_plan_id IS NOT NULL THEN 'practice_plan' 
          END AS type,
          d.name AS drill_name,
          pp.name AS practice_plan_name
        FROM comments c 
        LEFT JOIN drills d ON c.drill_id = d.id 
        LEFT JOIN practice_plans pp ON c.practice_plan_id = pp.id 
        WHERE c.user_id = $1
        ORDER BY c.created_at DESC
      `;
      const commentsResult = await client.query(commentsQuery, [userId]);
      
      return {
        user,
        drills: drillsResult.rows,
        practicePlans: plansResult.rows,
        formations: formationsResult.rows,
        votes: votesResult.rows,
        comments: commentsResult.rows
      };
    });
  }

  /**
   * Check if user has admin role
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - True if user is admin
   */
  async isAdmin(userId) {
    try {
      // Check if user exists
      const userExists = await this.exists(userId);
      if (!userExists) {
        return false;
      }

      // This is a simple implementation that could be expanded later
      // to use a proper roles table or other authorization mechanism
      const query = `
        SELECT email FROM users WHERE id = $1
      `;
      
      const result = await db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return false;
      }
      
      // List of admin email addresses
      // In a production app, this would be stored in a database
      const adminEmails = [
        'admin@example.com',
        // Add other admin emails as needed
      ];
      
      return adminEmails.includes(result.rows[0].email);
    } catch (error) {
      console.error('Error in isAdmin:', error);
      return false;
    }
  }

  /**
   * Check if user can perform a specific action on an entity
   * @param {string} userId - User ID
   * @param {string} action - Action type (view, edit, delete)
   * @param {string} entityType - Entity type (drill, practice_plan, formation)
   * @param {string|number} entityId - Entity ID
   * @returns {Promise<boolean>} - True if user can perform action
   */
  async canUserPerformAction(userId, action, entityType, entityId) {
    try {
      // If user is admin, they can do anything
      const isUserAdmin = await this.isAdmin(userId);
      if (isUserAdmin) {
        return true;
      }

      // Map entity types to table names
      const tableMap = {
        'drill': 'drills',
        'practice_plan': 'practice_plans',
        'formation': 'formations'
      };
      
      const tableName = tableMap[entityType];
      if (!tableName) {
        return false;
      }
      
      // Handle view action
      if (action === 'view') {
        const query = `
          SELECT 
            id,
            created_by,
            visibility,
            is_editable_by_others
          FROM ${tableName}
          WHERE id = $1
        `;
        
        const result = await db.query(query, [entityId]);
        
        if (result.rows.length === 0) {
          return false;
        }
        
        const entity = result.rows[0];
        
        // Public entities can be viewed by anyone
        if (entity.visibility === 'public' || entity.visibility === 'unlisted') {
          return true;
        }
        
        // Private entities can only be viewed by creator
        return entity.created_by === userId;
      }
      
      // Handle edit and delete actions
      if (action === 'edit' || action === 'delete') {
        const query = `
          SELECT 
            id,
            created_by,
            is_editable_by_others
          FROM ${tableName}
          WHERE id = $1
        `;
        
        const result = await db.query(query, [entityId]);
        
        if (result.rows.length === 0) {
          return false;
        }
        
        const entity = result.rows[0];
        
        // For delete, only creator can perform this action
        if (action === 'delete') {
          return entity.created_by === userId;
        }
        
        // For edit, either creator or if the entity is editable by others
        return entity.created_by === userId || entity.is_editable_by_others === true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error in canUserPerformAction for ${action} on ${entityType}:`, error);
      return false;
    }
  }
}

// Export a singleton instance of the service
export const userService = new UserService();