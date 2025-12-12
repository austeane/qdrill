import { json } from '@sveltejs/kit';
import { kyselyDb, sql } from '$lib/server/db.js';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';

export async function POST({ locals, params }) {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		// Fetch plan
		const plan = await kyselyDb
			.selectFrom('practice_plans')
			.selectAll()
			.where('id', '=', params.id)
			.executeTakeFirst();

		if (!plan) {
			return json({ error: 'Practice plan not found' }, { status: 404 });
		}

		// Permission: admin of team or creator of plan
		if (plan.team_id) {
			const member = await teamMemberService.getMember(plan.team_id, locals.user.id);
			if (!member || (member.role !== 'admin' && plan.created_by !== locals.user.id)) {
				return json({ error: 'Forbidden' }, { status: 403 });
			}
		} else if (plan.created_by !== locals.user.id) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const updated = await kyselyDb
			.updateTable('practice_plans')
			.set({
				is_published: true,
				published_at: sql`now()`,
				updated_at: sql`now()`
			})
			.where('id', '=', params.id)
			.returningAll()
			.executeTakeFirst();

		return json(updated);
	} catch (error) {
		return json({ error: error.message }, { status: error.statusCode || 500 });
	}
}

export async function DELETE({ locals, params }) {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		// Fetch plan
		const plan = await kyselyDb
			.selectFrom('practice_plans')
			.selectAll()
			.where('id', '=', params.id)
			.executeTakeFirst();

		if (!plan) {
			return json({ error: 'Practice plan not found' }, { status: 404 });
		}

		// Permission: admin of team or creator of plan
		if (plan.team_id) {
			const member = await teamMemberService.getMember(plan.team_id, locals.user.id);
			if (!member || (member.role !== 'admin' && plan.created_by !== locals.user.id)) {
				return json({ error: 'Forbidden' }, { status: 403 });
			}
		} else if (plan.created_by !== locals.user.id) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const updated = await kyselyDb
			.updateTable('practice_plans')
			.set({
				is_published: false,
				published_at: null,
				updated_at: sql`now()`
			})
			.where('id', '=', params.id)
			.returningAll()
			.executeTakeFirst();

		return json(updated);
	} catch (error) {
		return json({ error: error.message }, { status: error.statusCode || 500 });
	}
}
