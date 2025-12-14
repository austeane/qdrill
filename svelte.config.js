import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const RUNES_NODE_MODULES = [
	// Compile specific dependencies in runes mode. Most dependencies still ship legacy Svelte
	// syntax (`export let`, `<slot>`, etc) and must be compiled with `runes: false`.
	//
	// Example: 'bits-ui' (v2+), '@some-svelte-lib/core'
];

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Enable Svelte 5 runes mode.
		runes: true
	},
	vitePlugin: {
		dynamicCompileOptions({ filename }) {
			if (!filename.includes('node_modules')) return;

			for (const pkg of RUNES_NODE_MODULES) {
				if (filename.includes(`node_modules/${pkg}/`)) {
					return { runes: true };
				}
			}

			// Some third-party packages ship legacy Svelte components that still use
			// `export let`, `$$props/$$restProps`, and `<slot>`. Compile them in legacy mode.
			return { runes: false };
		}
	},
	kit: {
		adapter: adapter({
			runtime: 'nodejs20.x'
		}),
		prerender: {
			entries: [],
			handleHttpError: 'warn'
		}
	},
	preprocess: vitePreprocess()
};

export default config;
