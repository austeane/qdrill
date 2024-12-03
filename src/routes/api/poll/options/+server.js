import { json } from '@sveltejs/kit';
import { sql } from '@vercel/postgres';
import { dev } from '$app/environment';

// Get all poll options
export async function GET() {
    try {
        const { rows } = await sql`
            SELECT * FROM poll_options 
            ORDER BY votes DESC, created_at DESC`;
        return json({ options: rows });
    } catch (error) {
        console.error('Error fetching poll options:', error);
        return json({ error: 'Failed to fetch poll options' }, { status: 500 });
    }
}

// Add a new poll option
export async function POST({ request }) {
    try {
        const { description } = await request.json();
        
        if (!description || description.length < 2 || description.length > 100) {
            return json(
                { error: 'Description must be between 2 and 100 characters' },
                { status: 400 }
            );
        }

        const { rows } = await sql`
            INSERT INTO poll_options (description)
            VALUES (${description})
            RETURNING *`;
            
        return json(rows[0]);
    } catch (error) {
        console.error('Error creating poll option:', error);
        return json({ error: 'Failed to create poll option' }, { status: 500 });
    }
}

// Update a poll option (for admin to add drill link)
export async function PUT({ request }) {
    if (!dev) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, drill_link } = await request.json();
        
        const { rows } = await sql`
            UPDATE poll_options 
            SET drill_link = ${drill_link}
            WHERE id = ${id}
            RETURNING *`;
            
        if (rows.length === 0) {
            return json({ error: 'Poll option not found' }, { status: 404 });
        }
        
        return json(rows[0]);
    } catch (error) {
        console.error('Error updating poll option:', error);
        return json({ error: 'Failed to update poll option' }, { status: 500 });
    }
}

// Delete a poll option (admin only)
export async function DELETE({ request }) {
    if (!dev) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await request.json();
        
        const { rows } = await sql`
            DELETE FROM poll_options 
            WHERE id = ${id}
            RETURNING *`;
            
        if (rows.length === 0) {
            return json({ error: 'Poll option not found' }, { status: 404 });
        }
        
        return json(rows[0]);
    } catch (error) {
        console.error('Error deleting poll option:', error);
        return json({ error: 'Failed to delete poll option' }, { status: 500 });
    }
} 