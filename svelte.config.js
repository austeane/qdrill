import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// This codebase is written in Svelte 4-style (implicit reactivity).
		// Disable runes mode so local `let` state updates and `$:` react as expected.
		runes: false,
		// Keep legacy component API semantics (component events, bindable props)
		// for this codebase while on Svelte 5.
		compatibility: {
			componentApi: 4
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
