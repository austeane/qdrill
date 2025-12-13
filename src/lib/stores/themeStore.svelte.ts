import { browser } from '$app/environment';
import { MediaQuery } from 'svelte/reactivity';

export type Theme = 'light' | 'dark' | 'system';

function applyThemeToDom(rendered: 'light' | 'dark') {
	if (!browser) return;
	const root = document.documentElement;

	// Apply or remove the dark class for Tailwind
	if (rendered === 'dark') {
		root.classList.add('dark');
	} else {
		root.classList.remove('dark');
	}

	// Also set data-theme attribute for any custom CSS that might use it
	root.setAttribute('data-theme', rendered);
}

function readStoredTheme(): Theme {
	if (!browser) return 'system';
	const raw = localStorage.getItem('theme');
	return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
}

class ThemeStore {
	value = $state<Theme>(readStoredTheme());

	#prefersDark = new MediaQuery('prefers-color-scheme: dark', false);
	#cleanup: (() => void) | null = null;

	get rendered(): 'light' | 'dark' {
		if (this.value === 'system') {
			return this.#prefersDark.current ? 'dark' : 'light';
		}
		return this.value;
	}

	init() {
		// In case the import is server-side and then hydrated, ensure we apply
		// once in the browser.
		if (!browser) return;
		if (this.#cleanup) return;

		applyThemeToDom(this.rendered);

		this.#cleanup = $effect.root(() => {
			$effect(() => {
				applyThemeToDom(this.rendered);
			});
		});
	}

	set(next: Theme) {
		this.value = next;
		if (browser) {
			localStorage.setItem('theme', next);
			applyThemeToDom(this.rendered);
		}
	}

	toggle() {
		// If the user is on `system`, toggle against the currently rendered theme.
		// This avoids the confusing behavior where `system` -> `light` is a no-op
		// when the system theme is already light.
		const current = this.value;
		let next: Theme;
		if (current === 'system') {
			next = this.rendered === 'dark' ? 'light' : 'dark';
		} else {
			next = current === 'light' ? 'dark' : 'light';
		}
		this.set(next);
	}
}

export const theme = new ThemeStore();
