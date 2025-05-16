import { json } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import * as db from '$lib/server/db';
import { handleApiError } from '../utils/handleApiError.js';
import { ForbiddenError, NotFoundError } from '$lib/server/errors.js';

// GET: Fetch comments for a specific drill or practice plan
export async function GET({ url }) {
	const drillId = url.searchParams.get('drillId');
	const practicePlanId = url.searchParams.get('practicePlanId');

	if (!drillId && !practicePlanId) {
		return json(
			{ error: { code: 'BAD_REQUEST', message: 'Missing drillId or practicePlanId' } },
			{ status: 400 }
		);
	}

	try {
		let query =
			'SELECT c.*, u.name AS user_name FROM comments c JOIN users u ON c.user_id = u.id WHERE ';
		let params = [];
		if (drillId) {
			query += 'c.drill_id = $1';
			params.push(parseInt(drillId, 10));
		} else {
			query += 'c.practice_plan_id = $1';
			params.push(parseInt(practicePlanId, 10));
		}
		query += ' ORDER BY c.created_at ASC';

		const result = await db.query(query, params);
		return json(result.rows);
	} catch (error) {
		return handleApiError(error);
	}
}

// POST: Add a new comment (authenticated)
export const POST = authGuard(async ({ request, locals }) => {
	const session = locals.session;
	const userId = session?.user?.id;
	const { drillId, practicePlanId, content } = await request.json();

	if (!content || (!drillId && !practicePlanId)) {
		return json(
			{
				error: {
					code: 'BAD_REQUEST',
					message: 'Content and either drillId or practicePlanId are required'
				}
			},
			{ status: 400 }
		);
	}

	try {
		const result = await db.query(
			`INSERT INTO comments (user_id, drill_id, practice_plan_id, content) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
			[
				userId,
				drillId ? parseInt(drillId, 10) : null,
				practicePlanId ? parseInt(practicePlanId, 10) : null,
				content
			]
		);
		return json(result.rows[0], { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
});

// DELETE: Delete a comment (authenticated and authorized)
export const DELETE = authGuard(async ({ url, locals }) => {
	const commentId = url.searchParams.get('id');
	const session = locals.session;
	const userId = session?.user?.id;

	if (!commentId) {
		return json(
			{ error: { code: 'BAD_REQUEST', message: 'Comment ID is required' } },
			{ status: 400 }
		);
	}

	try {
		const commentResult = await db.query('SELECT * FROM comments WHERE id = $1', [commentId]);
		if (commentResult.rows.length === 0) {
			throw new NotFoundError('Comment not found');
		}

		const comment = commentResult.rows[0];
		if (comment.user_id !== userId) {
			throw new ForbiddenError('User is not authorized to delete this comment');
		}

		await db.query('DELETE FROM comments WHERE id = $1', [commentId]);
		return new Response(null, { status: 204 });
	} catch (error) {
		return handleApiError(error);
	}
});
