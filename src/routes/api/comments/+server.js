import { json } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import { kyselyDb } from '$lib/server/db';
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
		const drillIdInt = drillId ? parseInt(drillId, 10) : null;
		const planIdInt = practicePlanId ? parseInt(practicePlanId, 10) : null;

		let qb = kyselyDb
			.selectFrom('comments as c')
			.innerJoin('users as u', 'c.user_id', 'u.id')
			.selectAll('c')
			.select('u.name as user_name')
			.orderBy('c.created_at', 'asc');

		if (drillIdInt) {
			qb = qb.where('c.drill_id', '=', drillIdInt);
		} else if (planIdInt) {
			qb = qb.where('c.practice_plan_id', '=', planIdInt);
		}

		const comments = await qb.execute();
		return json(comments);
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
		const inserted = await kyselyDb
			.insertInto('comments')
			.values({
				user_id: userId,
				drill_id: drillId ? parseInt(drillId, 10) : null,
				practice_plan_id: practicePlanId ? parseInt(practicePlanId, 10) : null,
				content
			})
			.returningAll()
			.executeTakeFirst();

		return json(inserted, { status: 201 });
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
		const commentIdInt = parseInt(commentId, 10);
		const comment = await kyselyDb
			.selectFrom('comments')
			.selectAll()
			.where('id', '=', commentIdInt)
			.executeTakeFirst();

		if (!comment) {
			throw new NotFoundError('Comment not found');
		}

		if (comment.user_id !== userId) {
			throw new ForbiddenError('User is not authorized to delete this comment');
		}

		await kyselyDb.deleteFrom('comments').where('id', '=', commentIdInt).execute();
		return new Response(null, { status: 204 });
	} catch (error) {
		return handleApiError(error);
	}
});
