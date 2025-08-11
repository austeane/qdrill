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