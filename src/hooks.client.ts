import { handleErrorWithSentry, replayIntegration } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://f20c97c5f330ac4e17cc678ded5b49da@o4509308595208192.ingest.us.sentry.io/4509308596715520',

	tracesSampleRate: 1.0,

	// This sets the sample rate to be 10%. You may want this to be 100% while
	// in development and sample at a lower rate in production
	replaysSessionSampleRate: 0.1,

	// If the entire session is not sampled, use the below sample rate to sample
	// sessions when an error occurs.
	replaysOnErrorSampleRate: 1.0,

	// If you don't want to use Session Replay, just remove the line below:
	integrations: [replayIntegration()],

	// Filter out dynamic import errors - these are typically version mismatch issues
	beforeSend(event, hint) {
		const error = hint.originalException;
		
		// Check if it's a dynamic import error
		if (error && error instanceof Error) {
			const message = error.message || '';
			if (message.includes('Failed to fetch dynamically imported module') ||
				message.includes('Failed to import') ||
				message.includes('Failed to fetch')) {
				// Don't send to Sentry, but reload the page to get fresh assets
				console.warn('Dynamic import error detected, reloading page to fetch latest version...');
				window.location.reload();
				return null; // Don't send to Sentry
			}
		}
		
		return event;
	}
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
