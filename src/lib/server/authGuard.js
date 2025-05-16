import { error } from '@sveltejs/kit';

export function authGuard(handler) {
	return async (event) => {
		// With Better Auth, session is available directly on event.locals
		const session = event.locals.session;

		if (!session?.user) {
			throw error(401, {
				message: 'Unauthorized - Please sign in to continue'
			});
		}
		return handler(event);
	};
}
