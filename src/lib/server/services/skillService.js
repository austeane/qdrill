import { BaseEntityService } from './baseEntityService.js';
import { kyselyDb, sql } from '$lib/server/db';
import { DatabaseError, ValidationError, NotFoundError } from '$lib/server/errors';
import { upsertSkillCounts } from './skillSql.js';

/**
 * Service for managing skills
 * Extends the BaseEntityService with skill-specific functionality
 */
export class SkillService extends BaseEntityService {
	/**
	 * Creates a new SkillService
	 */
	constructor() {
		// Table name is 'skills', use an 'id' primary key for consistency with other tables.
		// The unique skill name is stored in the `skill` column.
		super(
			'skills',
			'skill',
			['skill', 'usage_count', 'drills_used_in'],
			['skill', 'usage_count', 'drills_used_in']
		);
	}

	/**
	 * Get all skills, ordered by usage count descending, then by name
	 * @param {Object} [options={}] - Options for pagination, filtering etc. (passed to base getAll)
	 * @returns {Promise<Object>} - Result object containing skills list and pagination info
	 */
	async getAllSkills(options = {}) {
		const defaultOptions = {
			sortBy: 'usage_count',
			sortOrder: 'desc'
		};
		const effectiveOptions = { ...defaultOptions, ...options };
		return await this.getAll(effectiveOptions);
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
			const result = await kyselyDb
				.insertInto('skills')
				.values({ skill: trimmedSkill, usage_count: 1, drills_used_in: 0 })
				.onConflict((oc) =>
					oc.column('skill').doUpdateSet({
						usage_count: sql`skills.usage_count + 1`
					})
				)
				.returning(['skill', 'usage_count', 'drills_used_in'])
				.executeTakeFirst();

			if (!result) {
				throw new DatabaseError('Failed to add or update skill in database, no rows returned.');
			}
			return result;
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
			const result = await kyselyDb
				.selectFrom('drills')
				.select('skills_focused_on')
				.where('id', '=', drillId)
				.executeTakeFirst();

			if (!result) {
				throw new NotFoundError(`Drill with ID ${drillId} not found when fetching skills.`);
			}

			return result.skills_focused_on || [];
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
			return await kyselyDb
				.selectFrom('skills')
				.select(['skill', 'drills_used_in', 'usage_count'])
				.orderBy('drills_used_in', 'desc')
				.orderBy('usage_count', 'desc')
				.limit(limit)
				.execute();
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
		return this.withTransaction(async (trx) => {
			// Add new skills
			if (skillsToAdd.length > 0) {
				await this.addSkillsToDatabase(skillsToAdd, drillId, trx);
			}

			// Remove skills no longer used
			if (skillsToRemove.length > 0) {
				for (const skill of skillsToRemove) {
					await trx
						.updateTable('skills')
						.set({ drills_used_in: sql`drills_used_in - 1` })
						.where('skill', '=', skill)
						.execute();
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
	async addSkillsToDatabase(skills, drillId, trx) {
		for (const skill of skills) {
			await upsertSkillCounts(trx, skill, drillId);
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
			return this.getMostUsedSkills(limit).then((skills) => skills.map((s) => s.skill));
		}

		try {
			const drills = await kyselyDb
				.selectFrom('drills')
				.select('id')
				.where(sql`skills_focused_on && ${currentSkills}::varchar[]`)
				.limit(100)
				.execute();

			if (drills.length === 0) {
				return [];
			}

			// Get drill IDs
			const drillIds = drills.map((row) => row.id);

			const skillsResult = await sql`
				SELECT skill, COUNT(*) as drill_count
				FROM (
					SELECT unnest(COALESCE(skills_focused_on, '{}'::varchar[])) as skill
					FROM drills
					WHERE id = ANY(${drillIds}::int[])
				) s
				WHERE NOT (skill = ANY(${currentSkills}::varchar[]))
				GROUP BY skill
				ORDER BY drill_count DESC
				LIMIT ${limit}
			`.execute(kyselyDb);

			return skillsResult.rows.map((row) => row.skill);
		} catch (error) {
			console.error('Error in getSkillRecommendations:', error);
			throw new DatabaseError('Failed to get skill recommendations', error);
		}
	}
}

// Export a singleton instance of the service
export const skillService = new SkillService();
