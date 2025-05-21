/**
 * A wrapper around fetch to handle standard API responses and errors.
 * It assumes the API returns JSON on both success and error,
 * with errors following the { error: { code: '...', message: '...' } } format.
 *
 * @template T The expected type of the successful JSON response body.
 * @param {string} url The URL to fetch.
 * @param {RequestInit} [opts={}] Fetch options (method, headers, body, etc.).
 * @param {typeof fetch} [fetchInstance=fetch] Optional fetch implementation. Defaults to global fetch.
 * @returns {Promise<T>} A promise that resolves with the JSON body on success.
 * @throws {Error} Throws an error with a formatted message on network errors or non-ok responses.
 */
export async function apiFetch(url, opts = {}, fetchInstance = fetch) {
	let response;
	try {
		response = await fetchInstance(url, opts);
	} catch (networkError) {
		// Handle network errors (e.g., DNS resolution failure, refused connection)
		console.error('Network error in apiFetch:', networkError);
		throw new Error(`Network error: ${networkError.message || 'Failed to connect to server'}`);
	}

	let body = null;
	const contentType = response.headers.get('content-type');
	const isJson = contentType?.includes('application/json');

	if (!response.ok) {
		// Try to parse body for error message even if not ok
		try {
			if (isJson) {
				body = await response.json();
			} else {
				body = await response.text();
			}
		} catch (e) {
			// Parsing error, try to get text for error message
			try {
				body = await response.text(); // Read as text if JSON parsing failed or not JSON
			} catch (textErr) {
				body = `Response body could not be parsed. Status: ${response.status}`;
			}
		}
		
		let message = `HTTP error! Status: ${response.status}`;
		if (typeof body === 'object' && body !== null && body.error && body.error.message) {
			message = body.error.message;
		} else if (typeof body === 'string' && body.length > 0 && body.length < 500) {
			message = body;
		} else if (response.statusText) {
			message = `${response.status} ${response.statusText}`;
		}

		console.error(`API Fetch Error (${url}): ${message}`, { status: response.status, body });
		throw new Error(message);
	}

	// Response is OK
	if (isJson) {
		try {
			body = await response.json();
		} catch (parseError) {
			console.error('Error parsing JSON response body in apiFetch:', parseError, { url });
			// Attempt to get text for more context in the error, but throw a parsing specific error
			let responseTextForError = '';
			try {
				// Re-fetch or use a cloned response if original body is consumed or unreadable
				// For simplicity here, assuming response.text() can be called,
				// but in a real scenario, the response might be consumed.
				// Cloning upfront as in the original code is safer if we need to retry .json() vs .text()
				const clonedResponseForError = response.clone(); // Clone before attempting to read body
				responseTextForError = await clonedResponseForError.text();
			} catch (textErr) {
				responseTextForError = '(Could not retrieve text body for error context)';
			}
			throw new Error(
				`Successfully fetched, but failed to parse expected JSON response body. Status: ${response.status}. Error: ${parseError.message}. Response text: ${responseTextForError}`
			);
		}
	} else {
		// If not JSON, read as text.
		// This assumes non-JSON responses are expected to be text.
		try {
			body = await response.text();
		} catch (textError) {
			console.error('Error reading text response body in apiFetch:', textError, { url });
			throw new Error(
				`Successfully fetched, but failed to read response body as text. Status: ${response.status}. Error: ${textError.message}`
			);
		}
	}

	return body;
}
