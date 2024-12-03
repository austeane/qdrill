import { json } from '@sveltejs/kit';
import { sql } from '@vercel/postgres';

// Vote on a poll option
export async function POST({ request }) {
    try {
        const { optionId } = await request.json();
        
        const { rows } = await sql`
            UPDATE poll_options 
            SET votes = votes + 1
            WHERE id = ${optionId}
            RETURNING *`;
            
        if (rows.length === 0) {
            return json({ error: 'Poll option not found' }, { status: 404 });
        }
        
        return json(rows[0]);
    } catch (error) {
        console.error('Error voting on poll option:', error);
        return json({ error: 'Failed to vote on poll option' }, { status: 500 });
    }
} 