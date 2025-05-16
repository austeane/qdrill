import { writable } from 'svelte/store';

// Mock SvelteKit stores for testing
export const page = writable({
	url: new URL('http://localhost'),
	params: {},
	route: {
		id: null
	},
	status: 200,
	error: null,
	data: {},
	form: undefined
});

export const navigating = writable(null);
export const updated = writable(false);
