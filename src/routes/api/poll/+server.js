import { json } from '@sveltejs/kit';
import { kyselyDb, sql } from '$lib/server/db';
import { handleApiError } from '../utils/handleApiError.js';
import { NotFoundError } from '$lib/server/errors.js';

// Vote on a poll option
export async function POST({ request }) {
	try {
		const { optionId } = await request.json();

		// Input validation (basic)
		if (!optionId) {
			return json(
				{ error: { code: 'BAD_REQUEST', message: 'Missing optionId in request body' } },
				{ status: 400 }
			);
		}

		const optionIdInt = Number.parseInt(String(optionId), 10);
		if (!Number.isFinite(optionIdInt)) {
			return json(
				{ error: { code: 'BAD_REQUEST', message: 'Invalid optionId' } },
				{ status: 400 }
			);
		}

		const updated = await kyselyDb
			.updateTable('poll_options')
			.set({ votes: sql`votes + 1` })
			.where('id', '=', optionIdInt)
			.returningAll()
			.executeTakeFirst();

		if (!updated) {
			throw new NotFoundError('Poll option not found'); // Throw custom error
		}

		return json(updated); // Return updated option
	} catch (error) {
		return handleApiError(error); // Use handleApiError
	}
}
