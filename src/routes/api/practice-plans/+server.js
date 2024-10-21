import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';
import { authGuard } from '$lib/server/authGuard';

const client = createClient();
await client.connect();

export const POST = authGuard(async ({ request, locals }) => {
  const practicePlan = await request.json();
  const session = await locals.getSession();
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
  
  if (!name || !drills || !Array.isArray(drills) || drills.length === 0) {
    return json(
      { error: 'Invalid practice plan data' },
      { status: 400 }
    );
  }

  const validPhases = [
    'Offseason',
    'Early season, new players',
    'Mid season, skill building',
    'Tournament tuneup',
    'End of season, peaking'
  ];
  if (phase_of_season && !validPhases.includes(phase_of_season)) {
    return json(
      { error: 'Invalid phase of season' },
      { status: 400 }
    );
  }

  try {
    await client.query('BEGIN');

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

    for (let i = 0; i < drills.length; i++) {
      const item = drills[i];
      const orderInPlan = i + 1;
      const duration = item.duration || item.selected_duration;

      if (item.type === 'drill') {
        const diagramData = item.diagram_data || null;

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

    return json(
      { id: planId, message: 'Practice plan created successfully' },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error occurred while inserting practice plan:', error);
    return json(
      { error: 'An error occurred while creating the practice plan', details: error.toString() },
      { status: 500 }
    );
  }
});

export const GET = async ({ locals }) => {
  // Get session if available
  const session = await locals.getSession();
  const userId = session?.user?.id;

  try {
    // Fetch practice plans from the database
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

    // Filter practice plans based on visibility and ownership
    const filteredPlans = result.rows.filter(plan => {
      if (plan.visibility === 'public') {
        return true;
      } else if (plan.visibility === 'unlisted') {
        return true; // Include unlisted plans
      } else if (plan.visibility === 'private') {
        return plan.created_by === userId;
      }
      return false;
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
