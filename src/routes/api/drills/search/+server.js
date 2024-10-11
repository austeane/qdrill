import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';

export async function GET({ url }) {
  const query = url.searchParams.get('query') || '';
  const client = createClient();
  await client.connect();

  try {
    let result;
    if (query.trim() === '') {
      // If no query is provided, fetch all drills (limit to a reasonable number)
      result = await client.query(
        `SELECT id, name 
         FROM drills 
         ORDER BY name 
         LIMIT 50`
      );
    } else {
      // If a query is provided, search for matching drills
      result = await client.query(
        `SELECT id, name 
         FROM drills 
         WHERE name ILIKE $1 
         ORDER BY name 
         LIMIT 10`,
        [`%${query}%`]
      );
    }
    return json(result.rows);
  } catch (error) {
    console.error('Error fetching drill suggestions:', error);
    return json({ error: 'Error fetching drill suggestions' }, { status: 500 });
  } finally {
    await client.end();
  }
}