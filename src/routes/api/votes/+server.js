import { json } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import { kyselyDb, sql } from '$lib/server/db';
import { handleApiError } from '../utils/handleApiError.js';
import { NotFoundError } from '$lib/server/errors.js';

// POST: Cast or update a vote
export const POST = authGuard(async ({ request, locals }) => {
	const session = locals.session;
	const userId = session.user.id;
	const body = await request.json();

	const { drillId, practicePlanId, vote } = body;

	if ((!drillId && !practicePlanId) || ![1, -1].includes(vote)) {
		console.error('Invalid vote input:', { drillId, practicePlanId, vote });
		return json(
			{
				error: {
					code: 'BAD_REQUEST',
					message: 'Invalid input: Requires drillId or practicePlanId, and vote must be 1 or -1'
				}
			},
			{ status: 400 }
		);
	}

	try {
		if (drillId) {
			const drillIdInt = parseInt(drillId, 10);
			const drill = await kyselyDb
				.selectFrom('drills')
				.select('name')
				.where('id', '=', drillIdInt)
				.executeTakeFirst();

			if (!drill) {
				throw new NotFoundError('Drill not found');
			}
			const drillName = drill.name;

			await kyselyDb
				.insertInto('votes')
				.values({
					user_id: userId,
					drill_id: drillIdInt,
					vote,
					item_name: drillName
				})
				.onConflict((oc) =>
					oc.columns(['user_id', 'drill_id']).doUpdateSet({
						vote,
						updated_at: sql`now()`
					})
				)
				.execute();
		} else {
			const planIdInt = parseInt(practicePlanId, 10);
			const plan = await kyselyDb
				.selectFrom('practice_plans')
				.select('name')
				.where('id', '=', planIdInt)
				.executeTakeFirst();

			if (!plan) {
				throw new NotFoundError('Practice plan not found');
			}
			const planName = plan.name;

			await kyselyDb
				.insertInto('votes')
				.values({
					user_id: userId,
					practice_plan_id: planIdInt,
					vote,
					item_name: planName
				})
				.onConflict((oc) =>
					oc.columns(['user_id', 'practice_plan_id']).doUpdateSet({
						vote,
						updated_at: sql`now()`
					})
				)
				.execute();
		}

		return json({ message: 'Vote recorded successfully' });
	} catch (error) {
		return handleApiError(error);
	}
});

// DELETE: Remove a vote
export const DELETE = authGuard(async ({ url, locals }) => {
	const session = locals.session;
	const userId = session?.user?.id;

	const drillId = url.searchParams.get('drillId');
	const practicePlanId = url.searchParams.get('practicePlanId');

	if (!drillId && !practicePlanId) {
		return json(
			{ error: { code: 'BAD_REQUEST', message: 'Missing drillId or practicePlanId' } },
			{ status: 400 }
		);
	}

	try {
		if (drillId) {
			const drillIdInt = parseInt(drillId, 10);
			await kyselyDb
				.deleteFrom('votes')
				.where('user_id', '=', userId)
				.where('drill_id', '=', drillIdInt)
				.execute();
		} else {
			const planIdInt = parseInt(practicePlanId, 10);
			await kyselyDb
				.deleteFrom('votes')
				.where('user_id', '=', userId)
				.where('practice_plan_id', '=', planIdInt)
				.execute();
		}

		return new Response(null, { status: 204 });
	} catch (error) {
		return handleApiError(error);
	}
});

// GET: Fetch vote counts for a drill or practice plan
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
		let qb = kyselyDb
			.selectFrom('votes')
			.select([
				sql`COALESCE(SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END), 0)`.as('upvotes'),
				sql`COALESCE(SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END), 0)`.as('downvotes')
			]);

		if (drillId) {
			qb = qb.where('drill_id', '=', parseInt(drillId, 10));
		} else {
			qb = qb.where('practice_plan_id', '=', parseInt(practicePlanId, 10));
		}

		const row = await qb.executeTakeFirst();
		return json({
			upvotes: Number(row?.upvotes ?? 0),
			downvotes: Number(row?.downvotes ?? 0)
		});
	} catch (error) {
		return handleApiError(error);
	}
}
