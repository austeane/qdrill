import { kyselyDb, sql } from '$lib/server/db.js';
import { NotFoundError } from '$lib/server/errors.js';

async function save(token, data, expiresAt) {
	await kyselyDb
		.insertInto('pending_practice_plans')
		.values({ token, data, expires_at: expiresAt })
		.onConflict((oc) =>
			oc.column('token').doUpdateSet({
				data,
				expires_at: expiresAt
			})
		)
		.execute();
	await cleanupExpired();
}

async function get(token) {
	await cleanupExpired();
	const row = await kyselyDb
		.selectFrom('pending_practice_plans')
		.select('data')
		.where('token', '=', token)
		.where('expires_at', '>', sql`now()`)
		.executeTakeFirst();
	if (!row) {
		throw new NotFoundError('Pending plan not found or expired');
	}
	return row.data;
}

async function deletePlan(token) {
	await kyselyDb.deleteFrom('pending_practice_plans').where('token', '=', token).execute();
}

async function cleanupExpired() {
	await kyselyDb
		.deleteFrom('pending_practice_plans')
		.where('expires_at', '<', sql`now()`)
		.execute();
}

export const pendingPracticePlanService = {
	save,
	get,
	delete: deletePlan,
	_cleanupExpired: cleanupExpired
};
