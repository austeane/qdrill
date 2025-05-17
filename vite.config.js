import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			sourceMapsUploadOptions: {
				org: 'qdrill',
				project: 'javascript-sveltekit'
			}
		}),
		sveltekit()
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	optimizeDeps: {
		include: [
			'@sveltejs/kit',
			'@sveltejs/adapter-vercel',
			'react',
			'react-dom',
			'@excalidraw/excalidraw'
		],
		exclude: [
			'@mapbox/node-pre-gyp',
			'svelte-range-slider-pips',
			'@zerodevx/svelte-toast',
			'lucide-svelte'
		]
	},
	resolve: {
		alias: {
			$components: 'src/components',
			$lib: 'src/lib'
		}
	},
	server: {
		port: 5173,
		strictPort: true
	}
});
