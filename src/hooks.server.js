import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
// import { cleanup } from '@vercel/postgres'; // Commented out if not used
import { userService } from '$lib/server/services/userService';

Sentry.init({
	dsn: 'https://f20c97c5f330ac4e17cc678ded5b49da@o4509308595208192.ingest.us.sentry.io/4509308596715520',
	tracesSampleRate: 1
});

export const handleError = Sentry.handleErrorWithSentry(async function _handleError({ error }) {
	console.error('Uncaught error:', error);

	return {
		message: 'Internal error',
		code: error?.code ?? 'UNKNOWN'
	};
});

export const handle = sequence(Sentry.sentryHandle(), async function _handle({ event, resolve }) {
	// Retrieve the current session (if any) and expose it on event.locals so that
	// downstream load functions, endpoints and `authGuard` can access it.
	try {
		const sessionResult = await auth.api.getSession({
			headers: event.request.headers
		});

		if (sessionResult && sessionResult.user) {
			// Ensure user object exists
			// merge user into session for backward compatibility
			event.locals.session = {
				...sessionResult.session,
				user: sessionResult.user
			};
			event.locals.user = sessionResult.user;

			// Ensure the user exists in our database
			await userService.ensureUserExists(sessionResult.user);
		} else {
			// console.info('No active session found for request');
		}
	} catch (err) {
		console.warn('Error while fetching session or ensuring user exists:', err);
		// If the request does not contain a valid session cookie, ignore the error –
		// unauthenticated requests are still allowed to proceed to public routes.
	}

	return svelteKitHandler({ event, resolve, auth });
});

// Commented out or removed if cleanup is not actively used
// export async function onłądīt() {
//  await cleanup();
// }
