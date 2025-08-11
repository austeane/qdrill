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