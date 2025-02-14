import { json } from '@sveltejs/kit';
import * as db from '$lib/server/db';

// Custom error class for better error handling
class PracticePlanError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
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

export async function GET({ url, locals }) {
    const userId = locals.user?.id;
    let retries = 2;
    
    while (retries > 0) {
        try {
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
            const result = await db.query(query, params);
            return json(result.rows);
            
        } catch (error) {
            console.error(`Database error (${retries} retries left):`, error);
            
            if (error.code === '57P01' && retries > 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                retries--;
                continue;
            }
            
            return json(
                { error: 'Failed to fetch practice plans', details: error.message },
                { status: 500 }
            );
        }
    }
}

export const POST = async ({ request, locals }) => {
  try {
    const practicePlan = await request.json();
    const userId = locals.user?.id;

    // If user is not logged in, force public visibility and editable by others
    if (!userId) {
      practicePlan.visibility = 'public';
      practicePlan.is_editable_by_others = true;
    }

    // Validate visibility
    const validVisibilities = ['public', 'unlisted', 'private'];
    if (!validVisibilities.includes(practicePlan.visibility)) {
      throw new PracticePlanError('Invalid visibility setting', 400);
    }

    // If user is logged out, they can only create public plans
    if (!userId && practicePlan.visibility !== 'public') {
      throw new PracticePlanError('Anonymous users can only create public plans', 400);
    }

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

    let planId;
    
    try {
      await db.query('BEGIN');

      const planResult = await db.query(
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

      planId = planResult.rows[0].id;

      // Insert sections and their items
      for (const section of sections) {
        const sectionResult = await db.query(
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
            await db.query(
              `INSERT INTO practice_plan_drills 
               (practice_plan_id, section_id, drill_id, order_in_plan, duration, type, diagram_data, parallel_group_id, parallel_timeline)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                planId,
                dbSectionId,
                item.drill_id,
                index,
                item.duration,
                item.type,
                item.diagram_data,
                item.parallel_group_id,
                item.parallel_timeline
              ]
            );
          }
        }
      }

      await db.query('COMMIT');
      return json({ id: planId, message: 'Practice plan created successfully' }, { status: 201 });

    } catch (error) {
      await db.query('ROLLBACK');
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
};
