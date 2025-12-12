import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import svelteParser from 'svelte-eslint-parser';
import tsParser from '@typescript-eslint/parser';

export default [
	// Global ignores
	{
		ignores: [
			'node_modules/**',
			'build/**',
			'.svelte-kit/**',
			'package/**',
			'.vercel/**',
			'coverage/**',
			'*.config.js',
			'*.config.cjs',
			'*.config.ts',
			'svelte.config.js',
			'vite.config.js',
			'vitest.config.js',
			'playwright.config.js',
			'migrations/**'
		]
	},

	// Base JS config
	js.configs.recommended,

	// Svelte recommended configs
	...svelte.configs['flat/recommended'],

	// Prettier config (must be last to override other formatting rules)
	prettier,

	// Global settings for all files
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021
			}
		}
	},

	// Svelte files configuration
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser
			}
		},
		rules: {
			// Demote Svelte 5 specific rules to warnings during migration
			'svelte/valid-compile': 'warn',
			'svelte/no-at-html-tags': 'off',
			'no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],
			'svelte/no-unused-svelte-ignore': 'warn',
			'svelte/require-each-key': 'warn'
		}
	},

	// TypeScript files
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsParser
		},
		rules: {
			'no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			]
		}
	},

	// TypeScript declaration files
	{
		files: ['**/*.d.ts'],
		rules: {
			'no-unused-vars': 'off'
		}
	},

	// JavaScript files
	{
		files: ['**/*.js'],
		rules: {
			'no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			]
		}
	},

	// Test files
	{
		files: ['**/*.test.js', '**/*.spec.js', '**/__tests__/**/*.js'],
		languageOptions: {
			globals: {
				describe: 'readonly',
				it: 'readonly',
				expect: 'readonly',
				test: 'readonly',
				vi: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
				beforeAll: 'readonly',
				afterAll: 'readonly'
			}
		}
	},

	// Cypress files
	{
		files: ['cypress/**/*.js', 'cypress/**/*.cy.js'],
		languageOptions: {
			globals: {
				cy: 'readonly',
				Cypress: 'readonly',
				describe: 'readonly',
				it: 'readonly',
				expect: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
				before: 'readonly',
				after: 'readonly',
				context: 'readonly'
			}
		},
		rules: {
			'no-unused-vars': 'warn'
		}
	}
];
