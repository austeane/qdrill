import { BaseEntityService } from './baseEntityService.js';
import * as db from '$lib/server/db';

/**
 * Service for managing practice plans
 * Extends the BaseEntityService with practice plan-specific functionality
 */
export class PracticePlanService extends BaseEntityService {
  /**
   * Creates a new PracticePlanService
   */
  constructor() {
    super('practice_plans', 'id', ['*'], [
      'name', 'description', 'practice_goals', 'phase_of_season',
      'estimated_number_of_participants', 'created_by', 'visibility',
      'is_editable_by_others', 'start_time', 'created_at', 'updated_at'
    ], {});
    
    // Enable standard permissions model
    this.enableStandardPermissions();
  }

  /**
   * Get practice plans with optional filtering/pagination
   * Overrides base getAll to include drill information
   */
  async getAll(options = {}) {
    // Use transaction helper
    return this.withTransaction(async (client) => {
      const userId = options.userId || null;
      
      // Modify the query to include drill information
      let query = `
        SELECT pp.*, 
               array_agg(ppd.drill_id ORDER BY ppd.order_in_plan) as drills,
               array_agg(ppd.duration ORDER BY ppd.order_in_plan) as drill_durations,
               pp.created_by
        FROM practice_plans pp
        LEFT JOIN practice_plan_drills ppd ON pp.id = ppd.practice_plan_id
        WHERE visibility = 'public'
        OR visibility = 'unlisted'
        ${userId ? `OR (visibility = 'private' AND created_by = $1)` : ''}
        GROUP BY pp.id
        ORDER BY pp.created_at DESC
      `;
      
      const params = userId ? [userId] : [];
      const result = await client.query(query, params);
      
      return {
        items: result.rows,
        pagination: null // All items are returned
      };
    });
  }
  
  /**
   * Create a new practice plan
   * @param {Object} planData - Practice plan data
   * @param {number|null} userId - User ID creating the plan (null if anonymous)
   * @returns {Promise<Object>} - The created practice plan with ID
   * @throws {Error} If validation fails
   */
  async createPracticePlan(planData, userId = null) {
    // Validate the practice plan - this will throw if invalid
    this.validatePracticePlan(planData);
    
    // If user is not logged in, force public visibility and editable by others
    if (!userId) {
      planData.visibility = 'public';
      planData.is_editable_by_others = true;
    }

    // Validate visibility
    const validVisibilities = ['public', 'unlisted', 'private'];
    if (!planData.visibility || !validVisibilities.includes(planData.visibility)) {
      throw new Error('Invalid visibility setting');
    }

    // If user is logged out, they can only create public plans
    if (!userId && planData.visibility !== 'public') {
      throw new Error('Anonymous users can only create public plans');
    }

    const {
      name,
      description,
      practice_goals,
      phase_of_season,
      estimated_number_of_participants,
      is_editable_by_others = false,
      visibility = 'public',
      sections = [],
      start_time = null
    } = planData;
    
    // Use transaction helper
    return this.withTransaction(async (client) => {
      // Add timestamps and metadata
      const planWithTimestamps = this.addTimestamps({
        name,
        description,
        practice_goals,
        phase_of_season,
        estimated_number_of_participants,
        created_by: userId,
        visibility,
        is_editable_by_others,
        start_time
      }, true);

      // Insert practice plan
      const planResult = await client.query(
        `INSERT INTO practice_plans (
          name, description, practice_goals, phase_of_season, 
          estimated_number_of_participants, created_by, 
          visibility, is_editable_by_others, start_time, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING id`,
        [
          planWithTimestamps.name,
          planWithTimestamps.description,
          planWithTimestamps.practice_goals,
          planWithTimestamps.phase_of_season,
          planWithTimestamps.estimated_number_of_participants,
          planWithTimestamps.created_by,
          planWithTimestamps.visibility,
          planWithTimestamps.is_editable_by_others,
          planWithTimestamps.start_time,
          planWithTimestamps.created_at,
          planWithTimestamps.updated_at
        ]
      );

      const planId = planResult.rows[0].id;

      // Insert sections and their items
      for (const section of sections) {
        const sectionResult = await client.query(
          `INSERT INTO practice_plan_sections 
           (practice_plan_id, name, "order", goals, notes)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            planId,
            section.name,
            section.order,
            section.goals,
            section.notes
          ]
        );

        const dbSectionId = sectionResult.rows[0].id;

        // Insert items for this section
        if (section.items?.length > 0) {
          for (const [index, item] of section.items.entries()) {
            await client.query(
              `INSERT INTO practice_plan_drills 
               (practice_plan_id, section_id, drill_id, order_in_plan, duration, type, diagram_data, parallel_group_id, parallel_timeline, group_timelines, name)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                planId,
                dbSectionId,
                // Logic for determining drill_id
                (() => {
                  // For one-off items, use null
                  if (item.type === 'one-off' || (typeof item.id === 'number' && item.id < 0)) {
                    return null;
                  }
                  // For drills, use drill_id or drill.id if available
                  if (item.type === 'drill') {
                    return item.drill_id || (item.drill?.id || null);
                  }
                  // For other types (e.g., breaks), use null
                  return null;
                })(),
                index,
                item.duration,
                // Map 'one-off' type to 'drill' to conform to database constraints
                item.type === 'one-off' ? 'drill' : item.type,
                item.diagram_data,
                item.parallel_group_id,
                item.parallel_timeline,
                item.groupTimelines
                  ? `{${item.groupTimelines.join(',')}}`
                  : null,
                // Save the name field
                item.name || 
                (item.type === 'drill' && item.drill?.name 
                  ? item.drill.name 
                  : (item.type === 'one-off' ? 'Quick Activity' : 'Break'))
              ]
            );
          }
        }
      }

