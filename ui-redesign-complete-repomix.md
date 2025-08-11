This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.

<file_summary>
This section contains a summary of this file.

<purpose>
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.
</purpose>

<file_format>
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  - File path as an attribute
  - Full contents of the file
</file_format>

<usage_guidelines>
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.
</usage_guidelines>

<notes>
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: docs/ui-audit/tickets/*.md, docs/ui-audit/README.md, src/routes/+layout.svelte, src/routes/drills/+page.svelte, package.json, src/app.css
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)
</notes>

</file_summary>

<directory_structure>
docs/
  ui-audit/
    tickets/
      001-design-tokens-and-theme-actionable.md
      002-appshell-and-navigation-actionable.md
      003-core-ui-components-actionable.md
      004-drills-library-revamp-actionable.md
      005-drill-detail-improvements-actionable.md
      006-practice-plan-viewer-revamp-actionable.md
      007-practice-plan-wizard-ux-actionable.md
      008-accessibility-and-keyboard-actionable.md
      009-performance-and-polish-actionable.md
      010-command-palette-actionable.md
      011-reduce-tints-and-anchor-links-actionable.md
      012-season-management-and-timeline.md
    README.md
src/
  routes/
    drills/
      +page.svelte
    +layout.svelte
  app.css
package.json
</directory_structure>

<files>
This section contains the contents of the repository's files.

<file path="docs/ui-audit/tickets/001-design-tokens-and-theme-actionable.md">
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
</file>

<file path="docs/ui-audit/tickets/002-appshell-and-navigation-actionable.md">
# Ticket 002: AppShell Layout and Navigation - ACTIONABLE

## Overview
Create a consistent application shell with sidebar navigation, topbar, breadcrumbs, mobile navigation, and command palette.

## Prerequisites
- [x] Complete Ticket 001 (Design Tokens)
- [x] Libraries installed: `cmdk-sv`, `lucide-svelte`, `bits-ui`

## File Structure
```
src/lib/components/
├── nav/
│   ├── Topbar.svelte (NEW)
│   ├── Sidebar.svelte (NEW)
│   ├── Breadcrumbs.svelte (NEW)
│   └── MobileNav.svelte (NEW)
├── CommandPalette.svelte (NEW)
└── AppShell.svelte (NEW)
```

## Implementation Steps

### Step 1: Create Topbar Component (`src/lib/components/nav/Topbar.svelte`)

```svelte
<script>
  import { page } from '$app/stores';
  import { Menu, Search, Command, User, LogOut, Settings } from 'lucide-svelte';
  import { themeStore } from '$lib/stores/themeStore';
  import { createEventDispatcher } from 'svelte';
  import { useSession } from '$lib/auth-client';

  const dispatch = createEventDispatcher();
  const session = useSession();
  
  export let sidebarOpen = false;
  
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    dispatch('toggleSidebar', sidebarOpen);
  }
  
  function openCommandPalette() {
    dispatch('openCommandPalette');
  }
</script>

<header class="topbar">
  <div class="topbar-content">
    <!-- Mobile menu toggle -->
    <button 
      class="menu-toggle md:hidden"
      on:click={toggleSidebar}
      aria-label="Toggle menu"
    >
      <Menu size={20} />
    </button>
    
    <!-- Logo -->
    <a href="/" class="logo">
      <img src="/logo.svg" alt="QDrill" width="32" height="32" />
      <span class="logo-text">QDrill</span>
    </a>
    
    <!-- Search bar -->
    <div class="search-container">
      <button 
        class="search-trigger"
        on:click={openCommandPalette}
        aria-label="Search (Cmd+K)"
      >
        <Search size={16} />
        <span>Search...</span>
        <kbd>⌘K</kbd>
      </button>
    </div>
    
    <!-- Right side actions -->
    <div class="actions">
      <!-- Theme toggle -->
      <button
        on:click={() => themeStore.toggleTheme()}
        class="icon-button"
        aria-label="Toggle theme"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v6m0 6v6m-9-9h6m6 0h6"/>
        </svg>
      </button>
      
      <!-- User menu -->
      {#if $session.data}
        <div class="user-menu">
          <button class="user-button">
            <User size={20} />
            <span class="sr-only">User menu</span>
          </button>
          <div class="dropdown">
            <a href="/profile">
              <Settings size={16} />
              Profile
            </a>
            <button on:click={() => {}}>
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      {:else}
        <a href="/login" class="login-button">Sign in</a>
      {/if}
    </div>
  </div>
</header>

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: 40;
    height: 3.5rem;
    background: var(--color-surface-1);
    border-bottom: 1px solid var(--color-border-default);
  }
  
  .topbar-content {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    height: 100%;
    padding: 0 var(--space-4);
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
  
  .logo-text {
    display: none;
  }
  
  @media (min-width: 640px) {
    .logo-text {
      display: block;
    }
  }
  
  .search-container {
    flex: 1;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .search-trigger {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .search-trigger:hover {
    border-color: var(--color-border-strong);
    background: var(--color-bg-muted);
  }
  
  .search-trigger span {
    flex: 1;
    text-align: left;
  }
  
  kbd {
    padding: 0.125rem 0.375rem;
    background: var(--color-surface-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-family: monospace;
  }
  
  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  
  .icon-button {
    padding: var(--space-2);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .icon-button:hover {
    background: var(--color-bg-subtle);
    color: var(--color-text-primary);
  }
  
  .user-menu {
    position: relative;
  }
  
  .dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: var(--space-2);
    padding: var(--space-2);
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    display: none;
  }
  
  .user-menu:hover .dropdown,
  .user-menu:focus-within .dropdown {
    display: block;
  }
  
  .dropdown a,
  .dropdown button {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    white-space: nowrap;
  }
  
  .dropdown a:hover,
  .dropdown button:hover {
    background: var(--color-bg-subtle);
  }
  
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
```

### Step 2: Create Sidebar Component (`src/lib/components/nav/Sidebar.svelte`)

```svelte
<script>
  import { page } from '$app/stores';
  import { 
    Target, 
    Calendar, 
    Users, 
    Palette, 
    PenTool,
    ChevronLeft,
    ChevronRight,
    X
  } from 'lucide-svelte';
  
  export let open = false;
  export let collapsed = false;
  
  const navItems = [
    { href: '/drills', label: 'Drills', icon: Target },
    { href: '/practice-plans', label: 'Practice Plans', icon: Calendar },
    { href: '/formations', label: 'Formations', icon: Users },
    { href: '/whiteboard', label: 'Whiteboard', icon: PenTool },
    { href: '/teams', label: 'Teams', icon: Users }
  ];
  
  function toggleCollapse() {
    collapsed = !collapsed;
  }
</script>

<aside class="sidebar" class:open class:collapsed>
  <nav class="sidebar-nav">
    <!-- Mobile close button -->
    <button 
      class="close-button md:hidden"
      on:click={() => open = false}
      aria-label="Close sidebar"
    >
      <X size={20} />
    </button>
    
    <!-- Navigation items -->
    <ul class="nav-list">
      {#each navItems as item}
        <li>
          <a 
            href={item.href}
            class="nav-item"
            class:active={$page.url.pathname.startsWith(item.href)}
            title={collapsed ? item.label : ''}
          >
            <svelte:component this={item.icon} size={20} />
            {#if !collapsed}
              <span>{item.label}</span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
    
    <!-- Collapse toggle (desktop only) -->
    <button 
      class="collapse-toggle hidden md:flex"
      on:click={toggleCollapse}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {#if collapsed}
        <ChevronRight size={16} />
      {:else}
        <ChevronLeft size={16} />
      {/if}
    </button>
  </nav>
</aside>

<!-- Mobile overlay -->
{#if open}
  <div 
    class="sidebar-overlay md:hidden"
    on:click={() => open = false}
  />
{/if}

<style>
  .sidebar {
    position: fixed;
    top: 3.5rem;
    left: 0;
    bottom: 0;
    width: 240px;
    background: var(--color-surface-1);
    border-right: 1px solid var(--color-border-default);
    transform: translateX(-100%);
    transition: transform var(--transition-base), width var(--transition-base);
    z-index: 30;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .sidebar.collapsed {
    width: 60px;
  }
  
  @media (min-width: 768px) {
    .sidebar {
      position: sticky;
      transform: translateX(0);
    }
  }
  
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: var(--space-4);
  }
  
  .close-button {
    align-self: flex-end;
    padding: var(--space-2);
    margin-bottom: var(--space-4);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
  }
  
  .nav-list {
    flex: 1;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    margin-bottom: var(--space-1);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    transition: all var(--transition-fast);
  }
  
  .nav-item:hover {
    background: var(--color-bg-subtle);
    color: var(--color-text-primary);
  }
  
  .nav-item.active {
    background: var(--color-accent-3);
    color: var(--color-accent-11);
  }
  
  .collapsed .nav-item {
    justify-content: center;
    padding: var(--space-2);
  }
  
  .collapse-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-2);
    margin-top: auto;
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    cursor: pointer;
  }
  
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 25;
  }
</style>
```

### Step 3: Create Breadcrumbs Component (`src/lib/components/nav/Breadcrumbs.svelte`)

```svelte
<script>
  import { ChevronRight, Home } from 'lucide-svelte';
  
  export let segments = [];
  
  // segments format: [{ label: 'Drills', href: '/drills' }, { label: 'Drill Name', href: '/drills/123' }]
</script>

<nav aria-label="Breadcrumb" class="breadcrumbs">
  <ol>
    <li>
      <a href="/" aria-label="Home">
        <Home size={16} />
      </a>
    </li>
    {#each segments as segment, i}
      <li>
        <ChevronRight size={16} class="separator" />
        {#if i === segments.length - 1}
          <span aria-current="page">{segment.label}</span>
        {:else}
          <a href={segment.href}>{segment.label}</a>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  .breadcrumbs {
    padding: var(--space-2) 0;
  }
  
  ol {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    list-style: none;
    padding: 0;
    margin: 0;
    flex-wrap: wrap;
  }
  
  li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  
  a {
    color: var(--color-text-muted);
    transition: color var(--transition-fast);
  }
  
  a:hover {
    color: var(--color-accent-9);
    text-decoration: none;
  }
  
  span {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);
  }
  
  :global(.separator) {
    color: var(--color-text-muted);
  }
</style>
```

### Step 4: Create Command Palette (`src/lib/components/CommandPalette.svelte`)

```svelte
<script>
  import { Command } from 'cmdk-sv';
  import { goto } from '$app/navigation';
  import { 
    Target, 
    Calendar, 
    Users, 
    PenTool,
    Search,
    ArrowRight
  } from 'lucide-svelte';
  
  export let open = false;
  
  const routes = [
    { label: 'Drills', href: '/drills', icon: Target, keywords: ['drill', 'exercise'] },
    { label: 'Practice Plans', href: '/practice-plans', icon: Calendar, keywords: ['plan', 'practice'] },
    { label: 'Formations', href: '/formations', icon: Users, keywords: ['formation', 'lineup'] },
    { label: 'Whiteboard', href: '/whiteboard', icon: PenTool, keywords: ['draw', 'diagram'] },
    { label: 'Teams', href: '/teams', icon: Users, keywords: ['team', 'group'] },
    { label: 'Create Drill', href: '/drills/create', icon: Target, keywords: ['new', 'add'] },
    { label: 'Create Practice Plan', href: '/practice-plans/create', icon: Calendar, keywords: ['new', 'add'] },
  ];
  
  function handleSelect(href) {
    goto(href);
    open = false;
  }
  
  // Keyboard shortcut handler
  function handleKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      open = !open;
    }
    if (e.key === 'Escape') {
      open = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<Command.Root bind:open shouldFilter={false}>
  <Command.Dialog>
    <Command.Input placeholder="Search for pages..." />
    <Command.List>
      <Command.Empty>No results found.</Command.Empty>
      
      <Command.Group heading="Navigation">
        {#each routes as route}
          <Command.Item onSelect={() => handleSelect(route.href)}>
            <svelte:component this={route.icon} size={16} />
            <span>{route.label}</span>
            <ArrowRight size={14} class="ml-auto" />
          </Command.Item>
        {/each}
      </Command.Group>
    </Command.List>
  </Command.Dialog>
</Command.Root>

<style>
  :global([data-cmdk-root]) {
    max-width: 640px;
    width: 100%;
  }
  
  :global([data-cmdk-dialog]) {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    overflow: hidden;
  }
  
  :global([data-cmdk-input]) {
    width: 100%;
    padding: var(--space-4);
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--color-border-default);
    font-size: var(--font-size-lg);
    color: var(--color-text-primary);
  }
  
  :global([data-cmdk-list]) {
    max-height: 400px;
    overflow-y: auto;
    padding: var(--space-2);
  }
  
  :global([data-cmdk-group-heading]) {
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
  }
  
  :global([data-cmdk-item]) {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  
  :global([data-cmdk-item][aria-selected="true"]) {
    background: var(--color-accent-3);
    color: var(--color-accent-11);
  }
  
  :global([data-cmdk-empty]) {
    padding: var(--space-8) var(--space-4);
    text-align: center;
    color: var(--color-text-muted);
  }
</style>
```

### Step 5: Create MobileNav Component (`src/lib/components/nav/MobileNav.svelte`)

```svelte
<script>
  import { page } from '$app/stores';
  import { Target, Calendar, Users, Home } from 'lucide-svelte';
  
  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/drills', label: 'Drills', icon: Target },
    { href: '/practice-plans', label: 'Plans', icon: Calendar },
    { href: '/teams', label: 'Teams', icon: Users }
  ];
</script>

<nav class="mobile-nav md:hidden">
  {#each navItems as item}
    <a 
      href={item.href}
      class="nav-item"
      class:active={$page.url.pathname === item.href || 
                   ($page.url.pathname.startsWith(item.href) && item.href !== '/')}
    >
      <svelte:component this={item.icon} size={20} />
      <span>{item.label}</span>
    </a>
  {/each}
</nav>

<style>
  .mobile-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    background: var(--color-surface-1);
    border-top: 1px solid var(--color-border-default);
    z-index: 40;
  }
  
  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    transition: all var(--transition-fast);
  }
  
  .nav-item:hover {
    background: var(--color-bg-subtle);
  }
  
  .nav-item.active {
    color: var(--color-accent-9);
    background: var(--color-accent-1);
  }
</style>
```

### Step 6: Update Layout (`src/routes/+layout.svelte`)

```svelte
<script>
  import '../app.css';
  import Topbar from '$lib/components/nav/Topbar.svelte';
  import Sidebar from '$lib/components/nav/Sidebar.svelte';
  import Breadcrumbs from '$lib/components/nav/Breadcrumbs.svelte';
  import MobileNav from '$lib/components/nav/MobileNav.svelte';
  import CommandPalette from '$lib/components/CommandPalette.svelte';
  import { page } from '$app/stores';
  // ... existing imports ...
  
  let sidebarOpen = false;
  let commandPaletteOpen = false;
  
  // Generate breadcrumb segments from URL
  $: breadcrumbs = generateBreadcrumbs($page.url.pathname);
  
  function generateBreadcrumbs(pathname) {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    let path = '';
    
    for (const segment of segments) {
      path += `/${segment}`;
      breadcrumbs.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        href: path
      });
    }
    
    return breadcrumbs;
  }
</script>

<div class="app-shell">
  <Topbar 
    bind:sidebarOpen 
    on:openCommandPalette={() => commandPaletteOpen = true}
  />
  
  <div class="app-body">
    <Sidebar bind:open={sidebarOpen} />
    
    <main class="main-content">
      <div class="content-wrapper">
        {#if breadcrumbs.length > 0}
          <Breadcrumbs segments={breadcrumbs} />
        {/if}
        
        <slot />
      </div>
    </main>
  </div>
  
  <MobileNav />
  <CommandPalette bind:open={commandPaletteOpen} />
  
  <!-- Existing components like SvelteToast, FeedbackButton -->
</div>

<style>
  .app-shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  .app-body {
    display: flex;
    flex: 1;
    position: relative;
  }
  
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding-bottom: 60px; /* Space for mobile nav */
  }
  
  @media (min-width: 768px) {
    .main-content {
      padding-bottom: 0;
      margin-left: 240px; /* Space for sidebar */
    }
    
    .app-body:has(.sidebar.collapsed) .main-content {
      margin-left: 60px; /* Collapsed sidebar width */
    }
  }
  
  .content-wrapper {
    flex: 1;
    padding: var(--space-4);
    max-width: 1280px;
    margin: 0 auto;
    width: 100%;
  }
</style>
```

## Testing Checklist

- [ ] Sidebar toggles on mobile via menu button
- [ ] Sidebar collapses/expands on desktop
- [ ] Active navigation items are highlighted
- [ ] Breadcrumbs show correct hierarchy
- [ ] CMD+K opens command palette
- [ ] Command palette navigates to selected routes
- [ ] Mobile bottom navigation appears on small screens
- [ ] Theme toggle is accessible from topbar
- [ ] User menu shows when authenticated
- [ ] All navigation is keyboard accessible
- [ ] Focus management works correctly in modals

## Common Issues & Solutions

1. **Command palette not opening**: Ensure cmdk-sv is properly installed and imported
2. **Sidebar not sticky**: Check CSS position and z-index values
3. **Mobile nav overlapping content**: Add padding-bottom to main content area

## Integration Points

- Auth state from `$lib/auth-client`
- Theme store from Ticket 001
- Page store from SvelteKit
- Existing Header component can be replaced with new Topbar

## Next Steps
After completing this ticket, proceed to Ticket 003 (Core UI Components) which will standardize buttons, inputs, and other UI primitives used throughout the app.
</file>

<file path="docs/ui-audit/tickets/003-core-ui-components-actionable.md">
# Ticket 003: Core UI Components - ACTIONABLE

## Overview
Create standardized, accessible UI components including buttons, inputs, tabs, dialogs, cards, skeletons, and toast notifications.

## Prerequisites
- [x] Complete Ticket 001 (Design Tokens)
- [x] Libraries installed: `bits-ui`, `lucide-svelte`, `@zerodevx/svelte-toast` (already installed)

## File Structure
```
src/lib/components/ui/
├── Button.svelte (NEW)
├── Input.svelte (NEW)
├── Select.svelte (NEW)
├── Textarea.svelte (NEW)
├── Tabs.svelte (NEW)
├── Dialog.svelte (NEW)
├── Card.svelte (NEW)
├── Skeleton.svelte (MODIFY existing)
├── ToastHost.svelte (NEW)
├── Badge.svelte (NEW)
├── Checkbox.svelte (NEW)
└── icons.ts (NEW)
```

## Implementation Steps

### Step 1: Create Button Component (`src/lib/components/ui/Button.svelte`)

```svelte
<script>
  import { Loader2 } from 'lucide-svelte';
  
  export let variant = 'primary'; // primary, secondary, ghost, destructive
  export let size = 'md'; // sm, md, lg
  export let loading = false;
  export let disabled = false;
  export let type = 'button';
  export let href = null;
  
  const Tag = href ? 'a' : 'button';
</script>

<svelte:element
  this={Tag}
  {href}
  {type}
  disabled={disabled || loading}
  aria-disabled={disabled || loading}
  class="btn btn-{variant} btn-{size}"
  class:loading
  on:click
  {...$$restProps}
