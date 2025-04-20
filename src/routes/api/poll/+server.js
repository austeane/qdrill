import { json } from '@sveltejs/kit';
import { sql } from '@vercel/postgres';
import { handleApiError } from '../utils/handleApiError.js';
import { NotFoundError } from '$lib/server/errors.js';

// Vote on a poll option
export async function POST({ request }) {
    try {
        const { optionId } = await request.json();
        
        // Input validation (basic)
        if (!optionId) {
            return json({ error: { code: 'BAD_REQUEST', message: 'Missing optionId in request body' } }, { status: 400 });
        }
        
        const { rows, rowCount } = await sql`
            UPDATE poll_options 
            SET votes = votes + 1
            WHERE id = ${optionId}
            RETURNING *`;
            
        if (rowCount === 0) {
            throw new NotFoundError('Poll option not found'); // Throw custom error
        }
        
        return json(rows[0]); // Return updated option
    } catch (error) {
        return handleApiError(error); // Use handleApiError
    }
} 