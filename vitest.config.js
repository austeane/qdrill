import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/__tests__/**', '**/__mocks__/**', '**/*.test.js'],
      include: ['src/lib/server/services/*.js', 'src/routes/api/**/*.js', '!src/routes/api/**/__tests__/**'],
      all: true,
      reportsDirectory: './coverage'
    }
  },
  resolve: {
    alias: {
      '$lib': resolve(__dirname, './src/lib'),
      '$app/environment': resolve(__dirname, './src/lib/__mocks__/environment.js'),
      '$app/navigation': resolve(__dirname, './src/lib/__mocks__/navigation.js'),
      '$app/stores': resolve(__dirname, './src/lib/__mocks__/stores.js')
    }
  }
});