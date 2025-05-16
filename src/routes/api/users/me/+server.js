import { json } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import { userService } from '$lib/server/services/userService';
import { handleApiError } from '../../utils/handleApiError.js';

export const GET = authGuard(async ({ locals }) => {
	try {
		// Retrieve the session from event.locals
		const session = locals.session;
		const userId = session.user.id;

		// Ensure we have a row in users table for this Better‑Auth user
		await userService.ensureUserExists(session.user);

		// Use the userService to fetch the complete profile
		const profileData = await userService.getUserProfile(userId);

		if (!profileData) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Transform the data to match the expected format in the frontend
		return json({
			user: profileData.user,
			drills: profileData.drills,
			practicePlans: profileData.practicePlans,
			formations: profileData.formations,
			votes: profileData.votes,
			comments: profileData.comments
		});
	} catch (err) {
		// Use the centralized error handler
		let processedError = err;
		if (!(err instanceof Error)) {
			const message =
				typeof err === 'string'
					? err
					: err?.message
						? String(err.message)
						: 'Unknown non-Error object thrown';
			processedError = new Error(message);
			if (typeof err === 'object' && err !== null) {
				try {
					Object.assign(processedError, err);
					processedError.message = message;
				} catch (assignError) {}
			}
		} else if (err.message && typeof err.message !== 'string') {
			try {
				processedError = new Error(JSON.stringify(err.message));
			} catch (stringifyError) {
				processedError = new Error('Error with non-string message that could not be stringified.');
			}
			processedError.stack = err.stack;
			if (err.code) processedError.code = err.code;
		}
		return handleApiError(processedError);
	}
});
