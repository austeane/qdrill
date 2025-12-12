/**
 * Param matcher for team slugs
 * Enforces slug format at the router level
 * @param {string} param
 * @returns {boolean}
 */
export function match(param) {
	// Slug must be:
	// - 3-50 characters long
	// - Lowercase letters, numbers, and hyphens only
	// - Cannot start or end with a hyphen
	const slugRegex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
	return slugRegex.test(param);
}
