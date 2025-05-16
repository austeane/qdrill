import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { pendingPracticePlanService } from '$lib/server/services/pendingPracticePlanService'; // Assuming this service exists
import { handleApiError } from '../utils/handleApiError.js';
import { NotFoundError } from '$lib/server/errors.js'; // Import NotFoundError for potential use

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
		// TODO: Add validation for planData structure/content?
		const token = randomUUID();
		const expiresAt = new Date(Date.now() + COOKIE_OPTS.maxAge * 1000);

		// Store the pending plan data using the service
		await pendingPracticePlanService.save(token, planData, expiresAt);

		// Set the cookie
		cookies.set(COOKIE_NAME, token, COOKIE_OPTS);

		console.log(`[API /api/pending-plans] Saved pending plan with token: ${token}`);
		return json({ success: true, token }, { status: 201 });
	} catch (error) {
		// Note: If save throws specific errors (e.g., validation), handleApiError will map them
		return handleApiError(error);
	}
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ cookies }) {
	const token = cookies.get(COOKIE_NAME);

	if (!token) {
		console.log('[API /api/pending-plans] No pending plan token found in cookies.');
		// Throw NotFoundError for consistent handling
		// Client should interpret this as no pending plan found
		throw new NotFoundError('No pending plan token found');
	}

	try {
		// Retrieve the pending plan data using the service
		// pendingPracticePlanService.get should throw NotFoundError if token is invalid/expired
		const planData = await pendingPracticePlanService.get(token);

		console.log(`[API /api/pending-plans] Retrieved pending plan for token: ${token}`);
		return json({ plan: planData }); // Return plan data directly
	} catch (error) {
		// Clear the cookie if the plan wasn't found or other error occurred
		if (error instanceof NotFoundError) {
			console.log(`[API /api/pending-plans] Pending plan not found or expired for token: ${token}`);
			cookies.delete(COOKIE_NAME, { path: COOKIE_OPTS.path });
		}
		return handleApiError(error);
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ cookies }) {
	const token = cookies.get(COOKIE_NAME);

	// Always clear the cookie if present, regardless of server-side success
	if (token) {
		cookies.delete(COOKIE_NAME, { path: COOKIE_OPTS.path });
	}

	if (!token) {
		console.log('[API /api/pending-plans] Delete requested but no token found.');
		// Nothing to delete server-side, return success (204 No Content)
		return new Response(null, { status: 204 });
	}

	try {
		// Delete the pending plan data using the service
		// Assuming delete might implicitly handle non-existent tokens gracefully
		await pendingPracticePlanService.delete(token);

		console.log(`[API /api/pending-plans] Deleted pending plan data for token: ${token}`);
		// Return 204 No Content on successful deletion
		return new Response(null, { status: 204 });
	} catch (error) {
		// Log the error, but the cookie is already cleared.
		// Return the standardized error response.
		console.error(
			`[API /api/pending-plans] Error deleting pending plan for token ${token}:`,
			error
		);
		return handleApiError(error);
	}
}
