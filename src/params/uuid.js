// UUID v4 pattern matcher for route parameters
export function match(param) {
	// UUID v4 regex pattern
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(param);
}
