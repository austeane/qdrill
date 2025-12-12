/**
 * Portal Action - Renders content in a portal container
 *
 * This action moves DOM elements to a portal container at the end of the document body,
 * useful for modals, tooltips, and bottom sheets that need to escape their parent's
 * stacking context or overflow constraints.
 *
 * Usage:
 *   import { portal } from '$lib/actions/portal.js';
 *   <div use:portal>Content to portal</div>
 *
 *   With custom target:
 *   <div use:portal={'#my-portal-target'}>Content</div>
 */

/**
 * Move element to a portal container
 * @param {HTMLElement} node - Element to portal
 * @param {string} target - CSS selector for portal target (default: creates/uses #portal-root)
 */
export function portal(node, target = '#portal-root') {
	let portalTarget;

	function mount() {
		// Find or create portal target
		portalTarget = document.querySelector(target);

		if (!portalTarget) {
			// Create default portal root if it doesn't exist
			portalTarget = document.createElement('div');
			portalTarget.id = target.replace('#', '');
			document.body.appendChild(portalTarget);
		}

		// Move node to portal
		portalTarget.appendChild(node);
	}

	function destroy() {
		// Remove node from portal
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	mount();

	return {
		destroy,
		update(newTarget) {
			if (newTarget !== target) {
				destroy();
				target = newTarget;
				mount();
			}
		}
	};
}
