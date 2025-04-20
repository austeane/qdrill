import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { cleanup } from '$lib/server/db';

export async function handle({ event, resolve }) {
    // Retrieve the current session (if any) and expose it on event.locals so that
    // downstream load functions, endpoints and `authGuard` can access it.
    try {
        const sessionResult = await auth.api.getSession({
            headers: event.request.headers
        });

        console.info('Better‑Auth getSession result:', sessionResult);

        if (sessionResult) {
            // merge user into session for backward compatibility
            event.locals.session = {
                ...sessionResult.session,
                user: sessionResult.user
            };
            event.locals.user = sessionResult.user;
        } else {
            console.info('No active session found for request');
        }
    } catch (err) {
        console.warn('Error while fetching session:', err);
        // If the request does not contain a valid session cookie, ignore the error –
        // unauthenticated requests are still allowed to proceed to public routes.
    }

    return svelteKitHandler({ event, resolve, auth });
}

export async function handleError({ error }) {
    console.error('Uncaught error:', error);
    
    // Clean up only the resources related to this request
    await cleanup();
    
    return {
        message: 'Internal error',
        code: error?.code ?? 'UNKNOWN'
    };
}