import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';

const client = createClient();
await client.connect();

export async function GET({ params, locals }) {
  const { id } = params;
  const session = await locals.getSession();
  const userId = session?.user?.id;

  try {
    // First determine if we're dealing with a parent or variant
    const drillResult = await client.query(
      `SELECT parent_drill_id FROM drills WHERE id = $1`,
      [id]
    );

    if (drillResult.rows.length === 0) {
      return json({ error: 'Drill not found' }, { status: 404 });
    }

    const parentDrillId = drillResult.rows[0].parent_drill_id || id;

    // Fetch the parent drill and all its variants in a single query
    const result = await client.query(
      `WITH parent AS (
        SELECT d.*, 
               (SELECT COUNT(*) FROM drills WHERE parent_drill_id = d.id) as variation_count
        FROM drills d 
        WHERE d.id = $1
      ),
      variants AS (
        SELECT d.*, 
               (SELECT COUNT(*) FROM drills WHERE parent_drill_id = d.id) as variation_count
        FROM drills d 
        WHERE d.parent_drill_id = $1
      )
      SELECT 
        (SELECT row_to_json(parent.*) FROM parent) as parent,
        COALESCE(
          (SELECT json_agg(variants.*) FROM variants),
          '[]'::json
        ) as variants`,
      [parentDrillId]
    );

    // Return both parent and variant data
    return json({
      parent: result.rows[0].parent,
      variants: result.rows[0].variants
    });
  } catch (error) {
    console.error('Error fetching variant data:', error);
    return json({ error: 'Failed to fetch variant data' }, { status: 500 });
  }
} 