import { redirect } from '@sveltejs/kit';

export async function load({ params }) {
	const { id } = params;

	// Redirect to the main practice plan edit page
	// The editing functionality is the same regardless of team context
	throw redirect(303, `/practice-plans/${id}/edit`);
}
