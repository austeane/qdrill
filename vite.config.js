import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	optimizeDeps: {
		include: ['@sveltejs/kit', '@sveltejs/adapter-vercel'],
		exclude: ['@mapbox/node-pre-gyp']
	},
	resolve: {
		alias: {
			$components: '/src/components',
			$lib: '/src/lib'
		}
	}
});
