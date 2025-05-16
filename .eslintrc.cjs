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
			files: ['**/__tests__/**/*.js', '**/__mocks__/**/*.js'],
			extends: ['plugin:vitest-globals/recommended']
		},
		{
			files: ['.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser',
				ecmaVersion: 2022,
				sourceType: 'module'
			}
		}
	]
};
