import { dev } from '$app/environment';
import { injectAnalytics } from '@vercel/analytics/sveltekit';
import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

injectAnalytics({ mode: dev ? 'development' : 'production' });
injectSpeedInsights();

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals }) {
	return {
		session: await locals.getSession()
	};
}
