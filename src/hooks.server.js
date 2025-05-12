import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { cleanup } from '$lib/server/db';
import { userService } from '$lib/server/services/userService';

export async function handle({ event, resolve }) {
    // Retrieve the current session (if any) and expose it on event.locals so that
    // downstream load functions, endpoints and `authGuard` can access it.
    try {
        const sessionResult = await auth.api.getSession({
            headers: event.request.headers
        });

        if (sessionResult && sessionResult.user) { // Ensure user object exists
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
}

export async function handleError({ error }) {
    console.error('Uncaught error:', error);
    
    return {
        message: 'Internal error',
        code: error?.code ?? 'UNKNOWN'
    };
}