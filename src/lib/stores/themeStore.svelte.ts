import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

function getSystemRenderedTheme(): 'light' | 'dark' {
	if (!browser) return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveRenderedTheme(theme: Theme): 'light' | 'dark' {
	if (theme === 'system') return getSystemRenderedTheme();
	return theme === 'dark' ? 'dark' : 'light';
}

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
	rendered = $state<'light' | 'dark'>('light');

	#cleanup: (() => void) | null = null;

	init() {
		// In case the import is server-side and then hydrated, ensure we apply
		// once in the browser.
		if (!browser) return;
		if (this.#cleanup) return;

		const apply = () => {
			this.rendered = resolveRenderedTheme(this.value);
			applyThemeToDom(this.rendered);
		};

		apply();

		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = () => {
			if (this.value !== 'system') return;
			apply();
		};

		media.addEventListener('change', handler);
		this.#cleanup = () => media.removeEventListener('change', handler);
	}

	set(next: Theme) {
		this.value = next;
		if (browser) {
			localStorage.setItem('theme', next);
			this.rendered = resolveRenderedTheme(this.value);
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
