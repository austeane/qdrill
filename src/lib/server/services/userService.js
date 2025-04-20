import { BaseEntityService } from './baseEntityService.js';
import * as db from '$lib/server/db';
import { NotFoundError, DatabaseError, ForbiddenError, InternalServerError } from '$lib/server/errors';

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
      'id', 'name', 'email', 'image', 'email_verified'
    ]);
  }

  /**
   * Get user by email address
   * @param {string} email - User email
   * @returns {Promise<Object>} - User object
   * @throws {NotFoundError} If user not found
   * @throws {DatabaseError} On database error
   */
  async getUserByEmail(email) {
    try {
      const query = `
        SELECT * FROM users
        WHERE email = $1
      `;
      
      const result = await db.query(query, [email]);
      // Throw NotFoundError if no user found
      if (result.rows.length === 0) {
        throw new NotFoundError(`User with email ${email} not found`);
      }
      return result.rows[0];
    } catch (error) {
      // Re-throw NotFoundError
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error in getUserByEmail:', error);
      // Wrap others as DatabaseError
      throw new DatabaseError('Failed to retrieve user by email', error);
    }
  }

  /**
   * Get user's profile with related content
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User profile with drills, plans, votes, comments
   * @throws {NotFoundError} If user not found
   * @throws {DatabaseError} On database error
   */
  async getUserProfile(userId) {
    try {
      // Get user basic data using base method
      // getById will throw NotFoundError if user doesn't exist.
      const user = await this.getById(userId, ['id', 'name', 'email', 'image', 'email_verified']);
      // Map email_verified to camelCase if needed, though getById might not return it in this format
      // The direct query previously used aliasing: email_verified AS "emailVerified"
      // Base getById doesn't handle aliasing, so we adjust the result or modify getById.
      // Let's adjust here for now:
      const profileUser = {
        ...user,
        emailVerified: user.email_verified // Manually map if necessary
      };
      delete profileUser.email_verified; // Remove snake_case version

      // Now start transaction for related data
      return this.withTransaction(async (client) => {
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
            v.id,
            v.drill_id,
            v.practice_plan_id,
            v.vote,
            v.created_at,
            CASE 
              WHEN v.drill_id IS NOT NULL THEN 'drill' 
              WHEN v.practice_plan_id IS NOT NULL THEN 'practice_plan' 
            END AS type,
            COALESCE(d.name, pp.name) AS item_name
          FROM votes v
          LEFT JOIN drills d ON v.drill_id = d.id
          LEFT JOIN practice_plans pp ON v.practice_plan_id = pp.id
          WHERE v.user_id = $1
          ORDER BY v.created_at DESC
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
          user: profileUser, // Use the adjusted user object
          drills: drillsResult.rows,
          practicePlans: plansResult.rows,
          formations: formationsResult.rows,
          votes: votesResult.rows,
          comments: commentsResult.rows
        };
      });
    } catch (error) {
       // Re-throw NotFoundError from getById
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error(`Error fetching user profile for ID ${userId}:`, error);
      // Wrap other errors (DB errors during related data fetch) as DatabaseError
      throw new DatabaseError('Failed to retrieve user profile', error);
    }
  }

  /**
   * Check if user has admin role
   * @param {string} userRole - User role from session (Currently NOT populated - see auth.js callbacks)
   * @returns {Promise<boolean>} - True if user is admin
   */
  async isAdmin(userRole) {
    // TODO: Implement proper Role-Based Access Control (RBAC)
    // This requires:
    // 1. Adding a 'role' column to the 'users' table.
    // 2. Updating the session callback in 'src/lib/auth.js' to fetch and include the user's role.
    // 3. Updating this function to check session.user.role === 'admin'.
    // For now, disabling admin functionality by always returning false.
    return false;
    /*
    // Original implementation kept for reference:
    // Checks if the role provided (presumably from the session) is 'admin'
    // Assumes the role column exists in the users table and is populated in the session
    // return userRole === 'admin';
    */
    /*
    // Older hardcoded implementation:
    // try {
    //   const userExists = await this.exists(userId);
    //   if (!userExists) return false;
    //   const query = `SELECT email FROM users WHERE id = $1`;
    //   const result = await db.query(query, [userId]);
    //   if (result.rows.length === 0) return false;
    //   const adminEmails = ['admin@example.com']; // Hardcoded list
    //   return adminEmails.includes(result.rows[0].email);
    // } catch (error) {
    //   console.error('Error in isAdmin:', error);
    //   return false;
    // }
    */
  }

  /**
   * Check if user can perform a specific action on an entity
   * @param {string} userId - User ID (still needed for ownership checks)
   * @param {string} userRole - User Role from session
   * @param {string} action - Action type (view, edit, delete)
   * @param {string} entityType - Entity type (drill, practice_plan, formation)
   * @param {string|number} entityId - Entity ID
   * @returns {Promise<boolean>} - True if user can perform action
   */
  async canUserPerformAction(userId, userRole, action, entityType, entityId) {
    try {
      // If user is admin, they can do anything (assuming isAdmin works correctly)
      const isUserAdmin = await this.isAdmin(userRole);
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
        // Use InternalServerError for unmapped entity types
        throw new InternalServerError(`Unknown entity type provided: ${entityType}`);
      }

      // Fetch the entity data using a minimal query
      // This is needed for ownership and visibility checks.
      // This replaces the separate queries for view/edit/delete.
      let entity;
      try {
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
            // Throw NotFoundError if the entity doesn't exist
            throw new NotFoundError(`${entityType} with ID ${entityId} not found`);
          }
          entity = result.rows[0];
      } catch(dbError) {
          // Re-throw NotFoundError
          if (dbError instanceof NotFoundError) throw dbError;
          // Wrap other potential DB errors
          console.error(`Error fetching entity ${entityType} ${entityId} for permission check:`, dbError);
          throw new DatabaseError(`Failed to fetch ${entityType} for permission check`, dbError);
      }

      // Handle view action
      if (action === 'view') {
        // Public/Unlisted entities can be viewed by anyone
        if (entity.visibility === 'public' || entity.visibility === 'unlisted') {
          return true;
        }
        // Private entities can only be viewed by creator
        if (entity.created_by === userId) {
          return true;
        }
        // If none of the above, access is forbidden
        throw new ForbiddenError(`You do not have permission to view this ${entityType}`);
      }

      // Handle edit action
      if (action === 'edit') {
        // Can edit if creator or editable by others
        if (entity.created_by === userId || entity.is_editable_by_others === true) {
          return true;
        }
        // Otherwise, forbidden
        throw new ForbiddenError(`You do not have permission to edit this ${entityType}`);
      }

      // Handle delete action
      if (action === 'delete') {
        // Only creator can delete
        if (entity.created_by === userId) {
          return true;
        }
        // Otherwise, forbidden
        throw new ForbiddenError(`You do not have permission to delete this ${entityType}`);
      }

      // If action is unknown, throw an error
      throw new InternalServerError(`Unknown action type for permission check: ${action}`);

    } catch (error) {
      // Re-throw known AppErrors (NotFound, Forbidden, InternalServer)
      if (error instanceof NotFoundError || error instanceof ForbiddenError || error instanceof InternalServerError) {
          throw error;
      }
      // Log and wrap unexpected errors
      console.error(`Error in canUserPerformAction (${action} on ${entityType} ${entityId}):`, error);
      // Wrap as DatabaseError or InternalServerError depending on expected cause
      throw new InternalServerError(`Failed to check permission for ${action} on ${entityType}`, error);
    }
  }

  /**
   * Ensure a user row exists in the users table. If it doesn't, insert it using data
   * from Better‑Auth's session.
   * @param {{id:string,name?:string,email?:string,image?:string,emailVerified?:boolean}} userObj
   */
  async ensureUserExists(userObj) {
    if (!userObj?.id) return;

    const { id, name, email, image, emailVerified } = userObj;

    // Quick existence check
    const exists = await this.exists(id);
    if (exists) return;

    // Insert minimal row
    const insertQuery = `
      INSERT INTO users (id, name, email, image, email_verified)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO NOTHING
    `;

    try {
      await db.query(insertQuery, [id, name ?? null, email ?? null, image ?? null, emailVerified ? new Date() : null]);
      console.info('Inserted new user row for Better‑Auth id', id);
    } catch (err) {
      console.error('Failed to insert user row for', id, err);
      // Should this throw? If called during sign-in, maybe not critical,
      // but could cause issues later if user data is expected.
      // Let's wrap and throw DatabaseError for clarity.
      throw new DatabaseError('Failed to ensure user exists in database', err);
    }
  }
}

// Export a singleton instance of the service
export const userService = new UserService();