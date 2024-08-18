import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// Ensure the adapter for Vercel is configured correctly
			runtime: 'nodejs18.x',
			isr: {
				expiration: false
			}
		})
	}
};

export default config;
