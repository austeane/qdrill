import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

function applyTheme(theme: Theme) {
  if (!browser) return;
  const root = document.documentElement;
  
  // Determine if dark mode should be active
  let isDark = false;
  if (theme === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isDark = theme === 'dark';
  }
  
  // Apply or remove the dark class for Tailwind
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Also set data-theme attribute for any custom CSS that might use it
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

function createThemeStore() {
  const initial: Theme = browser
    ? ((localStorage.getItem('theme') as Theme) || 'system')
    : 'system';

  const { subscribe, set, update } = writable<Theme>(initial);

  // Create a derived store that tracks the actual rendered theme
  const renderedTheme = writable<'light' | 'dark'>('light');

  function setTheme(next: Theme) {
    if (browser) localStorage.setItem('theme', next);
    applyTheme(next);
    set(next);
    updateRenderedTheme(next);
  }

  function updateRenderedTheme(theme: Theme) {
    if (!browser) return;
    let isDark = false;
    if (theme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = theme === 'dark';
    }
    renderedTheme.set(isDark ? 'dark' : 'light');
  }

  return {
    subscribe,
    init: () => {
      applyTheme(initial);
      updateRenderedTheme(initial);
    },
    set: setTheme,
    toggle: () =>
      update((t) => {
        const next = t === 'light' ? 'dark' : 'light';
        setTheme(next);
        return next;
      }),
    rendered: { subscribe: renderedTheme.subscribe }
  };
}

export const theme = createThemeStore();