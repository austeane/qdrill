import { error } from '@sveltejs/kit';
import { query } from '$lib/server/db';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	try {
		// Load all drills for the drill selection step
		const drills = await query(`
            SELECT *
            FROM drills
            ORDER BY name ASC
        `);

		return {
			drills: drills.rows
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
			const result = await query(
				`
                INSERT INTO practice_plan_drafts (
                    user_id,
                    data,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, NOW(), NOW())
                ON CONFLICT (user_id) DO UPDATE
                SET data = $2, updated_at = NOW()
                RETURNING id
            `,
				[locals.user.id, data]
			);

			return {
				success: true,
				id: result.rows[0].id
			};
		} catch (err) {
			console.error('Error saving draft:', err);
			throw error(500, 'Failed to save draft');
		}
	},

	// Load draft
	loadDraft: async ({ locals }) => {
		try {
			const result = await query(
				`
                SELECT data
                FROM practice_plan_drafts
                WHERE user_id = $1
                ORDER BY updated_at DESC
                LIMIT 1
            `,
				[locals.user.id]
			);

			if (result.rows.length === 0) {
				return {
					success: true,
					data: null
				};
			}

			return {
				success: true,
				data: result.rows[0].data
			};
		} catch (err) {
			console.error('Error loading draft:', err);
			throw error(500, 'Failed to load draft');
		}
	},

	// Delete draft
	deleteDraft: async ({ locals }) => {
		try {
			await query(
				`
                DELETE FROM practice_plan_drafts
                WHERE user_id = $1
            `,
				[locals.user.id]
			);

			return {
				success: true
			};
		} catch (err) {
			console.error('Error deleting draft:', err);
			throw error(500, 'Failed to delete draft');
		}
	}
};
