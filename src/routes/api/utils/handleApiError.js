// Helper function to convert AppError to SvelteKit error response
// Moved to src/routes/api/utils/handleApiError.js
import { json } from '@sveltejs/kit';
import { AppError, ValidationError } from '$lib/server/errors';

/**
 * Handles known application errors (AppError) and unexpected errors.
 * Converts them into a standardized SvelteKit JSON response.
 *
 * @param {any} err The error object caught.
 * @returns {Response} A SvelteKit JSON response.
 */
export function handleApiError(err) {
	if (err instanceof AppError) {
		console.warn(`[API Warn] (${err.status} ${err.code}): ${err.message}`);
		const body = { error: { code: err.code, message: err.message } };
		// Add details for validation errors if they exist
		if (err instanceof ValidationError && err.details) {
			body.error.details = err.details;
		}
		return json(body, { status: err.status });
	} else {
		// Handle potential raw database errors if not already wrapped
		// These checks might become less necessary if services consistently wrap DB errors
		if (err?.code === '23503') {
			// Foreign key violation
			console.warn('[API Warn] Foreign key constraint violation:', err.detail || err.message);
			return json(
				{ error: { code: 'CONFLICT', message: 'Operation failed due to related items.' } },
				{ status: 409 }
			);
		} else if (err?.code === '23505') {
			// Unique constraint violation
			console.warn('[API Warn] Unique constraint violation:', err.detail || err.message);
			return json(
				{ error: { code: 'CONFLICT', message: 'An item with this identifier already exists.' } },
				{ status: 409 }
			);
		}

		// Log the full unexpected error for debugging
		console.error('[API Error] Unexpected error:', err);

		// Default to 500 Internal Server Error for unknown errors
		const message =
			err instanceof Error ? err.message : 'An unexpected internal server error occurred';
		return json({ error: { code: 'INTERNAL_SERVER_ERROR', message } }, { status: 500 });
	}
}
