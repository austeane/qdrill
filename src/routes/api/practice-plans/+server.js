import { json } from '@sveltejs/kit';
import * as db from '$lib/server/db';

export async function GET({ url, locals }) {
    const userId = locals.user?.id;
    let retries = 2;
    
    while (retries > 0) {
        try {
            let query = `
                SELECT * FROM practice_plans 
                WHERE visibility = 'public'
                OR visibility = 'unlisted'
                ${userId ? `OR (visibility = 'private' AND user_id = $1)` : ''}
                ORDER BY created_at DESC
            `;
            
            const params = userId ? [userId] : [];
            const result = await db.query(query, params);
            return json(result.rows);
            
        } catch (error) {
            console.error(`Database error (${retries} retries left):`, error);
            
            if (error.code === '57P01' && retries > 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                retries--;
                continue;
            }
            
            return json(
                { error: 'Failed to fetch practice plans', details: error.message },
                { status: 500 }
            );
        }
    }
}
