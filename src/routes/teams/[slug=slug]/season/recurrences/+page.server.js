import { redirect } from '@sveltejs/kit';

export async function load({ locals, parent }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Get team data from parent layout
	const { userRole } = await parent();

	if (!userRole) {
		throw redirect(303, '/');
	}

	return {
		// team and userRole are available from parent layout
	};
}
