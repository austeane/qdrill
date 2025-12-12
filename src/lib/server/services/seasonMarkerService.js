import { BaseEntityService } from './baseEntityService.js';
import { ValidationError, ForbiddenError } from '$lib/server/errors.js';
import { teamMemberService } from './teamMemberService.js';
import { seasonService } from './seasonService.js';

class SeasonMarkerService extends BaseEntityService {
	constructor() {
		super(
			'season_markers',
			'id',
			[
				'id',
				'season_id',
				'type',
				'title',
				'notes',
				'start_date',
				'end_date',
				'color',
				'visible_to_members',
				'created_at',
				'updated_at'
			],
			[
				'id',
				'season_id',
				'type',
				'title',
				'notes',
				'start_date',
				'end_date',
				'color',
				'visible_to_members'
			]
		);
	}

	async create(data, userId) {
		// Verify user is team admin via season
		const season = await seasonService.getById(data.season_id);
		if (!season) {
			throw new ValidationError('Season not found');
		}

		const member = await teamMemberService.getMember(season.team_id, userId);
		if (!member || member.role !== 'admin') {
			throw new ForbiddenError('Only team admins can create season markers');
		}

		// Validate dates
		if (data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
			throw new ValidationError('Start date must be before or equal to end date');
		}

		// Check dates are within season bounds
		if (
			new Date(data.start_date) < new Date(season.start_date) ||
			(data.end_date && new Date(data.end_date) > new Date(season.end_date))
		) {
			throw new ValidationError('Marker dates must be within season dates');
		}

		return await super.create(data);
	}

	async update(id, data, userId) {
		const marker = await this.getById(id);
		if (!marker) {
			throw new ValidationError('Marker not found');
		}

		const season = await seasonService.getById(marker.season_id);

		// Verify user is team admin
		const member = await teamMemberService.getMember(season.team_id, userId);
		if (!member || member.role !== 'admin') {
			throw new ForbiddenError('Only team admins can update season markers');
		}

		// Validate dates if provided
		if (data.start_date || data.end_date) {
			const startDate = data.start_date || marker.start_date;
			const endDate = data.end_date || marker.end_date;

			if (endDate && new Date(startDate) > new Date(endDate)) {
				throw new ValidationError('Start date must be before or equal to end date');
			}

			if (
				new Date(startDate) < new Date(season.start_date) ||
				(endDate && new Date(endDate) > new Date(season.end_date))
			) {
				throw new ValidationError('Marker dates must be within season dates');
			}
		}

		return await super.update(id, data);
	}

	async delete(id, userId) {
		const marker = await this.getById(id);
		if (!marker) {
			throw new ValidationError('Marker not found');
		}

		const season = await seasonService.getById(marker.season_id);

		// Verify user is team admin
		const member = await teamMemberService.getMember(season.team_id, userId);
		if (!member || member.role !== 'admin') {
			throw new ForbiddenError('Only team admins can delete season markers');
		}

		return await super.delete(id);
	}

	async getSeasonMarkers(seasonId, userId = null) {
		const season = await seasonService.getById(seasonId);
		if (!season) {
			throw new ValidationError('Season not found');
		}

		// Check visibility permissions
		if (userId) {
			const member = await teamMemberService.getMember(season.team_id, userId);
			if (!member) {
				throw new ForbiddenError('Only team members can view season markers');
			}
		}

		const result = await this.getAll({
			filters: { season_id: seasonId },
			sortBy: 'start_date',
			sortOrder: 'asc',
			all: true
		});

		// Filter based on member visibility if not admin
		if (userId) {
			const member = await teamMemberService.getMember(season.team_id, userId);
			if (member && member.role !== 'admin') {
				result.items = result.items.filter((m) => m.visible_to_members);
			}
		}

		return result.items;
	}

	async getTimelineData(seasonId, userId = null) {
		const markers = await this.getSeasonMarkers(seasonId, userId);

		// Group markers by type for easier rendering
		return {
			tournaments: markers.filter((m) => m.type === 'tournament'),
			breaks: markers.filter((m) => m.type === 'break'),
			scrimmages: markers.filter((m) => m.type === 'scrimmage'),
			custom: markers.filter((m) => m.type === 'custom'),
			all: markers
		};
	}
}

export const seasonMarkerService = new SeasonMarkerService();
