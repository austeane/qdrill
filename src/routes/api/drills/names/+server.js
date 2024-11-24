import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';

const client = createClient();
await client.connect();

export const GET = async (event) => {
  const session = await event.locals.getSession();
  const userId = session?.user?.id;

  try {
    const result = await client.query(`
      SELECT id, name, visibility, created_by, parent_drill_id
      FROM drills
    `);

    const drills = result.rows.filter(drill => {
      if (drill.visibility === 'public') {
        return true;
      } else if (drill.visibility === 'unlisted') {
        return true;
      } else if (drill.visibility === 'private') {
        return drill.created_by === userId;
      }
      return false;
    });

    return json(drills);
  } catch (error) {
    console.error('Error fetching drill names:', error);
    return json({ error: 'Failed to fetch drill names' }, { status: 500 });
  }
};