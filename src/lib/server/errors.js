/**
 * @typedef {'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'INTERNAL_SERVER_ERROR' | 'CONFLICT'} ErrorCode
 */

/**
 * Base class for custom application errors.
 * Includes an HTTP status code and a machine-readable error code.
 */
export class AppError extends Error {
	/** @type {number} */
	status;
	/** @type {ErrorCode} */
	code;

	/**
	 * @param {string} message - The human-readable error message.
	 * @param {number} status - The HTTP status code associated with the error.
	 * @param {ErrorCode} code - The machine-readable error code.
	 */
	constructor(message, status, code) {
		super(message);
		this.name = this.constructor.name;
		this.status = status;
		this.code = code;
	}
}

/**
 * Error for when a requested resource is not found.
 */
export class NotFoundError extends AppError {
	/**
	 * @param {string} [message='Resource not found'] - The error message.
	 */
	constructor(message = 'Resource not found') {
		super(message, 404, 'NOT_FOUND');
	}
}

/**
 * Error for when an action requires authentication, but the user is not logged in.
 */
export class UnauthorizedError extends AppError {
	/**
	 * @param {string} [message='Authentication required'] - The error message.
	 */
	constructor(message = 'Authentication required') {
		super(message, 401, 'UNAUTHORIZED');
	}
}

/**
 * Error for when a user is authenticated but does not have permission to perform an action.
 */
export class ForbiddenError extends AppError {
	/**
	 * @param {string} [message='You do not have permission to perform this action'] - The error message.
	 */
	constructor(message = 'You do not have permission to perform this action') {
		super(message, 403, 'FORBIDDEN');
	}
}

/**
 * Error for when user input fails validation.
 */
export class ValidationError extends AppError {
	/**
	 * @param {string} [message='Input validation failed'] - The error message.
	 * @param {Record<string, string> | null} [details=null] - Optional details about validation errors per field.
	 */
	constructor(message = 'Input validation failed', details = null) {
		super(message, 400, 'VALIDATION_ERROR');
		/** @type {Record<string, string> | null} */
		this.details = details; // Optional: Add specific field errors if needed
	}
}

/**
 * Error for general database operation failures.
 */
export class DatabaseError extends AppError {
	/**
	 * @param {string} [message='A database error occurred'] - The error message.
	 * @param {Error | null} [cause=null] - The original error that caused this one.
	 */
	constructor(message = 'A database error occurred', cause = null) {
		super(message, 500, 'DATABASE_ERROR');
		if (cause) {
			this.cause = cause;
		}
	}
}

/**
 * Error for conflicts, e.g., trying to create a resource that already exists.
 */
export class ConflictError extends AppError {
	/**
	 * @param {string} [message='Conflict detected'] - The error message.
	 */
	constructor(message = 'Conflict detected') {
		super(message, 409, 'CONFLICT');
	}
}

/**
 * Generic fallback error.
 */
export class InternalServerError extends AppError {
	/**
	 * @param {string} [message='An unexpected internal server error occurred'] - The error message.
	 * @param {Error | null} [cause=null] - The original error that caused this one.
	 */
	constructor(message = 'An unexpected internal server error occurred', cause = null) {
		super(message, 500, 'INTERNAL_SERVER_ERROR');
		if (cause) {
			this.cause = cause;
		}
	}
} 