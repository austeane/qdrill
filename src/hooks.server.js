import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
// import { cleanup } from '@vercel/postgres'; // Commented out if not used
import { userService } from '$lib/server/services/userService';
import { SENTRY_DSN } from '$env/static/private';
import { dev } from '$app/environment';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: dev ? 1.0 : 0.1
  });
}

export const handleError = Sentry.handleErrorWithSentry(async function _handleError({ error }) {
	console.error('Uncaught error:', error);

	return {
		message: 'Internal error',
		code: error?.code ?? 'UNKNOWN'
	};
});

async function withSecurityHeaders({ event, resolve }) {
  const response = await resolve(event, {
    filterSerializedResponseHeaders: (name) => name.toLowerCase() === 'content-type'
  });
  const csp = "default-src 'self'; img-src 'self' data: blob:; media-src 'self' data: blob:; script-src 'self' 'unsafe-inline' https://*.vercel-insights.com https://*.sentry.io; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.vercel-insights.com https://*.sentry.io";
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

export const handle = sequence(Sentry.sentryHandle(), withSecurityHeaders, async function _handle({ event, resolve }) {
	// Retrieve the current session (if any) and expose it on event.locals so that
	// downstream load functions, endpoints and `authGuard` can access it.
	try {
		const sessionResult = await auth.api.getSession({
			headers: event.request.headers
		});

		if (sessionResult && sessionResult.user) {
			// Ensure the user exists in our database
			await userService.ensureUserExists(sessionResult.user);
			
			// Fetch user with role from database
			try {
				const dbUser = await userService.getById(sessionResult.user.id, ['id', 'name', 'email', 'image', 'role']);
				
				// Merge user data with role into session
				event.locals.session = {
					...sessionResult.session,
					user: {
						...sessionResult.user,
						role: dbUser.role || 'user'
					}
				};
				event.locals.user = event.locals.session.user;
			} catch (err) {
				// If we can't fetch the user, use the session data without role
				console.warn('Could not fetch user role:', err);
				event.locals.session = {
					...sessionResult.session,
					user: sessionResult.user
				};
				event.locals.user = sessionResult.user;
			}
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
