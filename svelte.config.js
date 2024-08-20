import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		prerender: {
			entries: ['/']
		},
		vite: {
			optimizeDeps: {
				include: ['@sveltejs/kit', '@sveltejs/adapter-vercel']
			}
		}
	}
};

export default config;