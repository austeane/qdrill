import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';
import { authGuard } from '$lib/server/authGuard';
import { dev } from '$app/environment';

const client = createClient();
await client.connect();

export async function GET({ params, locals }) {
  const id = params.id;
  const session = await locals.getSession();
  const userId = session?.user?.id;

  try {
    // First fetch the practice plan
    const planResult = await client.query(
      `SELECT * FROM practice_plans WHERE id = $1`,
      [id]
    );

    if (planResult.rows.length === 0) {
      return json({ error: 'Practice plan not found' }, { status: 404 });
    }

    const practicePlan = planResult.rows[0];

    // Check visibility and ownership
    if (practicePlan.visibility === 'private' && practicePlan.created_by !== userId) {
      return json({ error: 'Unauthorized' }, { status: 403 });
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
        .map(item => formatDrillItem(item))
    }));

    // Calculate duration for each section
    sections.forEach(section => {
      section.duration = calculateSectionDuration(section.items);
    });

    // If no sections exist, create a default one
    if (sections.length === 0) {
      const defaultSection = {
        id: 'default',
        name: 'Main Section',
        order: 0,
        goals: [],
        notes: '',
        items: itemsResult.rows.map(item => formatDrillItem(item))
      };
      defaultSection.duration = calculateSectionDuration(defaultSection.items);
      sections.push(defaultSection);
    }

    // Add sections to practice plan
    practicePlan.sections = sections;

    return json(practicePlan);
  } catch (error) {
    console.error('[API] Error fetching practice plan:', error);
    return json(
      { error: 'Failed to retrieve practice plan', details: error.toString() },
      { status: 500 }
    );
  }
}

// Helper function to format drill items
function formatDrillItem(item) {
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
        name: item.drill_name, // Using the renamed column
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

// Helper function to calculate section duration
function calculateSectionDuration(items) {
  const parallelGroups = new Map();
  let totalDuration = 0;

  items.forEach(item => {
    if (item.parallel_group_id) {
      const group = parallelGroups.get(item.parallel_group_id) || { duration: 0 };
      group.duration = Math.max(group.duration, item.duration);
      parallelGroups.set(item.parallel_group_id, group);
    } else {
      totalDuration += item.duration;
    }
  });

  // Add durations of parallel groups
  parallelGroups.forEach(group => {
    totalDuration += group.duration;
  });

  return totalDuration;
}

export const PUT = async ({ params, request, locals }) => {
    const { id } = params;
    const plan = await request.json();
    const session = await locals.getSession();
    const userId = session?.user?.id;

    try {
        await client.query('BEGIN');

        // First check if the plan exists and is editable
        const checkResult = await client.query(
            `SELECT created_by, is_editable_by_others, visibility 
             FROM practice_plans 
             WHERE id = $1`,
            [id]
        );

        if (checkResult.rows.length === 0) {
            throw new PracticePlanError('Practice plan not found', 404);
        }

        const existingPlan = checkResult.rows[0];

        // Check edit permissions
        const canEdit = userId === existingPlan.created_by || 
                       existingPlan.is_editable_by_others;

        if (!canEdit) {
            throw new PracticePlanError('Unauthorized to edit this practice plan', 403);
        }

        // If anonymous user, force public visibility and editable
        if (!userId) {
            plan.visibility = 'public';
            plan.is_editable_by_others = true;
        }

        // Update practice plan - add start_time to the UPDATE query
        const result = await client.query(
            `UPDATE practice_plans SET 
             name = $1,
             description = $2,
             practice_goals = $3,
             phase_of_season = $4,
             estimated_number_of_participants = $5,
             is_editable_by_others = $6,
             visibility = $7,
             start_time = $8
             WHERE id = $9 AND (created_by = $10 OR is_editable_by_others = true)
             RETURNING *`,
            [plan.name, plan.description, plan.practice_goals, 
             plan.phase_of_season, plan.estimated_number_of_participants,
             plan.is_editable_by_others, plan.visibility, plan.start_time,
             id, userId]
        );

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return json({ error: 'Unauthorized' }, { status: 403 });
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
        if (plan.sections?.length > 0) {
            for (const section of plan.sections) {
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
                    const values = section.items.map((item, index) => ({
                        practice_plan_id: id,
                        section_id: section.id,
                        drill_id: (() => {
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
                        order_in_plan: index,
                        duration: item.duration || item.selected_duration,
                        // Map 'one-off' type to 'drill' to conform to database constraints
                        type: item.type === 'one-off' ? 'drill' : item.type,
                        parallel_group_id: item.parallel_group_id,
                        parallel_timeline: item.parallel_timeline || null,
                        group_timelines: item.groupTimelines
                          ? `{${item.groupTimelines.join(',')}}`
                          : null,
                        // Save the name field - use item.name, or if it's a drill with a drill object, use drill.name, otherwise use appropriate defaults
                        name: item.name || 
                              (item.type === 'drill' && item.drill?.name 
                                ? item.drill.name 
                                : (item.type === 'one-off' ? 'Quick Activity' : 'Break'))
                    }));

                    // Update the SQL query to include name field
                    const valueStrings = values.map((_, index) => 
                        `($${index * 10 + 1}, $${index * 10 + 2}, $${index * 10 + 3}, $${index * 10 + 4}, $${index * 10 + 5}, $${index * 10 + 6}, $${index * 10 + 7}, $${index * 10 + 8}, $${index * 10 + 9}, $${index * 10 + 10})`
                    );
                    
                    const flatValues = values.flatMap(v => [
                        v.practice_plan_id, v.section_id, v.drill_id, 
                        v.order_in_plan, v.duration, v.type, 
                        v.parallel_group_id, v.parallel_timeline, v.group_timelines,
                        v.name
                    ]);

                    await client.query(
                        `INSERT INTO practice_plan_drills (practice_plan_id, section_id, drill_id, order_in_plan, duration, type, parallel_group_id, parallel_timeline, group_timelines, name)
                         VALUES ${valueStrings.join(', ')}`,
                        flatValues
                    );
                }
            }
        }

        await client.query('COMMIT');
        return json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[API] Error updating practice plan:', error);
        return json(
            { error: 'Failed to update practice plan', details: error.toString() },
            { status: 500 }
        );
    }
};

export const DELETE = authGuard(async ({ params, locals }) => {
    const { id } = params;
    const session = await locals.getSession();
    const userId = session?.user?.id;

    try {
        await client.query('BEGIN');

        // First check if the user has permission to delete this plan
        const checkResult = await client.query(
            `SELECT created_by, is_editable_by_others 
             FROM practice_plans 
             WHERE id = $1`,
            [id]
        );

        if (checkResult.rows.length === 0) {
            return json({ error: 'Practice plan not found' }, { status: 404 });
        }

        const plan = checkResult.rows[0];

        // Check if user has permission to delete
        // Allow deletion in development mode
        if (!dev && plan.created_by !== userId && !plan.is_editable_by_others) {
            return json({ error: 'Unauthorized to delete this practice plan' }, { status: 403 });
        }
        // Delete related records first (cascade delete)
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

        await client.query('COMMIT');
        return json({ success: true, message: 'Practice plan deleted successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting practice plan:', error);
        return json(
            { error: 'Failed to delete practice plan', details: error.toString() },
            { status: 500 }
        );
    }
});
