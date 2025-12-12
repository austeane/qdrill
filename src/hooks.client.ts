import { handleErrorWithSentry, replayIntegration } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';
import { browser, dev } from '$app/environment';

if (browser && !dev && import.meta.env.VITE_SENTRY_DSN) {
	Sentry.init({
		dsn: import.meta.env.VITE_SENTRY_DSN,
		tracesSampleRate: 1.0, // keep full sampling as requested
		// Keep Replay only on errors to minimize overhead
		replaysSessionSampleRate: 0.0,
		replaysOnErrorSampleRate: 1.0,
		integrations: [replayIntegration()],
		// Keep breadcrumbs reasonable to avoid noise
		maxBreadcrumbs: 50,
		// Sentry 10: Explicitly opt-in to IP address collection (now controlled by this flag)
		sendDefaultPii: true,
		// Limit trace header propagation to first‑party calls
		tracePropagationTargets: [/^\/api\//, /^https?:\/\/localhost/, /^https?:\/\/127\.0\.0\.1/],
		// Filter out known dynamic import noise
		beforeSend(event, hint) {
			const error = hint.originalException;
			if (error && error instanceof Error) {
				const message = error.message || '';
				if (
					message.includes('Failed to fetch dynamically imported module') ||
					message.includes('Failed to import') ||
					message.includes('Failed to fetch')
				) {
					console.warn('Dynamic import error detected, reloading for fresh assets...');
					window.location.reload();
					return null;
				}
			}
			return event;
		}
	});
}

export const handleError = handleErrorWithSentry();
