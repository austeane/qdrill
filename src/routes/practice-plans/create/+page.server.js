// import { redirect } from '@sveltejs/kit'; // This is no longer used

const COOKIE_NAME = 'pendingPlanToken';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies, fetch }) {
    const token = cookies.get(COOKIE_NAME);
    let pendingPlanData = null;

    if (token) {
        console.log(`[Load /practice-plans/create] Found pending plan token: ${token}`);
        try {
            // Fetch the pending data using the server-side fetch
            const response = await fetch('/api/pending-plans'); // Relative fetch works server-side
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.plan) {
                    pendingPlanData = data.plan;
                    console.log('[Load /practice-plans/create] Successfully loaded pending plan data.');

                    // IMPORTANT: Delete the pending plan immediately after successful retrieval
                    try {
                        const deleteResponse = await fetch('/api/pending-plans', { method: 'DELETE' });
                        if (!deleteResponse.ok) {
                            console.error('[Load /practice-plans/create] Failed to delete pending plan after load.');
                            // Log error, but continue loading the page with the data
                        } else {
                            console.log('[Load /practice-plans/create] Pending plan deleted after load.');
                        }
                    } catch (deleteError) {
                        console.error('[Load /practice-plans/create] Error deleting pending plan after load:', deleteError);
                    }
                } else {
                    // Data retrieved was empty or malformed, clear cookie as precaution
                     console.log('[Load /practice-plans/create] Pending plan data from API was null/empty.');
                     cookies.delete(COOKIE_NAME, { path: '/' });
                }
            } else {
                console.error(`[Load /practice-plans/create] Error fetching pending plan: ${response.status}`);
                // Clear cookie if fetch failed
                 cookies.delete(COOKIE_NAME, { path: '/' });
            }
        } catch (error) {
            console.error('[Load /practice-plans/create] Exception fetching/processing pending plan:', error);
            // Clear cookie on exception
             cookies.delete(COOKIE_NAME, { path: '/' });
        }
    }

    // Return the potentially loaded pending data
    return {
        pendingPlanData
    };
}