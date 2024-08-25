import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';

const client = createClient();
await client.connect();

export async function GET() {
  try {
    const result = await client.query('SELECT skill, usage_count FROM skills ORDER BY usage_count DESC');
    return json(result.rows.map(row => row.skill));
  } catch (error) {
    console.error('Error fetching skills:', error);
    return json({ error: 'Failed to retrieve skills' }, { status: 500 });
  }
}

export async function POST({ request }) {
  const { skill, drillId } = await request.json();
  try {
    await client.query(
      `INSERT INTO skills (skill, drills_used_in, usage_count) 
       VALUES ($1, 1, 1) 
       ON CONFLICT (skill) DO UPDATE SET 
       drills_used_in = skills.drills_used_in + 1,
       usage_count = skills.usage_count + 1`,
      [skill]
    );
    return json({ success: true });
  } catch (error) {
    console.error('Error adding skill:', error);
    return json({ error: 'Failed to add skill' }, { status: 500 });
  }
}
