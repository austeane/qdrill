import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';
import { authGuard } from '$lib/server/authGuard';

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
        ppd.*,
        d.*,
        ppd.diagram_data AS ppd_diagram_data
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
  if (item.type === 'drill') {
    return {
      type: 'drill',
      duration: item.duration,
      order_in_plan: item.order_in_plan,
      section_id: item.section_id,
      parallel_group_id: item.parallel_group_id,
      diagram_data: item.ppd_diagram_data,
      drill: {
        id: item.drill_id,
        name: item.name,
        brief_description: item.brief_description,
        detailed_description: item.detailed_description,
        min_duration: item.min_duration,
        max_duration: item.max_duration,
        suggested_length: item.suggested_length,
        skill_level: item.skill_level,
        complexity: item.complexity,
        number_of_people_min: item.number_of_people_min,
        number_of_people_max: item.number_of_people_max,
        skills_focused_on: item.skills_focused_on,
        positions_focused_on: item.positions_focused_on,
        video_link: item.video_link,
        diagrams: item.diagrams
      }
    };
  } else {
    return {
      type: 'break',
      duration: item.duration,
      order_in_plan: item.order_in_plan,
      section_id: item.section_id,
      parallel_group_id: item.parallel_group_id
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

export const PUT = authGuard(async ({ params, request, locals }) => {
    const { id } = params;
    const plan = await request.json();
    const session = await locals.getSession();
    const userId = session.user.id;

    try {
        await client.query('BEGIN');

        // Update practice plan
        const result = await client.query(
            `UPDATE practice_plans SET 
             name = $1,
             description = $2,
             practice_goals = $3,
             phase_of_season = $4,
             estimated_number_of_participants = $5,
             is_editable_by_others = $6,
             visibility = $7
             WHERE id = $8 AND (created_by = $9 OR is_editable_by_others = true)
             RETURNING *`,
            [plan.name, plan.description, plan.practice_goals, 
             plan.phase_of_season, plan.estimated_number_of_participants,
             plan.is_editable_by_others, plan.visibility, id, userId]
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
                    [id, section.id, section.name, section.order, 
                     section.goals, section.notes]
                );

                // Insert items for this section
                if (section.items?.length > 0) {
                    for (const [index, item] of section.items.entries()) {
                        await client.query(
                            `INSERT INTO practice_plan_drills 
                             (practice_plan_id, section_id, drill_id, 
                              order_in_plan, duration, type, parallel_group_id)
                             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                            [id, section.id, item.type === 'drill' ? item.id : null,
                             index, item.duration || item.selected_duration,
                             item.type, item.parallel_group_id]
                        );
                    }
                }
            }
        }

        await client.query('COMMIT');
        return json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating practice plan:', error);
        return json(
            { error: 'Failed to update practice plan', details: error.toString() },
            { status: 500 }
        );
    }
});
