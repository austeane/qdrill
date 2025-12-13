import { browser } from '$app/environment';

/**
 * Reactive window event subscription with automatic cleanup.
 * Intended for use inside component `<script>` blocks.
 */
export function onWindowEvent(event, handler, options) {
	$effect(() => {
		if (!browser) return;
		window.addEventListener(event, handler, options);
		return () => window.removeEventListener(event, handler, options);
	});
}

/**
 * Reactive document event subscription with automatic cleanup.
 * Intended for use inside component `<script>` blocks.
 */
export function onDocumentEvent(event, handler, options) {
	$effect(() => {
		if (!browser) return;
		document.addEventListener(event, handler, options);
		return () => document.removeEventListener(event, handler, options);
	});
}

