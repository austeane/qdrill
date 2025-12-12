import { kyselyDb, sql } from './db.js';

export async function saveFeedback({
	feedback,
	deviceInfo,
	page,
	name = null,
	email = null,
	feedbackType
}) {
	const res = await kyselyDb
		.insertInto('feedback')
		.values({
			feedback,
			device_info: deviceInfo,
			page_url: page,
			name,
			email,
			feedback_type: feedbackType,
			upvotes: 0
		})
		.returningAll()
		.executeTakeFirst();
	return res;
}

export async function getAllFeedback() {
	return await kyselyDb
		.selectFrom('feedback')
		.select(['id', 'feedback', 'feedback_type', 'timestamp', 'upvotes'])
		.orderBy('timestamp', 'desc')
		.execute();
}

export async function upvoteFeedback(id) {
	const res = await kyselyDb
		.updateTable('feedback')
		.set({ upvotes: sql`upvotes + 1` })
		.where('id', '=', id)
		.returning(['id', 'upvotes'])
		.executeTakeFirst();
	return res;
}

export async function deleteFeedback(id) {
	const res = await kyselyDb
		.deleteFrom('feedback')
		.where('id', '=', id)
		.returning('id')
		.executeTakeFirst();
	return res;
}
