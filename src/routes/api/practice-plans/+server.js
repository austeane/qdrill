import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';
import { authGuard } from '$lib/server/authGuard';

const client = createClient();
await client.connect();

// Custom error class for better error handling
class PracticePlanError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

function normalizeString(str) {
  return str?.toLowerCase().trim() || '';
}

function validatePracticePlan(plan) {
  // Check if there are any sections with drills
  const hasAnyDrills = plan.sections?.some(section => 
    section.items?.some(item => 
      item.type === 'drill' && (item.drill_id || item.id)
    )
  );

  if (!hasAnyDrills) {
    throw new PracticePlanError('At least one drill is required', 400);
  }
}

export const POST = authGuard(async ({ request, locals }) => {
  try {
    const practicePlan = await request.json();
    const session = await locals.getSession();
    
    // If user is not logged in, force public visibility and editable by others
    if (!session?.user?.id) {
      practicePlan.visibility = 'public';
      practicePlan.is_editable_by_others = true;
    }

    // Validate visibility
    const validVisibilities = ['public', 'unlisted', 'private'];
    if (!validVisibilities.includes(practicePlan.visibility)) {
      throw new PracticePlanError('Invalid visibility setting', 400);
    }

    const userId = session?.user?.id;

    // Validate the practice plan
    validatePracticePlan(practicePlan);

    const {
      name,
      description,
      practice_goals,
      phase_of_season,
      estimated_number_of_participants,
      is_editable_by_others = false,
      visibility = 'public',
      sections = []
    } = practicePlan;
    
    // Validate required fields
    if (!name?.trim()) {
      throw new PracticePlanError('Name is required', 400);
    }

    // Validate phase_of_season
    const validPhases = [
      'Offseason',
      'Early season, new players',
      'Mid season, skill building',
      'Tournament tuneup',
      'End of season, peaking'
    ];
    if (phase_of_season && !validPhases.includes(phase_of_season)) {
      throw new PracticePlanError(`Invalid phase of season. Must be one of: ${validPhases.join(', ')}`, 400);
    }

    await client.query('BEGIN');

    try {
      const planResult = await client.query(
        `INSERT INTO practice_plans (
          name, description, practice_goals, phase_of_season, 
          estimated_number_of_participants, created_by, 
          visibility, is_editable_by_others
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING id`,
        [
          name,
          description,
          practice_goals,
          phase_of_season,
          estimated_number_of_participants,
          userId,
          visibility,
          is_editable_by_others
        ]
      );

      const planId = planResult.rows[0].id;

      // Insert sections and their items
      for (const section of sections) {
        // Generate a numeric ID for the section
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
               (practice_plan_id, section_id, drill_id, order_in_plan, duration, type, diagram_data, parallel_group_id)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                planId,
                dbSectionId, // Use the database-generated section ID
                item.drill_id,
                index,
                item.duration,
                item.type,
                item.diagram_data,
                item.parallel_group_id
              ]
            );
          }
        }
      }

      await client.query('COMMIT');
      return json({ id: planId, message: 'Practice plan created successfully' }, { status: 201 });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Practice Plan Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return json({
      error: error instanceof PracticePlanError ? error.message : 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    }, {
      status: error instanceof PracticePlanError ? error.status : 500
    });
  }
});

export const GET = async ({ locals }) => {
  try {
    const session = await locals.getSession();
    const userId = session?.user?.id;

    const result = await client.query(`
      SELECT pp.*, 
             array_agg(ppd.drill_id ORDER BY ppd.order_in_plan) as drills,
             array_agg(ppd.duration ORDER BY ppd.order_in_plan) as drill_durations
      FROM practice_plans pp
      LEFT JOIN practice_plan_drills ppd ON pp.id = ppd.practice_plan_id
      WHERE 
        pp.visibility = 'public' 
        OR (pp.visibility = 'unlisted')
        OR (pp.visibility = 'private' AND pp.created_by = $1)
      GROUP BY pp.id
      ORDER BY pp.created_at DESC
    `, [userId || '']);

    return json(result.rows);
  } catch (error) {
    console.error('Error occurred while fetching practice plans:', error);
    return json(
      { error: 'Failed to retrieve practice plans', details: error.toString() },
      { status: 500 }
    );
  }
};
