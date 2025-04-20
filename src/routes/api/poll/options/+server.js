import { json } from '@sveltejs/kit';
import { sql } from '@vercel/postgres';
import { dev } from '$app/environment';
import { handleApiError } from '../../utils/handleApiError.js';
import { ForbiddenError, NotFoundError, ValidationError } from '$lib/server/errors.js';

// Get all poll options
export async function GET() {
    try {
        const { rows } = await sql`
            SELECT * FROM poll_options 
            ORDER BY votes DESC, created_at DESC`;
        return json({ options: rows });
    } catch (error) {
        return handleApiError(error);
    }
}

// Add a new poll option
export async function POST({ request }) {
    try {
        const { description } = await request.json();
        
        if (!description || description.length < 2 || description.length > 100) {
            // Throw ValidationError for consistent handling
            throw new ValidationError('Description must be between 2 and 100 characters');
        }

        const { rows } = await sql`
            INSERT INTO poll_options (description)
            VALUES (${description})
            RETURNING *`;
            
        return json(rows[0], { status: 201 }); // Use 201 Created
    } catch (error) {
        return handleApiError(error);
    }
}

// Update a poll option (for admin to add drill link)
export async function PUT({ request }) {
    // Replace dev check with proper role-based authorization if available
    if (!dev) {
        throw new ForbiddenError('Unauthorized access to update poll option');
    }

    try {
        const { id, drill_link } = await request.json();
        
        if (!id || !drill_link) {
            throw new ValidationError('Missing id or drill_link in request body');
        }
        // Basic URL validation (can be enhanced)
        if (!drill_link.startsWith('/')) { 
             throw new ValidationError('Drill link must be a relative path starting with /');
        }

        const { rows, rowCount } = await sql`
            UPDATE poll_options 
            SET drill_link = ${drill_link}
            WHERE id = ${id}
            RETURNING *`;
            
        if (rowCount === 0) {
            throw new NotFoundError('Poll option not found');
        }
        
        return json(rows[0]);
    } catch (error) {
        return handleApiError(error);
    }
}

// Delete a poll option (admin only)
export async function DELETE({ request }) {
    // Replace dev check with proper role-based authorization if available
    if (!dev) {
        throw new ForbiddenError('Unauthorized access to delete poll option');
    }

    try {
        // Assuming ID comes from request body, but should ideally be a URL parameter
        const { id } = await request.json();
        
        if (!id) {
            throw new ValidationError('Missing id in request body');
        }

        const { rowCount } = await sql`
            DELETE FROM poll_options 
            WHERE id = ${id}`; // No need for RETURNING if just confirming deletion
            
        if (rowCount === 0) {
            throw new NotFoundError('Poll option not found');
        }
        
        return new Response(null, { status: 204 }); // Use 204 No Content
    } catch (error) {
        return handleApiError(error);
    }
} 