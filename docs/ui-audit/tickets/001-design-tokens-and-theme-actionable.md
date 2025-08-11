# Ticket 001: Design Tokens, Typography, and Theme (Light/Dark) - ACTIONABLE

## Overview
Establish a comprehensive design system foundation with CSS variables, typography scale, and theme switching.

## Prerequisites
- [x] Install required dependencies: `@radix-ui/colors`, `mode-watcher`, `sveltekit-superforms`
- [x] Ensure Tailwind CSS is configured

## File Structure
```
src/
├── lib/
│   ├── styles/
│   │   └── tokens.css (NEW)
│   └── stores/
│       └── themeStore.ts (NEW)
├── app.css (MODIFY)
└── routes/
    └── +layout.svelte (MODIFY)
```

## Implementation Steps

### Step 1: Create Design Tokens (`src/lib/styles/tokens.css`)

```css
/* Color Tokens using Radix UI Colors */
:root {
  /* Spacing Scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  
  /* Border Radius */
  --radius-sm: 0.125rem;
  --radius-md: 0.25rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;
  
  /* Typography Scale */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  
  --line-height-tight: 1.1;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;
}

/* Light Theme Colors */
[data-theme="light"] {
  /* Background layers */
  --color-bg-base: hsl(0, 0%, 100%);
  --color-bg-subtle: hsl(0, 0%, 98%);
  --color-bg-muted: hsl(0, 0%, 96%);
  
  /* Surface colors */
  --color-surface-1: hsl(0, 0%, 100%);
  --color-surface-2: hsl(0, 0%, 99%);
  --color-surface-3: hsl(0, 0%, 97%);
  
  /* Text colors */
  --color-text-primary: hsl(0, 0%, 9%);
  --color-text-secondary: hsl(0, 0%, 32%);
  --color-text-muted: hsl(0, 0%, 45%);
  --color-text-disabled: hsl(0, 0%, 60%);
  
  /* Border colors */
  --color-border-default: hsl(0, 0%, 89%);
  --color-border-muted: hsl(0, 0%, 93%);
  --color-border-strong: hsl(0, 0%, 80%);
  
  /* Accent colors (blue) */
  --color-accent-1: hsl(206, 100%, 99%);
  --color-accent-2: hsl(210, 100%, 98%);
  --color-accent-3: hsl(209, 100%, 96.5%);
  --color-accent-4: hsl(210, 98.8%, 94%);
  --color-accent-5: hsl(209, 95%, 90.1%);
  --color-accent-6: hsl(209, 81.2%, 84.5%);
  --color-accent-7: hsl(208, 77.5%, 76.9%);
  --color-accent-8: hsl(206, 81.9%, 65.3%);
  --color-accent-9: hsl(206, 100%, 50%);
  --color-accent-10: hsl(208, 100%, 47.3%);
  --color-accent-11: hsl(211, 100%, 43.2%);
  --color-accent-12: hsl(211, 100%, 15%);
  
  /* Semantic colors */
  --color-success: hsl(142, 71%, 45%);
  --color-warning: hsl(38, 92%, 50%);
  --color-error: hsl(0, 72%, 51%);
  --color-info: hsl(206, 100%, 50%);
  
  /* Focus ring */
  --color-focus-ring: hsla(206, 100%, 50%, 0.5);
}

/* Dark Theme Colors */
[data-theme="dark"] {
  /* Background layers */
  --color-bg-base: hsl(0, 0%, 8%);
  --color-bg-subtle: hsl(0, 0%, 10%);
  --color-bg-muted: hsl(0, 0%, 12%);
  
  /* Surface colors */
  --color-surface-1: hsl(0, 0%, 10%);
  --color-surface-2: hsl(0, 0%, 12%);
  --color-surface-3: hsl(0, 0%, 14%);
  
  /* Text colors */
  --color-text-primary: hsl(0, 0%, 95%);
  --color-text-secondary: hsl(0, 0%, 70%);
  --color-text-muted: hsl(0, 0%, 55%);
  --color-text-disabled: hsl(0, 0%, 40%);
  
  /* Border colors */
  --color-border-default: hsl(0, 0%, 20%);
  --color-border-muted: hsl(0, 0%, 16%);
  --color-border-strong: hsl(0, 0%, 26%);
  
  /* Accent colors (blue) - adjusted for dark mode */
  --color-accent-1: hsl(212, 35%, 9.2%);
  --color-accent-2: hsl(216, 50%, 11.8%);
  --color-accent-3: hsl(214, 59.4%, 15.3%);
  --color-accent-4: hsl(214, 65.8%, 17.9%);
  --color-accent-5: hsl(213, 71.2%, 20.2%);
  --color-accent-6: hsl(212, 77.4%, 23.1%);
  --color-accent-7: hsl(211, 85.1%, 27.4%);
  --color-accent-8: hsl(211, 89.7%, 34.1%);
  --color-accent-9: hsl(206, 100%, 50%);
  --color-accent-10: hsl(206, 100%, 60%);
  --color-accent-11: hsl(206, 100%, 70%);
  --color-accent-12: hsl(206, 100%, 93%);
  
  /* Semantic colors */
  --color-success: hsl(142, 71%, 45%);
  --color-warning: hsl(38, 92%, 50%);
  --color-error: hsl(0, 72%, 51%);
  --color-info: hsl(206, 100%, 50%);
  
  /* Focus ring */
  --color-focus-ring: hsla(206, 100%, 60%, 0.5);
}
```

