export class APIError extends Error {
	constructor(message, status, code) {
		super(message);
		this.name = 'APIError';
		this.status = status;
		this.code = code;
	}
}

export function handleAPIError(error, context = '') {
	console.error(`API Error ${context}:`, error);

	if (error instanceof APIError) {
		switch (error.status) {
			case 401:
				return 'Please sign in to continue';
			case 403:
				return "You don't have permission to perform this action";
			case 404:
				return 'The requested resource was not found';
			case 429:
				return 'Too many requests. Please wait and try again';
			case 500:
				return 'Server error. Please try again later';
			default:
				return error.message || 'An unexpected error occurred';
		}
	}

	if (error.name === 'NetworkError' || !navigator.onLine) {
		return 'Network connection error. Please check your internet connection';
	}

	return 'An unexpected error occurred. Please try again';
}

export function createErrorToast(error, context = '') {
	const message = handleAPIError(error, context);

	return {
		message,
		type: 'error',
		duration: 5000,
		action:
			error.status >= 500
				? {
						label: 'Retry',
						handler: () => window.location.reload()
					}
				: null
	};
}
