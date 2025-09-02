import { BaseEntityService } from './baseEntityService.js';
import * as db from '$lib/server/db.js';
import { seasonUnionService } from './seasonUnionService.js';
import { practicePlanService } from './practicePlanService.js';
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
        'id', 'season_id', 'team_id', 'name', 'pattern', 'day_of_week',
        'day_of_month', 'time_of_day', 'duration_minutes', 'template_plan_id',
        'skip_dates', 'skip_markers', 'is_active', 'created_by', 'created_at', 'updated_at'
      ],
      [
        'id', 'season_id', 'team_id', 'name', 'pattern', 'day_of_week',
        'day_of_month', 'time_of_day', 'duration_minutes', 'template_plan_id',
        'skip_dates', 'skip_markers', 'is_active', 'created_by', 'created_at', 'updated_at'
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
    const query = `
      SELECT r.*, 
             pp.name as template_name,
             u.name as created_by_name
      FROM season_recurrences r
      LEFT JOIN practice_plans pp ON r.template_plan_id = pp.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.season_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await db.query(query, [seasonId]);
    return result.rows;
  }

  /**
   * Generate dates based on recurrence pattern
   */
  generateDatesFromPattern(recurrence, startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

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
        let weekCounter = 0;
        while (current <= end) {
          const dayOfWeek = current.getDay();
          const weekNumber = Math.floor((current - new Date(startDate)) / (7 * 24 * 60 * 60 * 1000));
          if (weekNumber % 2 === 0 && recurrence.day_of_week && recurrence.day_of_week.includes(dayOfWeek)) {
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
      const skipSet = new Set(recurrence.skip_dates.map(d => toLocalISO(new Date(d))));
      return dates.filter(date => !skipSet.has(toLocalISO(date)));
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
    const existingQuery = `
      SELECT scheduled_date 
      FROM practice_plans 
      WHERE season_id = $1 
        AND scheduled_date >= $2 
        AND scheduled_date <= $3
    `;
    const existingResult = await db.query(existingQuery, [
      recurrence.season_id,
      startDate,
      endDate
    ]);
    const existingDates = new Set(existingResult.rows.map(r => r.scheduled_date));

    // Check for markers if skip_markers is true
    let markerDates = new Set();
    if (recurrence.skip_markers) {
      const markers = await seasonMarkerService.getSeasonMarkers(recurrence.season_id);
      markers.forEach(marker => {
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
    const preview = dates.map(date => {
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
      willCreate: preview.filter(p => p.willCreate).length,
      willSkip: preview.filter(p => !p.willCreate).length,
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
    const datesToCreate = preview.preview.filter(p => p.willCreate);
    
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
    const logQuery = `
      INSERT INTO season_generation_logs (
        recurrence_id, generated_count, skipped_count,
        start_date, end_date, generated_plan_ids,
        skip_reasons, generated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const logResult = await db.query(logQuery, [
      recurrenceId,
      generatedPlanIds.length,
      Object.keys(skipReasons).length,
      startDate,
      endDate,
      generatedPlanIds,
      JSON.stringify(skipReasons),
      userId
    ]);

    return {
      log: logResult.rows[0],
      generated: generatedPlanIds.length,
      skipped: Object.keys(skipReasons).length,
      generatedPlanIds,
      skipReasons
    };
  }

  /**
   * Update recurrence pattern
   */
  async update(id, data, userId) {
    // Don't allow updating certain fields
    const { created_by, created_at, ...updateData } = data;
    
    return await super.update(id, {
      ...updateData,
      updated_at: new Date()
    });
  }

  /**
   * Get generation history for a recurrence
   */
  async getGenerationHistory(recurrenceId) {
    const query = `
      SELECT gl.*, u.name as generated_by_name
      FROM season_generation_logs gl
      LEFT JOIN users u ON gl.generated_by = u.id
      WHERE gl.recurrence_id = $1
      ORDER BY gl.generated_at DESC
    `;
    const result = await db.query(query, [recurrenceId]);
    return result.rows;
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