### Step 2: Create Theme Store (`src/lib/stores/themeStore.ts`)

```typescript
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

function createThemeStore() {
  const storedTheme = browser ? localStorage.getItem('theme') as Theme : 'system';
  const { subscribe, set, update } = writable<Theme>(storedTheme || 'system');

  return {
    subscribe,
    setTheme: (theme: Theme) => {
      if (browser) {
        localStorage.setItem('theme', theme);
        applyTheme(theme);
      }
      set(theme);
    },
    toggleTheme: () => {
      update(theme => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        if (browser) {
          localStorage.setItem('theme', newTheme);
          applyTheme(newTheme);
        }
        return newTheme;
      });
    },
    init: () => {
      if (browser) {
        const theme = localStorage.getItem('theme') as Theme || 'system';
        applyTheme(theme);
      }
    }
  };
}

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

export const themeStore = createThemeStore();
```

### Step 3: Update app.css

```css
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
@import './lib/styles/tokens.css';

/* Base Typography */
body {
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-bg-base);
  transition: background-color var(--transition-base), color var(--transition-base);
}

/* Headings */
h1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-4);
}

h2 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-3);
}

h3 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  margin-bottom: var(--space-3);
}

h4 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-snug);
  margin-bottom: var(--space-2);
}

/* Links */
a {
  color: var(--color-accent-9);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--color-accent-10);
  text-decoration: underline;
}

/* Focus Styles */
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
  border-radius: var(--radius-md);
}

/* Selection */
::selection {
  background-color: var(--color-accent-5);
  color: var(--color-text-primary);
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-subtle);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border-strong);
  border-radius: var(--radius-lg);
  border: 3px solid var(--color-bg-subtle);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}

/* Skip to content link */
.skip-to-content {
  position: absolute;
  left: -9999px;
  z-index: 999;
  padding: var(--space-4);
  background-color: var(--color-accent-9);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-md);
}

.skip-to-content:focus {
  left: var(--space-4);
  top: var(--space-4);
}
```

### Step 4: Update Layout (`src/routes/+layout.svelte`)

Add theme initialization and toggle button to the existing layout:

```svelte
<script>
  import { onMount } from 'svelte';
  import { themeStore } from '$lib/stores/themeStore';
  import { Sun, Moon, Monitor } from 'lucide-svelte';
  // ... existing imports ...

  let currentTheme = 'system';
  
  onMount(() => {
    themeStore.init();
    themeStore.subscribe(value => {
      currentTheme = value;
    });
  });

  function cycleTheme() {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    themeStore.setTheme(themes[nextIndex]);
  }
</script>

<!-- Add theme toggle button to Header component or in the layout -->
<button
  on:click={cycleTheme}
  class="theme-toggle"
  aria-label="Toggle theme"
>
  {#if currentTheme === 'light'}
    <Sun size={20} />
  {:else if currentTheme === 'dark'}
    <Moon size={20} />
  {:else}
    <Monitor size={20} />
  {/if}
</button>

<style>
  .theme-toggle {
    position: fixed;
    top: var(--space-4);
    right: var(--space-4);
    padding: var(--space-2);
    background: var(--color-surface-2);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    z-index: 50;
  }
  
  .theme-toggle:hover {
    background: var(--color-surface-3);
    border-color: var(--color-border-strong);
  }
</style>
```

## Testing Checklist

- [ ] Theme toggle switches between light, dark, and system modes
- [ ] Theme preference persists across page reloads
- [ ] All text meets WCAG AA contrast requirements (4.5:1 for body, 3:1 for large text)
- [ ] Typography scale is applied consistently across all pages
- [ ] Focus outlines are visible and properly styled
- [ ] No console errors on theme switch
- [ ] CSS variables are accessible in DevTools
- [ ] System preference is respected when set to 'system'

## Common Issues & Solutions

1. **Theme flashing on load**: Add this to `app.html` before any other scripts:
```html
<script>
  const theme = localStorage.getItem('theme') || 'system';
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
</script>
```

2. **Icons not appearing**: Ensure lucide-svelte is imported correctly
3. **Theme not persisting**: Check localStorage permissions in browser

## Relevant Files to Reference
- Current layout: `src/routes/+layout.svelte`
- Current styles: `src/routes/styles.css`
- Header component: `src/routes/Header.svelte`

## Next Steps
After completing this ticket, proceed to Ticket 002 (AppShell and Navigation) which will use these design tokens.