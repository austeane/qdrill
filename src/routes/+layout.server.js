import { dev } from '$app/environment';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals }) {
	return {
		analyticsId: dev ? undefined : 'VERCEL_ANALYTICS_ID',
		session: await locals.getSession()
	};
}
