import { BaseEntityService } from './baseEntityService.js';
import { kyselyDb } from '$lib/server/db.js';
import { seasonUnionService } from './seasonUnionService.js';
import { seasonMarkerService } from './seasonMarkerService.js';

/**
 * Service for managing practice recurrence patterns
 */
class RecurrenceService extends BaseEntityService {
	constructor() {
		super(
			'season_recurrences',
			'id',
			[
				'id',
				'season_id',
				'team_id',
				'name',
				'pattern',
				'day_of_week',
				'day_of_month',
				'time_of_day',
				'duration_minutes',
				'template_plan_id',
				'skip_dates',
				'skip_markers',
				'is_active',
				'created_by',
				'created_at',
				'updated_at'
			],
			[
				'id',
				'season_id',
				'team_id',
				'name',
				'pattern',
				'day_of_week',
				'day_of_month',
				'time_of_day',
				'duration_minutes',
				'template_plan_id',
				'skip_dates',
				'skip_markers',
				'is_active',
				'created_by',
				'created_at',
				'updated_at'
			]
		);
	}

	/**
	 * Create a new recurrence pattern
	 */
	async create(data, userId) {
		const recurrence = await super.create({
			...data,
			created_by: userId
		});
		return recurrence;
	}

	/**
	 * Get all recurrence patterns for a season
	 */
	async getBySeasonId(seasonId) {
		return await kyselyDb
			.selectFrom('season_recurrences as r')
			.leftJoin('practice_plans as pp', 'r.template_plan_id', 'pp.id')
			.leftJoin('users as u', 'r.created_by', 'u.id')
			.selectAll('r')
			.select(['pp.name as template_name', 'u.name as created_by_name'])
			.where('r.season_id', '=', seasonId)
			.orderBy('r.created_at', 'desc')
			.execute();
	}

	/**
	 * Generate dates based on recurrence pattern
	 */
	generateDatesFromPattern(recurrence, startDate, endDate) {
		const dates = [];
		const parseLocalDate = (value) => {
			if (value instanceof Date) {
				return new Date(value.getFullYear(), value.getMonth(), value.getDate());
			}
			if (typeof value === 'string') {
				const parts = value.split('-').map((p) => parseInt(p, 10));
				if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
					const [y, m, d] = parts;
					return new Date(y, m - 1, d);
				}
			}
			return new Date(value);
		};

		const current = parseLocalDate(startDate);
		const end = parseLocalDate(endDate);

		switch (recurrence.pattern) {
			case 'weekly':
				// Generate weekly dates for specified days of week
				while (current <= end) {
					const dayOfWeek = current.getDay();
					if (recurrence.day_of_week && recurrence.day_of_week.includes(dayOfWeek)) {
						dates.push(new Date(current));
					}
					current.setDate(current.getDate() + 1);
				}
				break;

				case 'biweekly':
					// Generate biweekly dates for specified days
					while (current <= end) {
						const dayOfWeek = current.getDay();
						const weekNumber = Math.floor(
						(current - new Date(startDate)) / (7 * 24 * 60 * 60 * 1000)
					);
					if (
						weekNumber % 2 === 0 &&
						recurrence.day_of_week &&
						recurrence.day_of_week.includes(dayOfWeek)
					) {
						dates.push(new Date(current));
					}
					current.setDate(current.getDate() + 1);
				}
				break;

			case 'monthly':
				// Generate monthly dates for specified days of month
				while (current <= end) {
					const dayOfMonth = current.getDate();
					if (recurrence.day_of_month && recurrence.day_of_month.includes(dayOfMonth)) {
						dates.push(new Date(current));
					}
					current.setDate(current.getDate() + 1);
				}
				break;

			case 'custom':
				// Custom pattern - would need specific implementation
				break;
		}

		// Filter out skip dates
		if (recurrence.skip_dates && recurrence.skip_dates.length > 0) {
			const toLocalISO = (d) => {
				const year = d.getFullYear();
				const month = String(d.getMonth() + 1).padStart(2, '0');
				const day = String(d.getDate()).padStart(2, '0');
				return `${year}-${month}-${day}`;
			};
			const skipSet = new Set(recurrence.skip_dates.map((d) => toLocalISO(parseLocalDate(d))));
			return dates.filter((date) => !skipSet.has(toLocalISO(date)));
		}

