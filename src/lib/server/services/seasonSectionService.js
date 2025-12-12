import { BaseEntityService } from './baseEntityService.js';
import { ValidationError, ForbiddenError } from '$lib/server/errors.js';
import { teamMemberService } from './teamMemberService.js';
import { seasonService } from './seasonService.js';

class SeasonSectionService extends BaseEntityService {
	constructor() {
		super(
			'season_sections',
			'id',
			[
				'id',
				'season_id',
				'name',
				'start_date',
				'end_date',
				'notes',
				'overview_visible_to_members',
				'display_order',
				'color',
				'created_at',
				'updated_at'
			],
			[
				'id',
				'season_id',
				'name',
				'start_date',
				'end_date',
				'notes',
				'overview_visible_to_members',
				'display_order',
				'color'
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
			throw new ForbiddenError('Only team admins can create season sections');
		}

		// Validate dates
		if (new Date(data.start_date) > new Date(data.end_date)) {
			throw new ValidationError('Start date must be before or equal to end date');
		}

		// Check dates are within season bounds
		if (
			new Date(data.start_date) < new Date(season.start_date) ||
			new Date(data.end_date) > new Date(season.end_date)
		) {
			throw new ValidationError('Section dates must be within season dates');
		}

		// Auto-assign display order
		if (data.display_order === undefined) {
			const existing = await this.getSeasonSections(data.season_id);
			data.display_order = existing.length;
		}

		return await super.create(data);
	}

	async update(id, data, userId) {
		const section = await this.getById(id);
		if (!section) {
			throw new ValidationError('Section not found');
		}

		const season = await seasonService.getById(section.season_id);

		// Verify user is team admin
		const member = await teamMemberService.getMember(season.team_id, userId);
		if (!member || member.role !== 'admin') {
			throw new ForbiddenError('Only team admins can update season sections');
		}

		// Validate dates if provided
		if (data.start_date || data.end_date) {
			const startDate = data.start_date || section.start_date;
			const endDate = data.end_date || section.end_date;

			if (new Date(startDate) > new Date(endDate)) {
				throw new ValidationError('Start date must be before or equal to end date');
			}

			if (
				new Date(startDate) < new Date(season.start_date) ||
				new Date(endDate) > new Date(season.end_date)
			) {
				throw new ValidationError('Section dates must be within season dates');
			}
		}

		return await super.update(id, data);
	}

	async delete(id, userId) {
		const section = await this.getById(id);
		if (!section) {
			throw new ValidationError('Section not found');
		}

		const season = await seasonService.getById(section.season_id);

		// Verify user is team admin
		const member = await teamMemberService.getMember(season.team_id, userId);
		if (!member || member.role !== 'admin') {
			throw new ForbiddenError('Only team admins can delete season sections');
		}

		return await super.delete(id);
	}

	async getSeasonSections(seasonId, userId = null) {
		const season = await seasonService.getById(seasonId);
		if (!season) {
			throw new ValidationError('Season not found');
		}

		// Check visibility permissions
		if (userId) {
			const member = await teamMemberService.getMember(season.team_id, userId);
			if (!member) {
				throw new ForbiddenError('Only team members can view season sections');
			}
		}

		const result = await this.getAll({
			filters: { season_id: seasonId },
			sortBy: 'display_order',
			sortOrder: 'asc',
			all: true
		});

		// Filter based on member visibility if not admin
		if (userId) {
			const member = await teamMemberService.getMember(season.team_id, userId);
			if (member && member.role !== 'admin') {
				result.items = result.items.filter((s) => s.overview_visible_to_members);
			}
		}

		return result.items;
	}

	async getSectionWithDefaults(sectionId, userId = null) {
		const section = await this.getById(sectionId);
		if (!section) {
			throw new ValidationError('Section not found');
		}

		const season = await seasonService.getById(section.season_id);

		// Check permissions
		if (userId) {
			const member = await teamMemberService.getMember(season.team_id, userId);
			if (!member) {
				throw new ForbiddenError('Only team members can view section details');
			}

			if (member.role !== 'admin' && !section.overview_visible_to_members) {
				throw new ForbiddenError('This section is not visible to members');
			}
		}

		// Get default sections and linked drills
		const defaultSections = await this.getDefaultSections(sectionId);
		const linkedDrills = await this.getLinkedDrills(sectionId);

		return {
			...section,
			defaultSections,
			linkedDrills
		};
	}

	async getDefaultSections(sectionId) {
		return await this.withTransaction(async (client) => {
			const query = `
        SELECT * FROM season_section_default_sections
        WHERE season_section_id = $1
        ORDER BY "order" ASC
      `;
			const result = await client.query(query, [sectionId]);
			return result.rows;
		});
	}

	async setDefaultSections(sectionId, sections, userId) {
		const section = await this.getById(sectionId);
		if (!section) {
			throw new ValidationError('Section not found');
		}

		const season = await seasonService.getById(section.season_id);

		// Verify admin
		const member = await teamMemberService.getMember(season.team_id, userId);
		if (!member || member.role !== 'admin') {
			throw new ForbiddenError('Only team admins can set default sections');
		}

		return await this.withTransaction(async (client) => {
			// Delete existing
			await client.query(
				'DELETE FROM season_section_default_sections WHERE season_section_id = $1',
				[sectionId]
			);

			// Insert new
			for (let i = 0; i < sections.length; i++) {
				const section = sections[i];
				const query = `
          INSERT INTO season_section_default_sections 
          (season_section_id, section_name, "order", goals, notes)
          VALUES ($1, $2, $3, $4, $5)
        `;
				await client.query(query, [
					sectionId,
					section.section_name,
					section.order ?? i,
					JSON.stringify(section.goals || []),
					section.notes || null
				]);
			}

			// Return updated list
			const result = await client.query(
				'SELECT * FROM season_section_default_sections WHERE season_section_id = $1 ORDER BY "order"',
				[sectionId]
			);
			return result.rows;
		});
	}

	async getLinkedDrills(sectionId) {
		return await this.withTransaction(async (client) => {
			const query = `
        SELECT 
          ssd.*,
          d.name as drill_name,
          d.brief_description as drill_description,
          f.name as formation_name,
          f.brief_description as formation_description,
          ssds.section_name as default_section_name
        FROM season_section_drills ssd
        LEFT JOIN drills d ON ssd.drill_id = d.id
        LEFT JOIN formations f ON ssd.formation_id = f.id
        LEFT JOIN season_section_default_sections ssds ON ssd.default_section_id = ssds.id
        WHERE ssd.season_section_id = $1
        ORDER BY ssd.order_in_section ASC
      `;
			const result = await client.query(query, [sectionId]);
			return result.rows;
		});
	}

	async setLinkedDrills(sectionId, drills, userId) {
		const section = await this.getById(sectionId);
		if (!section) {
			throw new ValidationError('Section not found');
		}

		const season = await seasonService.getById(section.season_id);

		// Verify admin
		const member = await teamMemberService.getMember(season.team_id, userId);
		if (!member || member.role !== 'admin') {
			throw new ForbiddenError('Only team admins can set linked drills');
		}

		return await this.withTransaction(async (client) => {
			// Delete existing
			await client.query('DELETE FROM season_section_drills WHERE season_section_id = $1', [
				sectionId
			]);

			// Insert new
			for (let i = 0; i < drills.length; i++) {
				const drill = drills[i];

				// Validate type and references
				if (drill.type === 'drill' && !drill.drill_id) {
					throw new ValidationError(`Drill at position ${i} requires drill_id`);
				}
				if (drill.type === 'formation' && !drill.formation_id) {
					throw new ValidationError(`Formation at position ${i} requires formation_id`);
				}

				const query = `
          INSERT INTO season_section_drills 
          (season_section_id, type, drill_id, formation_id, name, 
           default_duration_minutes, order_in_section, default_section_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
				await client.query(query, [
					sectionId,
					drill.type,
					drill.drill_id || null,
					drill.formation_id || null,
					drill.name || null,
					drill.default_duration_minutes || 30,
					drill.order_in_section ?? i,
					drill.default_section_id || null
				]);
			}

			// Return updated list with joins
			return await this.getLinkedDrills(sectionId);
		});
	}

	async reorderSections(seasonId, sectionIds, userId) {
		const season = await seasonService.getById(seasonId);
		if (!season) {
			throw new ValidationError('Season not found');
		}

		// Verify admin
		const member = await teamMemberService.getMember(season.team_id, userId);
		if (!member || member.role !== 'admin') {
			throw new ForbiddenError('Only team admins can reorder sections');
		}

		return await this.withTransaction(async (client) => {
			for (let i = 0; i < sectionIds.length; i++) {
				await client.query(
					'UPDATE season_sections SET display_order = $1 WHERE id = $2 AND season_id = $3',
					[i, sectionIds[i], seasonId]
				);
			}
		});
	}
}

export const seasonSectionService = new SeasonSectionService();
