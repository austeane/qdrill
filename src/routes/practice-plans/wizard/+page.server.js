import { error } from '@sveltejs/kit';
import { kyselyDb, sql } from '$lib/server/db';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	try {
		// Load all drills for the drill selection step
		const drills = await kyselyDb
			.selectFrom('drills')
			.selectAll()
			.orderBy('name', 'asc')
			.execute();

		return {
			drills
		};
	} catch (err) {
		console.error('Error loading drills:', err);
		throw error(500, 'Failed to load drills');
	}
}

/** @type {import('./$types').Actions} */
export const actions = {
	// Save draft
	saveDraft: async ({ request, locals }) => {
		const formData = await request.formData();
		const data = JSON.parse(formData.get('data'));

		try {
			// For anonymous users, store draft in session or return temporary ID
			if (!locals.user) {
				return {
					success: true,
					id: 'temp-draft', // or generate a temporary ID
					anonymous: true
				};
			}

			// For logged-in users, save to database
			const result = await kyselyDb
				.insertInto('practice_plan_drafts')
				.values({
					user_id: locals.user.id,
					data,
					created_at: sql`now()`,
					updated_at: sql`now()`
				})
				.onConflict((oc) =>
					oc.column('user_id').doUpdateSet({
						data,
						updated_at: sql`now()`
					})
				)
				.returning('id')
				.executeTakeFirst();

			return {
				success: true,
				id: result.id
			};
		} catch (err) {
			console.error('Error saving draft:', err);
			throw error(500, 'Failed to save draft');
		}
	},

	// Load draft
	loadDraft: async ({ locals }) => {
		try {
			const row = await kyselyDb
				.selectFrom('practice_plan_drafts')
				.select('data')
				.where('user_id', '=', locals.user.id)
				.orderBy('updated_at', 'desc')
				.limit(1)
				.executeTakeFirst();

			if (!row) {
				return {
					success: true,
					data: null
				};
			}

			return {
				success: true,
				data: row.data
			};
		} catch (err) {
			console.error('Error loading draft:', err);
			throw error(500, 'Failed to load draft');
		}
	},

	// Delete draft
	deleteDraft: async ({ locals }) => {
		try {
			await kyselyDb
				.deleteFrom('practice_plan_drafts')
				.where('user_id', '=', locals.user.id)
				.execute();

			return {
				success: true
			};
		} catch (err) {
			console.error('Error deleting draft:', err);
			throw error(500, 'Failed to delete draft');
		}
	}
};
