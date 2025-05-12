import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		prerender: {
			entries: ['/']
		},
		// Temporarily disable CSRF origin checking for local development
		// WARNING: Do NOT do this in production. For dev troubleshooting only.
		csrf: {
			checkOrigin: process.env.NODE_ENV === 'production' // true in prod, false in dev
		}
	},
	preprocess: vitePreprocess()
};

export default config;
