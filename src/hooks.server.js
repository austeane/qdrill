import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { kyselyDb } from '$lib/server/db.js';
// import { cleanup } from '@vercel/postgres'; // Commented out if not used
import { dev } from '$app/environment';

if (!dev && process.env.SENTRY_DSN) {
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		environment: 'production',
		enabled: true,
		tracesSampleRate: 1.0
	});
}

export const handleError = Sentry.handleErrorWithSentry(async function _handleError({ error }) {
	console.error('Uncaught error:', error);

	return {
		message: 'Internal error',
		code: error?.code ?? 'UNKNOWN'
	};
});

export const handle = sequence(
	!dev ? Sentry.sentryHandle() : async ({ event, resolve }) => resolve(event),
	async function _handle({ event, resolve }) {
		// Retrieve the current session (if any) and expose it on event.locals so that
		// downstream load functions, endpoints and `authGuard` can access it.
		try {
			const sessionResult = await auth.api.getSession({
				headers: event.request.headers
			});

			if (sessionResult && sessionResult.user) {
				const enableUserEnsure = dev || process.env.ENABLE_HOOKS_USER_UPSERT === 'true';

				if (enableUserEnsure) {
					// Ensure user exists in our users table (short-term fix for missing users)
					try {
						const existing = await kyselyDb
							.selectFrom('users')
							.select(['id', 'role'])
							.where('id', '=', sessionResult.user.id)
							.executeTakeFirst();

						if (!existing) {
							// User missing in our table - insert them now
							console.warn(
								'[hooks] User missing from users table, creating:',
								sessionResult.user.id
							);
							await kyselyDb
								.insertInto('users')
								.values({
									id: sessionResult.user.id,
									email: sessionResult.user.email ?? null,
									name: sessionResult.user.name ?? null,
									image: sessionResult.user.image ?? null,
									role: 'user'
								})
								.onConflict((oc) => oc.column('id').doNothing())
								.execute();

							// Set default role for newly created user
							event.locals.session = {
								...sessionResult.session,
								user: {
									...sessionResult.user,
									role: 'user'
								}
							};
						} else {
							// User exists, use their actual role
							event.locals.session = {
								...sessionResult.session,
								user: {
									...sessionResult.user,
									role: existing.role || 'user'
								}
							};
						}
					} catch (err) {
						console.error('[hooks] Failed to ensure user exists:', err);
						// Report to Sentry in production
						if (!dev && process.env.SENTRY_DSN) {
							Sentry.captureException(err, {
								extra: {
									userId: sessionResult.user?.id,
									userEmail: sessionResult.user?.email,
									context: 'hooks.server.js - ensure user exists'
								}
							});
						}
						// Fallback: use session data as-is
						event.locals.session = {
							...sessionResult.session,
							user: {
								...sessionResult.user,
								role: sessionResult.user.role || 'user'
							}
						};
					}
				} else {
					// Trust Better Auth callbacks; keep hooks lightweight
					event.locals.session = {
						...sessionResult.session,
						user: {
							...sessionResult.user,
							role: sessionResult.user.role || 'user'
						}
					};
				}

				event.locals.user = event.locals.session.user;
			} else {
				// Debug logging for auth issues
				if (dev && event.url.pathname.includes('/teams')) {
					console.log(
						'[auth] No session for teams route; Cookie header:',
						event.request.headers.get('cookie')
					);
				}
			}
		} catch (err) {
			console.warn('Error while fetching session or ensuring user exists:', err);
			// If the request does not contain a valid session cookie, ignore the error –
			// unauthenticated requests are still allowed to proceed to public routes.
		}

		return svelteKitHandler({ event, resolve, auth });
	}
);

// Commented out or removed if cleanup is not actively used
// export async function onłądīt() {
//  await cleanup();
// }
