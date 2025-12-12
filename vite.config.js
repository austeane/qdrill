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
		port: 3000,
		strictPort: false,
		// Playwright creates/cleans up nested `test-results/.playwright-artifacts-*` dirs quickly.
		// Vite's file watcher can occasionally hit transient ENOENT during those operations,
		// which can crash `vercel dev` if the error bubbles out unhandled.
		watch: {
			ignored: ['**/test-results/**', '**/playwright-report/**', '**/.playwright-artifacts-*/**']
		}
	}
});
