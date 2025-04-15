import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { cleanup } from '$lib/server/db';

export async function handle({ event, resolve }) {
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