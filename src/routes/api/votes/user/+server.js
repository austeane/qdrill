import { json } from '@sveltejs/kit';
import { kyselyDb } from '$lib/server/db';
import { handleApiError } from '../../utils/handleApiError.js';

export async function GET({ url, locals }) {
	const session = locals.session;
	const userId = session?.user?.id;

	if (!userId) {
		return json({ vote: 0 });
	}

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
			const row = await kyselyDb
				.selectFrom('votes')
				.select('vote')
				.where('user_id', '=', userId)
				.where('drill_id', '=', parseInt(drillId, 10))
				.executeTakeFirst();
			return json(row || { vote: 0 });
		} else {
			const row = await kyselyDb
				.selectFrom('votes')
				.select('vote')
				.where('user_id', '=', userId)
				.where('practice_plan_id', '=', parseInt(practicePlanId, 10))
				.executeTakeFirst();
			return json(row || { vote: 0 });
		}
	} catch (error) {
		return handleApiError(error);
	}
}
