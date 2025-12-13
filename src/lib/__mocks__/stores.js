function writable(initialValue) {
	let value = initialValue;
	const subscribers = new Set();

	function set(next) {
		value = next;
		for (const run of subscribers) run(value);
	}

	function update(fn) {
		set(fn(value));
	}

	function subscribe(run) {
		run(value);
		subscribers.add(run);
		return () => subscribers.delete(run);
	}

	return { set, update, subscribe };
}

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
