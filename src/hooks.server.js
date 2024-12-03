import { handle as authHandle } from "$lib/server/auth"
import { cleanup } from '$lib/server/db';

export const handle = authHandle

export async function handleError({ error }) {
    console.error('Uncaught error:', error);
    
    // Clean up only the resources related to this request
    await cleanup();
    
    return {
        message: 'Internal error',
        code: error?.code ?? 'UNKNOWN'
    };
}