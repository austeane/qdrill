module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:svelte/recommended',
		'plugin:cypress/recommended',
		'prettier'
	],
	plugins: ['vitest-globals'],
	parserOptions: {
		parser: '@typescript-eslint/parser',
		sourceType: 'module',
		ecmaVersion: 2022,
		extraFileExtensions: ['.svelte']
	},
	env: {
		browser: true,
		es2017: true,
		node: true,
		'cypress/globals': true
	},
	overrides: [
		{
			files: ['*.js'],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module'
			}
		},
		{
			files: ['cypress/**/*.js'],
			rules: {
				'cypress/no-unnecessary-waiting': 'off',
				'cypress/unsafe-to-chain-command': 'off'
			}
		},
		{
			files: ['**/__tests__/**/*.js', '**/__mocks__/**/*.js'],
			extends: ['plugin:vitest-globals/recommended']
		},
		{
			files: ['**/*.{test,spec}.{js,ts}', '**/__tests__/**/*.{js,ts}', 'tests/**/*.{js,ts}'],
			rules: {
				'no-unused-vars': 'off',
				'no-useless-catch': 'off',
				'no-import-assign': 'off'
			}
		},
		{
			files: ['**/*.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser',
				ecmaVersion: 2022,
				sourceType: 'module'
			},
			rules: {
				// Svelte compiler warnings are useful, but this repo historically treats them as non-blocking.
				'svelte/valid-compile': 'warn',
				// We intentionally use {@html} only with sanitizeHtml
				'svelte/no-at-html-tags': 'off',
				// Many components accept props for parent usage without local reads.
				'no-unused-vars': 'warn'
			}
		}
	]
};
