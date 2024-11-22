import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';

const client = createClient();
await client.connect();

export async function GET({ params }) {
  const { id } = params;
  console.log('[Variations API] Fetching variations for drill:', id);

  try {
    // First check if this is a parent drill
    const parentCheck = await client.query(
      `SELECT * FROM drills WHERE id = $1 AND parent_drill_id IS NULL`,
      [id]
    );
    console.log('[Variations API] Parent check results:', parentCheck.rows);

    if (parentCheck.rows.length > 0) {
      // This is a parent drill, get its variations
      const result = await client.query(
        `SELECT * FROM drills WHERE parent_drill_id = $1 ORDER BY upvotes DESC`,
        [id]
      );
      console.log('[Variations API] Parent drill variations:', result.rows);
      return json([parentCheck.rows[0], ...result.rows]);
    }

    // Check if this is a child drill
    const childCheck = await client.query(
      `SELECT parent_drill_id FROM drills WHERE id = $1 AND parent_drill_id IS NOT NULL`,
      [id]
    );
    console.log('[Variations API] Child check results:', childCheck.rows);

    if (childCheck.rows.length > 0) {
      const parentId = childCheck.rows[0].parent_drill_id;
      console.log('[Variations API] Found parent ID:', parentId);
      
      const result = await client.query(
        `SELECT * FROM drills 
         WHERE id = $1 OR parent_drill_id = $1 
         ORDER BY CASE WHEN id = $2 THEN 0 ELSE 1 END, upvotes DESC`,
        [parentId, id]
      );
      console.log('[Variations API] Child drill variations:', result.rows);
      return json(result.rows);
    }

    console.log('[Variations API] No variations found');
    return json([]);
  } catch (error) {
    console.error('[Variations API] Error:', error);
    return json({ error: 'Failed to fetch variations' }, { status: 500 });
  }
}

export async function POST({ params, request }) {
  const { id } = params;
  const drillData = await request.json();

  try {
    // First fetch the parent drill
    const parentResult = await client.query(
      'SELECT * FROM drills WHERE id = $1',
      [id]
    );

    if (parentResult.rows.length === 0) {
      return json({ error: 'Parent drill not found' }, { status: 404 });
    }

    const parentDrill = parentResult.rows[0];

    // Create the variation
    const result = await client.query(
      `INSERT INTO drills (
        name, brief_description, detailed_description, skill_level,
        complexity, suggested_length, number_of_people_min,
        number_of_people_max, skills_focused_on, positions_focused_on,
        video_link, images, diagrams, parent_drill_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        drillData.name,
        drillData.brief_description,
        drillData.detailed_description,
        parentDrill.skill_level,
        parentDrill.complexity,
        parentDrill.suggested_length,
        parentDrill.number_of_people_min,
        parentDrill.number_of_people_max,
        parentDrill.skills_focused_on,
        parentDrill.positions_focused_on,
        drillData.video_link,
        drillData.images,
        drillData.diagrams,
        id
      ]
    );

    return json(result.rows[0]);
  } catch (error) {
    console.error('Error creating variation:', error);
    return json({ error: 'Failed to create variation' }, { status: 500 });
  }
} 