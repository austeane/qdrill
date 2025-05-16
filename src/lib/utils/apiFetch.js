/**
 * A wrapper around fetch to handle standard API responses and errors.
 * It assumes the API returns JSON on both success and error,
 * with errors following the { error: { code: '...', message: '...' } } format.
 *
 * @template T The expected type of the successful JSON response body.
 * @param {string} url The URL to fetch.
 * @param {RequestInit} [opts={}] Fetch options (method, headers, body, etc.).
 * @returns {Promise<T>} A promise that resolves with the JSON body on success.
 * @throws {Error} Throws an error with a formatted message on network errors or non-ok responses.
 */
export async function apiFetch(url, opts = {}) {
	let response;
	try {
		response = await fetch(url, opts);
	} catch (networkError) {
		// Handle network errors (e.g., DNS resolution failure, refused connection)
		console.error('Network error in apiFetch:', networkError);
		throw new Error(`Network error: ${networkError.message || 'Failed to connect to server'}`);
	}

	let body = null;
	let parseError = null;
	try {
		// Try cloning the response to read the body without consuming it for the final return
		const clonedResponse = response.clone();
		if (response.headers.get('content-type')?.includes('application/json')) {
			body = await clonedResponse.json();
		} else {
			// If not JSON, store text for potential error messages
			body = await clonedResponse.text();
		}
	} catch (e) {
		// Store the parsing error
		parseError = e;
		console.warn('Error parsing response body in apiFetch:', e);
		// Attempt to get text even if JSON parsing failed
		try {
			body = await response.text();
		} catch (textErr) {
			console.warn('Error getting text fallback body in apiFetch:', textErr);
			body = `Response body could not be parsed. Status: ${response.status}`;
		}
	}

	if (!response.ok) {
		// Construct the best possible error message
		let message = `HTTP error! Status: ${response.status}`;
		if (typeof body === 'object' && body !== null && body.error && body.error.message) {
			message = body.error.message; // Use the message from the standardized error format
		} else if (typeof body === 'string' && body.length > 0 && body.length < 500) {
			// Use text body if it's reasonable
			message = body;
		} else if (response.statusText) {
			message = `${response.status} ${response.statusText}`;
		} else if (parseError) {
			message += ` (Could not parse response: ${parseError.message})`;
		}

		console.error(`API Fetch Error (${url}): ${message}`, { status: response.status, body });
		throw new Error(message);
	}

	// If response is OK, but we had a parsing error earlier, re-throw it
	// (unless body was successfully read as text)
	if (parseError && typeof body !== 'string') {
		throw new Error(
			`Successfully fetched, but failed to parse response body: ${parseError.message}`
		);
	}

	// Return the parsed body (which could be JSON object or text)
	// Note: If the original request expected non-JSON, the caller should handle the type.
	return body;
}
