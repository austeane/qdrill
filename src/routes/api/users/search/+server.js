import { json } from '@sveltejs/kit';
import { userService } from '$lib/server/services/userService';

export async function GET({ locals, url }) {
	if (!locals.user) {
		return json({ error: { message: 'Unauthorized' } }, { status: 401 });
	}

	const email = url.searchParams.get('email');

	if (!email) {
		return json({ error: { message: 'Email parameter is required' } }, { status: 400 });
	}

	try {
		const user = await userService.getUserByEmail(email);

		// Return array for consistency with search results
		return json([
			{
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image
			}
		]);
	} catch (error) {
		if (error.message.includes('not found')) {
			return json([]);
		}
		console.error('Error searching for user:', error);
		return json({ error: { message: 'Failed to search users' } }, { status: 500 });
	}
}
