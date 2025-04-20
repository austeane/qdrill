import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { pendingPracticePlanService } from '$lib/server/services/pendingPracticePlanService'; // Assuming this service exists

const COOKIE_NAME = 'pendingPlanToken';
const COOKIE_OPTS = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'lax',
    maxAge: 60 * 60 * 1 // 1 hour expiry for the cookie/pending plan
};

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
    try {
        const planData = await request.json();
        const token = randomUUID();
        const expiresAt = new Date(Date.now() + COOKIE_OPTS.maxAge * 1000);

        // Store the pending plan data using the service
        await pendingPracticePlanService.save(token, planData, expiresAt);

        // Set the cookie
        cookies.set(COOKIE_NAME, token, COOKIE_OPTS);

        console.log(`[API /api/pending-plans] Saved pending plan with token: ${token}`);
        return json({ success: true, token }, { status: 201 });

    } catch (error) {
        console.error('[API /api/pending-plans] Error saving pending plan:', error);
        return json({ error: 'Failed to save pending plan data.' }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ cookies }) {
    const token = cookies.get(COOKIE_NAME);

    if (!token) {
        console.log('[API /api/pending-plans] No pending plan token found in cookies.');
        return json({ plan: null }); // No token, no pending plan
    }

    try {
        // Retrieve the pending plan data using the service
        const planData = await pendingPracticePlanService.get(token);

        if (planData) {
            console.log(`[API /api/pending-plans] Retrieved pending plan for token: ${token}`);
            return json({ plan: planData });
        } else {
            console.log(`[API /api/pending-plans] Pending plan not found or expired for token: ${token}`);
            // Clear the cookie if the data is missing or expired server-side
            cookies.delete(COOKIE_NAME, { path: COOKIE_OPTS.path });
            return json({ plan: null });
        }
    } catch (error) {
        console.error(`[API /api/pending-plans] Error retrieving pending plan for token ${token}:`, error);
        // Optionally clear cookie on error too? Maybe not, allow retry?
        return json({ error: 'Failed to retrieve pending plan data.' }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ cookies }) {
    const token = cookies.get(COOKIE_NAME);

    if (!token) {
        console.log('[API /api/pending-plans] Delete requested but no token found.');
        return json({ success: true }, { status: 200 }); // Nothing to delete
    }

    try {
        // Delete the pending plan data using the service
        await pendingPracticePlanService.delete(token);

        // Clear the cookie
        cookies.delete(COOKIE_NAME, { path: COOKIE_OPTS.path });

        console.log(`[API /api/pending-plans] Deleted pending plan and cookie for token: ${token}`);
        return json({ success: true }, { status: 200 }); // Use 200 OK as we are returning a body

    } catch (error) {
        console.error(`[API /api/pending-plans] Error deleting pending plan for token ${token}:`, error);
        // Don't clear the cookie here, allow retry? Or clear anyway? Let's clear it.
        cookies.delete(COOKIE_NAME, { path: COOKIE_OPTS.path });
        return json({ error: 'Failed to delete pending plan data.' }, { status: 500 });
    }
} 