      return { id: planId };
    });
  }
  
  /**
   * Get a practice plan with all its details
   * @param {number} id - Practice plan ID
   * @param {number|null} userId - User ID requesting the plan
   * @returns {Promise<Object>} - Complete practice plan with sections and items
   */
  async getPracticePlanById(id, userId = null) {
    return this.withTransaction(async (client) => {
      // First fetch the practice plan
      const planResult = await client.query(
        `SELECT * FROM practice_plans WHERE id = $1`,
        [id]
      );

      if (planResult.rows.length === 0) {
        throw new Error('Practice plan not found');
      }

      const practicePlan = planResult.rows[0];

      // Use standard permission check
      if (!this.canUserView(practicePlan, userId)) {
        throw new Error('Unauthorized');
      }

      // Fetch sections
      const sectionsResult = await client.query(
        `SELECT * FROM practice_plan_sections 
         WHERE practice_plan_id = $1 
         ORDER BY "order"`,
        [id]
      );

      // Fetch items with their section assignments
      const itemsResult = await client.query(
        `SELECT 
          ppd.id,
          ppd.practice_plan_id,
          ppd.section_id,
          ppd.drill_id,
          ppd.order_in_plan,
          ppd.duration AS item_duration,
          ppd.type,
          ppd.name,
          ppd.parallel_group_id,
          ppd.parallel_timeline,
          ppd.diagram_data AS ppd_diagram_data,
          ppd.group_timelines::text[] AS "groupTimelines",
          d.id AS drill_id,
          d.name AS drill_name,
          d.brief_description,
          d.detailed_description,
          d.suggested_length,
          d.skill_level,
          d.complexity,
          d.number_of_people_min,
          d.number_of_people_max,
          d.skills_focused_on,
          d.positions_focused_on,
          d.video_link,
          d.diagrams
         FROM practice_plan_drills ppd
         LEFT JOIN drills d ON ppd.drill_id = d.id
         WHERE ppd.practice_plan_id = $1
         ORDER BY ppd.section_id, ppd.order_in_plan`,
        [id]
      );

      // Organize items by section
      const sections = sectionsResult.rows.map(section => ({
        ...section,
        items: itemsResult.rows
          .filter(item => item.section_id === section.id)
          .map(item => this.formatDrillItem(item))
      }));

      // Calculate duration for each section
      sections.forEach(section => {
        section.duration = this.calculateSectionDuration(section.items);
      });

      // If no sections exist, create a default one
      if (sections.length === 0) {
        const defaultSection = {
          id: 'default',
          name: 'Main Section',
          order: 0,
          goals: [],
          notes: '',
          items: itemsResult.rows.map(item => this.formatDrillItem(item))
        };
        defaultSection.duration = this.calculateSectionDuration(defaultSection.items);
        sections.push(defaultSection);
      }

      // Add sections to practice plan
      practicePlan.sections = sections;

      return practicePlan;
    });
  }
  
  /**
   * Update a practice plan
   * @param {number} id - Practice plan ID
   * @param {Object} planData - Updated practice plan data
   * @param {number|null} userId - User ID updating the plan
   * @returns {Promise<Object>} - Updated practice plan
   */
  async updatePracticePlan(id, planData, userId = null) {
    // Check if the plan exists
    const existingPlan = await this.getById(id);
    if (!existingPlan) {
      throw new Error('Practice plan not found');
    }

    // Check edit permissions using standard permission model
    const canEdit = await this.canUserEdit(id, userId);
    if (!canEdit) {
      throw new Error('Unauthorized to edit this practice plan');
    }

    // If anonymous user, force public visibility and editable
    if (!userId) {
      planData.visibility = 'public';
      planData.is_editable_by_others = true;
    }
    
    // Use transaction helper
    return this.withTransaction(async (client) => {
      // Add updated timestamp
      const planWithTimestamp = this.addTimestamps(planData, false);
      
      // Update practice plan
      const result = await client.query(
        `UPDATE practice_plans SET 
         name = $1,
         description = $2,
         practice_goals = $3,
         phase_of_season = $4,
         estimated_number_of_participants = $5,
         is_editable_by_others = $6,
         visibility = $7,
         start_time = $8,
         updated_at = $9
         WHERE id = $10 AND (created_by = $11 OR is_editable_by_others = true)
         RETURNING *`,
        [
          planWithTimestamp.name, 
          planWithTimestamp.description, 
          planWithTimestamp.practice_goals, 
          planWithTimestamp.phase_of_season, 
          planWithTimestamp.estimated_number_of_participants,
          planWithTimestamp.is_editable_by_others, 
          planWithTimestamp.visibility, 
          planWithTimestamp.start_time,
          planWithTimestamp.updated_at,
          id, 
          userId
        ]
      );

      if (result.rowCount === 0) {
        throw new Error('Unauthorized');
      }

      // Delete existing sections and drills
      await client.query(
        `DELETE FROM practice_plan_sections WHERE practice_plan_id = $1`,
        [id]
      );
      await client.query(
        `DELETE FROM practice_plan_drills WHERE practice_plan_id = $1`,
        [id]
      );

      // Insert sections
      if (planData.sections?.length > 0) {
        for (const section of planData.sections) {
          // Insert section
          const sectionResult = await client.query(
            `INSERT INTO practice_plan_sections 
             (practice_plan_id, id, name, "order", goals, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [id, section.id, section.name, section.order, section.goals, section.notes]
          );

          // Insert items with explicit ordering
          if (section.items?.length > 0) {
            for (const [index, item] of section.items.entries()) {
              await client.query(
                `INSERT INTO practice_plan_drills 
                 (practice_plan_id, section_id, drill_id, order_in_plan, duration, type, 
                  parallel_group_id, parallel_timeline, group_timelines, name, diagram_data)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                  id,
                  section.id,
                  (() => {
                    // For one-off items, use null
                    if (item.type === 'one-off' || (typeof item.id === 'number' && item.id < 0)) {
                      return null;
                    }
                    // For drills, use drill_id or drill.id if available
                    if (item.type === 'drill') {
                      return item.drill_id || (item.drill?.id || null);
                    }
                    // For other types (e.g., breaks), use null
                    return null;
                  })(),
                  index,
                  item.duration || item.selected_duration,
                  // Map 'one-off' type to 'drill' to conform to database constraints
                  item.type === 'one-off' ? 'drill' : item.type,
                  item.parallel_group_id,
                  item.parallel_timeline || null,
                  item.groupTimelines
                    ? `{${item.groupTimelines.join(',')}}`
                    : null,
                  // Name field
                  item.name || 
                  (item.type === 'drill' && item.drill?.name 
                    ? item.drill.name 
                    : (item.type === 'one-off' ? 'Quick Activity' : 'Break')),
                  // Diagram data
                  item.diagram_data
                ]
              );
            }
          }
        }
      }

      return result.rows[0];
    });
  }
  
  /**
   * Delete a practice plan
   * @param {number} id - Practice plan ID
   * @param {number} userId - User ID requesting deletion
   * @returns {Promise<boolean>} - True if successful
   */
  async deletePracticePlan(id, userId) {
    // First check if the user has permission to delete this plan
    const plan = await this.getById(id);
    if (!plan) {
      throw new Error('Practice plan not found');
    }

    // Check permissions using standard permission model
    const canEdit = await this.canUserEdit(id, userId);
    if (!canEdit) {
      throw new Error('Unauthorized to delete this practice plan');
    }
    
    // Use transaction helper for the deletion
    return this.withTransaction(async (client) => {
      // Delete related records first
      await client.query(
        'DELETE FROM practice_plan_drills WHERE practice_plan_id = $1',
        [id]
      );

      await client.query(
        'DELETE FROM practice_plan_sections WHERE practice_plan_id = $1',
        [id]
      );

      // Finally delete the practice plan
      await client.query(
        'DELETE FROM practice_plans WHERE id = $1',
        [id]
      );

      return true;
    });
  }
  
  /**
   * Duplicate a practice plan
   * @param {number} id - Practice plan ID to duplicate
   * @param {number|null} userId - User ID creating the duplicate
   * @returns {Promise<Object>} - New practice plan ID
   */
  async duplicatePracticePlan(id, userId = null) {
    // First fetch the original practice plan
    const originalPlan = await this.getById(id);
    if (!originalPlan) {
      throw new Error('Practice plan not found');
    }

    // Use transaction helper
    return this.withTransaction(async (client) => {
      // Create data for new plan with timestamps
      const newPlanData = this.addTimestamps({
        name: `${originalPlan.name} (Copy)`,
        description: originalPlan.description,
        practice_goals: originalPlan.practice_goals,
        phase_of_season: originalPlan.phase_of_season,
        estimated_number_of_participants: originalPlan.estimated_number_of_participants,
        created_by: userId,
        visibility: originalPlan.visibility,
        is_editable_by_others: originalPlan.is_editable_by_others,
        start_time: originalPlan.start_time
      }, true);

      // Create new practice plan
      const newPlanResult = await client.query(
        `INSERT INTO practice_plans (
          name, description, practice_goals, phase_of_season,
          estimated_number_of_participants, created_by,
          visibility, is_editable_by_others, start_time, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          newPlanData.name,
          newPlanData.description,
          newPlanData.practice_goals,
          newPlanData.phase_of_season,
          newPlanData.estimated_number_of_participants,
          newPlanData.created_by,
          newPlanData.visibility,
          newPlanData.is_editable_by_others,
          newPlanData.start_time,
          newPlanData.created_at,
          newPlanData.updated_at
        ]
      );

      const newPlanId = newPlanResult.rows[0].id;

      // Copy sections
      const sectionsResult = await client.query(
        `SELECT * FROM practice_plan_sections 
         WHERE practice_plan_id = $1 
         ORDER BY "order"`,
        [id]
      );

      for (const section of sectionsResult.rows) {
        // Insert section
        const newSectionResult = await client.query(
          `INSERT INTO practice_plan_sections 
           (practice_plan_id, name, "order", goals, notes)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [newPlanId, section.name, section.order, section.goals, section.notes]
        );

        const newSectionId = newSectionResult.rows[0].id;

        // Copy drills for this section
        const drillsResult = await client.query(
          `SELECT * FROM practice_plan_drills 
           WHERE practice_plan_id = $1 AND section_id = $2
           ORDER BY order_in_plan`,
          [id, section.id]
        );

        for (const drill of drillsResult.rows) {
          await client.query(
            `INSERT INTO practice_plan_drills 
             (practice_plan_id, section_id, drill_id, order_in_plan, 
              duration, type, diagram_data, parallel_group_id, parallel_timeline,
              group_timelines, name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              newPlanId,
              newSectionId,
              drill.drill_id,
              drill.order_in_plan,
              drill.duration,
              drill.type,
              drill.diagram_data,
              drill.parallel_group_id,
              drill.parallel_timeline,
              drill.group_timelines,
              drill.name
            ]
          );
        }
      }

      return { id: newPlanId };
    });
  }
  
  /**
   * Validate a practice plan
   * @param {Object} plan - Practice plan to validate
   * @throws {Error} If validation fails
   */
  validatePracticePlan(plan) {
    // Check if the name is valid
    if (!plan.name?.trim()) {
      throw new Error('Name is required');
    }
    
    // Check if there are any sections with drills
    const hasAnyDrills = plan.sections?.some(section => 
      section.items?.some(item => 
        item.type === 'drill' && (item.drill_id || item.id)
      )
    );

    if (!hasAnyDrills) {
      throw new Error('At least one drill is required');
    }
    
    // Validate phase_of_season
    const validPhases = [
      'Offseason',
      'Early season, new players',
      'Mid season, skill building',
      'Tournament tuneup',
      'End of season, peaking'
    ];
    
    if (plan.phase_of_season && !validPhases.includes(plan.phase_of_season)) {
      throw new Error(`Invalid phase of season. Must be one of: ${validPhases.join(', ')}`);
    }
  }
  
  /**
   * Format a drill item from database row to client format
   * @param {Object} item - Database row for drill item
   * @returns {Object} - Formatted drill item
   */
  formatDrillItem(item) {
    // Check if this is a one-off drill (when type is 'drill' but drill_id is null)
    const isOneOff = item.type === 'drill' && item.drill_id === null;
    
    if (item.type === 'drill') {
      return {
        id: item.id,
        type: isOneOff ? 'one-off' : 'drill',
        duration: item.item_duration,
        order_in_plan: item.order_in_plan,
        section_id: item.section_id,
        parallel_group_id: item.parallel_group_id,
        parallel_timeline: item.parallel_timeline,
        groupTimelines: item.groupTimelines,
        diagram_data: item.ppd_diagram_data,
        // Use custom name from ppd.name column if available
        name: item.name || (isOneOff ? "Quick Activity" : null),
        // Only include drill object if this is not a one-off drill
        drill: isOneOff ? null : {
          id: item.drill_id,
          name: item.drill_name,
          brief_description: item.brief_description,
          detailed_description: item.detailed_description,
          suggested_length: item.suggested_length,
          skill_level: item.skill_level,
          complexity: item.complexity,
          number_of_people_min: item.number_of_people_min,
          number_of_people_max: item.number_of_people_max,
          skills_focused_on: item.skills_focused_on,
          positions_focused_on: item.positions_focused_on,
          video_link: item.video_link,
          diagrams: item.diagrams
        },
      };
    } else {
      return {
        id: item.id,
        type: 'break',
        duration: item.item_duration,
        order_in_plan: item.order_in_plan,
        section_id: item.section_id,
        name: item.name || 'Break',
        parallel_group_id: item.parallel_group_id,
        parallel_timeline: item.parallel_timeline,
        groupTimelines: item.groupTimelines
      };
    }
  }
  
  /**
   * Calculate section duration considering parallel drills
   * @param {Array<Object>} items - Items in the section
   * @returns {number} - Total section duration
   */
  calculateSectionDuration(items) {
    const parallelGroups = new Map();
    let totalDuration = 0;

    items.forEach(item => {
      if (item.parallel_group_id) {
        const group = parallelGroups.get(item.parallel_group_id) || { duration: 0 };
        group.duration = Math.max(group.duration, item.duration || 0);
        parallelGroups.set(item.parallel_group_id, group);
      } else {
        totalDuration += item.duration || 0;
      }
    });

    // Add durations of parallel groups
    parallelGroups.forEach(group => {
      totalDuration += group.duration;
    });

    return totalDuration;
  }

  /**
   * Associate an anonymously created practice plan with a user
   * @param {number} id - Practice Plan ID
   * @param {number} userId - User ID to associate with
   * @returns {Promise<Object>} - The updated practice plan
   * @throws {Error} - If plan not found or already owned
   */
  async associatePracticePlan(id, userId) {
    const plan = await this.getById(id);

    if (!plan) {
      throw new Error('Practice plan not found');
    }

    // Check if already owned
    if (plan.created_by !== null) {
      // Return existing plan if already owned
      return plan;
    }

    // Update the created_by field
    return await this.update(id, { created_by: userId });
  }
}

// Create and export an instance of the service
export const practicePlanService = new PracticePlanService();