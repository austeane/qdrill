import { dev } from '$app/environment';
import { injectAnalytics } from '@vercel/analytics/sveltekit';
import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals }) {
	injectAnalytics({ mode: dev ? 'development' : 'production' });
	injectSpeedInsights();

	return {
		analyticsId: dev ? undefined : 'VERCEL_ANALYTICS_ID',
		session: await locals.getSession()
	};
}
