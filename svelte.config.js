import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Enable Svelte 5 runes mode.
		runes: true
	},
	vitePlugin: {
		dynamicCompileOptions({ filename }) {
			// Some third-party packages ship legacy Svelte components that still use
			// `export let`, `$$props/$$restProps`, and `<slot>`. Compile them in legacy mode.
			if (filename.includes('node_modules')) {
				return { runes: false };
			}
		}
	},
	kit: {
		adapter: adapter({
			runtime: 'nodejs20.x'
		}),
		prerender: {
			entries: [],
			handleHttpError: 'warn'
		},
		csrf: {
			checkOrigin: process.env.NODE_ENV !== 'development'
		}
	},
	preprocess: vitePreprocess()
};

export default config;
