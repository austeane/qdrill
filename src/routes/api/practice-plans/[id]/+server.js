import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';

const client = createClient();
await client.connect();

export async function GET({ params }) {
  const id = params.id;

  try {
    // Fetch the practice plan
    const planResult = await client.query(
      `SELECT * FROM practice_plans WHERE id = $1`,
      [id]
    );

    if (planResult.rows.length === 0) {
      return json({ error: 'Practice plan not found' }, { status: 404 });
    }

    const practicePlan = planResult.rows[0];

    // Fetch items (drills and breaks) associated with this practice plan
    const itemsResult = await client.query(
      `
      SELECT 
        ppd.order_in_plan,
        ppd.duration,
        ppd.type,
        ppd.drill_id,
        d.*
      FROM practice_plan_drills ppd
      LEFT JOIN drills d ON ppd.drill_id = d.id
      WHERE ppd.practice_plan_id = $1
      ORDER BY ppd.order_in_plan
      `,
      [id]
    );

    // Map items to the required format
    const items = itemsResult.rows.map((item) => {
      if (item.type === 'drill') {
        return {
          type: 'drill',
          duration: item.duration,
          order_in_plan: item.order_in_plan,
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
            diagram_data: item.diagram_data,
          },
        };
      } else if (item.type === 'break') {
        return {
          type: 'break',
          duration: item.duration,
          order_in_plan: item.order_in_plan,
        };
      }
    });

    practicePlan.items = items;

    return json(practicePlan);
  } catch (error) {
    console.error('Error fetching practice plan:', error);
    return json(
      { error: 'Failed to retrieve practice plan', details: error.toString() },
      { status: 500 }
    );
  }
}