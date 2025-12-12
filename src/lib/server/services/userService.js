import { BaseEntityService } from './baseEntityService.js';
import * as db from '$lib/server/db';
import {
	NotFoundError,
	DatabaseError,
	ValidationError
} from '$lib/server/errors';

/**
 * Service for managing users
 * Extends the BaseEntityService with user-specific functionality
 */
export class UserService extends BaseEntityService {
	/**
	 * Creates a new UserService
	 */
	constructor() {
		super('users', 'id', ['*'], ['id', 'name', 'email', 'image', 'email_verified', 'role']);
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
	async getUserProfile(userId, { limit = 10, offset = 0 } = {}) {
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
          LIMIT $2 OFFSET $3
        `;
				const drillsResult = await client.query(drillsQuery, [userId, limit, offset]);

				// Get practice plans created by user
				const plansQuery = `
          SELECT id, name, description, created_at,
                 visibility, is_editable_by_others
          FROM practice_plans
          WHERE created_by = $1
          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `;
				const plansResult = await client.query(plansQuery, [userId, limit, offset]);

				// Get formations created by user
				const formationsQuery = `
          SELECT id, name, brief_description, created_at,
                 visibility, is_editable_by_others
          FROM formations
          WHERE created_by = $1
          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `;
				const formationsResult = await client.query(formationsQuery, [userId, limit, offset]);

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
          LIMIT $2 OFFSET $3
        `;
				const votesResult = await client.query(votesQuery, [userId, limit, offset]);

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
          LIMIT $2 OFFSET $3
        `;
				const commentsResult = await client.query(commentsQuery, [userId, limit, offset]);

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
	 * @param {string} userId - User ID to check
	 * @returns {Promise<boolean>} - True if user is admin
	 */
	async isAdmin(userId) {
		try {
			const user = await this.getById(userId, ['role']);
			return user.role === 'admin';
		} catch (error) {
			// If user not found or error, they're not admin
			return false;
		}
	}

	/**
	 * Set user role
	 * @param {string} userId - User ID
	 * @param {string} role - New role (user or admin)
	 * @returns {Promise<Object>} - Updated user object
	 * @throws {ValidationError} If role is invalid
	 * @throws {NotFoundError} If user not found
	 * @throws {DatabaseError} On database error
	 */
	async setUserRole(userId, role) {
		// Validate role
		const validRoles = ['user', 'admin'];
		if (!validRoles.includes(role)) {
			throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
		}

		try {
			const query = `
				UPDATE users 
				SET role = $1 
				WHERE id = $2 
				RETURNING id, name, email, role
			`;
			const result = await db.query(query, [role, userId]);

			if (result.rows.length === 0) {
				throw new NotFoundError(`User with ID ${userId} not found`);
			}

			console.info(`User ${userId} role updated to ${role}`);
			return result.rows[0];
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error;
			}
			console.error('Error setting user role:', error);
			throw new DatabaseError('Failed to update user role', error);
		}
	}

	/**
	 * Ensure a user row exists in the users table. If it doesn't, insert it using data
	 * from Better‑Auth's session.
	 * @param {{id:string,name?:string,email?:string,image?:string,emailVerified?:boolean}} userObj
	 */
	async ensureUserExists(userObj) {
		if (!userObj?.id) return;

		const { id, name, email, image, emailVerified, role = 'user' } = userObj;

		// Quick existence check
		const exists = await this.exists(id);
		if (exists) return;

		// Insert minimal row
		const insertQuery = `
      INSERT INTO users (id, name, email, image, email_verified, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
    `;

		try {
			await db.query(insertQuery, [
				id,
				name ?? null,
				email ?? null,
				image ?? null,
				emailVerified ? new Date() : null,
				role
			]);
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
