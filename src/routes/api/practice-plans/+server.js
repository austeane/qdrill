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

export const POST = authGuard(async ({ request, locals }) => {
  try {
    const practicePlan = await request.json().catch(() => {
      throw new PracticePlanError('Invalid JSON payload', 400);
    });

    const session = await locals.getSession();
    if (!session?.user?.id) {
      throw new PracticePlanError('Unauthorized', 401);
    }
    const userId = session.user.id;

    const {
      name,
      description,
      drills,
      practice_goals,
      phase_of_season,
      estimated_number_of_participants,
      is_editable_by_others = false,
      visibility = 'public'
    } = practicePlan;
    
    // Validate required fields
    if (!name?.trim()) {
      throw new PracticePlanError('Name is required', 400);
    }

    if (!drills || !Array.isArray(drills) || drills.length === 0) {
      throw new PracticePlanError('At least one drill is required', 400);
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
        `INSERT INTO practice_plans (name, description, practice_goals, phase_of_season, estimated_number_of_participants, created_by, is_editable_by_others, visibility) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          name,
          description,
          practice_goals,
          phase_of_season,
          estimated_number_of_participants,
          userId,
          is_editable_by_others,
          visibility
        ]
      );

      const planId = planResult.rows[0].id;

      // Validate each drill before insertion
      for (let i = 0; i < drills.length; i++) {
        const item = drills[i];
        if (!item.type || !['drill', 'break'].includes(item.type)) {
          throw new PracticePlanError(`Invalid drill type at position ${i + 1}`, 400);
        }

        const duration = item.duration || item.selected_duration;
        if (!duration || duration <= 0) {
          throw new PracticePlanError(`Invalid duration for item at position ${i + 1}`, 400);
        }

        const orderInPlan = i + 1;
        const diagramData = item.diagram_data || null;

        if (item.type === 'drill') {
          await client.query(
            `INSERT INTO practice_plan_drills (practice_plan_id, drill_id, order_in_plan, duration, type, diagram_data) 
             VALUES ($1, $2, $3, $4, 'drill', $5)`,
            [planId, item.id, orderInPlan, duration, diagramData]
          );
        } else if (item.type === 'break') {
          await client.query(
            `INSERT INTO practice_plan_drills (practice_plan_id, order_in_plan, duration, type) 
             VALUES ($1, $2, $3, 'break')`,
            [planId, orderInPlan, duration]
          );
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
             pp.practice_goals,
             pp.phase_of_season,
             pp.estimated_number_of_participants,
             array_agg(ppd.drill_id ORDER BY ppd.order_in_plan) as drills,
             array_agg(ppd.duration ORDER BY ppd.order_in_plan) as drill_durations
      FROM practice_plans pp
      LEFT JOIN practice_plan_drills ppd ON pp.id = ppd.practice_plan_id
      GROUP BY pp.id
      ORDER BY pp.created_at DESC
    `);

    if (!result?.rows) {
      throw new PracticePlanError('No practice plans found', 404);
    }

    const filteredPlans = result.rows.filter(plan => {
      return plan.visibility === 'public' || 
             plan.visibility === 'unlisted' || 
             (plan.visibility === 'private' && plan.created_by === userId);
    });

    return json(filteredPlans);
  } catch (error) {
    console.error('Error occurred while fetching practice plans:', error);
    return json(
      { error: 'Failed to retrieve practice plans', details: error.toString() },
      { status: 500 }
    );
  }
};
