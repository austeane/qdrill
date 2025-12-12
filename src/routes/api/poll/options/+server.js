import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { kyselyDb } from '$lib/server/db.js';
import { handleApiError } from '../../utils/handleApiError.js';
import { ForbiddenError, NotFoundError, ValidationError } from '$lib/server/errors.js';

// Get all poll options
export async function GET() {
	try {
		const options = await kyselyDb
			.selectFrom('poll_options')
			.selectAll()
			.orderBy('votes', 'desc')
			.orderBy('created_at', 'desc')
			.execute();
		return json({ options });
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

		const inserted = await kyselyDb
			.insertInto('poll_options')
			.values({ description })
			.returningAll()
			.executeTakeFirst();

		if (!inserted) {
			throw new Error('Failed to insert poll option');
		}

		return json(inserted, { status: 201 }); // Use 201 Created
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

		const idInt = Number.parseInt(String(id), 10);
		if (!Number.isFinite(idInt)) {
			throw new ValidationError('Invalid id');
		}

		const updated = await kyselyDb
			.updateTable('poll_options')
			.set({ drill_link })
			.where('id', '=', idInt)
			.returningAll()
			.executeTakeFirst();

		if (!updated) {
			throw new NotFoundError('Poll option not found');
		}

		return json(updated);
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

		const idInt = Number.parseInt(String(id), 10);
		if (!Number.isFinite(idInt)) {
			throw new ValidationError('Invalid id');
		}

		const deleted = await kyselyDb
			.deleteFrom('poll_options')
			.where('id', '=', idInt)
			.returning('id')
			.executeTakeFirst();

		if (!deleted) {
			throw new NotFoundError('Poll option not found');
		}

		return new Response(null, { status: 204 }); // Use 204 No Content
	} catch (error) {
		return handleApiError(error);
	}
}