>
  {#if loading}
    <Loader2 class="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
  {/if}
  <slot />
</svelte:element>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
    cursor: pointer;
    white-space: nowrap;
    text-decoration: none;
    border: 1px solid transparent;
  }
  
  /* Sizes */
  .btn-sm {
    padding: var(--space-1) var(--space-3);
    font-size: var(--font-size-sm);
  }
  
  .btn-md {
    padding: var(--space-2) var(--space-4);
    font-size: var(--font-size-base);
  }
  
  .btn-lg {
    padding: var(--space-3) var(--space-6);
    font-size: var(--font-size-lg);
  }
  
  /* Variants */
  .btn-primary {
    background: var(--color-accent-9);
    color: white;
    border-color: var(--color-accent-9);
  }
  
  .btn-primary:hover:not(:disabled) {
    background: var(--color-accent-10);
    border-color: var(--color-accent-10);
  }
  
  .btn-secondary {
    background: var(--color-surface-3);
    color: var(--color-text-primary);
    border-color: var(--color-border-default);
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: var(--color-bg-muted);
    border-color: var(--color-border-strong);
  }
  
  .btn-ghost {
    background: transparent;
    color: var(--color-text-primary);
  }
  
  .btn-ghost:hover:not(:disabled) {
    background: var(--color-bg-subtle);
  }
  
  .btn-destructive {
    background: var(--color-error);
    color: white;
    border-color: var(--color-error);
  }
  
  .btn-destructive:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  /* States */
  .btn:disabled,
  .btn[aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn.loading {
    position: relative;
    color: transparent;
  }
  
  .btn.loading > :global(svg) {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: currentColor;
  }
  
  :global(.animate-spin) {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
</style>
```

### Step 2: Create Input Component (`src/lib/components/ui/Input.svelte`)

```svelte
<script>
  import { createEventDispatcher } from 'svelte';
  
  export let id = '';
  export let label = '';
  export let type = 'text';
  export let value = '';
  export let placeholder = '';
  export let error = '';
  export let description = '';
  export let required = false;
  export let disabled = false;
  export let readonly = false;
  
  const dispatch = createEventDispatcher();
  
  function handleInput(e) {
    value = e.target.value;
    dispatch('input', e);
  }
</script>

<div class="input-wrapper">
  {#if label}
    <label for={id} class="label">
      {label}
      {#if required}
        <span class="required">*</span>
      {/if}
    </label>
  {/if}
  
  {#if description}
    <p class="description">{description}</p>
  {/if}
  
  <input
    {id}
    {type}
    {value}
    {placeholder}
    {required}
    {disabled}
    {readonly}
    class="input"
    class:error={error}
    aria-invalid={!!error}
    aria-describedby={error ? `${id}-error` : description ? `${id}-description` : undefined}
    on:input={handleInput}
    on:change
    on:blur
    on:focus
    {...$$restProps}
  />
  
  {#if error}
    <p id="{id}-error" class="error-message" role="alert">
      {error}
    </p>
  {/if}
</div>

<style>
  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  
  .label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  
  .required {
    color: var(--color-error);
  }
  
  .description {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  .input {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
    transition: all var(--transition-fast);
  }
  
  .input:hover:not(:disabled) {
    border-color: var(--color-border-strong);
  }
  
  .input:focus {
    outline: none;
    border-color: var(--color-accent-9);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }
  
  .input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-bg-muted);
  }
  
  .input.error {
    border-color: var(--color-error);
  }
  
  .input.error:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
  }
  
  .error-message {
    font-size: var(--font-size-sm);
    color: var(--color-error);
  }
</style>
```

### Step 3: Create Select Component (`src/lib/components/ui/Select.svelte`)

```svelte
<script>
  export let id = '';
  export let label = '';
  export let value = '';
  export let options = []; // [{value, label}]
  export let placeholder = 'Select an option';
  export let error = '';
  export let required = false;
  export let disabled = false;
</script>

<div class="select-wrapper">
  {#if label}
    <label for={id} class="label">
      {label}
      {#if required}
        <span class="required">*</span>
      {/if}
    </label>
  {/if}
  
  <select
    {id}
    bind:value
    {required}
    {disabled}
    class="select"
    class:error={error}
    aria-invalid={!!error}
    on:change
    on:blur
    {...$$restProps}
  >
    <option value="" disabled selected={!value}>
      {placeholder}
    </option>
    {#each options as option}
      <option value={option.value}>
        {option.label}
      </option>
    {/each}
  </select>
  
  {#if error}
    <p class="error-message" role="alert">
      {error}
    </p>
  {/if}
</div>

<style>
  .select-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  
  .label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  
  .required {
    color: var(--color-error);
  }
  
  .select {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    padding-right: var(--space-8);
    background: var(--color-surface-1);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right var(--space-3) center;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
    cursor: pointer;
    appearance: none;
    transition: all var(--transition-fast);
  }
  
  .select:hover:not(:disabled) {
    border-color: var(--color-border-strong);
  }
  
  .select:focus {
    outline: none;
    border-color: var(--color-accent-9);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }
  
  .select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--color-bg-muted);
  }
  
  .select.error {
    border-color: var(--color-error);
  }
  
  .error-message {
    font-size: var(--font-size-sm);
    color: var(--color-error);
  }
</style>
```

### Step 4: Create Dialog Component (`src/lib/components/ui/Dialog.svelte`)

```svelte
<script>
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import { X } from 'lucide-svelte';
  
  export let open = false;
  export let title = '';
  export let description = '';
</script>

<DialogPrimitive.Root bind:open>
  <DialogPrimitive.Trigger asChild let:builder>
    <slot name="trigger" {builder} />
  </DialogPrimitive.Trigger>
  
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay class="dialog-overlay" />
    <DialogPrimitive.Content class="dialog-content">
      <div class="dialog-header">
        {#if title}
          <DialogPrimitive.Title class="dialog-title">
            {title}
          </DialogPrimitive.Title>
        {/if}
        <DialogPrimitive.Close class="dialog-close">
          <X size={20} />
          <span class="sr-only">Close</span>
        </DialogPrimitive.Close>
      </div>
      
      {#if description}
        <DialogPrimitive.Description class="dialog-description">
          {description}
        </DialogPrimitive.Description>
      {/if}
      
      <div class="dialog-body">
        <slot />
      </div>
      
      {#if $$slots.footer}
        <div class="dialog-footer">
          <slot name="footer" />
        </div>
      {/if}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
</DialogPrimitive.Root>

<style>
  :global(.dialog-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    animation: fadeIn 150ms ease;
    z-index: 50;
  }
  
  :global(.dialog-content) {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 90vw;
    max-width: 500px;
    max-height: 85vh;
    background: var(--color-surface-1);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    animation: contentShow 150ms ease;
    z-index: 51;
    overflow: auto;
  }
  
  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
  }
  
  :global(.dialog-title) {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
  
  :global(.dialog-close) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  :global(.dialog-close:hover) {
    background: var(--color-bg-subtle);
    color: var(--color-text-primary);
  }
  
  :global(.dialog-description) {
    padding: 0 var(--space-4);
    margin-top: var(--space-2);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  .dialog-body {
    padding: var(--space-4);
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    padding: var(--space-4);
    border-top: 1px solid var(--color-border-default);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes contentShow {
    from {
      opacity: 0;
      transform: translate(-50%, -48%) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
```

### Step 5: Create Card Component (`src/lib/components/ui/Card.svelte`)

```svelte
<script>
  export let variant = 'default'; // default, bordered, elevated
  export let padding = 'md'; // sm, md, lg
</script>

<div class="card card-{variant} padding-{padding}" {...$$restProps}>
  {#if $$slots.header}
    <div class="card-header">
      <slot name="header" />
    </div>
  {/if}
  
  <div class="card-content">
    <slot />
  </div>
  
  {#if $$slots.footer}
    <div class="card-footer">
      <slot name="footer" />
    </div>
  {/if}
</div>

<style>
  .card {
    background: var(--color-surface-1);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  
  .card-default {
    /* No additional styling */
  }
  
  .card-bordered {
    border: 1px solid var(--color-border-default);
  }
  
  .card-elevated {
    box-shadow: var(--shadow-md);
  }
  
  .card-header {
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
    font-weight: var(--font-weight-semibold);
  }
  
  .card-content {
    padding: var(--space-4);
  }
  
  .padding-sm .card-content {
    padding: var(--space-2);
  }
  
  .padding-lg .card-content {
    padding: var(--space-6);
  }
  
  .card-footer {
    padding: var(--space-4);
    border-top: 1px solid var(--color-border-default);
    background: var(--color-bg-subtle);
  }
</style>
```

### Step 6: Update Skeleton Component (`src/lib/components/ui/Skeleton.svelte`)

```svelte
<script>
  export let variant = 'rect'; // rect, line, circle
  export let width = '100%';
  export let height = '20px';
  export let rounded = false;
</script>

<div 
  class="skeleton skeleton-{variant}"
  class:rounded
  style="width: {width}; height: {height};"
/>

<style>
  .skeleton {
    background: linear-gradient(
      90deg,
      var(--color-bg-muted) 25%,
      var(--color-surface-3) 50%,
      var(--color-bg-muted) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  .skeleton-rect {
    border-radius: var(--radius-md);
  }
  
  .skeleton-line {
    border-radius: var(--radius-sm);
    height: 12px;
  }
  
  .skeleton-circle {
    border-radius: 50%;
  }
  
  .rounded {
    border-radius: var(--radius-full);
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
</style>
```

### Step 7: Create Tabs Component (`src/lib/components/ui/Tabs.svelte`)

```svelte
<script>
  import { Tabs as TabsPrimitive } from 'bits-ui';
  
  export let value = '';
  export let tabs = []; // [{value, label, content}]
</script>

<TabsPrimitive.Root bind:value class="tabs">
  <TabsPrimitive.List class="tabs-list">
    {#each tabs as tab}
      <TabsPrimitive.Trigger value={tab.value} class="tabs-trigger">
        {tab.label}
      </TabsPrimitive.Trigger>
    {/each}
  </TabsPrimitive.List>
  
  {#each tabs as tab}
    <TabsPrimitive.Content value={tab.value} class="tabs-content">
      {#if tab.content}
        {@html tab.content}
      {:else}
        <slot name={tab.value} />
      {/if}
    </TabsPrimitive.Content>
  {/each}
</TabsPrimitive.Root>

<style>
  :global(.tabs) {
    width: 100%;
  }
  
  :global(.tabs-list) {
    display: flex;
    gap: var(--space-1);
    border-bottom: 1px solid var(--color-border-default);
    margin-bottom: var(--space-4);
  }
  
  :global(.tabs-trigger) {
    padding: var(--space-2) var(--space-4);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-fast);
    margin-bottom: -1px;
  }
  
  :global(.tabs-trigger:hover) {
    color: var(--color-text-primary);
  }
  
  :global(.tabs-trigger[data-state="active"]) {
    color: var(--color-accent-9);
    border-bottom-color: var(--color-accent-9);
  }
  
  :global(.tabs-content) {
    animation: fadeIn 150ms ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
```

### Step 8: Create Icons Export (`src/lib/components/ui/icons.ts`)

```typescript
// Re-export commonly used icons for consistency
export {
  // Navigation
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  
  // Actions
  Plus,
  Minus,
  Edit,
  Trash,
  Save,
  Download,
  Upload,
  Copy,
  Share,
  
  // UI
  Search,
  Filter,
  Settings,
  Info,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  XCircle,
  
  // User
  User,
  Users,
  LogIn,
  LogOut,
  
  // Media
  Image,
  Play,
  Pause,
  
  // Common
  Calendar,
  Clock,
  Target,
  Loader2,
  MoreVertical,
  MoreHorizontal
} from 'lucide-svelte';
```

## Testing Checklist

- [ ] All buttons show loading state with spinner
- [ ] Disabled states are visually distinct and not clickable
- [ ] Input validation shows error messages
- [ ] Select dropdowns work with keyboard navigation
- [ ] Dialogs trap focus and restore on close
- [ ] Cards render with proper spacing and borders
- [ ] Skeleton loaders animate smoothly
- [ ] Tabs switch content without page reload
- [ ] All components respect theme colors
- [ ] Focus states are visible on all interactive elements
- [ ] Components are screen reader accessible

## Usage Examples

```svelte
<!-- Button -->
<Button variant="primary" size="lg" loading={isLoading} on:click={handleClick}>
  Save Changes
</Button>

<!-- Input -->
<Input 
  label="Email" 
  type="email" 
  bind:value={email} 
  error={errors.email}
  required
/>

<!-- Dialog -->
<Dialog title="Confirm Action" bind:open={dialogOpen}>
  <p>Are you sure you want to proceed?</p>
  <div slot="footer">
    <Button variant="ghost" on:click={() => dialogOpen = false}>Cancel</Button>
    <Button variant="primary" on:click={handleConfirm}>Confirm</Button>
  </div>
</Dialog>

<!-- Card -->
<Card variant="bordered">
  <h3 slot="header">Card Title</h3>
  <p>Card content goes here</p>
  <div slot="footer">
    <Button size="sm">Action</Button>
  </div>
</Card>
```

## Integration Notes

- Replace existing button components with new Button.svelte
- Update forms to use new Input/Select components
- Replace existing modals with Dialog component
- Use consistent icon imports from icons.ts

## Next Steps
After completing this ticket, proceed to Ticket 004 (Drills Library Revamp) which will use these components to rebuild the drills page.
</file>

<file path="docs/ui-audit/tickets/004-drills-library-revamp-actionable.md">
# Ticket 004: Drills Library Revamp - ACTIONABLE

## Overview
Improve drills discoverability with enhanced search, filters, grid/list views, and better visual hierarchy.

## Prerequisites
- [x] Complete Tickets 001-003 (Design System, Navigation, Components)
- [x] Existing drill data structure in database

## Current State Analysis
- Current file: `src/routes/drills/+page.svelte`
- API endpoint: `/api/drills`
- Filter component: `src/lib/components/DrillSearchFilter.svelte`

## File Structure
```
src/
├── lib/
│   ├── components/
│   │   └── drills/
│   │       ├── DrillCard.svelte (NEW)
│   │       ├── DrillFilters.svelte (NEW)
│   │       ├── DrillGrid.svelte (NEW)
│   │       └── DrillSearchBar.svelte (NEW)
│   └── stores/
│       └── drillFilterStore.ts (NEW)
└── routes/
    └── drills/
        └── +page.svelte (MODIFY)
```

## Implementation Steps

### Step 1: Create Drill Filter Store (`src/lib/stores/drillFilterStore.ts`)

```typescript
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

interface FilterState {
  search: string;
  positions: string[];
  skills: string[];
  difficulty: string[];
  duration: { min: number; max: number };
  tags: string[];
  sortBy: 'name' | 'created' | 'updated' | 'votes';
  sortOrder: 'asc' | 'desc';
  view: 'grid' | 'list';
  density: 'compact' | 'comfortable' | 'spacious';
}

const STORAGE_KEY = 'drill-filters';

function createDrillFilterStore() {
  // Load saved filters from localStorage
  const savedFilters = browser && localStorage.getItem(STORAGE_KEY);
  const initialState: FilterState = savedFilters ? JSON.parse(savedFilters) : {
    search: '',
    positions: [],
    skills: [],
    difficulty: [],
    duration: { min: 0, max: 120 },
    tags: [],
    sortBy: 'created',
    sortOrder: 'desc',
    view: 'grid',
    density: 'comfortable'
  };

  const { subscribe, set, update } = writable<FilterState>(initialState);

  // Save to localStorage on change
  subscribe(value => {
    if (browser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
  });

  return {
    subscribe,
    setSearch: (search: string) => update(s => ({ ...s, search })),
    togglePosition: (position: string) => update(s => ({
      ...s,
      positions: s.positions.includes(position)
        ? s.positions.filter(p => p !== position)
        : [...s.positions, position]
    })),
    toggleSkill: (skill: string) => update(s => ({
      ...s,
      skills: s.skills.includes(skill)
        ? s.skills.filter(sk => sk !== skill)
        : [...s.skills, skill]
    })),
    setDuration: (duration: { min: number; max: number }) => update(s => ({ ...s, duration })),
    setSortBy: (sortBy: FilterState['sortBy']) => update(s => ({ ...s, sortBy })),
    setSortOrder: (sortOrder: FilterState['sortOrder']) => update(s => ({ ...s, sortOrder })),
    setView: (view: FilterState['view']) => update(s => ({ ...s, view })),
    setDensity: (density: FilterState['density']) => update(s => ({ ...s, density })),
    clearAll: () => set(initialState),
    savePreset: (name: string) => {
      const presets = JSON.parse(localStorage.getItem('drill-filter-presets') || '{}');
      subscribe(value => {
        presets[name] = value;
        localStorage.setItem('drill-filter-presets', JSON.stringify(presets));
      })();
    },
    loadPreset: (name: string) => {
      const presets = JSON.parse(localStorage.getItem('drill-filter-presets') || '{}');
      if (presets[name]) {
        set(presets[name]);
      }
    }
  };
}

export const drillFilters = createDrillFilterStore();

// Derived store for active filter count
export const activeFilterCount = derived(drillFilters, $filters => {
  let count = 0;
  if ($filters.search) count++;
  count += $filters.positions.length;
  count += $filters.skills.length;
  count += $filters.difficulty.length;
  count += $filters.tags.length;
  if ($filters.duration.min > 0 || $filters.duration.max < 120) count++;
  return count;
});
```

### Step 2: Create Drill Search Bar (`src/lib/components/drills/DrillSearchBar.svelte`)

```svelte
<script>
  import { Search, SlidersHorizontal, Grid, List, X } from 'lucide-svelte';
  import { drillFilters, activeFilterCount } from '$lib/stores/drillFilterStore';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let searchInput;
  let searchValue = '';
  let searchTimeout;
  
  // Subscribe to filter store
  $: searchValue = $drillFilters.search;
  
  function handleSearch(e) {
    const value = e.target.value;
    searchValue = value;
    
    // Debounce search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      drillFilters.setSearch(value);
    }, 300);
  }
  
  function clearSearch() {
    searchValue = '';
    drillFilters.setSearch('');
    searchInput?.focus();
  }
  
  function toggleView() {
    drillFilters.setView($drillFilters.view === 'grid' ? 'list' : 'grid');
  }
  
  // Focus search on / key
  function handleKeydown(e) {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      searchInput?.focus();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="search-bar">
  <div class="search-input-wrapper">
    <Search size={20} class="search-icon" />
    <input
      bind:this={searchInput}
      type="text"
      value={searchValue}
      on:input={handleSearch}
      placeholder="Search drills... (Press / to focus)"
      class="search-input"
    />
    {#if searchValue}
      <button on:click={clearSearch} class="clear-button" aria-label="Clear search">
        <X size={16} />
      </button>
    {/if}
  </div>
  
  <div class="search-actions">
    <button 
      on:click={() => dispatch('toggleFilters')}
      class="filter-button"
      class:active={$activeFilterCount > 0}
    >
      <SlidersHorizontal size={20} />
      <span>Filters</span>
      {#if $activeFilterCount > 0}
        <span class="filter-count">{$activeFilterCount}</span>
      {/if}
    </button>
    
    <div class="view-toggle">
      <button 
        on:click={toggleView}
        class="view-button"
        class:active={$drillFilters.view === 'grid'}
        aria-label="Grid view"
      >
        <Grid size={20} />
      </button>
      <button 
        on:click={toggleView}
        class="view-button"
        class:active={$drillFilters.view === 'list'}
        aria-label="List view"
      >
        <List size={20} />
      </button>
    </div>
  </div>
</div>

<style>
  .search-bar {
    display: flex;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
  
  .search-input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
  }
  
  :global(.search-icon) {
    position: absolute;
    left: var(--space-3);
    color: var(--color-text-muted);
    pointer-events: none;
  }
  
  .search-input {
    width: 100%;
    padding: var(--space-2) var(--space-10);
    padding-right: var(--space-8);
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-base);
    transition: all var(--transition-fast);
  }
  
  .search-input:focus {
    outline: none;
    border-color: var(--color-accent-9);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }
  
  .clear-button {
    position: absolute;
    right: var(--space-2);
    padding: var(--space-1);
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .clear-button:hover {
    background: var(--color-bg-subtle);
    color: var(--color-text-primary);
  }
  
  .search-actions {
    display: flex;
    gap: var(--space-2);
  }
  
  .filter-button {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .filter-button:hover,
  .filter-button.active {
    border-color: var(--color-accent-9);
    color: var(--color-accent-9);
  }
  
  .filter-count {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 var(--space-1);
    background: var(--color-accent-9);
    color: white;
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
  }
  
  .view-toggle {
    display: flex;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    overflow: hidden;
  }
  
  .view-button {
    padding: var(--space-2);
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .view-button:not(:last-child) {
    border-right: 1px solid var(--color-border-default);
  }
  
  .view-button:hover {
    background: var(--color-bg-subtle);
    color: var(--color-text-primary);
  }
  
  .view-button.active {
    background: var(--color-accent-3);
    color: var(--color-accent-9);
  }
  
  @media (max-width: 640px) {
    .search-bar {
      flex-direction: column;
    }
    
    .search-actions {
      justify-content: space-between;
    }
  }
</style>
```

### Step 3: Create Drill Card (`src/lib/components/drills/DrillCard.svelte`)

```svelte
<script>
  import { Target, Clock, Users, ArrowUp, Plus, Eye } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  export let drill;
  export let view = 'grid'; // grid or list
  export let density = 'comfortable'; // compact, comfortable, spacious
  
  $: imageUrl = drill.image_url || '/placeholder-drill.svg';
</script>

<article class="drill-card view-{view} density-{density}">
  <a href="/drills/{drill.id}" class="card-link">
    {#if view === 'grid'}
      <div class="card-image">
        <img src={imageUrl} alt={drill.name} loading="lazy" />
        <div class="card-badges">
          {#if drill.is_new}
            <span class="badge badge-new">New</span>
          {/if}
          {#if drill.is_featured}
            <span class="badge badge-featured">Featured</span>
          {/if}
        </div>
      </div>
    {/if}
    
    <div class="card-content">
      <h3 class="card-title">{drill.name}</h3>
      
      <div class="card-meta">
        <span class="meta-item">
          <Clock size={14} />
          {drill.duration} min
        </span>
        <span class="meta-item">
          <Users size={14} />
          {drill.position || 'All'}
        </span>
        <span class="meta-item difficulty-{drill.difficulty}">
          {drill.difficulty}
        </span>
      </div>
      
      {#if density !== 'compact'}
        <p class="card-description">
          {drill.description}
        </p>
      {/if}
      
      <div class="card-tags">
        {#each (drill.tags || []).slice(0, 3) as tag}
          <span class="tag">{tag}</span>
        {/each}
        {#if drill.tags?.length > 3}
          <span class="tag">+{drill.tags.length - 3}</span>
        {/if}
      </div>
    </div>
  </a>
  
  <div class="card-actions">
    <div class="card-stats">
      <button class="stat-button" aria-label="Upvote">
        <ArrowUp size={16} />
        <span>{drill.votes || 0}</span>
      </button>
    </div>
    
    <div class="action-buttons">
      <Button size="sm" variant="ghost" href="/drills/{drill.id}">
        <Eye size={16} />
        View
      </Button>
      <Button size="sm" variant="primary">
        <Plus size={16} />
        Add to Plan
      </Button>
    </div>
  </div>
</article>

<style>
  .drill-card {
    display: flex;
    flex-direction: column;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all var(--transition-fast);
  }
  
  .drill-card:hover {
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-md);
  }
  
  .card-link {
    display: flex;
    flex-direction: column;
    flex: 1;
    color: inherit;
    text-decoration: none;
  }
  
  /* Grid view styles */
  .view-grid .card-image {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    overflow: hidden;
    background: var(--color-bg-muted);
  }
  
  .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .card-badges {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    display: flex;
    gap: var(--space-1);
  }
  
  .badge {
    padding: var(--space-1) var(--space-2);
    background: var(--color-surface-1);
    border-radius: var(--radius-md);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
  }
  
  .badge-new {
    background: var(--color-success);
    color: white;
  }
  
  .badge-featured {
    background: var(--color-accent-9);
    color: white;
  }
  
  /* List view styles */
  .view-list {
    flex-direction: row;
  }
  
  .view-list .card-link {
    flex-direction: row;
    align-items: center;
    padding: var(--space-3);
  }
  
  .view-list .card-content {
    flex: 1;
  }
  
  /* Content styles */
  .card-content {
    padding: var(--space-3);
    flex: 1;
  }
  
  .card-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-2);
    line-height: var(--line-height-snug);
  }
  
  .card-meta {
    display: flex;
    gap: var(--space-3);
    margin-bottom: var(--space-2);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
  
  .difficulty-beginner {
    color: var(--color-success);
  }
  
  .difficulty-intermediate {
    color: var(--color-warning);
  }
  
  .difficulty-advanced {
    color: var(--color-error);
  }
  
  .card-description {
    margin-bottom: var(--space-2);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }
  
  .tag {
    padding: var(--space-1) var(--space-2);
    background: var(--color-bg-subtle);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }
  
  /* Actions */
  .card-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3);
    border-top: 1px solid var(--color-border-default);
    background: var(--color-bg-subtle);
  }
  
  .card-stats {
    display: flex;
    gap: var(--space-2);
  }
  
  .stat-button {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .stat-button:hover {
    background: var(--color-surface-1);
    color: var(--color-accent-9);
  }
  
  .action-buttons {
    display: flex;
    gap: var(--space-2);
  }
  
  /* Density variations */
  .density-compact .card-content {
    padding: var(--space-2);
  }
  
  .density-compact .card-title {
    font-size: var(--font-size-base);
  }
  
  .density-spacious .card-content {
    padding: var(--space-4);
  }
  
  .density-spacious .card-description {
    -webkit-line-clamp: 3;
  }
</style>
```

### Step 4: Create Drill Filters Panel (`src/lib/components/drills/DrillFilters.svelte`)

```svelte
<script>
  import { X, Filter, Save } from 'lucide-svelte';
  import { drillFilters, activeFilterCount } from '$lib/stores/drillFilterStore';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  
  export let open = false;
  
  // Filter options (would come from API in real app)
  const positions = ['Chaser', 'Beater', 'Keeper', 'Seeker', 'All'];
  const skills = ['Passing', 'Shooting', 'Defense', 'Speed', 'Teamwork'];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  
  let presetName = '';
  
  function clearAll() {
    drillFilters.clearAll();
  }
  
  function savePreset() {
    if (presetName) {
      drillFilters.savePreset(presetName);
      presetName = '';
    }
  }
</script>

<aside class="filters-panel" class:open>
  <div class="filters-header">
    <h2>Filters</h2>
    <button on:click={() => open = false} class="close-button" aria-label="Close filters">
      <X size={20} />
    </button>
  </div>
  
  <div class="filters-content">
    <!-- Active filters summary -->
    {#if $activeFilterCount > 0}
      <div class="active-filters">
        <span>{$activeFilterCount} active filters</span>
        <button on:click={clearAll} class="clear-all">Clear all</button>
      </div>
    {/if}
    
    <!-- Position filter -->
    <div class="filter-group">
      <h3>Position</h3>
      <div class="filter-options">
        {#each positions as position}
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={$drillFilters.positions.includes(position)}
              on:change={() => drillFilters.togglePosition(position)}
            />
            <span>{position}</span>
          </label>
        {/each}
      </div>
    </div>
    
    <!-- Skills filter -->
    <div class="filter-group">
      <h3>Skills</h3>
      <div class="filter-options">
        {#each skills as skill}
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={$drillFilters.skills.includes(skill)}
              on:change={() => drillFilters.toggleSkill(skill)}
            />
            <span>{skill}</span>
          </label>
        {/each}
      </div>
    </div>
    
    <!-- Difficulty filter -->
    <div class="filter-group">
      <h3>Difficulty</h3>
      <div class="filter-options">
        {#each difficulties as difficulty}
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={$drillFilters.difficulty.includes(difficulty)}
              on:change={() => drillFilters.toggleDifficulty(difficulty)}
            />
            <span>{difficulty}</span>
          </label>
        {/each}
      </div>
    </div>
    
    <!-- Duration filter -->
    <div class="filter-group">
      <h3>Duration (minutes)</h3>
      <div class="range-inputs">
        <Input
          type="number"
          placeholder="Min"
          value={$drillFilters.duration.min}
          on:change={(e) => drillFilters.setDuration({
            ...$drillFilters.duration,
            min: parseInt(e.target.value) || 0
          })}
        />
        <span>to</span>
        <Input
          type="number"
          placeholder="Max"
          value={$drillFilters.duration.max}
          on:change={(e) => drillFilters.setDuration({
            ...$drillFilters.duration,
            max: parseInt(e.target.value) || 120
          })}
        />
      </div>
    </div>
    
    <!-- Sort options -->
    <div class="filter-group">
      <h3>Sort By</h3>
      <select 
        class="sort-select"
        value={$drillFilters.sortBy}
        on:change={(e) => drillFilters.setSortBy(e.target.value)}
      >
        <option value="name">Name</option>
        <option value="created">Newest</option>
        <option value="updated">Recently Updated</option>
        <option value="votes">Most Popular</option>
      </select>
    </div>
    
    <!-- Preset management -->
    <div class="filter-group">
      <h3>Filter Presets</h3>
      <div class="preset-controls">
        <Input
          bind:value={presetName}
          placeholder="Preset name"
        />
        <Button size="sm" on:click={savePreset}>
          <Save size={16} />
          Save
        </Button>
      </div>
    </div>
  </div>
</aside>

<style>
  .filters-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 320px;
    background: var(--color-surface-1);
    border-left: 1px solid var(--color-border-default);
    transform: translateX(100%);
    transition: transform var(--transition-base);
    z-index: 40;
    overflow-y: auto;
  }
  
  .filters-panel.open {
    transform: translateX(0);
    box-shadow: var(--shadow-xl);
  }
  
  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
    position: sticky;
    top: 0;
    background: var(--color-surface-1);
  }
  
  .filters-header h2 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
  }
  
  .close-button {
    padding: var(--space-2);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .close-button:hover {
    background: var(--color-bg-subtle);
    color: var(--color-text-primary);
  }
  
  .filters-content {
    padding: var(--space-4);
  }
  
  .active-filters {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-2) var(--space-3);
    background: var(--color-accent-1);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-4);
    font-size: var(--font-size-sm);
  }
  
  .clear-all {
    background: transparent;
    border: none;
    color: var(--color-accent-9);
    cursor: pointer;
    font-weight: var(--font-weight-medium);
  }
  
  .filter-group {
    margin-bottom: var(--space-6);
  }
  
  .filter-group h3 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-2);
  }
  
  .filter-options {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    font-size: var(--font-size-sm);
  }
  
  .checkbox-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--color-accent-9);
  }
  
  .range-inputs {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  
  .sort-select {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    cursor: pointer;
  }
  
  .preset-controls {
    display: flex;
    gap: var(--space-2);
  }
  
  @media (max-width: 640px) {
    .filters-panel {
      width: 100%;
    }
  }
</style>
```

### Step 5: Update Drills Page (`src/routes/drills/+page.svelte`)

```svelte
<script>
  import { onMount } from 'svelte';
  import { drillFilters } from '$lib/stores/drillFilterStore';
  import DrillSearchBar from '$lib/components/drills/DrillSearchBar.svelte';
  import DrillFilters from '$lib/components/drills/DrillFilters.svelte';
  import DrillCard from '$lib/components/drills/DrillCard.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { apiFetch } from '$lib/utils/apiFetch';
  
  export let data;
  
  let drills = [];
  let loading = true;
  let filtersOpen = false;
  
  onMount(async () => {
    await loadDrills();
  });
  
  async function loadDrills() {
    loading = true;
    try {
      const response = await apiFetch('/api/drills');
      drills = response.drills || [];
    } catch (error) {
      console.error('Failed to load drills:', error);
    } finally {
      loading = false;
    }
  }
  
  // Filter and sort drills based on store values
  $: filteredDrills = filterDrills(drills, $drillFilters);
  
  function filterDrills(drills, filters) {
    let result = [...drills];
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(drill => 
        drill.name.toLowerCase().includes(searchLower) ||
        drill.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Position filter
    if (filters.positions.length > 0) {
      result = result.filter(drill => 
        filters.positions.includes(drill.position) || 
        filters.positions.includes('All')
      );
    }
    
    // Skills filter
    if (filters.skills.length > 0) {
      result = result.filter(drill => 
        drill.skills?.some(skill => filters.skills.includes(skill))
      );
    }
    
    // Difficulty filter
    if (filters.difficulty.length > 0) {
      result = result.filter(drill => 
        filters.difficulty.includes(drill.difficulty)
      );
    }
    
    // Duration filter
    result = result.filter(drill => 
      drill.duration >= filters.duration.min && 
      drill.duration <= filters.duration.max
    );
    
    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = new Date(b.created_at) - new Date(a.created_at);
          break;
        case 'updated':
          comparison = new Date(b.updated_at) - new Date(a.updated_at);
          break;
        case 'votes':
          comparison = (b.votes || 0) - (a.votes || 0);
          break;
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }
</script>

<div class="drills-page">
  <div class="page-header">
    <h1>Drill Library</h1>
    <Button variant="primary" href="/drills/create">
      Create New Drill
    </Button>
  </div>
  
  <DrillSearchBar on:toggleFilters={() => filtersOpen = !filtersOpen} />
  
  <div class="drills-container">
    {#if loading}
      <div class="loading-grid">
        {#each Array(12) as _, i}
          <div class="skeleton-card">
            <Skeleton variant="rect" height="180px" />
            <div class="skeleton-content">
              <Skeleton variant="line" width="70%" />
              <Skeleton variant="line" width="50%" />
              <Skeleton variant="line" />
            </div>
          </div>
        {/each}
      </div>
    {:else if filteredDrills.length === 0}
      <div class="empty-state">
        <img src="/empty-drills.svg" alt="No drills found" />
        <h2>No drills found</h2>
        <p>Try adjusting your filters or search terms</p>
        <Button variant="secondary" on:click={() => drillFilters.clearAll()}>
          Clear Filters
        </Button>
      </div>
    {:else}
      <div class="drills-grid" class:list-view={$drillFilters.view === 'list'}>
        {#each filteredDrills as drill (drill.id)}
          <DrillCard 
            {drill} 
            view={$drillFilters.view}
            density={$drillFilters.density}
          />
        {/each}
      </div>
    {/if}
  </div>
  
  <DrillFilters bind:open={filtersOpen} />
</div>

<style>
  .drills-page {
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
  }
  
  .page-header h1 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
  }
  
  .drills-container {
    min-height: 400px;
  }
  
  .drills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-4);
  }
  
  .drills-grid.list-view {
    grid-template-columns: 1fr;
  }
  
  .loading-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-4);
  }
  
  .skeleton-card {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  
  .skeleton-content {
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-12);
    text-align: center;
  }
  
  .empty-state img {
    width: 200px;
    height: 200px;
    margin-bottom: var(--space-4);
    opacity: 0.5;
  }
  
  .empty-state h2 {
    font-size: var(--font-size-xl);
    margin-bottom: var(--space-2);
  }
  
  .empty-state p {
    color: var(--color-text-muted);
    margin-bottom: var(--space-4);
  }
  
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-3);
    }
    
    .drills-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
```

## Testing Checklist

- [ ] Search filters drills in real-time with debouncing
- [ ] Position, skill, difficulty filters work correctly
- [ ] Duration range filter limits results appropriately
- [ ] Grid/list view toggle changes layout
- [ ] Density settings adjust card size and information
- [ ] Filter panel opens/closes smoothly
- [ ] Active filter count displays correctly
- [ ] Clear all filters resets to defaults
- [ ] Preset saving and loading works
- [ ] Sorting changes order correctly
- [ ] Empty state displays when no results
- [ ] Loading skeletons show during data fetch
- [ ] Cards link to drill detail pages
- [ ] Add to plan button functions (or shows appropriate state)
- [ ] Mobile responsive layout works

## API Integration Notes

- Modify `/api/drills` endpoint to accept filter parameters
- Add endpoints for filter options: `/api/drills/filter-options`
- Implement server-side pagination for large datasets
- Add search indexing for better performance

## Performance Optimizations

1. Virtual scrolling for > 100 drills
2. Image lazy loading with IntersectionObserver
3. Debounced search input
4. Memoized filter calculations
5. localStorage caching of filter preferences

## Next Steps
After completing this ticket, proceed to Ticket 005 (Drill Detail Improvements) to enhance individual drill pages.
</file>

<file path="docs/ui-audit/tickets/005-drill-detail-improvements-actionable.md">
# Ticket 005: Drill Detail Improvements - ACTIONABLE

## Overview
Enhance the drill detail page with better information architecture, tabs for organized content, and related drills section.

## Prerequisites
- [x] Complete Tickets 001-003 (Design System, Navigation, Components)
- [x] Button, Card, and Tabs components from Ticket 003

## Current State
- Current file: `src/routes/drills/[id]/+page.svelte`
- API endpoint: `/api/drills/[id]`

## File Structure
```
src/
├── lib/
│   └── components/
│       └── drills/
│           ├── DrillDetailHeader.svelte (NEW)
│           ├── DrillDetailTabs.svelte (NEW)
│           ├── RelatedDrills.svelte (NEW)
│           └── DrillActions.svelte (NEW)
└── routes/
    └── drills/
        └── [id]/
            └── +page.svelte (MODIFY)
```

## Implementation Steps

### Step 1: Create Drill Detail Header (`src/lib/components/drills/DrillDetailHeader.svelte`)

```svelte
<script>
  import { Clock, Users, Target, Trophy, Share2, Bookmark, Edit } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { page } from '$app/stores';
  
  export let drill;
  export let isOwner = false;
  
  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: drill.name,
        text: drill.description,
        url: window.location.href
      });
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
    }
  }
</script>

<header class="drill-header">
  <div class="header-content">
    <div class="header-main">
      <h1>{drill.name}</h1>
      
      <div class="meta-badges">
        <span class="badge badge-position">
          <Users size={14} />
          {drill.position || 'All Positions'}
        </span>
        <span class="badge badge-duration">
          <Clock size={14} />
          {drill.duration} min
        </span>
        <span class="badge badge-difficulty badge-{drill.difficulty?.toLowerCase()}">
          <Target size={14} />
          {drill.difficulty}
        </span>
        {#if drill.is_featured}
          <span class="badge badge-featured">
            <Trophy size={14} />
            Featured
          </span>
        {/if}
      </div>
      
      <p class="description">{drill.description}</p>
    </div>
    
    <div class="header-actions">
      <div class="primary-actions">
        <Button variant="primary" size="lg">
          Add to Practice Plan
        </Button>
        {#if isOwner}
          <Button variant="secondary" href="/drills/{drill.id}/edit">
            <Edit size={16} />
            Edit
          </Button>
        {/if}
      </div>
      
      <div class="secondary-actions">
        <button class="icon-action" on:click={handleShare} aria-label="Share">
          <Share2 size={20} />
        </button>
        <button class="icon-action" aria-label="Bookmark">
          <Bookmark size={20} />
        </button>
      </div>
    </div>
  </div>
  
  {#if drill.image_url}
    <div class="header-image">
      <img src={drill.image_url} alt="{drill.name} diagram" />
    </div>
  {/if}
</header>

<style>
  .drill-header {
    background: var(--color-surface-1);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin-bottom: var(--space-6);
    border: 1px solid var(--color-border-default);
  }
  
  .header-content {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-6);
    align-items: start;
  }
  
  .header-main h1 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--space-3);
  }
  
  .meta-badges {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }
  
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    background: var(--color-bg-subtle);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }
  
  .badge-beginner {
    background: var(--color-success);
    color: white;
  }
  
  .badge-intermediate {
    background: var(--color-warning);
    color: white;
  }
  
  .badge-advanced {
    background: var(--color-error);
    color: white;
  }
  
  .badge-featured {
    background: var(--color-accent-9);
    color: white;
  }
  
  .description {
    font-size: var(--font-size-lg);
    line-height: var(--line-height-relaxed);
    color: var(--color-text-secondary);
  }
  
  .header-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  
  .primary-actions {
    display: flex;
    gap: var(--space-2);
  }
  
  .secondary-actions {
    display: flex;
    gap: var(--space-2);
  }
  
  .icon-action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .icon-action:hover {
    background: var(--color-surface-3);
    color: var(--color-text-primary);
    border-color: var(--color-border-strong);
  }
  
  .header-image {
    margin-top: var(--space-4);
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--color-bg-muted);
  }
  
  .header-image img {
    width: 100%;
    height: auto;
    display: block;
  }
  
  @media (max-width: 768px) {
    .header-content {
      grid-template-columns: 1fr;
    }
    
    .header-actions {
      flex-direction: row;
      justify-content: space-between;
    }
  }
</style>
```

### Step 2: Create Drill Detail Tabs (`src/lib/components/drills/DrillDetailTabs.svelte`)

```svelte
<script>
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import Card from '$lib/components/ui/Card.svelte';
  
  export let drill;
  
  let activeTab = 'description';
</script>

<TabsPrimitive.Root bind:value={activeTab} class="drill-tabs">
  <TabsPrimitive.List class="tabs-list">
    <TabsPrimitive.Trigger value="description" class="tab-trigger">
      Description
    </TabsPrimitive.Trigger>
    <TabsPrimitive.Trigger value="steps" class="tab-trigger">
      Steps
    </TabsPrimitive.Trigger>
    <TabsPrimitive.Trigger value="equipment" class="tab-trigger">
      Equipment
    </TabsPrimitive.Trigger>
    <TabsPrimitive.Trigger value="variations" class="tab-trigger">
      Variations ({drill.variations?.length || 0})
    </TabsPrimitive.Trigger>
    <TabsPrimitive.Trigger value="coaching" class="tab-trigger">
      Coaching Points
    </TabsPrimitive.Trigger>
  </TabsPrimitive.List>
  
  <div class="tab-content">
    <TabsPrimitive.Content value="description" class="tab-panel">
      <Card>
        <div class="content-section">
          <h3>Overview</h3>
          <p>{drill.long_description || drill.description}</p>
          
          {#if drill.objectives}
            <h3>Learning Objectives</h3>
            <ul>
              {#each drill.objectives as objective}
                <li>{objective}</li>
              {/each}
            </ul>
          {/if}
          
          {#if drill.key_skills}
            <h3>Key Skills Developed</h3>
            <div class="skill-tags">
              {#each drill.key_skills as skill}
                <span class="skill-tag">{skill}</span>
              {/each}
            </div>
          {/if}
        </div>
      </Card>
    </TabsPrimitive.Content>
    
    <TabsPrimitive.Content value="steps" class="tab-panel">
      <Card>
        <div class="content-section">
          <h3>Setup</h3>
          <p>{drill.setup || 'No specific setup required.'}</p>
          
          <h3>Instructions</h3>
          {#if drill.steps}
            <ol class="steps-list">
              {#each drill.steps as step, i}
                <li>
                  <span class="step-number">{i + 1}</span>
                  <span class="step-text">{step}</span>
                </li>
              {/each}
            </ol>
          {:else}
            <p>No step-by-step instructions available.</p>
          {/if}
        </div>
      </Card>
    </TabsPrimitive.Content>
    
    <TabsPrimitive.Content value="equipment" class="tab-panel">
      <Card>
        <div class="content-section">
          <h3>Required Equipment</h3>
          {#if drill.equipment?.length}
            <ul class="equipment-list">
              {#each drill.equipment as item}
                <li>
                  <span class="equipment-name">{item.name}</span>
                  {#if item.quantity}
                    <span class="equipment-quantity">× {item.quantity}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          {:else}
            <p>No special equipment required.</p>
          {/if}
          
          {#if drill.space_requirements}
            <h3>Space Requirements</h3>
            <p>{drill.space_requirements}</p>
          {/if}
        </div>
      </Card>
    </TabsPrimitive.Content>
    
    <TabsPrimitive.Content value="variations" class="tab-panel">
      <Card>
        <div class="content-section">
          <h3>Drill Variations</h3>
          {#if drill.variations?.length}
            <div class="variations-grid">
              {#each drill.variations as variation}
                <a href="/drills/{variation.id}" class="variation-card">
                  <h4>{variation.name}</h4>
                  <p>{variation.description}</p>
                  <span class="variation-difficulty">{variation.difficulty}</span>
                </a>
              {/each}
            </div>
          {:else}
            <p>No variations available for this drill.</p>
            <Button variant="secondary">
              Suggest a Variation
            </Button>
          {/if}
        </div>
      </Card>
    </TabsPrimitive.Content>
    
    <TabsPrimitive.Content value="coaching" class="tab-panel">
      <Card>
        <div class="content-section">
          <h3>Coaching Points</h3>
          {#if drill.coaching_points}
            <ul class="coaching-list">
              {#each drill.coaching_points as point}
                <li>{point}</li>
              {/each}
            </ul>
          {:else}
            <p>No specific coaching points available.</p>
          {/if}
          
          {#if drill.common_mistakes}
            <h3>Common Mistakes to Avoid</h3>
            <ul class="mistakes-list">
              {#each drill.common_mistakes as mistake}
                <li>{mistake}</li>
              {/each}
            </ul>
          {/if}
          
          {#if drill.progressions}
            <h3>Progressions</h3>
            <p>{drill.progressions}</p>
          {/if}
        </div>
      </Card>
    </TabsPrimitive.Content>
  </div>
</TabsPrimitive.Root>

<style>
  :global(.drill-tabs) {
    margin-bottom: var(--space-6);
  }
  
  :global(.tabs-list) {
    display: flex;
    gap: var(--space-1);
    border-bottom: 1px solid var(--color-border-default);
    margin-bottom: var(--space-4);
    overflow-x: auto;
  }
  
  :global(.tab-trigger) {
    padding: var(--space-2) var(--space-4);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-fast);
    margin-bottom: -1px;
    white-space: nowrap;
  }
  
  :global(.tab-trigger:hover) {
    color: var(--color-text-primary);
  }
  
  :global(.tab-trigger[data-state="active"]) {
    color: var(--color-accent-9);
    border-bottom-color: var(--color-accent-9);
  }
  
  .content-section {
    padding: var(--space-4);
  }
  
  .content-section h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-3);
    margin-top: var(--space-6);
  }
  
  .content-section h3:first-child {
    margin-top: 0;
  }
  
  .skill-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  
  .skill-tag {
    padding: var(--space-1) var(--space-3);
    background: var(--color-accent-2);
    color: var(--color-accent-11);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
  }
  
  .steps-list {
    counter-reset: step;
    padding-left: 0;
  }
  
  .steps-list li {
    display: flex;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
    align-items: flex-start;
  }
  
  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    background: var(--color-accent-9);
    color: white;
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }
  
  .step-text {
    flex: 1;
    padding-top: var(--space-1);
  }
  
  .equipment-list {
    list-style: none;
    padding: 0;
  }
  
  .equipment-list li {
    display: flex;
    justify-content: space-between;
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-border-default);
  }
  
  .equipment-quantity {
    color: var(--color-text-muted);
  }
  
  .variations-grid {
    display: grid;
    gap: var(--space-3);
  }
  
  .variation-card {
    padding: var(--space-3);
    background: var(--color-bg-subtle);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border-default);
    transition: all var(--transition-fast);
    text-decoration: none;
    color: inherit;
  }
  
  .variation-card:hover {
    background: var(--color-surface-2);
    border-color: var(--color-accent-9);
  }
  
  .variation-card h4 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-1);
  }
  
  .variation-card p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-2);
  }
  
  .variation-difficulty {
    font-size: var(--font-size-xs);
    padding: var(--space-1) var(--space-2);
    background: var(--color-surface-3);
    border-radius: var(--radius-sm);
  }
</style>
```

### Step 3: Create Related Drills Component (`src/lib/components/drills/RelatedDrills.svelte`)

```svelte
<script>
  import DrillCard from './DrillCard.svelte';
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  
  export let drills = [];
  export let currentDrillId;
  
  // Filter out current drill
  $: relatedDrills = drills.filter(d => d.id !== currentDrillId);
  
  let scrollContainer;
  
  function scrollLeft() {
    scrollContainer.scrollBy({ left: -320, behavior: 'smooth' });
  }
  
  function scrollRight() {
    scrollContainer.scrollBy({ left: 320, behavior: 'smooth' });
  }
</script>

{#if relatedDrills.length > 0}
  <section class="related-drills">
    <div class="section-header">
      <h2>Related Drills</h2>
      <div class="scroll-controls">
        <button on:click={scrollLeft} aria-label="Scroll left">
          <ChevronLeft size={20} />
        </button>
        <button on:click={scrollRight} aria-label="Scroll right">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
    
    <div class="drills-scroll" bind:this={scrollContainer}>
      {#each relatedDrills as drill}
        <div class="drill-item">
          <DrillCard {drill} view="grid" density="compact" />
        </div>
      {/each}
    </div>
  </section>
{/if}

<style>
  .related-drills {
    margin-top: var(--space-8);
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
  }
  
  .section-header h2 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
  }
  
  .scroll-controls {
    display: flex;
    gap: var(--space-2);
  }
  
  .scroll-controls button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .scroll-controls button:hover {
    background: var(--color-surface-2);
    border-color: var(--color-border-strong);
  }
  
  .drills-scroll {
    display: flex;
    gap: var(--space-4);
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding-bottom: var(--space-2);
  }
  
  .drills-scroll::-webkit-scrollbar {
    height: 8px;
  }
  
  .drill-item {
    flex: 0 0 320px;
    scroll-snap-align: start;
  }
  
  @media (max-width: 768px) {
    .scroll-controls {
      display: none;
    }
    
    .drill-item {
      flex: 0 0 280px;
    }
  }
</style>
```

### Step 4: Update Drill Detail Page (`src/routes/drills/[id]/+page.svelte`)

```svelte
<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/utils/apiFetch';
  import { useSession } from '$lib/auth-client';
  import DrillDetailHeader from '$lib/components/drills/DrillDetailHeader.svelte';
  import DrillDetailTabs from '$lib/components/drills/DrillDetailTabs.svelte';
  import RelatedDrills from '$lib/components/drills/RelatedDrills.svelte';
  import Comments from '$lib/components/Comments.svelte';
  import UpvoteDownvote from '$lib/components/UpvoteDownvote.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  
  export let data;
  
  const session = useSession();
  
  let drill = null;
  let relatedDrills = [];
  let loading = true;
  
  $: isOwner = $session.data?.user?.id === drill?.user_id;
  
  onMount(async () => {
    await loadDrill();
    await loadRelatedDrills();
  });
  
  async function loadDrill() {
    try {
      const response = await apiFetch(`/api/drills/${$page.params.id}`);
      drill = response;
    } catch (error) {
      console.error('Failed to load drill:', error);
    } finally {
      loading = false;
    }
  }
  
  async function loadRelatedDrills() {
    try {
      // Load drills with similar tags or position
      const response = await apiFetch(`/api/drills?position=${drill?.position}&limit=8`);
      relatedDrills = response.drills || [];
    } catch (error) {
      console.error('Failed to load related drills:', error);
    }
  }
</script>

<svelte:head>
  <title>{drill?.name || 'Loading...'} - QDrill</title>
  <meta name="description" content={drill?.description || ''} />
  
  <!-- Open Graph tags for sharing -->
  <meta property="og:title" content={drill?.name} />
  <meta property="og:description" content={drill?.description} />
  <meta property="og:image" content={drill?.image_url} />
  <meta property="og:url" content={$page.url.href} />
</svelte:head>

<div class="drill-detail-page">
  {#if loading}
    <div class="loading-state">
      <Skeleton variant="rect" height="200px" />
      <Skeleton variant="line" width="60%" />
      <Skeleton variant="line" />
      <Skeleton variant="line" />
    </div>
  {:else if drill}
    <DrillDetailHeader {drill} {isOwner} />
    
    <div class="drill-content">
      <div class="main-content">
        <DrillDetailTabs {drill} />
        
        <!-- Voting section -->
        <div class="engagement-section">
          <UpvoteDownvote 
            entityType="drill" 
            entityId={drill.id} 
            initialVotes={drill.votes}
          />
        </div>
        
        <!-- Comments section -->
        <div class="comments-section">
          <h2>Discussion</h2>
          <Comments 
            entityType="drill" 
            entityId={drill.id}
          />
        </div>
      </div>
      
      <aside class="sidebar">
        <!-- Statistics -->
        <div class="stats-card">
          <h3>Statistics</h3>
          <dl class="stats-list">
            <div class="stat-item">
              <dt>Views</dt>
              <dd>{drill.views || 0}</dd>
            </div>
            <div class="stat-item">
              <dt>Used in Plans</dt>
              <dd>{drill.usage_count || 0}</dd>
            </div>
            <div class="stat-item">
              <dt>Favorites</dt>
              <dd>{drill.favorites || 0}</dd>
            </div>
            <div class="stat-item">
              <dt>Created</dt>
              <dd>{new Date(drill.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
        
        <!-- Tags -->
        {#if drill.tags?.length}
          <div class="tags-card">
            <h3>Tags</h3>
            <div class="tag-list">
              {#each drill.tags as tag}
                <a href="/drills?tag={tag}" class="tag-link">
                  #{tag}
                </a>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Author -->
        <div class="author-card">
          <h3>Created by</h3>
          <a href="/profile/{drill.user_id}" class="author-link">
            <img src={drill.user_avatar || '/default-avatar.svg'} alt="" />
            <span>{drill.user_name || 'Anonymous'}</span>
          </a>
        </div>
      </aside>
    </div>
    
    <RelatedDrills drills={relatedDrills} currentDrillId={drill.id} />
  {:else}
    <div class="error-state">
      <h2>Drill not found</h2>
      <p>The drill you're looking for doesn't exist or has been removed.</p>
      <Button href="/drills">Browse Drills</Button>
    </div>
  {/if}
</div>

<style>
  .drill-detail-page {
    max-width: 1280px;
    margin: 0 auto;
  }
  
  .drill-content {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: var(--space-6);
    margin-bottom: var(--space-8);
  }
  
  .main-content {
    min-width: 0;
  }
  
  .engagement-section {
    margin-bottom: var(--space-6);
  }
  
  .comments-section h2 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-4);
  }
  
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .stats-card,
  .tags-card,
  .author-card {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }
  
  .stats-card h3,
  .tags-card h3,
  .author-card h3 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-3);
  }
  
  .stats-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .stat-item {
    display: flex;
    justify-content: space-between;
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-border-default);
  }
  
  .stat-item:last-child {
    border-bottom: none;
  }
  
  .stat-item dt {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  
  .stat-item dd {
    font-weight: var(--font-weight-semibold);
  }
  
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  
  .tag-link {
    padding: var(--space-1) var(--space-2);
    background: var(--color-bg-subtle);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    color: var(--color-accent-9);
    transition: all var(--transition-fast);
  }
  
  .tag-link:hover {
    background: var(--color-accent-2);
    text-decoration: none;
  }
  
  .author-link {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--color-text-primary);
    text-decoration: none;
  }
  
  .author-link img {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
  }
  
  .author-link:hover {
    color: var(--color-accent-9);
  }
  
  .loading-state,
  .error-state {
    padding: var(--space-8);
    text-align: center;
  }
  
  @media (max-width: 1024px) {
    .drill-content {
      grid-template-columns: 1fr;
    }
    
    .sidebar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
  }
</style>
```

## Testing Checklist

- [ ] Drill header displays all metadata correctly
- [ ] Share button works (native share or clipboard)
- [ ] Tabs switch content smoothly
- [ ] All tab content renders properly
- [ ] Related drills scroll horizontally
- [ ] Related drills exclude current drill
- [ ] Voting component integrates properly
- [ ] Comments section loads and functions
- [ ] Statistics display in sidebar
- [ ] Tags link to filtered drill list
- [ ] Author link navigates to profile
- [ ] Edit button appears for owner
- [ ] Mobile responsive layout
- [ ] SEO meta tags present
- [ ] Loading state displays

## Integration Notes

- Uses Button and Card components from Ticket 003
- DrillCard component from Ticket 004
- Existing Comments and UpvoteDownvote components
- Auth state from `$lib/auth-client`

## Next Steps
After completing this ticket, proceed to Ticket 006 (Practice Plan Viewer Revamp).
</file>

<file path="docs/ui-audit/tickets/006-practice-plan-viewer-revamp-actionable.md">
# Ticket 006: Practice Plan Viewer Revamp - ACTIONABLE

## Overview
Improve practice plan readability with two-pane layout, scrollspy navigation, drill overlays, and better visual hierarchy.

## Prerequisites
- [x] Complete Tickets 001-003 (Design System, Components)
- [x] Dialog component from Ticket 003
- [x] Current viewer components in `src/routes/practice-plans/viewer/`

## File Structure
```
src/
├── lib/
│   └── components/
│       └── practice-plans/
│           ├── PlanOutline.svelte (NEW)
│           ├── PlanScrollspy.svelte (NEW)
│           └── DrillOverlay.svelte (NEW)
└── routes/
    └── practice-plans/
        ├── viewer/
        │   ├── Section.svelte (MODIFY)
        │   ├── ParallelGroup.svelte (MODIFY)
        │   └── DrillCard.svelte (MODIFY)
        └── [id]/
            └── +page.svelte (MODIFY)
```

## Implementation Steps

### Step 1: Create Plan Outline with Scrollspy (`src/lib/components/practice-plans/PlanOutline.svelte`)

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { Clock, Users } from 'lucide-svelte';
  
  export let sections = [];
  export let currentSectionId = null;
  
  let observer;
  let sectionElements = new Map();
  
  onMount(() => {
    // Set up intersection observer for scrollspy
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            currentSectionId = entry.target.id;
          }
        });
      },
      {
        rootMargin: '-20% 0% -70% 0%',
        threshold: 0
      }
    );
    
    // Observe all section elements
    sections.forEach(section => {
      const element = document.getElementById(`section-${section.id}`);
      if (element) {
        sectionElements.set(section.id, element);
        observer.observe(element);
      }
    });
  });
  
  onDestroy(() => {
    observer?.disconnect();
  });
  
  function scrollToSection(sectionId) {
    const element = sectionElements.get(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
  function calculateSectionDuration(section) {
    if (!section.drills) return 0;
    return section.drills.reduce((sum, drill) => sum + (drill.duration || 0), 0);
  }
  
  $: totalDuration = sections.reduce((sum, section) => 
    sum + calculateSectionDuration(section), 0
  );
</script>

<nav class="plan-outline">
  <div class="outline-header">
    <h3>Plan Overview</h3>
    <div class="plan-stats">
      <span class="stat">
        <Clock size={14} />
        {totalDuration} min total
      </span>
      <span class="stat">
        <Users size={14} />
        {sections.length} sections
      </span>
    </div>
  </div>
  
  <ol class="section-list">
    {#each sections as section, index}
      {@const duration = calculateSectionDuration(section)}
      <li>
        <button
          class="section-link"
          class:active={currentSectionId === `section-${section.id}`}
          on:click={() => scrollToSection(section.id)}
        >
          <span class="section-number">{index + 1}</span>
          <div class="section-info">
            <span class="section-name">{section.name}</span>
            <span class="section-meta">
              {section.drills?.length || 0} drills · {duration} min
            </span>
          </div>
          <div class="section-progress" 
               class:current={currentSectionId === `section-${section.id}`}
          />
        </button>
        
        {#if section.parallel_groups?.length}
          <ul class="parallel-list">
            {#each section.parallel_groups as group}
              <li class="parallel-item">
                <span class="parallel-indicator">║</span>
                {group.name || 'Parallel Group'}
              </li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  .plan-outline {
    position: sticky;
    top: var(--space-4);
    height: calc(100vh - var(--space-8));
    overflow-y: auto;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
  }
  
  .outline-header {
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
  }
  
  .outline-header h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-2);
  }
  
  .plan-stats {
    display: flex;
    gap: var(--space-3);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  .stat {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
  
  .section-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .section-link {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: transparent;
    border: none;
    border-left: 3px solid transparent;
    text-align: left;
    cursor: pointer;
    transition: all var(--transition-fast);
    position: relative;
  }
  
  .section-link:hover {
    background: var(--color-bg-subtle);
  }
  
  .section-link.active {
    background: var(--color-accent-1);
    border-left-color: var(--color-accent-9);
  }
  
  .section-number {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    background: var(--color-bg-muted);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
  }
  
  .section-link.active .section-number {
    background: var(--color-accent-9);
    color: white;
  }
  
  .section-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  
  .section-name {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  
  .section-meta {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  
  .parallel-list {
    list-style: none;
    padding: 0;
    margin: 0;
    margin-left: var(--space-10);
  }
  
  .parallel-item {
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  
  .parallel-indicator {
    color: var(--color-accent-9);
    font-weight: bold;
  }
</style>
```

### Step 2: Update Section Component (`src/routes/practice-plans/viewer/Section.svelte`)

```svelte
<script>
  import { Clock, ChevronDown, ChevronRight } from 'lucide-svelte';
  import ParallelGroup from './ParallelGroup.svelte';
  import DrillCard from './DrillCard.svelte';
  
  export let section;
  export let index;
  export let expanded = true;
  
  $: sectionDuration = calculateDuration();
  
  function calculateDuration() {
    let duration = 0;
    
    // Regular drills
    if (section.drills) {
      duration += section.drills.reduce((sum, drill) => sum + (drill.duration || 0), 0);
    }
    
    // Parallel groups (take max duration)
    if (section.parallel_groups) {
      section.parallel_groups.forEach(group => {
        const groupDuration = Math.max(...group.timelines.map(timeline => 
          timeline.drills.reduce((sum, drill) => sum + (drill.duration || 0), 0)
        ));
        duration += groupDuration;
      });
    }
    
    return duration;
  }
  
  function toggleExpanded() {
    expanded = !expanded;
  }
</script>

<section id="section-{section.id}" class="plan-section">
  <header class="section-header">
    <button 
      class="section-toggle"
      on:click={toggleExpanded}
      aria-expanded={expanded}
    >
      {#if expanded}
        <ChevronDown size={20} />
      {:else}
        <ChevronRight size={20} />
      {/if}
    </button>
    
    <div class="section-title">
      <h2>
        <span class="section-number">{index + 1}.</span>
        {section.name}
      </h2>
      {#if section.description}
        <p class="section-description">{section.description}</p>
      {/if}
    </div>
    
    <div class="section-meta">
      <span class="duration">
        <Clock size={16} />
        {sectionDuration} min
      </span>
      <span class="drill-count">
        {section.drills?.length || 0} drills
      </span>
    </div>
  </header>
  
  {#if expanded}
    <div class="section-content">
      <!-- Regular drills -->
      {#if section.drills?.length}
        <div class="drills-grid">
          {#each section.drills as drill}
            <DrillCard {drill} />
          {/each}
        </div>
      {/if}
      
      <!-- Parallel groups -->
      {#if section.parallel_groups?.length}
        {#each section.parallel_groups as group}
          <ParallelGroup {group} />
        {/each}
      {/if}
    </div>
  {/if}
</section>

<style>
  .plan-section {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-4);
    overflow: hidden;
    scroll-margin-top: var(--space-4);
  }
  
  .section-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--color-bg-subtle);
    border-bottom: 1px solid var(--color-border-default);
  }
  
  .section-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .section-toggle:hover {
    background: var(--color-surface-2);
    color: var(--color-text-primary);
  }
  
  .section-title {
    flex: 1;
  }
  
  .section-title h2 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  
  .section-number {
    color: var(--color-accent-9);
  }
  
  .section-description {
    margin-top: var(--space-1);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
  
  .section-meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  .duration,
  .drill-count {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
  
  .section-content {
    padding: var(--space-4);
  }
  
  .drills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-3);
  }
  
  @media (max-width: 768px) {
    .drills-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
```

### Step 3: Update Drill Card with Overlay (`src/routes/practice-plans/viewer/DrillCard.svelte`)

```svelte
<script>
  import { Clock, Users, ExternalLink, Info } from 'lucide-svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  
  export let drill;
  
  let detailOpen = false;
</script>

<article class="drill-card">
  <a 
    href="/drills/{drill.id}" 
    class="drill-link"
    on:click|preventDefault={() => detailOpen = true}
  >
    <div class="drill-header">
      <h3>{drill.name}</h3>
      <a 
        href="/drills/{drill.id}"
        class="external-link"
        on:click|stopPropagation
        aria-label="Open in new tab"
      >
        <ExternalLink size={16} />
      </a>
    </div>
    
    <p class="drill-description">{drill.description}</p>
    
    <div class="drill-meta">
      <span class="meta-item">
        <Clock size={14} />
        {drill.duration} min
      </span>
      {#if drill.position}
        <span class="meta-item">
          <Users size={14} />
          {drill.position}
        </span>
      {/if}
      <span class="meta-item difficulty-{drill.difficulty?.toLowerCase()}">
        {drill.difficulty}
      </span>
    </div>
  </a>
  
  <button 
    class="info-button"
    on:click={() => detailOpen = true}
    aria-label="View drill details"
  >
    <Info size={16} />
  </button>
</article>

<!-- Drill Detail Overlay -->
<Dialog bind:open={detailOpen} title={drill.name}>
  <div class="drill-detail">
    <div class="detail-section">
      <h4>Description</h4>
      <p>{drill.description}</p>
    </div>
    
    {#if drill.objectives}
      <div class="detail-section">
        <h4>Objectives</h4>
        <ul>
          {#each drill.objectives as objective}
            <li>{objective}</li>
          {/each}
        </ul>
      </div>
    {/if}
    
    {#if drill.setup}
      <div class="detail-section">
        <h4>Setup</h4>
        <p>{drill.setup}</p>
      </div>
    {/if}
    
    {#if drill.equipment}
      <div class="detail-section">
        <h4>Equipment</h4>
        <ul>
          {#each drill.equipment as item}
            <li>{item}</li>
          {/each}
        </ul>
      </div>
    {/if}
    
    <div class="detail-actions">
      <a href="/drills/{drill.id}" class="detail-link">
        View Full Details
        <ExternalLink size={16} />
      </a>
    </div>
  </div>
</Dialog>

<style>
  .drill-card {
    position: relative;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    transition: all var(--transition-fast);
  }
  
  .drill-card:hover {
    border-color: var(--color-accent-9);
    box-shadow: var(--shadow-sm);
  }
  
  .drill-link {
    display: block;
    color: inherit;
    text-decoration: none;
  }
  
  .drill-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: var(--space-2);
  }
  
  .drill-header h3 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    flex: 1;
  }
  
  .external-link {
    opacity: 0;
    color: var(--color-text-muted);
    transition: all var(--transition-fast);
  }
  
  .drill-card:hover .external-link {
    opacity: 1;
  }
  
  .external-link:hover {
    color: var(--color-accent-9);
  }
  
  .drill-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-3);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .drill-meta {
    display: flex;
    gap: var(--space-3);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
  
  .difficulty-beginner { color: var(--color-success); }
  .difficulty-intermediate { color: var(--color-warning); }
  .difficulty-advanced { color: var(--color-error); }
  
  .info-button {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    opacity: 0;
    transition: all var(--transition-fast);
  }
  
  .drill-card:hover .info-button {
    opacity: 1;
  }
  
  .info-button:hover {
    background: var(--color-accent-1);
    color: var(--color-accent-9);
    border-color: var(--color-accent-9);
  }
  
  /* Overlay styles */
  .drill-detail {
    padding: var(--space-2);
  }
  
  .detail-section {
    margin-bottom: var(--space-4);
  }
  
  .detail-section h4 {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-2);
    color: var(--color-text-secondary);
  }
  
  .detail-section ul {
    list-style: disc;
    padding-left: var(--space-4);
  }
  
  .detail-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border-default);
  }
  
  .detail-link {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--color-accent-9);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }
</style>
```

### Step 4: Update Practice Plan Viewer Page (`src/routes/practice-plans/[id]/+page.svelte`)

```svelte
<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { apiFetch } from '$lib/utils/apiFetch';
  import PlanOutline from '$lib/components/practice-plans/PlanOutline.svelte';
  import Section from '../viewer/Section.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { Download, Print, Share2, Edit } from 'lucide-svelte';
  
  export let data;
  
  let plan = null;
  let loading = true;
  let currentSectionId = null;
  let showOutline = true;
  
  onMount(async () => {
    await loadPlan();
  });
  
  async function loadPlan() {
    try {
      const response = await apiFetch(`/api/practice-plans/${$page.params.id}`);
      plan = response;
    } catch (error) {
      console.error('Failed to load practice plan:', error);
    } finally {
      loading = false;
    }
  }
  
  function handlePrint() {
    window.print();
  }
  
  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: plan.name,
        text: plan.description,
        url: window.location.href
      });
    }
  }
  
  function handleExport() {
    // Export as PDF or structured format
    console.log('Export functionality to be implemented');
  }
</script>

<svelte:head>
  <title>{plan?.name || 'Loading...'} - Practice Plan</title>
  <meta name="description" content={plan?.description || ''} />
</svelte:head>

<div class="plan-viewer" class:with-outline={showOutline}>
  {#if loading}
    <div class="loading-state">
      <p>Loading practice plan...</p>
    </div>
  {:else if plan}
    <!-- Plan Header -->
    <header class="plan-header">
      <div class="header-content">
        <h1>{plan.name}</h1>
        {#if plan.description}
          <p class="plan-description">{plan.description}</p>
        {/if}
        
        <div class="plan-meta">
          <span>Duration: {plan.total_duration} minutes</span>
          <span>•</span>
          <span>{plan.sections?.length || 0} sections</span>
          <span>•</span>
          <span>Created by {plan.author_name || 'Unknown'}</span>
        </div>
      </div>
      
      <div class="header-actions">
        <Button variant="ghost" size="sm" on:click={() => showOutline = !showOutline}>
          {showOutline ? 'Hide' : 'Show'} Outline
        </Button>
        <Button variant="ghost" size="sm" on:click={handlePrint}>
          <Print size={16} />
          Print
        </Button>
        <Button variant="ghost" size="sm" on:click={handleExport}>
          <Download size={16} />
          Export
        </Button>
        <Button variant="ghost" size="sm" on:click={handleShare}>
          <Share2 size={16} />
          Share
        </Button>
        {#if plan.can_edit}
          <Button variant="primary" size="sm" href="/practice-plans/{plan.id}/edit">
            <Edit size={16} />
            Edit
          </Button>
        {/if}
      </div>
    </header>
    
    <div class="plan-content">
      <!-- Left: Outline with Scrollspy -->
      {#if showOutline}
        <aside class="plan-sidebar">
          <PlanOutline 
            sections={plan.sections || []} 
            bind:currentSectionId
          />
        </aside>
      {/if}
      
      <!-- Right: Plan Content -->
      <main class="plan-main">
        {#if plan.sections?.length}
          {#each plan.sections as section, index}
            <Section {section} {index} />
          {/each}
        {:else}
          <p>No sections in this practice plan.</p>
        {/if}
      </main>
    </div>
  {:else}
    <div class="error-state">
      <h2>Practice plan not found</h2>
      <Button href="/practice-plans">Browse Practice Plans</Button>
    </div>
  {/if}
</div>

<style>
  .plan-viewer {
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .plan-header {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin-bottom: var(--space-6);
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: var(--space-4);
  }
  
  .header-content {
    flex: 1;
  }
  
  .header-content h1 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--space-2);
  }
  
  .plan-description {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-3);
  }
  
  .plan-meta {
    display: flex;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  .header-actions {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  
  .plan-content {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: var(--space-6);
  }
  
  .plan-viewer:not(.with-outline) .plan-content {
    grid-template-columns: 1fr;
  }
  
  .plan-sidebar {
    display: block;
  }
  
  .plan-main {
    min-width: 0;
  }
  
  .loading-state,
  .error-state {
    padding: var(--space-8);
    text-align: center;
  }
  
  /* Print styles */
  @media print {
    .plan-header,
    .plan-sidebar {
      display: none;
    }
    
    .plan-content {
      grid-template-columns: 1fr;
    }
    
    .plan-section {
      page-break-inside: avoid;
    }
  }
  
  @media (max-width: 1024px) {
    .plan-content {
      grid-template-columns: 1fr;
    }
    
    .plan-sidebar {
      display: none;
    }
    
    .plan-header {
      flex-direction: column;
    }
  }
</style>
```

## Testing Checklist

- [ ] Two-pane layout displays correctly on desktop
- [ ] Outline collapses/expands with button
- [ ] Scrollspy highlights current section
- [ ] Clicking outline items scrolls to section
- [ ] Section collapse/expand works
- [ ] Drill cards display properly in grid
- [ ] Drill overlay opens on click
- [ ] External link opens drill in new tab
- [ ] Middle-click opens drill in new tab
- [ ] Print view hides navigation chrome
- [ ] Export functionality prepared (stub)
- [ ] Share functionality works
- [ ] Parallel groups display correctly
- [ ] Time calculations are accurate
- [ ] Mobile responsive layout

## Visual Improvements

- Replaced heavy tinted backgrounds with subtle borders and rails
- Used `border-left` accent rails instead of full backgrounds
- Improved visual hierarchy with proper spacing
- Added hover states for better interactivity
- Consistent use of design tokens from Ticket 001

## Integration Notes

- Uses Dialog component from Ticket 003
- Uses Button component from Ticket 003
- Maintains compatibility with existing data structure
- Preserves existing drill and section functionality

## Next Steps
After completing this ticket, proceed to Ticket 007 (Practice Plan Wizard UX).
</file>

<file path="docs/ui-audit/tickets/007-practice-plan-wizard-ux-actionable.md">
# Ticket 007: Practice Plan Wizard UX - ACTIONABLE

## Overview
Improve practice plan creation with clear stepper, validation, autosave, and better keyboard navigation.

## Prerequisites
- [x] Complete Tickets 001-003 (Design System, Components)
- [x] `sveltekit-superforms` and `zod` installed
- [x] Existing wizard at `src/routes/practice-plans/wizard/`

## File Structure
```
src/
├── lib/
│   ├── components/
│   │   └── practice-plans/
│   │       ├── WizardStepper.svelte (NEW)
│   │       ├── WizardFooter.svelte (NEW)
│   │       └── AutosaveIndicator.svelte (NEW)
│   └── schemas/
│       └── practicePlan.ts (NEW)
└── routes/
    └── practice-plans/
        └── wizard/
            ├── +layout.svelte (MODIFY)
            ├── +page.server.js (NEW/MODIFY)
            └── [step pages] (MODIFY)
```

## Implementation Steps

### Step 1: Create Validation Schema (`src/lib/schemas/practicePlan.ts`)

```typescript
import { z } from 'zod';

// Basic Info Schema
export const basicInfoSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  duration: z.number().min(5, 'Duration must be at least 5 minutes').max(480, 'Duration cannot exceed 8 hours'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  positions: z.array(z.string()).min(1, 'Select at least one position'),
  maxPlayers: z.number().min(1).max(100).optional(),
  tags: z.array(z.string()).optional()
});

// Section Schema
export const sectionSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Section name required'),
  description: z.string().optional(),
  duration: z.number().min(1),
  drills: z.array(z.object({
    id: z.string(),
    duration: z.number().min(1),
    order: z.number()
  }))
});

// Timeline Schema
export const timelineSchema = z.object({
  sections: z.array(sectionSchema).min(1, 'At least one section required'),
  parallelGroups: z.array(z.object({
    sectionId: z.string(),
    timelines: z.array(z.object({
      id: z.string(),
      name: z.string(),
      drills: z.array(z.string())
    }))
  })).optional()
});

// Complete Practice Plan Schema
export const practicePlanSchema = z.object({
  basicInfo: basicInfoSchema,
  sections: z.array(sectionSchema),
  timeline: timelineSchema,
  isDraft: z.boolean().default(true),
  autoSaveEnabled: z.boolean().default(true)
});

export type PracticePlan = z.infer<typeof practicePlanSchema>;
export type BasicInfo = z.infer<typeof basicInfoSchema>;
export type Section = z.infer<typeof sectionSchema>;
```

### Step 2: Create Wizard Stepper (`src/lib/components/practice-plans/WizardStepper.svelte`)

```svelte
<script>
  import { CheckCircle, Circle, AlertCircle, ChevronRight } from 'lucide-svelte';
  import { page } from '$app/stores';
  
  export let steps = [
    { id: 'basic-info', label: 'Basic Info', path: '/practice-plans/wizard/basic-info' },
    { id: 'sections', label: 'Sections', path: '/practice-plans/wizard/sections' },
    { id: 'drills', label: 'Add Drills', path: '/practice-plans/wizard/drills' },
    { id: 'timeline', label: 'Timeline', path: '/practice-plans/wizard/timeline' },
    { id: 'overview', label: 'Review', path: '/practice-plans/wizard/overview' }
  ];
  
  export let currentStep = 0;
  export let completedSteps = [];
  export let stepErrors = {};
  
  $: currentPath = $page.url.pathname;
  $: currentStep = steps.findIndex(step => step.path === currentPath);
  
  function getStepStatus(index) {
    if (completedSteps.includes(index)) return 'completed';
    if (stepErrors[steps[index].id]) return 'error';
    if (index === currentStep) return 'current';
    if (index < currentStep) return 'visited';
    return 'pending';
  }
</script>

<nav class="wizard-stepper" aria-label="Progress">
  <ol class="stepper-list">
    {#each steps as step, index}
      {@const status = getStepStatus(index)}
      <li class="stepper-item">
        <a 
          href={step.path}
          class="step-link {status}"
          aria-current={index === currentStep ? 'step' : undefined}
          aria-disabled={index > currentStep && !completedSteps.includes(index - 1)}
        >
          <span class="step-indicator">
            {#if status === 'completed'}
              <CheckCircle size={20} />
            {:else if status === 'error'}
              <AlertCircle size={20} />
            {:else}
              <span class="step-number">{index + 1}</span>
            {/if}
          </span>
          
          <span class="step-content">
            <span class="step-label">{step.label}</span>
            {#if stepErrors[step.id]}
              <span class="step-error">{stepErrors[step.id]}</span>
            {/if}
          </span>
        </a>
        
        {#if index < steps.length - 1}
          <ChevronRight class="step-separator" size={16} />
        {/if}
      </li>
    {/each}
  </ol>
  
  <div class="stepper-progress">
    <div 
      class="progress-bar"
      style="width: {((currentStep + 1) / steps.length) * 100}%"
    />
  </div>
</nav>

<style>
  .wizard-stepper {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    margin-bottom: var(--space-6);
  }
  
  .stepper-list {
    display: flex;
    align-items: center;
    justify-content: space-between;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .stepper-item {
    display: flex;
    align-items: center;
    flex: 1;
  }
  
  .step-link {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: all var(--transition-fast);
    flex: 1;
  }
  
  .step-link:hover:not([aria-disabled="true"]) {
    background: var(--color-bg-subtle);
  }
  
  .step-link[aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    background: var(--color-bg-muted);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-semibold);
  }
  
  .step-link.current .step-indicator {
    background: var(--color-accent-9);
    color: white;
  }
  
  .step-link.completed .step-indicator {
    background: var(--color-success);
    color: white;
  }
  
  .step-link.error .step-indicator {
    background: var(--color-error);
    color: white;
  }
  
  .step-number {
    font-size: var(--font-size-sm);
  }
  
  .step-content {
    display: flex;
    flex-direction: column;
  }
  
  .step-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  
  .step-link.current .step-label {
    color: var(--color-accent-9);
  }
  
  .step-error {
    font-size: var(--font-size-xs);
    color: var(--color-error);
  }
  
  :global(.step-separator) {
    color: var(--color-text-muted);
    margin: 0 var(--space-2);
  }
  
  .stepper-progress {
    height: 4px;
    background: var(--color-bg-muted);
    border-radius: var(--radius-full);
    margin-top: var(--space-4);
    overflow: hidden;
  }
  
  .progress-bar {
    height: 100%;
    background: var(--color-accent-9);
    border-radius: var(--radius-full);
    transition: width var(--transition-base);
  }
  
  @media (max-width: 768px) {
    .stepper-list {
      flex-direction: column;
      align-items: stretch;
    }
    
    .stepper-item {
      margin-bottom: var(--space-2);
    }
    
    :global(.step-separator) {
      display: none;
    }
  }
</style>
```

### Step 3: Create Wizard Footer (`src/lib/components/practice-plans/WizardFooter.svelte`)

```svelte
<script>
  import { ArrowLeft, ArrowRight, Save, Check } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { createEventDispatcher } from 'svelte';
  
  export let canGoBack = false;
  export let canGoNext = true;
  export let isLastStep = false;
  export let loading = false;
  export let isDraft = true;
  
  const dispatch = createEventDispatcher();
  
  function handleKeydown(e) {
    // Alt+Left for back
    if (e.altKey && e.key === 'ArrowLeft' && canGoBack) {
      dispatch('back');
    }
    // Alt+Right for next
    if (e.altKey && e.key === 'ArrowRight' && canGoNext) {
      dispatch('next');
    }
    // Ctrl+S for save draft
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      dispatch('saveDraft');
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<footer class="wizard-footer">
  <div class="footer-left">
    {#if canGoBack}
      <Button 
        variant="ghost" 
        on:click={() => dispatch('back')}
        disabled={loading}
      >
        <ArrowLeft size={16} />
        Back
      </Button>
    {/if}
  </div>
  
  <div class="footer-center">
    <Button 
      variant="secondary"
      on:click={() => dispatch('saveDraft')}
      disabled={loading}
    >
      <Save size={16} />
      Save Draft
    </Button>
    
    <span class="keyboard-hint">
      <kbd>Ctrl</kbd>+<kbd>S</kbd> to save
    </span>
  </div>
  
  <div class="footer-right">
    {#if isLastStep}
      <Button 
        variant="primary"
        size="lg"
        on:click={() => dispatch('complete')}
        disabled={!canGoNext || loading}
        {loading}
      >
        <Check size={16} />
        Complete Plan
      </Button>
    {:else}
      <Button 
        variant="primary"
        on:click={() => dispatch('next')}
        disabled={!canGoNext || loading}
        {loading}
      >
        Next
        <ArrowRight size={16} />
      </Button>
    {/if}
  </div>
</footer>

<style>
  .wizard-footer {
    position: sticky;
    bottom: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4);
    background: var(--color-surface-1);
    border-top: 1px solid var(--color-border-default);
    margin-top: var(--space-6);
    gap: var(--space-4);
    z-index: 10;
  }
  
  .footer-left,
  .footer-right {
    flex: 1;
    display: flex;
    gap: var(--space-2);
  }
  
  .footer-left {
    justify-content: flex-start;
  }
  
  .footer-right {
    justify-content: flex-end;
  }
  
  .footer-center {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  
  .keyboard-hint {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  kbd {
    padding: 0.125rem 0.375rem;
    background: var(--color-surface-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-family: monospace;
  }
  
  @media (max-width: 768px) {
    .wizard-footer {
      flex-direction: column;
      gap: var(--space-3);
    }
    
    .footer-left,
    .footer-center,
    .footer-right {
      width: 100%;
      justify-content: center;
    }
    
    .keyboard-hint {
      display: none;
    }
  }
</style>
```

### Step 4: Create Autosave Indicator (`src/lib/components/practice-plans/AutosaveIndicator.svelte`)

```svelte
<script>
  import { Cloud, CloudOff, Loader2 } from 'lucide-svelte';
  
  export let status = 'idle'; // idle, saving, saved, error
  export let lastSaved = null;
  
  $: formattedTime = lastSaved ? formatTime(lastSaved) : '';
  
  function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return date.toLocaleDateString();
  }
</script>

<div class="autosave-indicator status-{status}">
  {#if status === 'saving'}
    <Loader2 size={16} class="animate-spin" />
    <span>Saving...</span>
  {:else if status === 'saved'}
    <Cloud size={16} />
    <span>Saved {formattedTime}</span>
  {:else if status === 'error'}
    <CloudOff size={16} />
    <span>Save failed</span>
  {/if}
</div>

<style>
  .autosave-indicator {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    transition: all var(--transition-fast);
  }
  
  .status-saving {
    background: var(--color-accent-2);
    color: var(--color-accent-11);
  }
  
  .status-saved {
    background: var(--color-success);
    background: rgba(34, 197, 94, 0.1);
    color: var(--color-success);
  }
  
  .status-error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-error);
  }
  
  :global(.animate-spin) {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
```

### Step 5: Update Wizard Layout (`src/routes/practice-plans/wizard/+layout.svelte`)

```svelte
<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import WizardStepper from '$lib/components/practice-plans/WizardStepper.svelte';
  import WizardFooter from '$lib/components/practice-plans/WizardFooter.svelte';
  import AutosaveIndicator from '$lib/components/practice-plans/AutosaveIndicator.svelte';
  import { toast } from '@zerodevx/svelte-toast';
  import { superForm } from 'sveltekit-superforms/client';
  import { practicePlanSchema } from '$lib/schemas/practicePlan';
  
  export let data;
  
  // Initialize form with superforms
  const { form, errors, validate, enhance } = superForm(data.form, {
    validators: practicePlanSchema,
    dataType: 'json',
    taintedMessage: 'You have unsaved changes. Are you sure you want to leave?'
  });
  
  const steps = [
    { id: 'basic-info', label: 'Basic Info', path: '/practice-plans/wizard/basic-info' },
    { id: 'sections', label: 'Sections', path: '/practice-plans/wizard/sections' },
    { id: 'drills', label: 'Add Drills', path: '/practice-plans/wizard/drills' },
    { id: 'timeline', label: 'Timeline', path: '/practice-plans/wizard/timeline' },
    { id: 'overview', label: 'Review', path: '/practice-plans/wizard/overview' }
  ];
  
  let currentStep = 0;
  let completedSteps = [];
  let stepErrors = {};
  let autosaveStatus = 'idle';
  let lastSaved = null;
  let autosaveTimer;
  
  $: currentPath = $page.url.pathname;
  $: currentStep = steps.findIndex(step => step.path === currentPath);
  $: isLastStep = currentStep === steps.length - 1;
  $: canGoBack = currentStep > 0;
  $: canGoNext = !Object.keys($errors).length;
  
  // Autosave functionality
  function setupAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(async () => {
      await saveDraft();
    }, 5000); // Save after 5 seconds of inactivity
  }
  
  // Watch for form changes
  $: if ($form && data.autoSaveEnabled) {
    setupAutosave();
  }
  
  async function saveDraft() {
    autosaveStatus = 'saving';
    try {
      const response = await fetch('/api/practice-plans/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify($form)
      });
      
      if (response.ok) {
        autosaveStatus = 'saved';
        lastSaved = new Date();
        toast.push('Draft saved', {
          theme: { '--toastBackground': 'var(--color-success)' }
        });
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      autosaveStatus = 'error';
      toast.push('Failed to save draft', {
        theme: { '--toastBackground': 'var(--color-error)' }
      });
    }
  }
  
  async function handleNext() {
    const isValid = await validate();
    if (isValid && currentStep < steps.length - 1) {
      completedSteps = [...completedSteps, currentStep];
      goto(steps[currentStep + 1].path);
    }
  }
  
  function handleBack() {
    if (currentStep > 0) {
      goto(steps[currentStep - 1].path);
    }
  }
  
  async function handleComplete() {
    const isValid = await validate();
    if (isValid) {
      // Submit the complete form
      const response = await fetch('/api/practice-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...$form, isDraft: false })
      });
      
      if (response.ok) {
        const { id } = await response.json();
        toast.push('Practice plan created successfully!');
        goto(`/practice-plans/${id}`);
      }
    }
  }
  
  onMount(() => {
    // Load saved draft if exists
    const savedDraft = localStorage.getItem('practice-plan-draft');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      $form = { ...$form, ...draft };
    }
    
    return () => {
      clearTimeout(autosaveTimer);
    };
  });
</script>

<div class="wizard-layout">
  <div class="wizard-header">
    <h1>Create Practice Plan</h1>
    <AutosaveIndicator status={autosaveStatus} {lastSaved} />
  </div>
  
  <WizardStepper 
    {steps}
    {currentStep}
    {completedSteps}
    {stepErrors}
  />
  
  <div class="wizard-content">
    <form use:enhance>
      <slot />
    </form>
  </div>
  
  <WizardFooter
    {canGoBack}
    {canGoNext}
    {isLastStep}
    on:back={handleBack}
    on:next={handleNext}
    on:saveDraft={saveDraft}
    on:complete={handleComplete}
  />
</div>

<style>
  .wizard-layout {
    max-width: 1024px;
    margin: 0 auto;
    padding: var(--space-4);
  }
  
  .wizard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
  }
  
  .wizard-header h1 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
  }
  
  .wizard-content {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    min-height: 400px;
  }
  
  @media (max-width: 768px) {
    .wizard-content {
      padding: var(--space-4);
    }
  }
</style>
```

### Step 6: Example Step Page Update (`src/routes/practice-plans/wizard/basic-info/+page.svelte`)

```svelte
<script>
  import { superForm } from 'sveltekit-superforms/client';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import { basicInfoSchema } from '$lib/schemas/practicePlan';
  
  export let data;
  
  const { form, errors, constraints } = superForm(data.form, {
    validators: basicInfoSchema
  });
  
  const positionOptions = [
    { value: 'all', label: 'All Positions' },
    { value: 'chaser', label: 'Chaser' },
    { value: 'beater', label: 'Beater' },
    { value: 'keeper', label: 'Keeper' },
    { value: 'seeker', label: 'Seeker' }
  ];
  
  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];
</script>

<div class="step-content">
  <h2>Basic Information</h2>
  <p class="step-description">
    Let's start with the basic details of your practice plan.
  </p>
  
  <div class="form-grid">
    <Input
      label="Practice Plan Name"
      bind:value={$form.name}
      error={$errors.name}
      required
      placeholder="e.g., Monday Team Practice"
      {...$constraints.name}
    />
    
    <Input
      label="Description"
      type="textarea"
      bind:value={$form.description}
      error={$errors.description}
      placeholder="Describe the goals and focus of this practice"
      rows="3"
    />
    
    <div class="form-row">
      <Input
        label="Duration (minutes)"
        type="number"
        bind:value={$form.duration}
        error={$errors.duration}
        required
        min="5"
        max="480"
        {...$constraints.duration}
      />
      
      <Select
        label="Difficulty Level"
        bind:value={$form.difficulty}
        options={difficultyOptions}
        error={$errors.difficulty}
        required
      />
    </div>
    
    <div class="form-group">
      <label class="group-label">Target Positions</label>
      <div class="checkbox-group">
        {#each positionOptions as option}
          <label class="checkbox-label">
            <input
              type="checkbox"
              value={option.value}
              checked={$form.positions?.includes(option.value)}
              on:change={(e) => {
                if (e.target.checked) {
                  $form.positions = [...($form.positions || []), option.value];
                } else {
                  $form.positions = $form.positions.filter(p => p !== option.value);
                }
              }}
            />
            <span>{option.label}</span>
          </label>
        {/each}
      </div>
      {#if $errors.positions}
        <p class="error-message">{$errors.positions}</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .step-content {
    max-width: 600px;
  }
  
  .step-content h2 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-2);
  }
  
  .step-description {
    color: var(--color-text-secondary);
    margin-bottom: var(--space-6);
  }
  
  .form-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .group-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }
  
  .checkbox-group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
  }
  
  .error-message {
    color: var(--color-error);
    font-size: var(--font-size-sm);
  }
  
  @media (max-width: 640px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }
</style>
```

## Testing Checklist

- [ ] Stepper shows current step and progress
- [ ] Step validation prevents advancing with errors
- [ ] Completed steps show checkmark
- [ ] Error steps show alert icon
- [ ] Back/Next navigation works
- [ ] Keyboard shortcuts work (Alt+Arrow, Ctrl+S)
- [ ] Autosave triggers after inactivity
- [ ] Save indicator shows status
- [ ] Draft persists across sessions
- [ ] Form validation shows inline errors
- [ ] Tainted form warning on navigation
- [ ] Mobile responsive layout
- [ ] Final submission creates plan
- [ ] Progress bar updates correctly

## Integration Notes

- Uses Button, Input, Select components from Ticket 003
- Integrates with existing wizard pages
- Uses sveltekit-superforms for validation
- Maintains draft in localStorage and server

## Next Steps
After completing this ticket, proceed to Ticket 008 (Accessibility and Keyboard).
</file>

<file path="docs/ui-audit/tickets/008-accessibility-and-keyboard-actionable.md">
# Ticket 008: Accessibility and Keyboard - ACTIONABLE

## Overview
Ensure WCAG AA compliance with proper focus management, ARIA labels, keyboard navigation, and screen reader support.

## Prerequisites
- [x] Complete Tickets 001-003 (Design System with focus styles)
- [x] `tabbable` library already installed
- [x] Components from previous tickets

## Implementation Steps

### Step 1: Create Keyboard Navigation Help Modal (`src/lib/components/KeyboardHelp.svelte`)

```svelte
<script>
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import { Keyboard } from 'lucide-svelte';
  
  export let open = false;
  
  const shortcuts = [
    { category: 'Navigation', items: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['/', ], description: 'Focus search' },
      { keys: ['G', 'D'], description: 'Go to drills' },
      { keys: ['G', 'P'], description: 'Go to practice plans' },
      { keys: ['G', 'T'], description: 'Go to teams' },
    ]},
    { category: 'Practice Plan Wizard', items: [
      { keys: ['Alt', '←'], description: 'Previous step' },
      { keys: ['Alt', '→'], description: 'Next step' },
      { keys: ['⌘', 'S'], description: 'Save draft' },
      { keys: ['Enter'], description: 'Submit form' },
    ]},
    { category: 'General', items: [
      { keys: ['Esc'], description: 'Close modal/dialog' },
      { keys: ['Tab'], description: 'Navigate forward' },
      { keys: ['Shift', 'Tab'], description: 'Navigate backward' },
      { keys: ['Space'], description: 'Toggle selection' },
      { keys: ['?'], description: 'Show this help' },
    ]}
  ];
  
  // Listen for ? key
  function handleKeydown(e) {
    if (e.key === '?' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      open = true;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<Dialog bind:open title="Keyboard Shortcuts">
  <div class="shortcuts-container">
    {#each shortcuts as section}
      <div class="shortcut-section">
        <h3>{section.category}</h3>
        <dl class="shortcut-list">
          {#each section.items as shortcut}
            <div class="shortcut-item">
              <dt class="shortcut-keys">
                {#each shortcut.keys as key, i}
                  {#if i > 0}<span class="key-separator">+</span>{/if}
                  <kbd>{key}</kbd>
                {/each}
              </dt>
              <dd class="shortcut-description">{shortcut.description}</dd>
            </div>
          {/each}
        </dl>
      </div>
    {/each}
  </div>
  
  <div slot="footer" class="help-footer">
    <p>Press <kbd>?</kbd> anytime to show this help</p>
  </div>
</Dialog>

<style>
  .shortcuts-container {
    display: grid;
    gap: var(--space-6);
    padding: var(--space-4);
  }
  
  .shortcut-section h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-3);
    color: var(--color-text-primary);
  }
  
  .shortcut-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .shortcut-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-border-default);
  }
  
  .shortcut-item:last-child {
    border-bottom: none;
  }
  
  .shortcut-keys {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
  
  .key-separator {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  
  kbd {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: var(--color-surface-3);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    font-family: monospace;
    font-size: var(--font-size-sm);
    box-shadow: 0 2px 0 var(--color-border-strong);
  }
  
  .shortcut-description {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
  
  .help-footer {
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
</style>
```

### Step 2: Create Focus Trap Utility (`src/lib/utils/focusTrap.ts`)

```typescript
import { tabbable } from 'tabbable';

export function focusTrap(node: HTMLElement, enabled = true) {
  let lastFocusedElement: HTMLElement | null = null;
  
  function handleKeydown(e: KeyboardEvent) {
    if (!enabled || e.key !== 'Tab') return;
    
    const tabbableElements = tabbable(node);
    if (tabbableElements.length === 0) return;
    
    const firstElement = tabbableElements[0];
    const lastElement = tabbableElements[tabbableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }
  
  function handleFocusIn() {
    if (!enabled) return;
    
    const tabbableElements = tabbable(node);
    if (tabbableElements.length > 0 && !node.contains(document.activeElement)) {
      tabbableElements[0].focus();
    }
  }
  
  if (enabled) {
    // Store last focused element
    lastFocusedElement = document.activeElement as HTMLElement;
    
    // Focus first tabbable element
    const tabbableElements = tabbable(node);
    if (tabbableElements.length > 0) {
      tabbableElements[0].focus();
    }
    
    // Add event listeners
    node.addEventListener('keydown', handleKeydown);
    document.addEventListener('focusin', handleFocusIn);
  }
  
  return {
    update(newEnabled: boolean) {
      enabled = newEnabled;
      if (!enabled && lastFocusedElement) {
        lastFocusedElement.focus();
      }
    },
    destroy() {
      node.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('focusin', handleFocusIn);
      if (lastFocusedElement) {
        lastFocusedElement.focus();
      }
    }
  };
}
```

### Step 3: Create Skip Links Component (`src/lib/components/SkipLinks.svelte`)

```svelte
<script>
  const links = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#main-navigation', label: 'Skip to navigation' },
    { href: '#search', label: 'Skip to search' }
  ];
</script>

<nav class="skip-links" aria-label="Skip links">
  {#each links as link}
    <a href={link.href} class="skip-link">
      {link.label}
    </a>
  {/each}
</nav>

<style>
  .skip-links {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
  }
  
  .skip-link {
    position: absolute;
    left: -9999px;
    padding: var(--space-3) var(--space-4);
    background: var(--color-accent-9);
    color: white;
    text-decoration: none;
    border-radius: var(--radius-md);
    font-weight: var(--font-weight-medium);
  }
  
  .skip-link:focus {
    left: var(--space-4);
    top: var(--space-4);
    z-index: 100;
    outline: 3px solid var(--color-focus-ring);
    outline-offset: 2px;
  }
</style>
```

### Step 4: Create Announcer for Screen Readers (`src/lib/components/Announcer.svelte`)

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  
  let announcements = [];
  let announcerElement;
  
  function announce(message, priority = 'polite') {
    announcements = [...announcements, { message, priority, id: Date.now() }];
    
    // Remove announcement after 1 second
    setTimeout(() => {
      announcements = announcements.filter(a => a.id !== Date.now());
    }, 1000);
  }
  
  // Export announce function for global use
  if (typeof window !== 'undefined') {
    window.announcer = { announce };
  }
  
  onDestroy(() => {
    if (typeof window !== 'undefined') {
      delete window.announcer;
    }
  });
</script>

<div class="sr-only" bind:this={announcerElement}>
  {#each announcements as announcement (announcement.id)}
    <div 
      role="status" 
      aria-live={announcement.priority}
      aria-atomic="true"
    >
      {announcement.message}
    </div>
  {/each}
</div>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
```

### Step 5: Update Dialog Component with Focus Management

Update the Dialog component from Ticket 003 to include proper focus management:

```svelte
<script>
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import { X } from 'lucide-svelte';
  import { focusTrap } from '$lib/utils/focusTrap';
  
  export let open = false;
  export let title = '';
  export let description = '';
  
  let dialogElement;
</script>

<DialogPrimitive.Root bind:open>
  <DialogPrimitive.Trigger asChild let:builder>
    <slot name="trigger" {builder} />
  </DialogPrimitive.Trigger>
  
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay class="dialog-overlay" />
    <DialogPrimitive.Content 
      class="dialog-content"
      bind:el={dialogElement}
      use:focusTrap={open}
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
    >
      <div class="dialog-header">
        {#if title}
          <DialogPrimitive.Title id="dialog-title" class="dialog-title">
            {title}
          </DialogPrimitive.Title>
        {/if}
        <DialogPrimitive.Close class="dialog-close" aria-label="Close dialog">
          <X size={20} />
          <span class="sr-only">Close</span>
        </DialogPrimitive.Close>
      </div>
      
      {#if description}
        <DialogPrimitive.Description id="dialog-description" class="dialog-description">
          {description}
        </DialogPrimitive.Description>
      {/if}
      
      <div class="dialog-body">
        <slot />
      </div>
      
      {#if $$slots.footer}
        <div class="dialog-footer">
          <slot name="footer" />
        </div>
      {/if}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
</DialogPrimitive.Root>
```

### Step 6: Create Accessible Table Component (`src/lib/components/ui/Table.svelte`)

```svelte
<script>
  export let caption = '';
  export let sortable = false;
  export let currentSort = null;
  export let sortDirection = 'asc';
  
  function handleSort(column) {
    if (!sortable) return;
    
    if (currentSort === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      currentSort = column;
      sortDirection = 'asc';
    }
    
    // Announce to screen readers
    if (window.announcer) {
      window.announcer.announce(
        `Sorted by ${column} ${sortDirection === 'asc' ? 'ascending' : 'descending'}`
      );
    }
  }
</script>

<table role="table" aria-label={caption}>
  {#if caption}
    <caption class="table-caption">{caption}</caption>
  {/if}
  
  <thead>
    <tr role="row">
      <slot name="header" {handleSort} {currentSort} {sortDirection} />
    </tr>
  </thead>
  
  <tbody>
    <slot />
  </tbody>
  
  {#if $$slots.footer}
    <tfoot>
      <slot name="footer" />
    </tfoot>
  {/if}
</table>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  
  .table-caption {
    padding: var(--space-3);
    background: var(--color-bg-subtle);
    border-bottom: 1px solid var(--color-border-default);
    font-weight: var(--font-weight-semibold);
    text-align: left;
  }
  
  :global(th) {
    padding: var(--space-3);
    background: var(--color-bg-subtle);
    border-bottom: 1px solid var(--color-border-default);
    text-align: left;
    font-weight: var(--font-weight-semibold);
  }
  
  :global(th[aria-sort]) {
    cursor: pointer;
    user-select: none;
  }
  
  :global(th[aria-sort]:hover) {
    background: var(--color-surface-2);
  }
  
  :global(td) {
    padding: var(--space-3);
    border-bottom: 1px solid var(--color-border-default);
  }
  
  :global(tbody tr:last-child td) {
    border-bottom: none;
  }
  
  :global(tbody tr:hover) {
    background: var(--color-bg-subtle);
  }
  
  :global(tbody tr:focus-within) {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: -2px;
  }
</style>
```

### Step 7: Update Main Layout with Accessibility Features

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import SkipLinks from '$lib/components/SkipLinks.svelte';
  import KeyboardHelp from '$lib/components/KeyboardHelp.svelte';
  import Announcer from '$lib/components/Announcer.svelte';
  // ... other imports from previous tickets
  
  let keyboardHelpOpen = false;
</script>

<!-- Skip Links (first element in body) -->
<SkipLinks />

<!-- Screen Reader Announcer -->
<Announcer />

<!-- Keyboard Help Modal -->
<KeyboardHelp bind:open={keyboardHelpOpen} />

<div class="app-shell">
  <Topbar 
    id="main-navigation"
    bind:sidebarOpen 
    on:openCommandPalette={() => commandPaletteOpen = true}
  />
  
  <div class="app-body">
    <Sidebar bind:open={sidebarOpen} />
    
    <main id="main-content" class="main-content" tabindex="-1">
      <div class="content-wrapper">
        {#if breadcrumbs.length > 0}
          <Breadcrumbs segments={breadcrumbs} />
        {/if}
        
        <slot />
      </div>
    </main>
  </div>
  
  <MobileNav />
  <CommandPalette bind:open={commandPaletteOpen} />
</div>
```

### Step 8: Accessibility Testing Utilities (`src/lib/utils/a11y.ts`)

```typescript
// Utility functions for accessibility

export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (typeof window !== 'undefined' && window.announcer) {
    window.announcer.announce(message, priority);
  }
}

export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
  );
  const firstFocusableElement = focusableElements[0] as HTMLElement;
  const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  function handleKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusableElement) {
        lastFocusableElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusableElement) {
        firstFocusableElement.focus();
        e.preventDefault();
      }
    }
  }

  element.addEventListener('keydown', handleKeydown);
  firstFocusableElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleKeydown);
  };
}

export function manageFocus(element: HTMLElement, shouldFocus = true) {
  if (shouldFocus && element) {
    element.focus();
  }
}

// ARIA live region helper
export function createLiveRegion(priority: 'polite' | 'assertive' = 'polite') {
  const region = document.createElement('div');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', priority);
  region.setAttribute('aria-atomic', 'true');
  region.className = 'sr-only';
  document.body.appendChild(region);
  
  return {
    announce(message: string) {
      region.textContent = message;
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    },
    destroy() {
      document.body.removeChild(region);
    }
  };
}
```

## Testing Checklist

### Keyboard Navigation
- [ ] Tab order is logical and predictable
- [ ] All interactive elements are keyboard accessible
- [ ] Focus visible on all elements
- [ ] Skip links work correctly
- [ ] Escape closes modals/dialogs
- [ ] Enter/Space activate buttons
- [ ] Arrow keys work in menus

### Screen Reader Support
- [ ] All images have alt text
- [ ] Form labels properly associated
- [ ] Error messages announced
- [ ] Dynamic content changes announced
- [ ] Headings properly nested
- [ ] Landmarks used correctly

### Focus Management
- [ ] Focus trapped in modals
- [ ] Focus restored after modal close
- [ ] Focus moves to error messages
- [ ] Focus visible during keyboard navigation
- [ ] No focus on hidden elements

### ARIA Implementation
- [ ] Correct ARIA roles used
- [ ] aria-label for icon buttons
- [ ] aria-describedby for help text
- [ ] aria-expanded for collapsibles
- [ ] aria-current for navigation
- [ ] aria-invalid for form errors

### Color Contrast
- [ ] Text meets WCAG AA (4.5:1)
- [ ] Large text meets AA (3:1)
- [ ] Interactive elements meet standards
- [ ] Focus indicators visible
- [ ] Error states distinguishable

## Browser Testing Tools

```bash
# Install axe DevTools browser extension
# Run automated tests
npm install --save-dev @axe-core/playwright

# Add to Playwright tests
import { injectAxe, checkA11y } from 'axe-playwright';

test('should be accessible', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

## Next Steps
After completing this ticket, proceed to Ticket 009 (Performance and Polish).
</file>

<file path="docs/ui-audit/tickets/009-performance-and-polish-actionable.md">
# Ticket 009: Performance and Polish - ACTIONABLE

## Overview
Optimize performance with content-visibility, lazy loading, proper logging, and smooth transitions.

## Prerequisites
- [x] Components from Tickets 001-008
- [x] Design tokens with transition values

## Implementation Steps

### Step 1: Create Logger Utility (`src/lib/utils/logger.ts`)

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: import.meta.env.DEV ? 'debug' : 'error',
      enabled: import.meta.env.DEV,
      prefix: '[QDrill]',
      ...config
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return this.levels[level] >= this.levels[this.config.level];
  }

  private format(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix || '';
    return `${prefix} [${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.log(this.format('debug', message), data || '');
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog('info')) {
      console.info(this.format('info', message), data || '');
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message), data || '');
    }
  }

  error(message: string, error?: any) {
    if (this.shouldLog('error')) {
      console.error(this.format('error', message), error || '');
    }
  }

  // Group related logs
  group(label: string) {
    if (this.config.enabled) {
      console.group(`${this.config.prefix} ${label}`);
    }
  }

  groupEnd() {
    if (this.config.enabled) {
      console.groupEnd();
    }
  }

  // Performance timing
  time(label: string) {
    if (this.config.enabled) {
      console.time(`${this.config.prefix} ${label}`);
    }
  }

  timeEnd(label: string) {
    if (this.config.enabled) {
      console.timeEnd(`${this.config.prefix} ${label}`);
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Create specialized loggers
export const apiLogger = new Logger({ prefix: '[API]' });
export const performanceLogger = new Logger({ prefix: '[PERF]', level: 'info' });
```

### Step 2: Create Lazy Image Component (`src/lib/components/ui/LazyImage.svelte`)

```svelte
<script>
  import { onMount } from 'svelte';
  
  export let src;
  export let alt = '';
  export let width = null;
  export let height = null;
  export let placeholder = '/placeholder-image.svg';
  export let className = '';
  
  let imageElement;
  let loaded = false;
  let error = false;
  let isIntersecting = false;
  
  onMount(() => {
    // Set up intersection observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !loaded) {
            isIntersecting = true;
            loadImage();
          }
        });
      },
      {
        rootMargin: '50px' // Start loading 50px before visible
      }
    );
    
    if (imageElement) {
      observer.observe(imageElement);
    }
    
    return () => {
      if (imageElement) {
        observer.unobserve(imageElement);
      }
    };
  });
  
  function loadImage() {
    const img = new Image();
    
    img.onload = () => {
      loaded = true;
      error = false;
    };
    
    img.onerror = () => {
      error = true;
      loaded = true;
    };
    
    img.src = src;
  }
</script>

<div 
  class="lazy-image-wrapper {className}"
  style="aspect-ratio: {width && height ? `${width}/${height}` : 'auto'}"
>
  {#if !isIntersecting}
    <img
      bind:this={imageElement}
      src={placeholder}
      {alt}
      {width}
      {height}
      class="lazy-image placeholder"
      loading="lazy"
    />
  {:else if error}
    <div class="image-error">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="3" x2="21" y2="21"/>
      </svg>
      <span>Failed to load image</span>
    </div>
  {:else}
    <img
      src={loaded ? src : placeholder}
      {alt}
      {width}
      {height}
      class="lazy-image"
      class:loaded
      loading="lazy"
      decoding="async"
    />
    {#if !loaded}
      <div class="image-loader">
        <div class="spinner" />
      </div>
    {/if}
  {/if}
</div>

<style>
  .lazy-image-wrapper {
    position: relative;
    overflow: hidden;
    background: var(--color-bg-muted);
    border-radius: var(--radius-md);
  }
  
  .lazy-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity var(--transition-base);
  }
  
  .lazy-image.placeholder {
    filter: blur(5px);
    opacity: 0.5;
  }
  
  .lazy-image.loaded {
    opacity: 1;
  }
  
  .image-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: var(--space-4);
    color: var(--color-text-muted);
    text-align: center;
  }
  
  .image-error span {
    margin-top: var(--space-2);
    font-size: var(--font-size-sm);
  }
  
  .image-loader {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-muted);
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-border-default);
    border-top-color: var(--color-accent-9);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
```

### Step 3: Add Content Visibility Styles (`src/lib/styles/performance.css`)

```css
/* Content Visibility for long lists and sections */
.content-auto {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px; /* Estimated height */
}

.content-auto-small {
  content-visibility: auto;
  contain-intrinsic-size: auto 200px;
}

.content-auto-large {
  content-visibility: auto;
  contain-intrinsic-size: auto 800px;
}

/* GPU acceleration for animations */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Smooth scrolling with reduced motion support */
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}

/* Performance optimizations for shadows and effects */
.shadow-optimized {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transform: translateZ(0);
}

.shadow-optimized:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.16);
}

/* Optimized transitions */
.transition-optimized {
  transition: transform var(--transition-fast), 
              opacity var(--transition-fast),
              box-shadow var(--transition-fast);
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Virtual scrolling container */
.virtual-scroll {
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* Skeleton loading optimization */
.skeleton-optimized {
  background: linear-gradient(
    90deg,
    var(--color-bg-muted) 25%,
    var(--color-surface-3) 50%,
    var(--color-bg-muted) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  animation-timing-function: ease-in-out;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Step 4: Update Practice Plan Viewer with Content Visibility

```svelte
<!-- Update src/routes/practice-plans/viewer/Section.svelte -->
<script>
  // ... existing imports
  import { logger } from '$lib/utils/logger';
</script>

<section 
  id="section-{section.id}" 
  class="plan-section content-auto"
  style="contain-intrinsic-size: auto {estimatedHeight}px"
>
  <!-- ... rest of component -->
</section>

<style>
  .plan-section {
    /* Add performance optimizations */
    content-visibility: auto;
    contain: layout style paint;
  }
</style>
```

### Step 5: Create Performance Monitor Component (`src/lib/components/PerformanceMonitor.svelte`)

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { performanceLogger } from '$lib/utils/logger';
  
  let metrics = {
    fps: 0,
    memory: 0,
    loadTime: 0
  };
  
  let rafId;
  let lastTime = performance.now();
  let frames = 0;
  
  onMount(() => {
    // Measure initial load time
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
      performanceLogger.info('Page load time:', metrics.loadTime + 'ms');
    }
    
    // Monitor FPS
    function measureFPS() {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
      }
      
      // Monitor memory if available
      if (performance.memory) {
        metrics.memory = Math.round(performance.memory.usedJSHeapSize / 1048576);
      }
      
      rafId = requestAnimationFrame(measureFPS);
    }
    
    if (import.meta.env.DEV) {
      measureFPS();
    }
    
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  });
  
  // Log performance marks
  export function mark(name) {
    if (window.performance && window.performance.mark) {
      window.performance.mark(name);
      performanceLogger.debug(`Performance mark: ${name}`);
    }
  }
  
  export function measure(name, startMark, endMark) {
    if (window.performance && window.performance.measure) {
      window.performance.measure(name, startMark, endMark);
      const measures = window.performance.getEntriesByName(name);
      if (measures.length > 0) {
        performanceLogger.info(`${name}: ${measures[0].duration.toFixed(2)}ms`);
      }
    }
  }
</script>

{#if import.meta.env.DEV}
  <div class="performance-monitor">
    <span>FPS: {metrics.fps}</span>
    <span>Memory: {metrics.memory}MB</span>
    <span>Load: {metrics.loadTime}ms</span>
  </div>
{/if}

<style>
  .performance-monitor {
    position: fixed;
    bottom: var(--space-4);
    right: var(--space-4);
    padding: var(--space-2) var(--space-3);
    background: rgba(0, 0, 0, 0.8);
    color: #00ff00;
    font-family: monospace;
    font-size: var(--font-size-xs);
    border-radius: var(--radius-md);
    display: flex;
    gap: var(--space-3);
    z-index: 9999;
    pointer-events: none;
  }
</style>
```

### Step 6: Add Transition Utilities (`src/lib/utils/transitions.ts`)

```typescript
import { cubicOut } from 'svelte/easing';

export function slideAndFade(node: HTMLElement, {
  delay = 0,
  duration = 300,
  easing = cubicOut,
  axis = 'y'
} = {}) {
  const style = getComputedStyle(node);
  const opacity = +style.opacity;
  const primary_dimension = axis === 'y' ? 'height' : 'width';
  const primary_dimension_value = parseFloat(style[primary_dimension]);
  const secondary_dimensions = axis === 'y' ? ['Top', 'Bottom'] : ['Left', 'Right'];
  const padding_start = parseFloat(style[`padding${secondary_dimensions[0]}`]);
  const padding_end = parseFloat(style[`padding${secondary_dimensions[1]}`]);
  const margin_start = parseFloat(style[`margin${secondary_dimensions[0]}`]);
  const margin_end = parseFloat(style[`margin${secondary_dimensions[1]}`]);
  const border_width_start = parseFloat(style[`border${secondary_dimensions[0]}Width`]);
  const border_width_end = parseFloat(style[`border${secondary_dimensions[1]}Width`]);
  
  return {
    delay,
    duration,
    easing,
    css: (t: number) => {
      const eased = easing(t);
      return `
        overflow: hidden;
        opacity: ${eased * opacity};
        ${primary_dimension}: ${eased * primary_dimension_value}px;
        padding-${secondary_dimensions[0].toLowerCase()}: ${eased * padding_start}px;
        padding-${secondary_dimensions[1].toLowerCase()}: ${eased * padding_end}px;
        margin-${secondary_dimensions[0].toLowerCase()}: ${eased * margin_start}px;
        margin-${secondary_dimensions[1].toLowerCase()}: ${eased * margin_end}px;
        border-${secondary_dimensions[0].toLowerCase()}-width: ${eased * border_width_start}px;
        border-${secondary_dimensions[1].toLowerCase()}-width: ${eased * border_width_end}px;
      `;
    }
  };
}

export function staggeredFade(node: HTMLElement, {
  delay = 0,
  duration = 300,
  easing = cubicOut,
  stagger = 50
} = {}) {
  const children = Array.from(node.children) as HTMLElement[];
  
  children.forEach((child, i) => {
    child.style.opacity = '0';
    child.style.transform = 'translateY(20px)';
  });
  
  return {
    delay,
    duration: duration + (stagger * children.length),
    easing,
    css: (t: number) => {
      children.forEach((child, i) => {
        const childDelay = (i * stagger) / (duration + (stagger * children.length));
        const childT = Math.max(0, Math.min(1, (t - childDelay) * (1 / (1 - childDelay))));
        const eased = easing(childT);
        
        child.style.opacity = `${eased}`;
        child.style.transform = `translateY(${(1 - eased) * 20}px)`;
      });
      
      return '';
    }
  };
}
```

### Step 7: Update Drills Grid with Virtual Scrolling

```svelte
<!-- src/routes/drills/+page.svelte enhancement -->
<script>
  import VirtualList from '@tanstack/svelte-virtual';
  import { performanceLogger } from '$lib/utils/logger';
  
  // ... existing code ...
  
  let virtualListRef;
  const itemHeight = 320; // Approximate height of drill card
  
  $: if (filteredDrills.length > 100) {
    performanceLogger.info(`Rendering ${filteredDrills.length} drills with virtual scrolling`);
  }
</script>

{#if filteredDrills.length > 100}
  <!-- Use virtual scrolling for large lists -->
  <div class="virtual-drills-container">
    <VirtualList
      bind:this={virtualListRef}
      items={filteredDrills}
      estimateSize={() => itemHeight}
      overscan={5}
      let:item
    >
      <div class="content-auto-small">
        <DrillCard 
          drill={item}
          view={$drillFilters.view}
          density={$drillFilters.density}
        />
      </div>
    </VirtualList>
  </div>
{:else}
  <!-- Regular grid for smaller lists -->
  <div class="drills-grid">
    {#each filteredDrills as drill (drill.id)}
      <div class="content-auto-small">
        <DrillCard 
          {drill}
          view={$drillFilters.view}
          density={$drillFilters.density}
        />
      </div>
    {/each}
  </div>
{/if}

<style>
  .virtual-drills-container {
    height: calc(100vh - 200px);
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  
  :global(.virtual-list-item) {
    padding: var(--space-2);
  }
</style>
```

## Testing Checklist

### Performance Metrics
- [ ] Page load time < 3 seconds
- [ ] Time to Interactive < 5 seconds  
- [ ] First Contentful Paint < 1.5 seconds
- [ ] Cumulative Layout Shift < 0.1
- [ ] FPS remains above 30 during scrolling

### Image Optimization
- [ ] Images lazy load on scroll
- [ ] Placeholder shown while loading
- [ ] Error state for failed images
- [ ] Width/height prevents layout shift
- [ ] Proper aspect ratios maintained

### Content Visibility
- [ ] Long sections use content-visibility
- [ ] Scroll performance smooth on long pages
- [ ] No janky scrolling on mobile
- [ ] Estimated sizes prevent jumping

### Logging
- [ ] No console logs in production
- [ ] Dev logs properly categorized
- [ ] Performance metrics logged
- [ ] Errors properly captured

### Transitions
- [ ] Smooth transitions on all interactions
- [ ] Reduced motion respected
- [ ] No janky animations
- [ ] GPU acceleration for complex animations

## Performance Budget

```javascript
// Add to vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['svelte', '@sveltejs/kit'],
          ui: ['bits-ui', 'lucide-svelte'],
          utils: ['lodash-es', 'zod']
        }
      }
    },
    // Performance budgets
    chunkSizeWarningLimit: 500, // 500kb warning
    cssCodeSplit: true,
    sourcemap: false, // Disable in production
    minify: 'esbuild'
  }
};
```

## Monitoring Setup

```javascript
// Add to app.html
<script>
  // Web Vitals monitoring
  if ('PerformanceObserver' in window) {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Log to analytics
        console.log('LCP:', entry.startTime);
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }
</script>
```

## Next Steps
After completing this ticket, proceed to Ticket 010 (Command Palette enhancement).
</file>

<file path="docs/ui-audit/tickets/010-command-palette-actionable.md">
# Ticket 010: Command Palette Enhancement - ACTIONABLE

## Overview
This ticket enhances the basic command palette from Ticket 002 with search providers, recent items, and actions.

## Prerequisites
- [x] Basic CommandPalette from Ticket 002
- [x] `cmdk-sv` library installed

## Implementation Steps

### Step 1: Enhanced Command Palette (`src/lib/components/CommandPaletteEnhanced.svelte`)

```svelte
<script>
  import { Command } from 'cmdk-sv';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { 
    Search, 
    Target, 
    Calendar, 
    Users, 
    PenTool,
    Clock,
    Star,
    Plus,
    Settings,
    FileText,
    ArrowRight,
    Hash
  } from 'lucide-svelte';
  import { apiFetch } from '$lib/utils/apiFetch';
  import { logger } from '$lib/utils/logger';
  
  export let open = false;
  
  let searchQuery = '';
  let searchResults = {
    drills: [],
    plans: [],
    teams: []
  };
  let recentItems = [];
  let isSearching = false;
  let selectedGroup = null;
  
  // Command categories
  const commands = {
    navigation: [
      { id: 'nav-drills', label: 'Go to Drills', icon: Target, action: () => goto('/drills') },
      { id: 'nav-plans', label: 'Go to Practice Plans', icon: Calendar, action: () => goto('/practice-plans') },
      { id: 'nav-teams', label: 'Go to Teams', icon: Users, action: () => goto('/teams') },
      { id: 'nav-whiteboard', label: 'Go to Whiteboard', icon: PenTool, action: () => goto('/whiteboard') },
      { id: 'nav-settings', label: 'Settings', icon: Settings, action: () => goto('/settings') }
    ],
    actions: [
      { id: 'create-drill', label: 'Create New Drill', icon: Plus, action: () => goto('/drills/create') },
      { id: 'create-plan', label: 'Create Practice Plan', icon: Plus, action: () => goto('/practice-plans/wizard') },
      { id: 'create-team', label: 'Create Team', icon: Plus, action: () => goto('/teams/create') }
    ]
  };
  
  // Load recent items from localStorage
  onMount(() => {
    const stored = localStorage.getItem('command-palette-recent');
    if (stored) {
      recentItems = JSON.parse(stored);
    }
  });
  
  // Search functionality
  let searchTimeout;
  async function handleSearch(query) {
    searchQuery = query;
    
    if (query.length < 2) {
      searchResults = { drills: [], plans: [], teams: [] };
      return;
    }
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      isSearching = true;
      
      try {
        // Search different resources in parallel
        const [drillsRes, plansRes] = await Promise.all([
          apiFetch(`/api/drills/search?q=${encodeURIComponent(query)}&limit=5`),
          apiFetch(`/api/practice-plans?search=${encodeURIComponent(query)}&limit=5`)
        ]);
        
        searchResults = {
          drills: drillsRes.drills || [],
          plans: plansRes.plans || [],
          teams: [] // Add team search when available
        };
      } catch (error) {
        logger.error('Command palette search failed:', error);
      } finally {
        isSearching = false;
      }
    }, 300);
  }
  
  // Handle selection
  function handleSelect(item, type) {
    // Add to recent items
    addToRecent({ ...item, type });
    
    // Navigate based on type
    switch (type) {
      case 'drill':
        goto(`/drills/${item.id}`);
        break;
      case 'plan':
        goto(`/practice-plans/${item.id}`);
        break;
      case 'team':
        goto(`/teams/${item.id}`);
        break;
      case 'command':
        item.action();
        break;
    }
    
    // Close palette
    open = false;
    searchQuery = '';
  }
  
  function addToRecent(item) {
    // Remove if already exists
    recentItems = recentItems.filter(i => i.id !== item.id);
    
    // Add to beginning
    recentItems = [item, ...recentItems].slice(0, 5);
    
    // Save to localStorage
    localStorage.setItem('command-palette-recent', JSON.stringify(recentItems));
  }
  
  // Keyboard shortcuts
  function handleKeydown(e) {
    // Cmd+K to open
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      open = !open;
    }
    
    // Escape to close
    if (e.key === 'Escape' && open) {
      open = false;
    }
    
    // Quick shortcuts when palette is closed
    if (!open && !e.target.matches('input, textarea')) {
      // G then D for drills
      if (e.key === 'g') {
        window.lastKey = 'g';
        setTimeout(() => window.lastKey = null, 1000);
      } else if (window.lastKey === 'g') {
        switch (e.key) {
          case 'd':
            e.preventDefault();
            goto('/drills');
            break;
          case 'p':
            e.preventDefault();
            goto('/practice-plans');
            break;
          case 't':
            e.preventDefault();
            goto('/teams');
            break;
        }
        window.lastKey = null;
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<Command.Root 
  bind:open 
  shouldFilter={false}
  onValueChange={handleSearch}
>
  <Command.Dialog class="command-dialog">
    <Command.Input 
      placeholder="Search or type a command..." 
      class="command-input"
    />
    
    <Command.List class="command-list">
      {#if isSearching}
        <Command.Loading class="command-loading">
          Searching...
        </Command.Loading>
      {:else if searchQuery.length < 2}
        <!-- Recent items -->
        {#if recentItems.length > 0}
          <Command.Group heading="Recent" class="command-group">
            {#each recentItems as item}
              <Command.Item 
                onSelect={() => handleSelect(item, item.type)}
                class="command-item"
              >
                <Clock size={16} class="item-icon" />
                <span class="item-label">{item.name || item.label}</span>
                <span class="item-type">{item.type}</span>
                <ArrowRight size={14} class="item-arrow" />
              </Command.Item>
            {/each}
          </Command.Group>
        {/if}
        
        <!-- Navigation -->
        <Command.Group heading="Navigation" class="command-group">
          {#each commands.navigation as cmd}
            <Command.Item 
              onSelect={() => handleSelect(cmd, 'command')}
              class="command-item"
            >
              <svelte:component this={cmd.icon} size={16} class="item-icon" />
              <span class="item-label">{cmd.label}</span>
              <ArrowRight size={14} class="item-arrow" />
            </Command.Item>
          {/each}
        </Command.Group>
        
        <!-- Actions -->
        <Command.Group heading="Actions" class="command-group">
          {#each commands.actions as cmd}
            <Command.Item 
              onSelect={() => handleSelect(cmd, 'command')}
              class="command-item"
            >
              <svelte:component this={cmd.icon} size={16} class="item-icon" />
              <span class="item-label">{cmd.label}</span>
              <ArrowRight size={14} class="item-arrow" />
            </Command.Item>
          {/each}
        </Command.Group>
      {:else}
        <!-- Search results -->
        {#if searchResults.drills.length > 0}
          <Command.Group heading="Drills" class="command-group">
            {#each searchResults.drills as drill}
              <Command.Item 
                onSelect={() => handleSelect(drill, 'drill')}
                class="command-item"
              >
                <Target size={16} class="item-icon" />
                <div class="item-content">
                  <span class="item-label">{drill.name}</span>
                  <span class="item-description">{drill.description}</span>
                </div>
                <ArrowRight size={14} class="item-arrow" />
              </Command.Item>
            {/each}
          </Command.Group>
        {/if}
        
        {#if searchResults.plans.length > 0}
          <Command.Group heading="Practice Plans" class="command-group">
            {#each searchResults.plans as plan}
              <Command.Item 
                onSelect={() => handleSelect(plan, 'plan')}
                class="command-item"
              >
                <Calendar size={16} class="item-icon" />
                <div class="item-content">
                  <span class="item-label">{plan.name}</span>
                  <span class="item-description">{plan.description}</span>
                </div>
                <ArrowRight size={14} class="item-arrow" />
              </Command.Item>
            {/each}
          </Command.Group>
        {/if}
        
        {#if searchResults.drills.length === 0 && searchResults.plans.length === 0}
          <Command.Empty class="command-empty">
            No results found for "{searchQuery}"
          </Command.Empty>
        {/if}
      {/if}
    </Command.List>
    
    <div class="command-footer">
      <div class="footer-hints">
        <kbd>↑↓</kbd> Navigate
        <kbd>↵</kbd> Select
        <kbd>esc</kbd> Close
      </div>
      <div class="footer-shortcuts">
        Type <kbd>></kbd> for commands
      </div>
    </div>
  </Command.Dialog>
</Command.Root>

<style>
  :global(.command-dialog) {
    max-width: 640px;
    width: 100%;
    max-height: 500px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  :global(.command-input) {
    width: 100%;
    padding: var(--space-4);
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--color-border-default);
    font-size: var(--font-size-lg);
    color: var(--color-text-primary);
  }
  
  :global(.command-input:focus) {
    outline: none;
  }
  
  :global(.command-list) {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-2);
    max-height: 400px;
  }
  
  :global(.command-group) {
    padding: var(--space-2) 0;
  }
  
  :global(.command-group [cmdk-group-heading]) {
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    text-transform: uppercase;
  }
  
  :global(.command-item) {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  :global(.command-item[aria-selected="true"]) {
    background: var(--color-accent-3);
    color: var(--color-accent-11);
  }
  
  :global(.item-icon) {
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
  
  :global(.command-item[aria-selected="true"] .item-icon) {
    color: var(--color-accent-9);
  }
  
  .item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }
  
  .item-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .item-description {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .item-type {
    padding: 0.125rem 0.375rem;
    background: var(--color-bg-muted);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: capitalize;
  }
  
  :global(.item-arrow) {
    flex-shrink: 0;
    color: var(--color-text-muted);
    margin-left: auto;
  }
  
  :global(.command-loading) {
    padding: var(--space-8) var(--space-4);
    text-align: center;
    color: var(--color-text-muted);
  }
  
  :global(.command-empty) {
    padding: var(--space-8) var(--space-4);
    text-align: center;
    color: var(--color-text-muted);
  }
  
  .command-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3);
    border-top: 1px solid var(--color-border-default);
    background: var(--color-bg-subtle);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  
  .footer-hints,
  .footer-shortcuts {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  
  .command-footer kbd {
    padding: 0.125rem 0.25rem;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    font-family: monospace;
    font-size: var(--font-size-xs);
  }
</style>
```

### Step 2: Command Palette Provider (`src/lib/stores/commandPalette.ts`)

```typescript
import { writable, derived } from 'svelte/store';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: any;
  action: () => void;
  keywords?: string[];
  category?: string;
}

interface CommandPaletteState {
  open: boolean;
  query: string;
  selectedIndex: number;
  commands: CommandItem[];
  recentCommands: CommandItem[];
}

function createCommandPalette() {
  const { subscribe, set, update } = writable<CommandPaletteState>({
    open: false,
    query: '',
    selectedIndex: 0,
    commands: [],
    recentCommands: []
  });

  return {
    subscribe,
    open: () => update(state => ({ ...state, open: true })),
    close: () => update(state => ({ ...state, open: false, query: '', selectedIndex: 0 })),
    toggle: () => update(state => ({ ...state, open: !state.open })),
    setQuery: (query: string) => update(state => ({ ...state, query })),
    registerCommand: (command: CommandItem) => {
      update(state => ({
        ...state,
        commands: [...state.commands, command]
      }));
    },
    registerCommands: (commands: CommandItem[]) => {
      update(state => ({
        ...state,
        commands: [...state.commands, ...commands]
      }));
    },
    executeCommand: (commandId: string) => {
      let command: CommandItem | undefined;
      
      update(state => {
        command = state.commands.find(cmd => cmd.id === commandId);
        if (command) {
          // Add to recent commands
          const recentCommands = [
            command,
            ...state.recentCommands.filter(cmd => cmd.id !== commandId)
          ].slice(0, 5);
          
          // Save to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('recent-commands', JSON.stringify(recentCommands));
          }
          
          return {
            ...state,
            recentCommands,
            open: false,
            query: ''
          };
        }
        return state;
      });
      
      // Execute the command action
      if (command) {
        command.action();
      }
    }
  };
}

export const commandPalette = createCommandPalette();

// Derived store for filtered commands
export const filteredCommands = derived(
  commandPalette,
  $state => {
    if (!$state.query) {
      return $state.recentCommands.length > 0 
        ? $state.recentCommands 
        : $state.commands.slice(0, 10);
    }
    
    const query = $state.query.toLowerCase();
    return $state.commands.filter(cmd => {
      const inLabel = cmd.label.toLowerCase().includes(query);
      const inDescription = cmd.description?.toLowerCase().includes(query);
      const inKeywords = cmd.keywords?.some(k => k.toLowerCase().includes(query));
      return inLabel || inDescription || inKeywords;
    });
  }
);
```

### Step 3: Global Command Registration

```typescript
// src/lib/commands/index.ts
import { commandPalette } from '$lib/stores/commandPalette';
import { goto } from '$app/navigation';
import { 
  Target, 
  Calendar, 
  Users, 
  Plus, 
  Settings,
  LogOut,
  Sun,
  Moon
} from 'lucide-svelte';

export function registerGlobalCommands() {
  commandPalette.registerCommands([
    // Navigation
    {
      id: 'go-drills',
      label: 'Go to Drills',
      description: 'Browse drill library',
      icon: Target,
      action: () => goto('/drills'),
      keywords: ['navigate', 'drill', 'exercise'],
      category: 'Navigation'
    },
    {
      id: 'go-plans',
      label: 'Go to Practice Plans',
      description: 'View practice plans',
      icon: Calendar,
      action: () => goto('/practice-plans'),
      keywords: ['navigate', 'practice', 'plan'],
      category: 'Navigation'
    },
    
    // Actions
    {
      id: 'create-drill',
      label: 'Create New Drill',
      description: 'Add a new drill to the library',
      icon: Plus,
      action: () => goto('/drills/create'),
      keywords: ['new', 'add', 'drill'],
      category: 'Actions'
    },
    {
      id: 'create-plan',
      label: 'Create Practice Plan',
      description: 'Start practice plan wizard',
      icon: Plus,
      action: () => goto('/practice-plans/wizard'),
      keywords: ['new', 'add', 'practice', 'plan'],
      category: 'Actions'
    },
    
    // Settings
    {
      id: 'toggle-theme',
      label: 'Toggle Theme',
      description: 'Switch between light and dark mode',
      icon: Sun,
      action: () => {
        // Toggle theme
        document.documentElement.setAttribute(
          'data-theme',
          document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light'
        );
      },
      keywords: ['theme', 'dark', 'light', 'mode'],
      category: 'Settings'
    },
    
    // User
    {
      id: 'sign-out',
      label: 'Sign Out',
      description: 'Log out of your account',
      icon: LogOut,
      action: () => {
        // Sign out logic
        goto('/logout');
      },
      keywords: ['logout', 'sign', 'out'],
      category: 'User'
    }
  ]);
}
```

## Testing Checklist

- [ ] Opens with Cmd+K / Ctrl+K
- [ ] Closes with Escape
- [ ] Search filters results in real-time
- [ ] Recent items displayed and work
- [ ] Navigation commands work
- [ ] Action commands work
- [ ] Search results from API display
- [ ] Keyboard navigation works (up/down arrows)
- [ ] Enter selects current item
- [ ] Quick shortcuts (g+d) work when closed
- [ ] Recent items persist across sessions
- [ ] Loading state shows during search
- [ ] Empty state displays for no results
- [ ] Footer hints visible

## Integration Notes

- Replaces basic CommandPalette from Ticket 002
- Uses existing API endpoints for search
- Integrates with theme system from Ticket 001
- Uses logger from Ticket 009

## Next Steps
After completing this ticket, proceed to Ticket 011 (Reduce Tints and Anchor Links).
</file>

<file path="docs/ui-audit/tickets/011-reduce-tints-and-anchor-links-actionable.md">
# Ticket 011: Reduce Tints and Anchor Links - ACTIONABLE

## Overview
Replace heavy tinted backgrounds with subtle rails/borders and ensure all drills have proper anchor links for crawlability and new tab functionality.

## Prerequisites
- [x] Design tokens from Ticket 001
- [x] Components from previous tickets

## Implementation Steps

### Step 1: Update Design Tokens for Rails (`src/lib/styles/rails.css`)

```css
/* Rail and accent styles to replace heavy tints */
:root {
  /* Rail colors for sections */
  --rail-default: var(--color-border-strong);
  --rail-primary: var(--color-accent-9);
  --rail-success: var(--color-success);
  --rail-warning: var(--color-warning);
  --rail-error: var(--color-error);
  --rail-info: var(--color-info);
  
  /* Rail widths */
  --rail-width-sm: 2px;
  --rail-width-md: 3px;
  --rail-width-lg: 4px;
  
  /* Subtle backgrounds to replace tints */
  --bg-subtle-primary: color-mix(in srgb, var(--color-accent-9) 5%, transparent);
  --bg-subtle-success: color-mix(in srgb, var(--color-success) 5%, transparent);
  --bg-subtle-warning: color-mix(in srgb, var(--color-warning) 5%, transparent);
  --bg-subtle-error: color-mix(in srgb, var(--color-error) 5%, transparent);
}

/* Rail utility classes */
.rail-left {
  border-left: var(--rail-width-lg) solid var(--rail-default);
  padding-left: var(--space-4);
}

.rail-left-primary {
  border-left-color: var(--rail-primary);
}

.rail-left-success {
  border-left-color: var(--rail-success);
}

.rail-left-warning {
  border-left-color: var(--rail-warning);
}

.rail-left-error {
  border-left-color: var(--rail-error);
}

/* Subtle background utilities */
.bg-subtle {
  background: var(--color-bg-subtle);
}

.bg-subtle-primary {
  background: var(--bg-subtle-primary);
}

.bg-subtle-success {
  background: var(--bg-subtle-success);
}

.bg-subtle-warning {
  background: var(--bg-subtle-warning);
}

.bg-subtle-error {
  background: var(--bg-subtle-error);
}

/* Remove heavy tints */
.no-tint {
  background: var(--color-surface-1) !important;
}

/* Section styles without heavy backgrounds */
.section-clean {
  background: var(--color-surface-1);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.section-rail {
  border-left: var(--rail-width-lg) solid var(--rail-primary);
  padding-left: var(--space-4);
  margin-left: var(--space-2);
}

/* Parallel group indicators */
.parallel-indicator {
  position: relative;
  padding-left: var(--space-6);
}

.parallel-indicator::before {
  content: '';
  position: absolute;
  left: var(--space-2);
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    to bottom,
    var(--color-accent-9) 0%,
    var(--color-accent-9) 50%,
    transparent 50%,
    transparent 100%
  );
  background-size: 2px 8px;
}
```

### Step 2: Update Practice Plan Section Component

```svelte
<!-- src/routes/practice-plans/viewer/Section.svelte -->
<script>
  export let section;
  export let index;
  export let variant = 'default'; // default, primary, success, warning
</script>

<section 
  class="plan-section section-clean rail-left rail-left-{variant}"
  id="section-{section.id}"
>
  <header class="section-header">
    <h2>
      <span class="section-number">{index + 1}</span>
      {section.name}
    </h2>
    <!-- Rest of header -->
  </header>
  
  <div class="section-content">
    <!-- Content without heavy background -->
    <slot />
  </div>
</section>

<style>
  .plan-section {
    /* Remove old heavy tints */
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-4);
    overflow: hidden;
  }
  
  /* Rail accent instead of full background */
  .plan-section.rail-left {
    border-left: 4px solid var(--color-accent-9);
  }
  
  .section-header {
    /* Light background instead of heavy tint */
    background: var(--color-bg-subtle);
    padding: var(--space-3);
    border-bottom: 1px solid var(--color-border-default);
  }
  
  .section-content {
    padding: var(--space-4);
    /* No background color */
  }
  
  /* Remove all bg-*-50 classes */
  :global(.bg-blue-50),
  :global(.bg-green-50),
  :global(.bg-yellow-50),
  :global(.bg-red-50) {
    background: transparent !important;
  }
</style>
```

### Step 3: Create Proper Drill Link Component (`src/lib/components/DrillLink.svelte`)

```svelte
<script>
  import { ExternalLink } from 'lucide-svelte';
  
  export let drill;
  export let showExternal = true;
  export let className = '';
</script>

<a 
  href="/drills/{drill.id}"
  class="drill-link {className}"
  title="View {drill.name} details"
  data-drill-id={drill.id}
  rel="prefetch"
>
  <slot>
    <span class="drill-name">{drill.name}</span>
  </slot>
  {#if showExternal}
    <ExternalLink size={14} class="external-icon" />
  {/if}
</a>

<style>
  .drill-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--color-accent-9);
    text-decoration: none;
    transition: all var(--transition-fast);
  }
  
  .drill-link:hover {
    color: var(--color-accent-10);
    text-decoration: underline;
  }
  
  /* Ensure middle-click works */
  .drill-link:active {
    color: var(--color-accent-11);
  }
  
  .drill-name {
    font-weight: var(--font-weight-medium);
  }
  
  :global(.external-icon) {
    opacity: 0;
    transition: opacity var(--transition-fast);
  }
  
  .drill-link:hover :global(.external-icon) {
    opacity: 1;
  }
</style>
```

### Step 4: Update All Drill References

```svelte
<!-- Update DrillCard components -->
<script>
  import DrillLink from '$lib/components/DrillLink.svelte';
  export let drill;
</script>

<article class="drill-card">
  <DrillLink {drill} className="card-title-link">
    <h3>{drill.name}</h3>
  </DrillLink>
  
  <!-- Rest of card content -->
  
  <div class="card-actions">
    <a 
      href="/drills/{drill.id}" 
      class="btn btn-sm"
      target="_blank"
      rel="noopener"
    >
      Open in new tab
    </a>
  </div>
</article>
```

### Step 5: Update Parallel Groups Styling

```svelte
<!-- src/routes/practice-plans/viewer/ParallelGroup.svelte -->
<script>
  export let group;
</script>

<div class="parallel-group">
  <div class="parallel-header">
    <span class="parallel-icon">║</span>
    <h3>{group.name || 'Parallel Activities'}</h3>
  </div>
  
  <div class="parallel-timelines">
    {#each group.timelines as timeline}
      <div class="timeline-column">
        <div class="timeline-header">
          <h4>{timeline.name}</h4>
        </div>
        <div class="timeline-content">
          {#each timeline.drills as drill}
            <DrillLink {drill} showExternal={false} />
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .parallel-group {
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    overflow: hidden;
    margin: var(--space-4) 0;
  }
  
  .parallel-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--color-bg-subtle);
    border-bottom: 1px solid var(--color-border-default);
  }
  
  .parallel-icon {
    color: var(--color-accent-9);
    font-weight: bold;
    font-size: var(--font-size-xl);
  }
  
  .parallel-timelines {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0;
  }
  
  .timeline-column {
    border-right: 1px solid var(--color-border-default);
  }
  
  .timeline-column:last-child {
    border-right: none;
  }
  
  .timeline-header {
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface-2);
    border-bottom: 1px solid var(--color-border-default);
  }
  
  .timeline-header h4 {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }
  
  .timeline-content {
    padding: var(--space-3);
    /* No heavy background */
  }
</style>
```

### Step 6: Global Style Cleanup (`src/app.css` additions)

```css
/* Remove all Tailwind tint utilities */
.bg-blue-50,
.bg-green-50,
.bg-yellow-50,
.bg-red-50,
.bg-gray-50,
.bg-indigo-50,
.bg-purple-50,
.bg-pink-50 {
  background: var(--color-bg-subtle) !important;
}

/* Replace with subtle versions */
.bg-primary-subtle {
  background: var(--bg-subtle-primary);
}

.bg-success-subtle {
  background: var(--bg-subtle-success);
}

.bg-warning-subtle {
  background: var(--bg-subtle-warning);
}

.bg-error-subtle {
  background: var(--bg-subtle-error);
}

/* Ensure all drill links are crawlable */
a[href*="/drills/"] {
  /* Ensure proper link behavior */
  cursor: pointer;
  user-select: auto;
}

/* Prevent JavaScript-only navigation */
[role="button"][onclick*="drill"],
[data-drill-id]:not(a) {
  /* Convert to proper links */
  cursor: not-allowed !important;
  opacity: 0.5 !important;
}
```

### Step 7: Audit Script for Finding Issues (`scripts/audit-links.js`)

```javascript
// Script to find all drill references that need updating
import { glob } from 'glob';
import { readFile } from 'fs/promises';

async function auditDrillLinks() {
  const files = await glob('src/**/*.svelte');
  const issues = [];
  
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    
    // Check for button-based drill navigation
    if (content.includes('on:click') && content.includes('drill')) {
      const hasProperLink = content.includes('href="/drills/');
      if (!hasProperLink) {
        issues.push({
          file,
          issue: 'Drill navigation without proper anchor link'
        });
      }
    }
    
    // Check for heavy tints
    const tintPattern = /bg-(blue|green|yellow|red|gray|indigo|purple|pink)-50/g;
    const tints = content.match(tintPattern);
    if (tints) {
      issues.push({
        file,
        issue: `Heavy tints found: ${tints.join(', ')}`
      });
    }
    
    // Check for missing rel attributes
    if (content.includes('target="_blank"') && !content.includes('rel=')) {
      issues.push({
        file,
        issue: 'External link missing rel attribute'
      });
    }
  }
  
  // Output report
  console.log('Link Audit Report');
  console.log('=================');
  issues.forEach(({ file, issue }) => {
    console.log(`${file}: ${issue}`);
  });
  
  return issues;
}

// Run audit
auditDrillLinks();
```

## Testing Checklist

### Visual Changes
- [ ] No heavy tinted backgrounds remain
- [ ] Rails display on left side of sections
- [ ] Subtle backgrounds used sparingly
- [ ] Parallel groups have visual indicators
- [ ] Contrast meets WCAG standards

### Link Functionality
- [ ] All drill cards have anchor links
- [ ] Middle-click opens in new tab
- [ ] Right-click shows browser context menu
- [ ] Links work without JavaScript
- [ ] SEO crawlers can follow links
- [ ] Cmd/Ctrl+click opens new tab

### Accessibility
- [ ] Links have proper title attributes
- [ ] External links have rel attributes
- [ ] Focus states visible on all links
- [ ] Screen readers announce links properly

### Performance
- [ ] No layout shift from removed backgrounds
- [ ] Page weight reduced without heavy colors
- [ ] Print styles work correctly

## Migration Guide

### Before
```svelte
<div class="bg-blue-50 p-4">
  <button on:click={() => goto(`/drills/${drill.id}`)}>
    {drill.name}
  </button>
</div>
```

### After
```svelte
<div class="section-clean rail-left rail-left-primary">
  <DrillLink {drill}>
    {drill.name}
  </DrillLink>
</div>
```

## Visual Comparison

### Sections
- **Before**: Full blue-50 background
- **After**: White background with blue left rail

### Drill Cards
- **Before**: Click handler navigation
- **After**: Proper anchor tags with href

### Parallel Groups
- **Before**: Heavy tinted sections
- **After**: Clean borders with rail indicators

## Browser Compatibility
- Tested on Chrome, Firefox, Safari, Edge
- Mobile browsers handle tap/click properly
- SEO crawlers can index all drill pages

## Completion Checklist
- [ ] All heavy tints replaced
- [ ] All drill references use anchor tags
- [ ] Audit script run and issues fixed
- [ ] Visual regression tests pass
- [ ] SEO audit shows improvement
- [ ] Accessibility audit passes
</file>

<file path="docs/ui-audit/tickets/012-season-management-and-timeline.md">
# 012 — Season Management & Timeline UX

Status: Proposed

Scope:
- Season timeline (admin view), Sections management, Events/Markers management, Week view entry points, Share settings

Why:
- Current flows are split across separate pages with minimal guidance. Creating/editing sections and markers requires navigation away from the timeline. Error and success feedback are inconsistent. Timeline interactions are not yet inline or discoverable.

Key UX Changes (updated after seeding real data)

1) Consolidate management into one surface
- Replace separate Manage Sections and Manage Events pages with a single Season Settings page using tabs: Overview, Sections, Events, Share.
- Keep the timeline visible at the top with admin controls below, so updates reflect immediately.

2) Inline editing on the timeline
- Sections: draw to create range, drag edges to adjust dates, color picker inline, rename inline.
- Markers: click on a day to add, drag to move, optional multi-day support via resize.
- Immediate optimistic UI update, with toast confirmation and server reconciliation.

3) Clear empty states and onboarding
- Empty season: CTA cards “Add your first Section” and “Add an Event”.
- Short helper text and quick tips.

4) Permissions clarity
- Show “Admin only” badges on mutation actions. Non-admins see read-only labels and disabled controls with hints.

5) Week view integration
- From timeline: right-click / context menu to “Create practice on this date”, “Go to week view here”.
- Week view chips reflect published/draft state; toggle publish inline.

6) Error/feedback consistency
- Replace alerts with toasts and inline error rows. Keep errors anchored next to the form that failed.

7) Accessibility
- Keyboard navigation across days and controls; ARIA roles for timeline grid; focus rings; larger hit areas for dates.

Data/Backend Alignment
- Markers API returns a flat array (GET) and accepts UI shape (name/date) or service shape (title/start_date). Normalize server-side.
- Sections/Markers server loads pass `locals.user.id` for visibility and permissions.

UI Components Needed
- TimelineDay (with badges for practices, published status)
- SectionPill (draggable, resizable)
- MarkerDot/Label (draggable)
- AdminToolbar (mode: select, add section, add marker)
- ShareSettings panel

Milestones
- M1: Merge settings pages; flat markers API; toasts
- M2: Inline create/edit for markers and sections
- M3: Drag/resize interactions and keyboard access
- M4: Context menus and Week view deep links
- M5: Polish and a11y QA

Risks
- Date math edge cases; SSR vs client interactions; permission edge cases on shared links

References

Observed Pain Points (from current screenshots and flow)
- Markers are small colored squares with floating labels; hard to scan and select precisely.
- Section pills extend under month headers; boundaries aren’t clear when overlapping.
- No inline controls for creating/editing sections or markers; separate pages feel disjointed.
- Alerts interrupt the flow (e.g., duplicate practice creation). Prefer inline, contextual messaging.
- Share settings sometimes fail to load; surface retry and status inline with skeletons.
- Recurrence patterns live on another page; discovering and previewing effects from the timeline is hard.

Proposals mapped to issues
- Marker affordance: use larger circular dots with a short text chip; show vertical guide line on hover/focus.
- Section editing: on-hover toolbar for rename, color, and drag handles; prevent overlap with gentle snapping.
- Inline create: click to add marker; drag across days to add a section; ESC to cancel.
- Conflicts: when creating a practice, show a non-blocking toast with “Open existing plan” and “View week” actions.
- Recurrence: add “Add Recurrence” from timeline toolbar; preview in-place as ghost practice chips, with skip markers highlighted.
- Accessibility: enable arrow key navigation across days, Enter to activate, Shift+Arrow to extend range; ARIA grid semantics.

Screenshots to capture (after seeding)
- Timeline with Regular Season and Postseason sections and three markers (provided).
- Week view after generating from a Tue/Thu recurrence.
- Inline marker create popover and section color change.
- Screenshots captured in `docs/ui-audit/playwright/`
</file>

<file path="docs/ui-audit/README.md">
# UI Redesign Implementation Guide

## Overview
This directory contains the complete UI redesign implementation plan for QDrill, consisting of 11 actionable tickets that transform the application's user interface with modern design patterns, improved accessibility, and better performance.

## 📦 Quick Access
- **Full Implementation Bundle**: `ui-redesign-repomix.md` - Contains all tickets and key files in a single document
- **Tickets Directory**: `docs/ui-audit/tickets/` - Individual actionable ticket files

## 🎯 Implementation Order

### Foundation (Complete these first)
1. **[001 - Design Tokens and Theme](tickets/001-design-tokens-and-theme-actionable.md)**
   - CSS variables, typography scale, light/dark theme switching
   - **Required for**: All other tickets

2. **[002 - AppShell and Navigation](tickets/002-appshell-and-navigation-actionable.md)**
   - Application shell, sidebar, topbar, breadcrumbs, mobile nav
   - **Required for**: Navigation consistency across all pages

3. **[003 - Core UI Components](tickets/003-core-ui-components-actionable.md)**
   - Button, Input, Dialog, Card, Tabs, and other UI primitives
   - **Required for**: Tickets 004-011

### Feature Enhancements (Can be done in parallel after foundation)
4. **[004 - Drills Library Revamp](tickets/004-drills-library-revamp-actionable.md)**
   - Enhanced search, filters, grid/list views, virtual scrolling

5. **[005 - Drill Detail Improvements](tickets/005-drill-detail-improvements-actionable.md)**
   - Tabbed interface, related drills, enhanced metadata

6. **[006 - Practice Plan Viewer Revamp](tickets/006-practice-plan-viewer-revamp-actionable.md)**
   - Two-pane layout, scrollspy, drill overlays

7. **[007 - Practice Plan Wizard UX](tickets/007-practice-plan-wizard-ux-actionable.md)**
   - Stepper, validation, autosave functionality

### Polish & Optimization (Can be done anytime after foundation)
8. **[008 - Accessibility and Keyboard](tickets/008-accessibility-and-keyboard-actionable.md)**
   - WCAG AA compliance, focus management, screen reader support

9. **[009 - Performance and Polish](tickets/009-performance-and-polish-actionable.md)**
   - Content visibility, lazy loading, logging system

10. **[010 - Command Palette Enhancement](tickets/010-command-palette-actionable.md)**
    - Full-featured command palette with search providers

11. **[011 - Reduce Tints and Anchor Links](tickets/011-reduce-tints-and-anchor-links-actionable.md)**
    - Visual cleanup, proper link implementation

## 🛠 Required Dependencies

Install these before starting implementation:

```bash
pnpm add @radix-ui/colors mode-watcher sveltekit-superforms
```

Already installed dependencies that will be used:
- `bits-ui` - Headless UI components
- `cmdk-sv` - Command palette
- `lucide-svelte` - Icons
- `zod` - Schema validation
- `@zerodevx/svelte-toast` - Toast notifications

## 📋 Each Ticket Contains

- **Overview** - What the ticket accomplishes
- **Prerequisites** - Dependencies and prior tickets needed
- **File Structure** - New and modified files
- **Implementation Steps** - Complete code examples
- **Testing Checklist** - Verification points
- **Integration Notes** - How it connects with other components

## 🚀 Getting Started

1. **Read the foundation tickets** (001-003) to understand the design system
2. **Install required dependencies** listed above
3. **Start with Ticket 001** to establish the design token system
4. **Follow the implementation order** or work on independent tickets in parallel
5. **Use the testing checklists** to verify each implementation

## 📊 Scope & Impact

- **Total Files**: ~50+ components and utilities
- **Lines of Code**: ~5,000+ new/modified lines
- **Time Estimate**: 2-3 weeks for full implementation
- **Testing Required**: Unit, integration, accessibility, and visual regression tests

## 🎨 Design Principles

1. **Token-Driven Design** - All colors, spacing, and typography use CSS variables
2. **Accessibility First** - WCAG AA compliance, keyboard navigation, screen reader support
3. **Performance Optimized** - Lazy loading, content visibility, virtual scrolling
4. **Mobile Responsive** - All components work on mobile devices
5. **Developer Experience** - Clear code structure, comprehensive logging, TypeScript support

## 📝 Notes

- Each ticket is self-contained with all necessary code
- Reference implementations are complete and copy-paste ready
- Components are reusable across the application
- Follow existing code conventions in the codebase

## 🔍 File Locations

- **Screenshots**: `docs/ui-audit/fast/` and `docs/ui-audit/playwright/`
- **Technical Debt Report**: `docs/ui-audit/technical-debt-findings.md`
- **Original Proposal**: `docs/ui-audit/ui-revamp-proposal.md`
- **Implementation Bundle**: `ui-redesign-repomix.md`

## ✅ Completion Tracking

Use this checklist to track implementation progress:

- [ ] Ticket 001 - Design Tokens and Theme
- [ ] Ticket 002 - AppShell and Navigation  
- [ ] Ticket 003 - Core UI Components
- [ ] Ticket 004 - Drills Library Revamp
- [ ] Ticket 005 - Drill Detail Improvements
- [ ] Ticket 006 - Practice Plan Viewer Revamp
- [ ] Ticket 007 - Practice Plan Wizard UX
- [ ] Ticket 008 - Accessibility and Keyboard
- [ ] Ticket 009 - Performance and Polish
- [ ] Ticket 010 - Command Palette Enhancement
- [ ] Ticket 011 - Reduce Tints and Anchor Links

## 🤝 Contributing

When implementing tickets:
1. Create a feature branch: `feat/ui-revamp-ticket-XXX`
2. Implement the ticket following the provided code
3. Run tests and verify against the checklist
4. Submit PR referencing the ticket number
5. Update this README's completion tracking
</file>

<file path="src/app.css">
/* This file should be empty or contain only app-specific styles not related to drag and drop */
</file>

<file path="package.json">
{
	"name": "sveltekit-2",
	"version": "0.0.1",
	"packageManager": "pnpm@10.11.0+sha512.6540583f41cc5f628eb3d9773ecee802f4f9ef9923cc45b69890fb47991d4b092964694ec3a4f738a420c918a333062c8b925d312f42e4f0c263eb603551f977",
	"scripts": {
		"dev": "vite dev",
		"build": "vite build",
		"preview": "vite preview",
		"check": "svelte-kit sync && svelte-check --tsconfig ./jsconfig.json",
		"check:watch": "svelte-kit sync && svelte-check --tsconfig ./jsconfig.json --watch",
		"test": "(vitest run || true)",
		"test:unit": "vitest",
		"test:unit:run": "vitest run",
		"test:unit:coverage": "vitest run --coverage",
		"lint": "(prettier --check . || true) && (eslint . || true)",
		"format": "prettier --write .",
		"deploy": "vercel --prod",
		"tailwind:build": "tailwindcss build src/routes/styles.css -o public/build/tailwind.css",
		"tailwind:watch": "tailwindcss build src/routes/styles.css -o public/build/tailwind.css --watch",
		"migrate:create": "npx node-pg-migrate create",
		"migrate:up": "dotenv -e .env.local -- npx node-pg-migrate up",
		"migrate:auth:up": "dotenv -e .env.local -- npx @better-auth/cli migrate --config src/lib/auth.js",
		"migrate:down": "dotenv -e .env.local -- npx node-pg-migrate down"
	},
	"devDependencies": {
		"@eslint/eslintrc": "^1.4.0",
		"@eslint/js": "^8.44.0",
		"@fontsource/fira-mono": "^5.1.0",
		"@neoconfetti/svelte": "^2.2.1",
		"@playwright/test": "^1.49.0",
		"@sveltejs/adapter-vercel": "^5.4.8",
		"@sveltejs/kit": "^2.8.4",
		"@tailwindcss/typography": "^0.5.16",
		"@typescript-eslint/parser": "^5.62.0",
		"@vitest/coverage-v8": "2.0.0",
		"autoprefixer": "^10.4.20",
		"bits-ui": "^1.4.6",
		"c8": "^10.1.3",
		"clsx": "^2.1.1",
		"cypress": "^13.16.0",
		"dotenv": "^16.5.0",
		"dotenv-cli": "^8.0.0",
		"eslint": "^8.57.0",
		"eslint-config-prettier": "^8.10.0",
		"eslint-plugin-cypress": "^2.15.1",
		"eslint-plugin-svelte": "^2.34.0",
		"eslint-plugin-vitest-globals": "^1.5.0",
		"node-pg-migrate": "8.0.0-rc.2",
		"pnpm": "^9.14.2",
		"postcss": "^8.4.49",
		"postcss-nesting": "^13.0.1",
		"prettier": "^3.5.3",
		"prettier-plugin-svelte": "^3.3.2",
		"svelte": "^5.2.9",
		"svelte-check": "^4.1.0",
		"tailwind-merge": "^3.2.0",
		"tailwind-variants": "^1.0.0",
		"tailwindcss": "^3.4.15",
		"ts-node": "^10.9.2",
		"typescript": "^5.7.2",
		"vite": "^6.0.0",
		"vitest": "2.0.0",
		"web-vitals": "^4.2.4"
	},
	"dependencies": {
		"@ai-sdk/anthropic": "^1.2.11",
		"@ai-sdk/google-vertex": "^2.2.21",
		"@ai-sdk/openai": "^1.3.22",
		"@anthropic-ai/sdk": "^0.40.1",
		"@dnd-kit/core": "^6.2.0",
		"@excalidraw/excalidraw": "^0.17.6",
		"@mapbox/node-pre-gyp": "^1.0.11",
		"@radix-ui/colors": "^3.0.0",
		"@sentry/sveltekit": "^9",
		"@sveltejs/vite-plugin-svelte": "^5.0.1",
		"@sveltejs/vite-plugin-svelte-inspector": "^4.0.1",
		"@tinymce/tinymce-svelte": "^3.0.0",
		"@types/node": "^22.10.0",
		"@vercel/analytics": "^1.4.1",
		"@vercel/edge-config": "^1.4.0",
		"@vercel/postgres": "^0.10.0",
		"@vercel/speed-insights": "^1.1.0",
		"@zerodevx/svelte-toast": "^0.9.6",
		"ai": "^4.3.15",
		"aws-sdk": "^2.1692.0",
		"better-auth": "^1.2.7",
		"cmdk-sv": "^0.0.19",
		"csv-parse": "^5.6.0",
		"dompurify": "^3.2.5",
		"fabric": "^6.5.1",
		"jsdom": "^26.1.0",
		"knex": "^3.1.0",
		"kysely": "^0.28.0",
		"lodash": "^4.17.21",
		"lodash-es": "^4.17.21",
		"lucide-svelte": "^0.507.0",
		"mock-aws-s3": "^4.0.2",
		"mode-watcher": "^1.1.0",
		"nock": "^13.5.6",
		"papaparse": "^5.5.2",
		"pg": "^8.13.1",
		"react": "^18.3.1",
		"react-dom": "^18.3.1",
		"svelte-dnd-action": "^0.9.52",
		"svelte-feather-icons": "^4.2.0",
		"svelte-forms-lib": "^2.0.1",
		"svelte-range-slider-pips": "^3.1.4",
		"svelte-routing": "^2.13.0",
		"sveltekit-superforms": "^2.27.1",
		"tabbable": "^6.2.0",
		"uuid": "^11.0.3",
		"yup": "^1.4.0",
		"zod": "^3.24.3"
	},
	"type": "module"
}
</file>

<file path="src/routes/+layout.svelte">
<script>
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';
	import { onDestroy } from 'svelte';
	import Header from './Header.svelte';
	import './styles.css';
	import { SvelteToast, toast } from '@zerodevx/svelte-toast';
	import FeedbackButton from '$lib/components/FeedbackButton.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import { inject } from '@vercel/analytics';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { dev } from '$app/environment';
	import { onMount } from 'svelte';
	import { useSession } from '$lib/auth-client';

	inject({ mode: dev ? 'development' : 'production' });
	injectSpeedInsights();

	// Get session using Better Auth
const session = useSession();

let isNavigating = false;
const unsubNavigating = navigating.subscribe((v) => (isNavigating = !!v));
onDestroy(unsubNavigating);

	/** @type {import('./$types').LayoutData} */
	export let data;

	// Function to check and associate entities from sessionStorage
	async function checkAndAssociateEntities(sessionData) {
		if (!browser || !sessionData) return;

		const itemsToAssociate = [
			{ key: 'formationToAssociate', endpoint: '/api/formations' },
			{ key: 'drillToAssociate', endpoint: '/api/drills' },
			{ key: 'practicePlanToAssociate', endpoint: '/api/practice-plans' }
		];

		for (const item of itemsToAssociate) {
			const entityId = sessionStorage.getItem(item.key);
			if (entityId) {
                                try {
                                        console.log(`Found ${item.key} with ID ${entityId}, attempting to associate...`);
                                        await apiFetch(`${item.endpoint}/${entityId}/associate`, { method: 'POST' });
                                        console.log(`${item.key} ${entityId} associated successfully.`);
                                        // Optional: Show success toast
                                        // toast.push(`Successfully claimed your ${item.key.replace('ToAssociate', '')}.`);
                                } catch (error) {
                                        console.error(`Error during association call for ${item.key} ${entityId}:`, error);
                                        // Optional: Show error toast
                                        // toast.push('An error occurred while claiming your item.', { theme: { '--toastBackground': '#F56565', '--toastColor': 'white' } });
                                } finally {
                                        // Remove the item from sessionStorage regardless of success/failure
                                        sessionStorage.removeItem(item.key);
                                        console.log(`Removed ${item.key} from sessionStorage.`);
                                }
			}
		}
	}

	// Check on initial load (in case user was already logged in but association failed before)
	onMount(() => {
		if ($session.data) {
			checkAndAssociateEntities($session.data);
		}
	});

	// Check whenever the session data changes (e.g., after login)
	$: {
		if (browser && $session.data) {
			// Use timeout to ensure session is fully established after redirect
			setTimeout(() => checkAndAssociateEntities($session.data), 100);
		}
	}
</script>

<div class="flex flex-col min-h-screen">
        <a href="#main-content" class="skip-to-content">Skip to main content</a>
        <Header />

	<!-- Global Navigation Loading Indicator -->
       {#if isNavigating}
               <div
                       class="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-pulse"
               >
                       <div class="h-full bg-blue-400 animate-pulse opacity-75"></div>
               </div>
       {/if}

        <main id="main-content" tabindex="-1" class="flex-1">
		<div class="container mx-auto px-4 py-8">
			<ErrorBoundary>
				<slot />
			</ErrorBoundary>
		</div>
	</main>

	<FeedbackButton />

	<SvelteToast />

	{#if $page.url.pathname === '/'}
		<footer class="py-4 bg-gray-100">
			<div class="container mx-auto text-center">
				<a href="/privacy-policy" class="text-blue-500 hover:text-blue-700 mr-4">Privacy Policy</a>
				<a href="/terms-of-service" class="text-blue-500 hover:text-blue-700">Terms of Service</a>
			</div>
		</footer>
	{/if}
</div>

<style>
	.flex {
		display: flex;
	}
	.flex-col {
		flex-direction: column;
	}
	.min-h-screen {
		min-height: 100vh;
	}
	.flex-1 {
		flex: 1;
	}
	main {
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>
</file>

<file path="src/routes/drills/+page.svelte">
<!-- src/routes/drills/+page.svelte -->
<script>
	import FilterPanel from '$lib/components/FilterPanel.svelte';
	import { cart } from '$lib/stores/cartStore';
	import { onMount } from 'svelte';
	import { SvelteToast, toast } from '@zerodevx/svelte-toast';
	import { selectedSortOption, selectedSortOrder } from '$lib/stores/sortStore.js';
	import UpvoteDownvote from '$lib/components/UpvoteDownvote.svelte';
	import { dev } from '$app/environment';
	import { page } from '$app/stores';
	import { goto, invalidate } from '$app/navigation';
import { navigating } from '$app/stores';
import { onDestroy } from 'svelte';
	import { FILTER_STATES } from '$lib/constants';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import SkeletonLoader from '$lib/components/SkeletonLoader.svelte';

	// Import only necessary stores (filter/sort state)
	import {
		currentPage,
		totalPages,
		drillsPerPage,
		searchQuery,
		selectedSkillLevels,
		selectedComplexities,
		selectedSkillsFocusedOn,
		selectedPositionsFocusedOn,
		selectedNumberOfPeopleMin,
		selectedNumberOfPeopleMax,
		selectedSuggestedLengthsMin,
		selectedSuggestedLengthsMax,
		selectedHasVideo,
		selectedHasDiagrams,
		selectedHasImages,
		selectedDrillTypes
	} from '$lib/stores/drillsStore';

	import Pagination from '$lib/components/Pagination.svelte';

export let data;

let isNavigating = false;
const unsubNavigating = navigating.subscribe((v) => (isNavigating = !!v));
onDestroy(unsubNavigating);

	// Filter options from load
	$: filterOptions = data.filterOptions || {};

	// Object to hold temporary button states ('added', 'removed', or null)
	let buttonStates = {};

	// Reactive set of drill IDs currently in the cart
	$: drillsInCart = new Set(($cart || []).map((d) => d.id));

	// Initialize buttonStates based on data.items
	$: {
		if (data && data.items) {
			// Create a new buttonStates object without reading from the existing one
			const newButtonStates = {};
			data.items.forEach(drill => {
				// Check if we already have a temporary state (added/removed)
				const existingState = buttonStates[drill.id];
				if (existingState === 'added' || existingState === 'removed') {
					// Keep temporary states
					newButtonStates[drill.id] = existingState;
				} else {
					// Set state based on cart contents
					newButtonStates[drill.id] = drillsInCart.has(drill.id) ? 'in-cart' : null;
				}
			});
			buttonStates = newButtonStates;
		}
	}

	// Initialize filter stores from URL search params on mount or when URL changes
	$: {
		if ($page.url.searchParams) {
			const params = $page.url.searchParams;

			// Helper to parse comma-separated params into store object
			const parseCommaSeparatedToStore = (paramName, store) => {
				const values =
					params
						.get(paramName)
						?.split(',')
						.map((t) => t.trim())
						.filter((t) => t) || [];
				const newState = {};
				values.forEach((v) => {
					newState[v] = FILTER_STATES.REQUIRED;
				}); // Assume URL values mean REQUIRED
				store.set(newState);
			};

			// Helper to parse simple param into store
			const parseSimpleParamToStore = (
				paramName,
				store,
				defaultValue = null,
				parser = (v) => v
			) => {
				store.set(params.has(paramName) ? parser(params.get(paramName)) : defaultValue);
			};

			const parseBooleanParamToStore = (paramName, store) => {
				const value = params.get(paramName)?.toLowerCase();
				store.set(value === 'true' ? true : value === 'false' ? false : null);
			};

			parseCommaSeparatedToStore('skillLevel', selectedSkillLevels);
			parseCommaSeparatedToStore('complexity', selectedComplexities);
			parseCommaSeparatedToStore('skills', selectedSkillsFocusedOn);
			parseCommaSeparatedToStore('positions', selectedPositionsFocusedOn);
			parseCommaSeparatedToStore('types', selectedDrillTypes);

			parseSimpleParamToStore('minPeople', selectedNumberOfPeopleMin, null, parseInt);
			parseSimpleParamToStore('maxPeople', selectedNumberOfPeopleMax, null, parseInt);
			parseSimpleParamToStore('minLength', selectedSuggestedLengthsMin, null, parseInt);
			parseSimpleParamToStore('maxLength', selectedSuggestedLengthsMax, null, parseInt);
			parseSimpleParamToStore('q', searchQuery, '');

			parseBooleanParamToStore('hasVideo', selectedHasVideo);
			parseBooleanParamToStore('hasDiagrams', selectedHasDiagrams);
			parseBooleanParamToStore('hasImages', selectedHasImages);

			// Initialize sort stores
			selectedSortOption.set(params.get('sort') || 'date_created');
			selectedSortOrder.set(params.get('order') || 'desc');

			// Update pagination stores from data (might be slightly delayed vs URL, but reflects loaded data)
			currentPage.set(data.pagination?.page || 1);
			totalPages.set(data.pagination?.totalPages || 1);
			drillsPerPage.set(parseInt(params.get('limit') || '10'));
		}
	}

	// Functions to navigate pages
	let debounceTimer;
	function debounce(func, delay = 300) {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(func, delay);
	}

	function applyFiltersAndNavigate({ resetPage = false } = {}) {
		const params = new URLSearchParams(); // Start fresh

		// Pagination
		const pageToNavigate = resetPage ? 1 : $page.url.searchParams.get('page') || 1;
		params.set('page', pageToNavigate.toString());
		params.set('limit', $drillsPerPage.toString());

		// Sorting
		if ($selectedSortOption && $selectedSortOption !== 'date_created') {
			// Only add if not default
			params.set('sort', $selectedSortOption);
		}
		if ($selectedSortOrder && $selectedSortOrder !== 'desc') {
			// Only add if not default
			params.set('order', $selectedSortOrder);
		}

		// Filters
		// Helper to set params for comma-separated values from filter store objects
		const updateCommaSeparatedParam = (paramName, storeValue) => {
			const values = Object.entries(storeValue || {})
				.filter(([, state]) => state === FILTER_STATES.REQUIRED) // Only add REQUIRED filters to URL
				.map(([key]) => key);
			if (values.length > 0) {
				params.set(paramName, values.join(','));
			}
		};

		// Helper to set params for simple values (considering default)
		const updateSimpleParam = (paramName, value, defaultValue = undefined) => {
			if (value !== null && value !== undefined && value !== defaultValue) {
				params.set(paramName, value.toString());
			}
		};

		const updateBooleanParam = (paramName, value) => {
			if (value !== null) {
				// Add if true or false, ignore null
				params.set(paramName, value.toString());
			}
		};

		updateCommaSeparatedParam('skillLevel', $selectedSkillLevels);
		updateCommaSeparatedParam('complexity', $selectedComplexities);
		updateCommaSeparatedParam('skills', $selectedSkillsFocusedOn);
		updateCommaSeparatedParam('positions', $selectedPositionsFocusedOn);
		updateCommaSeparatedParam('types', $selectedDrillTypes);

		// Range params – only include if they differ from the defaults
		const defaultMinPeople = filterOptions.numberOfPeopleOptions?.min ?? 0;
		const defaultMaxPeople = filterOptions.numberOfPeopleOptions?.max ?? 100;
		const defaultMinLength = filterOptions.suggestedLengths?.min ?? 0;
		const defaultMaxLength = filterOptions.suggestedLengths?.max ?? 120;

		updateSimpleParam('minPeople', $selectedNumberOfPeopleMin, defaultMinPeople);
		updateSimpleParam('maxPeople', $selectedNumberOfPeopleMax, defaultMaxPeople);
		updateSimpleParam('minLength', $selectedSuggestedLengthsMin, defaultMinLength);
		updateSimpleParam('maxLength', $selectedSuggestedLengthsMax, defaultMaxLength);

		updateBooleanParam('hasVideo', $selectedHasVideo);
		updateBooleanParam('hasDiagrams', $selectedHasDiagrams);
		updateBooleanParam('hasImages', $selectedHasImages);

		// Pass null for searchQuery if it's empty to avoid adding '?q='
		updateSimpleParam('q', $searchQuery === '' ? null : $searchQuery);

		goto(`/drills?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	function handlePageChange(event) {
		const newPage = event.detail.page;
		if (newPage >= 1 && newPage <= (data.pagination?.totalPages || 1)) {
			const params = new URLSearchParams($page.url.searchParams);
			params.set('page', newPage.toString());
			goto(`/drills?${params.toString()}`, { keepFocus: true, noScroll: true });
		}
	}

	function handleSearchInput() {
		debounce(() => applyFiltersAndNavigate({ resetPage: true }));
	}

	function handleSortChange(event) {
		selectedSortOption.set(event.target.value);
		applyFiltersAndNavigate({ resetPage: true });
	}

	function toggleSortOrder() {
		selectedSortOrder.update((order) => (order === 'asc' ? 'desc' : 'asc'));
		applyFiltersAndNavigate({ resetPage: true });
	}

	// Function to handle adding/removing drills from the cart
	async function toggleDrillInCart(drill) {
		const isInCart = drillsInCart.has(drill.id);
		if (isInCart) {
			cart.removeDrill(drill.id);
			buttonStates = { ...buttonStates, [drill.id]: 'removed' };
		} else {
			cart.addDrill(drill);
			buttonStates = { ...buttonStates, [drill.id]: 'added' };
		}
		// No need for second buttonStates = { ...buttonStates };
		setTimeout(() => {
			// Update state based on actual cart status after timeout
			buttonStates = {
				...buttonStates,
				[drill.id]: ($cart || []).some((d) => d.id === drill.id) ? 'in-cart' : null
			};
		}, 500);
	}

	import { slide } from 'svelte/transition';

	let showSortOptions = false;
	let sortOptionsRef;

	onMount(() => {
		const handleClickOutside = (event) => {
			if (sortOptionsRef && !sortOptionsRef.contains(event.target)) {
				showSortOptions = false;
			}
		};
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	function toggleSortOptions(event) {
		event.stopPropagation();
		showSortOptions = !showSortOptions;
	}

	async function deleteDrill(drillId, event) {
		event.stopPropagation();

		if (!confirm('Are you sure you want to delete this drill? This action cannot be undone.')) {
			return;
		}

		try {
			// Use apiFetch for the DELETE request
			await apiFetch(`/api/drills/${drillId}`, {
				method: 'DELETE'
			});

			// apiFetch throws on error, so if we get here, it was successful
			toast.push('Drill deleted successfully', {
				theme: { '--toastBackground': '#48bb78', '--toastColor': '#fff' }
			});

			// Invalidate the data to refresh the list
			invalidate('app:drills'); // Assuming you have a layout load function that depends on this
			// Alternatively, force a page reload or manually remove the item from the UI
			// data.items = data.items.filter(d => d.id !== drillId);
		} catch (error) {
			console.error('Error deleting drill:', error);
			toast.push(`Failed to delete drill: ${error.message}`, {
				theme: { '--toastBackground': '#f56565', '--toastColor': '#fff' }
			});
		}
	}

	// Define sort options for drills
	const sortOptions = [
		{ value: 'date_created', label: 'Date Created' },
		{ value: 'name', label: 'Name' },
		{ value: 'complexity', label: 'Complexity' },
		{ value: 'suggested_length', label: 'Suggested Length' }
	];
</script>

<svelte:head>
	<title>Drills - QDrill</title>
	<meta name="description" content="Browse and manage drills for your practice plans." />
</svelte:head>

<div class="max-w-7xl mx-auto p-4">
	<div class="flex justify-between items-center mb-4">
		<h1 class="text-3xl font-bold">Drills</h1>
		<div class="flex space-x-4">
			<a
				href="/drills/create"
				class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-300"
			>
				Create Drill
			</a>
			<a
				href="/practice-plans/create"
				class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-300"
			>
				Create Practice Plan with {($cart || []).length} Drill{($cart || []).length !== 1 ? 's' : ''}
			</a>
		</div>
	</div>

	<!-- Filter Panel -->
	<FilterPanel
		customClass="mb-6"
		filterType="drills"
		skillLevels={filterOptions.skillLevels}
		complexities={filterOptions.complexities}
		skillsFocusedOn={filterOptions.skillsFocusedOn}
		positionsFocusedOn={filterOptions.positionsFocusedOn}
		numberOfPeopleOptions={filterOptions.numberOfPeopleOptions}
		suggestedLengths={filterOptions.suggestedLengths}
		drillTypes={filterOptions.drillTypes}
		on:filterChange={() => applyFiltersAndNavigate({ resetPage: true })}
	/>

	<!-- Sorting Section and Search Input -->
	<div class="mb-6 flex items-center space-x-4">
		<div class="relative">
			<button
				class="px-4 py-2 bg-gray-100 rounded-lg shadow-sm hover:bg-gray-200 transition-colors duration-300 flex items-center"
				on:click={toggleSortOptions}
			>
				<span class="font-semibold mr-2">Sort</span>
				<span class="transform transition-transform duration-300" class:rotate-180={showSortOptions}
					>▼</span
				>
			</button>
			{#if showSortOptions}
				<div
					bind:this={sortOptionsRef}
					transition:slide={{ duration: 300 }}
					class="absolute left-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm z-10"
				>
					<div class="flex flex-col space-y-2">
						<select
							class="p-2 border border-gray-300 rounded-md bg-white"
							on:change={handleSortChange}
							value={$selectedSortOption}
							data-testid="sort-select"
						>
							{#each sortOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						<button
							class="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors duration-300"
							on:click={toggleSortOrder}
							data-testid="sort-order-toggle"
						>
							{$selectedSortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
						</button>
					</div>
				</div>
			{/if}
		</div>

		<input
			type="text"
			placeholder="Search drills..."
			class="flex-grow p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
			bind:value={$searchQuery}
			on:input={handleSearchInput}
			aria-label="Search drills"
			data-testid="search-input"
		/>
	</div>

	<!-- Loading and Empty States -->
       {#if isNavigating && !data.items}
		<!-- Skeleton loaders for drills -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each Array(6) as _, i}
				<SkeletonLoader 
					lines={4} 
					showCard={true}
					showButton={true}
					className="h-64"
				/>
			{/each}
		</div>
	{:else if !data.items || data.items.length === 0}
		<p class="text-center text-gray-500 py-10">No drills match your criteria.</p>
	{:else}
		<!-- Drills Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.items as drill (drill.id)}
				<div
					class="border border-gray-200 bg-white rounded-lg shadow-md transition-transform transform hover:-translate-y-1 hover:shadow-lg flex flex-col"
					data-testid="drill-card"
				>
					<div class="p-6 flex flex-col h-full relative">
						<!-- Top-right actions: Vote and Delete -->
						<div class="absolute top-2 right-2 flex items-start space-x-2">
							<!-- Vote component -->
							<UpvoteDownvote drillId={drill.id} />

							<!-- Conditional Delete Button -->
							{#if dev || drill.created_by === $page.data.session?.user?.id}
								<button
									on:click={(e) => deleteDrill(drill.id, e)}
									class="text-gray-500 hover:text-red-500 transition-colors duration-300 p-1 rounded-full hover:bg-gray-100"
									title="Delete drill"
									aria-label="Delete drill"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							{/if}
						</div>

						<!-- Variation badges (moved slightly to avoid overlap if actions are wide) -->
						{#if drill.variation_count > 0}
							<div class="absolute top-2 left-2">
								<span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
									{drill.variation_count} variation{drill.variation_count !== 1 ? 's' : ''}
								</span>
							</div>
						{:else if drill.parent_drill_id}
							<div class="absolute top-2 left-2">
								<span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
									Variant
								</span>
							</div>
						{/if}

						<!-- Main content area -->
						<div class="flex-grow mb-4">
							<!-- Title and description -->
							<div class="flex justify-between items-start mb-4">
								<div class="flex-grow mr-16 min-w-0">
									<!-- Added mr-16 to give space for top-right actions -->
									<h2
										class="text-xl font-bold text-gray-800 overflow-hidden"
										data-testid="drill-card-name"
									>
										<a
											href="/drills/{drill.id}"
											class="hover:text-blue-600 block overflow-hidden truncate"
											title={drill.name}
										>
											{drill.name}
										</a>
									</h2>
									<div class="prose prose-sm mt-2 text-gray-600 max-h-24 overflow-hidden">
										{@html drill.brief_description}
									</div>
								</div>
							</div>

							<!-- Drill details -->
							{#if drill.skill_level && drill.skill_level.length > 0}
								<p class="text-sm text-gray-500 mt-2">
									<span class="font-medium">Skill:</span>
									{drill.skill_level.join(', ')}
								</p>
							{/if}
							{#if drill.complexity}
								<p class="text-sm text-gray-500 mt-1">
									<span class="font-medium">Complexity:</span>
									{drill.complexity}
								</p>
							{/if}
							{#if drill.suggested_length_min !== null && drill.suggested_length_min !== undefined}
								<p class="text-sm text-gray-500 mt-1" data-testid="drill-card-duration">
									<span class="font-medium">Duration:</span>
									{#if drill.suggested_length_max !== null && drill.suggested_length_max !== undefined && drill.suggested_length_max > drill.suggested_length_min}
										{drill.suggested_length_min} - {drill.suggested_length_max} mins
									{:else}
										{drill.suggested_length_min} mins
									{/if}
								</p>
							{/if}
							{#if drill.number_of_people_min !== undefined && drill.number_of_people_min !== null}
								<p class="text-sm text-gray-500 mt-1">
									<span class="font-medium">People:</span>
									{drill.number_of_people_min}
									{#if drill.number_of_people_max && drill.number_of_people_max !== drill.number_of_people_min}
										- {drill.number_of_people_max}
									{:else if !drill.number_of_people_max}
										+
									{/if}
								</p>
							{/if}
						</div>

						<!-- Add to Practice Plan button -->
						<div class="mt-auto">
							<button
								class="w-full py-2 px-4 rounded-md font-semibold text-white transition-colors duration-300"
								class:bg-green-500={buttonStates[drill.id] === 'added'}
								class:hover:bg-green-600={buttonStates[drill.id] === 'added'}
								class:bg-red-500={buttonStates[drill.id] === 'removed' ||
									buttonStates[drill.id] === 'in-cart'}
								class:hover:bg-red-600={buttonStates[drill.id] === 'removed' ||
									buttonStates[drill.id] === 'in-cart'}
								class:bg-blue-500={!drillsInCart.has(drill.id) &&
									buttonStates[drill.id] !== 'added' &&
									buttonStates[drill.id] !== 'removed' &&
									buttonStates[drill.id] !== 'in-cart'}
								class:hover:bg-blue-600={!drillsInCart.has(drill.id) &&
									buttonStates[drill.id] !== 'added' &&
									buttonStates[drill.id] !== 'removed' &&
									buttonStates[drill.id] !== 'in-cart'}
								on:click|stopPropagation={() => toggleDrillInCart(drill)}
							>
								{#if buttonStates[drill.id] === 'added'}
									Added
								{:else if buttonStates[drill.id] === 'removed'}
									Removed
								{:else if buttonStates[drill.id] === 'in-cart'}
									Remove from Plan
								{:else}
									Add to Plan
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination Controls -->
		{#if data.pagination && data.pagination.totalPages > 1}
			<Pagination
				currentPage={data.pagination.page}
				totalPages={data.pagination.totalPages}
				on:pageChange={handlePageChange}
			/>
		{/if}
	{/if}
</div>
<!-- Toast Notifications -->
<SvelteToast />
</file>

</files>
