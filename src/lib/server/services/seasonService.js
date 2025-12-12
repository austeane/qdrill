import { BaseEntityService } from './baseEntityService.js';
import { ValidationError } from '$lib/server/errors.js';
import { teamMemberService } from './teamMemberService.js';

class SeasonService extends BaseEntityService {
	constructor() {
		super(
			'seasons',
			'id',
			[
				'id',
				'team_id',
				'name',
				'start_date',
				'end_date',
				'is_active',
				'template_practice_plan_id',
				'public_view_token',
				'ics_token',
				'created_at',
				'updated_at'
			],
			[
				'id',
				'team_id',
				'name',
				'start_date',
				'end_date',
				'is_active',
				'template_practice_plan_id',
				'public_view_token',
				'ics_token',
				'created_at',
				'updated_at'
			]
		);
	}

	async create(data, userId) {
		// Verify user is team admin
		const member = await teamMemberService.getMember(data.team_id, userId);
		if (!member || member.role !== 'admin') {
			throw new ValidationError('Only team admins can create seasons');
		}

		// Validate dates
		if (new Date(data.start_date) >= new Date(data.end_date)) {
			throw new ValidationError('Start date must be before end date');
		}

		// If setting as active, deactivate other seasons
		if (data.is_active) {
			await this.deactivateTeamSeasons(data.team_id);
		}

		return await super.create(data);
	}

	async update(id, data, userId) {
		const season = await this.getById(id);
		if (!season) {
			throw new ValidationError('Season not found');
		}

		// Verify user is team admin
		const member = await teamMemberService.getMember(season.team_id, userId);
		if (!member || member.role !== 'admin') {
			throw new ValidationError('Only team admins can update seasons');
		}

		// If setting as active, deactivate other seasons
		if (data.is_active && !season.is_active) {
			await this.deactivateTeamSeasons(season.team_id, id);
		}

		// Validate dates if provided
		if (data.start_date || data.end_date) {
			const startDate = data.start_date || season.start_date;
			const endDate = data.end_date || season.end_date;
			if (new Date(startDate) >= new Date(endDate)) {
				throw new ValidationError('Start date must be before end date');
			}
		}

		return await super.update(id, data);
	}

	async delete(id, userId) {
		const season = await this.getById(id);
		if (!season) {
			throw new ValidationError('Season not found');
		}

		// Verify user is team admin
		const member = await teamMemberService.getMember(season.team_id, userId);
		if (!member || member.role !== 'admin') {
			throw new ValidationError('Only team admins can delete seasons');
		}

		return await super.delete(id);
	}

	async getActiveSeason(teamId) {
		const result = await this.getAll({
			filters: { team_id: teamId, is_active: true },
			limit: 1
		});
		return result.items[0] || null;
	}

	async getTeamSeasons(teamId, userId) {
		// Verify user is team member
		const member = await teamMemberService.getMember(teamId, userId);
		if (!member) {
			throw new ValidationError('Only team members can view seasons');
		}

		const result = await this.getAll({
			filters: { team_id: teamId },
			sortBy: 'start_date',
			sortOrder: 'desc',
			all: true
		});

		return result.items;
	}

	async deactivateTeamSeasons(teamId, exceptId = null) {
		return await this.withTransaction(async (client) => {
			let query = `
        UPDATE seasons 
        SET is_active = false, updated_at = NOW()
        WHERE team_id = $1 AND is_active = true
      `;
			const params = [teamId];

			if (exceptId) {
				query += ' AND id != $2';
				params.push(exceptId);
			}

			await client.query(query, params);
		});
	}

	async setActiveSeason(seasonId, userId) {
		const season = await this.getById(seasonId);
		if (!season) {
			throw new ValidationError('Season not found');
		}

		// Verify user is team admin
		const member = await teamMemberService.getMember(season.team_id, userId);
		if (!member || member.role !== 'admin') {
			throw new ValidationError('Only team admins can activate seasons');
		}

		await this.deactivateTeamSeasons(season.team_id);
		return await super.update(seasonId, { is_active: true });
	}

	async rotatePublicToken(seasonId, userId) {
		const season = await this.getById(seasonId);
		if (!season) {
			throw new ValidationError('Season not found');
		}

		// Verify user is team admin
		const member = await teamMemberService.getMember(season.team_id, userId);
		if (!member || member.role !== 'admin') {
			throw new ValidationError('Only team admins can rotate tokens');
		}

		return await this.withTransaction(async (client) => {
			const query = `
        UPDATE seasons 
        SET public_view_token = gen_random_uuid(), updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
			const result = await client.query(query, [seasonId]);
			return result.rows[0];
		});
	}

	async rotateIcsToken(seasonId, userId) {
		const season = await this.getById(seasonId);
		if (!season) {
			throw new ValidationError('Season not found');
		}

		// Verify user is team admin
		const member = await teamMemberService.getMember(season.team_id, userId);
		if (!member || member.role !== 'admin') {
			throw new ValidationError('Only team admins can rotate tokens');
		}

		return await this.withTransaction(async (client) => {
			const query = `
        UPDATE seasons 
        SET ics_token = gen_random_uuid(), updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
			const result = await client.query(query, [seasonId]);
			return result.rows[0];
		});
	}

	async getByPublicToken(token) {
		const result = await this.getAll({
			filters: { public_view_token: token },
			limit: 1
		});
		return result.items[0] || null;
	}

	async getByIcsToken(token) {
		const result = await this.getAll({
			filters: { ics_token: token },
			limit: 1
		});
		return result.items[0] || null;
	}
}

export const seasonService = new SeasonService();
