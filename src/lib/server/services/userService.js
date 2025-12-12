import { BaseEntityService } from './baseEntityService.js';
import { kyselyDb, sql } from '$lib/server/db';
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
			const result = await kyselyDb
				.selectFrom('users')
				.selectAll()
				.where('email', '=', email)
				.executeTakeFirst();
			if (!result) {
				throw new NotFoundError(`User with email ${email} not found`);
			}
			return result;
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
			return this.withTransaction(async (trx) => {
				const drillsResult = await trx
					.selectFrom('drills as d')
					.select([
						'd.id',
						'd.name',
						'd.brief_description',
						'd.date_created',
						'd.visibility',
						'd.is_editable_by_others'
					])
					.select(
						sql`(SELECT COUNT(*) FROM drills v WHERE v.parent_drill_id = d.id)`.as(
							'variation_count'
						)
					)
					.where('d.created_by', '=', userId)
					.orderBy('d.date_created', 'desc')
					.limit(limit)
					.offset(offset)
					.execute();

				const plansResult = await trx
					.selectFrom('practice_plans')
					.select([
						'id',
						'name',
						'description',
						'created_at',
						'visibility',
						'is_editable_by_others'
					])
					.where('created_by', '=', userId)
					.orderBy('created_at', 'desc')
					.limit(limit)
					.offset(offset)
					.execute();

				const formationsResult = await trx
					.selectFrom('formations')
					.select([
						'id',
						'name',
						'brief_description',
						'created_at',
						'visibility',
						'is_editable_by_others'
					])
					.where('created_by', '=', userId)
					.orderBy('created_at', 'desc')
					.limit(limit)
					.offset(offset)
					.execute();

				const votesResult = await trx
					.selectFrom('votes as v')
					.leftJoin('drills as d', 'v.drill_id', 'd.id')
					.leftJoin('practice_plans as pp', 'v.practice_plan_id', 'pp.id')
					.select([
						'v.id',
						'v.drill_id',
						'v.practice_plan_id',
						'v.vote',
						'v.created_at',
						sql`CASE
							WHEN v.drill_id IS NOT NULL THEN 'drill'
							WHEN v.practice_plan_id IS NOT NULL THEN 'practice_plan'
						END`.as('type'),
						sql`COALESCE(d.name, pp.name)`.as('item_name')
					])
					.where('v.user_id', '=', userId)
					.orderBy('v.created_at', 'desc')
					.limit(limit)
					.offset(offset)
					.execute();

				const commentsResult = await trx
					.selectFrom('comments as c')
					.leftJoin('drills as d', 'c.drill_id', 'd.id')
					.leftJoin('practice_plans as pp', 'c.practice_plan_id', 'pp.id')
					.selectAll('c')
					.select([
						sql`CASE
							WHEN c.drill_id IS NOT NULL THEN 'drill'
							WHEN c.practice_plan_id IS NOT NULL THEN 'practice_plan'
						END`.as('type'),
						'd.name as drill_name',
						'pp.name as practice_plan_name'
					])
					.where('c.user_id', '=', userId)
					.orderBy('c.created_at', 'desc')
					.limit(limit)
					.offset(offset)
					.execute();

				return {
					user: profileUser, // Use the adjusted user object
					drills: drillsResult,
					practicePlans: plansResult,
					formations: formationsResult,
					votes: votesResult,
					comments: commentsResult
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
		} catch {
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
			const result = await kyselyDb
				.updateTable('users')
				.set({ role })
				.where('id', '=', userId)
				.returning(['id', 'name', 'email', 'role'])
				.executeTakeFirst();

			if (!result) {
				throw new NotFoundError(`User with ID ${userId} not found`);
			}

			console.info(`User ${userId} role updated to ${role}`);
			return result;
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

		try {
			await kyselyDb
				.insertInto('users')
				.values({
					id,
					name: name ?? null,
					email: email ?? null,
					image: image ?? null,
					email_verified: emailVerified ? new Date() : null,
					role
				})
				.onConflict((oc) => oc.column('id').doNothing())
				.execute();
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
