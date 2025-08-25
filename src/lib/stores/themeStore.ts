import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

function applyTheme(theme: Theme) {
  if (!browser) return;
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

function createThemeStore() {
  const initial: Theme = browser
    ? ((localStorage.getItem('theme') as Theme) || 'system')
    : 'system';

  const { subscribe, set, update } = writable<Theme>(initial);

  function setTheme(next: Theme) {
    if (browser) localStorage.setItem('theme', next);
    applyTheme(next);
    set(next);
  }

  return {
    subscribe,
    init: () => applyTheme(initial),
    set: setTheme,
    toggle: () =>
      update((t) => {
        const next = t === 'light' ? 'dark' : 'light';
        setTheme(next);
        return next;
      })
  };
}

export const theme = createThemeStore();