		return dates;
	}

	/**
	 * Preview practice generation without creating
	 */
	async previewGeneration(recurrenceId, startDate, endDate) {
		const recurrence = await this.getById(recurrenceId);
		if (!recurrence) {
			throw new Error('Recurrence pattern not found');
		}

		const dates = this.generateDatesFromPattern(recurrence, startDate, endDate);

		// Check for existing practices and markers
		const existingResult = await kyselyDb
			.selectFrom('practice_plans')
			.select('scheduled_date')
			.where('season_id', '=', recurrence.season_id)
			.where('scheduled_date', '>=', startDate)
			.where('scheduled_date', '<=', endDate)
			.execute();
		const existingDates = new Set(existingResult.map((r) => r.scheduled_date));

		// Check for markers if skip_markers is true
		let markerDates = new Set();
		if (recurrence.skip_markers) {
			const markers = await seasonMarkerService.getSeasonMarkers(recurrence.season_id);
			markers.forEach((marker) => {
				const start = new Date(marker.start_date);
				const end = marker.end_date ? new Date(marker.end_date) : start;
				const toLocalISO = (d) => {
					const year = d.getFullYear();
					const month = String(d.getMonth() + 1).padStart(2, '0');
					const day = String(d.getDate()).padStart(2, '0');
					return `${year}-${month}-${day}`;
				};
				for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
					markerDates.add(toLocalISO(d));
				}
			});
		}

		// Build preview
		const preview = dates.map((date) => {
			const toLocalISO = (d) => {
				const year = d.getFullYear();
				const month = String(d.getMonth() + 1).padStart(2, '0');
				const day = String(d.getDate()).padStart(2, '0');
				return `${year}-${month}-${day}`;
			};
			const dateStr = toLocalISO(date);
			const status = {
				date: dateStr,
				day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
				willCreate: true,
				skipReason: null
			};

			if (existingDates.has(dateStr)) {
				status.willCreate = false;
				status.skipReason = 'Practice already exists';
			} else if (markerDates.has(dateStr)) {
				status.willCreate = false;
				status.skipReason = 'Marker/event on this date';
			}

			return status;
		});

		return {
			recurrence,
			totalDates: dates.length,
			willCreate: preview.filter((p) => p.willCreate).length,
			willSkip: preview.filter((p) => !p.willCreate).length,
			preview
		};
	}

	/**
	 * Batch generate practices based on recurrence pattern
	 */
	async batchGenerate(recurrenceId, startDate, endDate, userId, teamId) {
			const recurrence = await this.getById(recurrenceId);
			if (!recurrence) {
				throw new Error('Recurrence pattern not found');
			}

			const preview = await this.previewGeneration(recurrenceId, startDate, endDate);

			const generatedPlanIds = [];
			const skipReasons = {};

		// Generate practices for each date
		for (const dateInfo of preview.preview) {
			if (!dateInfo.willCreate) {
				skipReasons[dateInfo.date] = dateInfo.skipReason;
				continue;
			}

			try {
				// Use seasonUnionService to create practice with proper structure
				const plan = await seasonUnionService.instantiatePracticePlan(
					recurrence.season_id,
					dateInfo.date,
					userId,
					teamId
				);
				generatedPlanIds.push(plan.id);
			} catch (error) {
				console.error(`Failed to create practice for ${dateInfo.date}:`, error);
				skipReasons[dateInfo.date] = `Error: ${error.message}`;
			}
		}

		// Log the generation
		const logResult = await kyselyDb
			.insertInto('season_generation_logs')
			.values({
				recurrence_id: recurrenceId,
				generated_count: generatedPlanIds.length,
				skipped_count: Object.keys(skipReasons).length,
				start_date: startDate,
				end_date: endDate,
				generated_plan_ids: generatedPlanIds,
				skip_reasons: JSON.stringify(skipReasons),
				generated_by: userId
			})
			.returningAll()
			.executeTakeFirst();

		return {
			log: logResult,
			generated: generatedPlanIds.length,
			skipped: Object.keys(skipReasons).length,
			generatedPlanIds,
			skipReasons
		};
	}

		/**
		 * Update recurrence pattern
		 */
		async update(id, data) {
			// Don't allow updating certain fields
			const updateData = { ...data };
			delete updateData.created_by;
			delete updateData.created_at;

			return await super.update(id, {
				...updateData,
				updated_at: new Date()
			});
		}

	/**
	 * Get generation history for a recurrence
	 */
	async getGenerationHistory(recurrenceId) {
		return await kyselyDb
			.selectFrom('season_generation_logs as gl')
			.leftJoin('users as u', 'gl.generated_by', 'u.id')
			.selectAll('gl')
			.select('u.name as generated_by_name')
			.where('gl.recurrence_id', '=', recurrenceId)
			.orderBy('gl.generated_at', 'desc')
			.execute();
	}

	/**
	 * Delete recurrence pattern
	 */
	async delete(id) {
		// This will cascade delete generation logs
		return await super.delete(id);
	}
}

export const recurrenceService = new RecurrenceService();
