import { dev } from '$app/environment';

/** @type {import('./$types').LayoutServerLoad} */
export function load() {
	return {
		analyticsId: dev ? undefined : 'VERCEL_ANALYTICS_ID'
	};
}
