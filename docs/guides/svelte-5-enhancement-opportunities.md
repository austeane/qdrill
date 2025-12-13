# Svelte 5 Enhancement Opportunities

This document catalogs opportunities to leverage new Svelte 5 features for cleaner code, better performance, or new capabilities. These are not bugs or legacy code issues—the codebase is already fully migrated to Svelte 5 runes. These are **optional enhancements** that could improve the codebase.

---

## 1. `createSubscriber` for IntersectionObserver

**Files:**
- `src/routes/practice-plans/[id]/+page.svelte:45-70`
- `src/routes/teams/[slug=slug]/plans/[id]/+page.svelte`

**Current Pattern:**
```javascript
$effect(() => {
  filteredSections; // dependency

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          currentSectionId = entry.target.getAttribute('data-section-id');
        }
      });
    },
    { rootMargin: '-50px 0px -50px 0px', threshold: 0.1 }
  );

  document.querySelectorAll('[data-section-id]').forEach((section) => {
    observer.observe(section);
  });

  return () => observer.disconnect();
});
```

**Enhancement with `createSubscriber`:**

Create a reusable reactive observer utility in `src/lib/utils/observers.svelte.js`:

```javascript
import { createSubscriber } from 'svelte/reactivity';

/**
 * Reactive IntersectionObserver that only runs when the getter is accessed.
 * Automatically cleans up when no longer observed.
 */
export class SectionObserver {
  #subscribe;
  #currentId = $state(null);
  #options;

  constructor(selector = '[data-section-id]', options = {}) {
    this.#options = {
      rootMargin: '-50px 0px -50px 0px',
      threshold: 0.1,
      ...options
    };

    this.#subscribe = createSubscriber((update) => {
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.#currentId = entry.target.dataset.sectionId;
            update();
          }
        }
      }, this.#options);

      document.querySelectorAll(selector).forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    });
  }

  get currentSectionId() {
    this.#subscribe();
    return this.#currentId;
  }
}
```

**Usage in component:**
```javascript
const sectionObserver = new SectionObserver();
// Reactively get the current section - observer only active when accessed
const currentSectionId = $derived(sectionObserver.currentSectionId);
```

**Benefits:**
- Reusable across multiple components
- Lazy activation (observer only runs when getter is accessed)
- Cleaner component code
- Automatic cleanup handled by Svelte

---

## 2. `createSubscriber` for matchMedia (Theme Store)

**File:** `src/lib/stores/themeStore.svelte.ts:55-62`

**Current Pattern:**
```typescript
init() {
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
```

**Enhancement with `createSubscriber`:**

Create a reusable MediaQuery utility in `src/lib/utils/mediaQuery.svelte.js`:

```javascript
import { createSubscriber } from 'svelte/reactivity';
import { on } from 'svelte/events';
import { browser } from '$app/environment';

/**
 * Reactive media query that lazily subscribes to changes.
 */
export class MediaQuery {
  #mq;
  #subscribe;

  constructor(query) {
    if (!browser) {
      // SSR fallback
      this.#mq = { matches: false };
      this.#subscribe = () => {};
      return;
    }

    this.#mq = window.matchMedia(`(${query})`);
    this.#subscribe = createSubscriber((update) => on(this.#mq, 'change', update));
  }

  get matches() {
    this.#subscribe();
    return this.#mq.matches;
  }
}

// Pre-built queries
export const prefersDark = new MediaQuery('prefers-color-scheme: dark');
export const prefersReducedMotion = new MediaQuery('prefers-reduced-motion: reduce');
export const isMobile = new MediaQuery('max-width: 768px');
```

**Refactored themeStore:**
```typescript
import { MediaQuery } from '$lib/utils/mediaQuery.svelte.js';

class ThemeStore {
  value = $state<Theme>(readStoredTheme());
  #prefersDark = new MediaQuery('prefers-color-scheme: dark');

  get rendered(): 'light' | 'dark' {
    if (this.value === 'system') {
      return this.#prefersDark.matches ? 'dark' : 'light';
    }
    return this.value;
  }

  // ... rest of implementation
}
```

**Benefits:**
- No manual cleanup needed
- Lazy subscription (only listens when accessed)
- Reusable for other media queries (mobile detection, reduced motion, etc.)
- Cleaner, more declarative code

---

## 3. `$state.raw` for Large Immutable Data

**File:** `src/lib/stores/sectionsStore.svelte.js:85`

**Current Pattern:**
```javascript
export const sections = $state(DEFAULT_SECTIONS);

function replaceSections(nextSections) {
  sections.splice(0, sections.length, ...nextSections);
}
```

**Consideration:**

The `sections` array is often replaced wholesale via `replaceSections()`. If you consistently replace rather than mutate, `$state.raw` avoids the overhead of deep proxying:

```javascript
// Only use if you NEVER mutate items in place
let sectionsRaw = $state.raw(DEFAULT_SECTIONS);

function replaceSections(nextSections) {
  sectionsRaw = nextSections; // Simple reassignment
}

// Export a getter for external access
export function getSections() {
  return sectionsRaw;
}
```

**When to use `$state.raw`:**
- Large arrays (100+ items) that are always replaced
- Objects from API responses that are treated as immutable
- Data that's never mutated with `.push()`, `[i].prop = x`, etc.

**When NOT to use:**
- When you use direct mutations like `sections[0].name = 'New Name'`
- When nested reactivity is needed

**Current Assessment:**

Looking at `sectionsStore.svelte.js`, there ARE direct mutations in some places (e.g., `section.items.push(breakItem)`), so `$state.raw` would require refactoring those patterns to always create new objects. This is a **medium effort** change that should be evaluated for performance benefit first.

---

## 4. `<svelte:boundary>` for Error Handling

**File:** `src/lib/components/ErrorBoundary.svelte`

**Current Pattern:**
```javascript
onMount(() => {
  const handleError = (event) => {
    hasError = true;
    error = event.error || event.reason || new Error('Unknown error');
    // ...
    event.preventDefault();
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleError);

  return () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleError);
  };
});
```

**Enhancement with `<svelte:boundary>`:**

Svelte 5's native error boundary catches errors during **render and effects**:

```svelte
<script>
  let { children, fallback, onError } = $props();
</script>

<svelte:boundary onerror={(error, reset) => {
  console.error('Boundary caught:', error);
  onError?.(error, { reset });
}}>
  {@render children?.()}

  {#snippet failed(error, reset)}
    {#if fallback}
      {@render fallback({ error, reset })}
    {:else}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-red-800">Something went wrong</h3>
            <p class="text-sm text-red-700 mt-1">
              An error occurred while loading this component.
            </p>
          </div>
        </div>
        <div class="mt-4">
          <button
            onclick={reset}
            class="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    {/if}
  {/snippet}
</svelte:boundary>
```

**Important Notes:**
- `<svelte:boundary>` catches errors during **render** and **effects**
- It does **NOT** catch errors from event handlers, timers, or async operations
- Keep the global `window.addEventListener` approach for those cases
- Consider using both: `<svelte:boundary>` for component tree errors, global handlers for async errors

**Recommended Approach:**
Create two components:
1. `RenderBoundary.svelte` - Uses `<svelte:boundary>` for render/effect errors
2. `GlobalErrorHandler.svelte` - Uses window listeners for async errors

---

## 5. `SvelteSet` / `SvelteMap` for Reactive Collections

**Files with opportunities:**
- `src/lib/components/practice-plan/modals/TimelineSelectorModal.svelte:4`
- `src/lib/components/practice-plan/PositionFilter.svelte:13`
- `src/routes/drills/+page.svelte:43`

**Current Pattern (TimelineSelectorModal):**
```javascript
let {
  selectedTimelines = new Set(), // Regular Set passed as prop
  // ...
} = $props();

function toggleTimelineSelection(timeline, checked) {
  if (checked) selectedTimelines.add(timeline);
  else selectedTimelines.delete(timeline);
}
```

**Issue:**
When `selectedTimelines.add()` or `.delete()` is called on a regular `Set`, Svelte can't detect the mutation. The parent component won't see updates.

**Solution:**
Parent should pass a `SvelteSet`:

```javascript
// In parent component:
import { SvelteSet } from 'svelte/reactivity';

const selectedTimelines = new SvelteSet(['BEATERS', 'CHASERS']);

// Pass to child:
<TimelineSelectorModal {selectedTimelines} ... />
```

**Files already using SvelteSet correctly:**
- `src/lib/stores/sectionsStore.svelte.js:86` - `selectedTimelines`
- `src/lib/components/practice-plan/modals/EnhancedAddItemModal.svelte:35` - `selectedPositions`

**When to use SvelteSet/SvelteMap:**
- When you need to mutate a Set/Map AND have UI react to changes
- When passing collections as props that will be mutated by children

**When regular Set/Map is fine:**
- Inside `$derived` computations (computed fresh each time)
- For temporary/local calculations that don't need reactivity

---

## 6. `$props.id()` for Accessible Components

**Already implemented in:**
- `src/lib/components/ui/Input.svelte`
- `src/lib/components/ui/Select.svelte`
- `src/lib/components/ui/Textarea.svelte`

**Pattern:**
```javascript
let { id = '', ... } = $props();
const baseId = $props.id();
const uid = $derived(id || `input-${baseId}`);
```

**Additional candidates:**
- Modal/Dialog components (for `aria-labelledby`)
- Accordion items
- Tab panels
- Tooltip triggers

**Example for Dialog:**
```svelte
<script>
  let { title, children } = $props();
  const baseId = $props.id();
  const titleId = $derived(`dialog-title-${baseId}`);
</script>

<div role="dialog" aria-labelledby={titleId}>
  <h2 id={titleId}>{title}</h2>
  {@render children?.()}
</div>
```

---

## 7. Attachments (`{@attach}`) for Reusable Behaviors

**Potential use case:** Tooltip behavior that flows through spread props.

**Current approach with `use:` actions:**
```svelte
<button use:tooltip={'Click me'}>Hover</button>
```

**Enhancement with attachments:**
```javascript
// src/lib/attachments/tooltip.svelte.js
import { fromAction } from 'svelte/attachments';
import { tippy } from 'tippy.js';

export const tooltip = fromAction((node, content) => {
  const instance = tippy(node, { content });
  return {
    update(newContent) { instance.setContent(newContent); },
    destroy() { instance.destroy(); }
  };
});
```

**Usage:**
```svelte
<Button {@attach tooltip('Click me')}>Hover</Button>
```

**Benefit:**
Attachments can flow through component prop spreading, unlike `use:` directives which only work on native elements.

---

## 8. Extract Reusable Window Event Listener Utility

**Files with repeated pattern:**
- `src/lib/components/CommandPalette.svelte:52-55`
- `src/lib/components/AppShell.svelte:21-24`
- `src/lib/stores/deviceStore.svelte.js:87-94`
- `src/lib/components/ui/BottomSheet.svelte:141-154`
- `src/lib/utils/actions/practicePlanAuthHandler.js:36-39`

**Current Pattern (repeated everywhere):**
```javascript
onMount(() => {
  const handler = (e) => { /* ... */ };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
});
```

**Enhancement:**

Create `src/lib/utils/windowEvents.svelte.js`:

```javascript
import { browser } from '$app/environment';

/**
 * Reactive window event subscription with automatic cleanup.
 * Use inside a component's script block.
 */
export function onWindowEvent(event, handler, options = {}) {
  $effect(() => {
    if (!browser) return;
    window.addEventListener(event, handler, options);
    return () => window.removeEventListener(event, handler, options);
  });
}

/**
 * Reactive document event subscription.
 */
export function onDocumentEvent(event, handler, options = {}) {
  $effect(() => {
    if (!browser) return;
    document.addEventListener(event, handler, options);
    return () => document.removeEventListener(event, handler, options);
  });
}
```

**Usage:**
```javascript
import { onWindowEvent } from '$lib/utils/windowEvents.svelte.js';

// In component:
onWindowEvent('keydown', (e) => {
  if (e.key === 'Escape') close();
});
```

**Benefits:**
- Eliminates repeated boilerplate
- Automatic SSR safety
- Consistent cleanup handling

---

## 9. Loading State Store Modernization

**File:** `src/lib/utils/loadingStates.js:6-50`

**Current Pattern:**
```javascript
export function createLoadingState(initialState = false) {
  let state = initialState;
  const subscribers = new Set();

  return {
    subscribe(fn) {
      subscribers.add(fn);
      fn(state);
      return () => subscribers.delete(fn);
    },
    set(value) {
      state = value;
      subscribers.forEach(fn => fn(state));
    }
  };
}
```

**Enhancement:**

Convert to class-based runes store:

```javascript
// src/lib/utils/loadingStates.svelte.js
export class LoadingState {
  #loading = $state(false);
  #error = $state(null);

  get loading() { return this.#loading; }
  get error() { return this.#error; }

  start() {
    this.#loading = true;
    this.#error = null;
  }

  finish() {
    this.#loading = false;
  }

  fail(error) {
    this.#loading = false;
    this.#error = error;
  }

  async wrap(asyncFn) {
    this.start();
    try {
      const result = await asyncFn();
      this.finish();
      return result;
    } catch (e) {
      this.fail(e);
      throw e;
    }
  }
}
```

**Benefits:**
- No manual subscription management
- Cleaner API
- Built-in error state handling

---

## 10. Additional `SvelteSet`/`SvelteMap` Opportunities

**Files found using regular Set/Map that could benefit:**

| File | Line | Current | Issue |
|------|------|---------|-------|
| `src/lib/stores/sectionsStore.svelte.js` | 286 | `new Set()` | Local, but mutated |
| `src/lib/stores/sectionsStore.svelte.js` | 316 | `new Map()` | Local computation |
| `src/lib/stores/sectionsStore.svelte.js` | 365 | `new Set()` | Collecting timelines |
| `src/lib/utils/loadingStates.js` | 8 | `new Set()` | Subscriber tracking |
| `src/lib/utils/imageUtils.js` | 4 | `new Set()` | Cache tracking |
| `src/lib/components/season/SeasonTimelineViewer.svelte` | 158, 168 | `new Map()` | Computed data |

**Assessment:**
- Lines inside `$derived` or pure functions: Regular Set/Map is fine (computed fresh)
- Lines where collection is mutated and UI should react: Use SvelteSet/SvelteMap
- Subscriber sets in stores: Could modernize with runes instead

---

## 11. Async Data Loading Patterns

**Files with manual async-in-effect pattern:**
- `src/lib/components/Comments.svelte:11-38`
- `src/lib/components/UpvoteDownvote.svelte:20-23`
- `src/lib/components/season/SeasonTimelineViewer.svelte:184-196`

**Current Pattern:**
```javascript
$effect(() => {
  let cancelled = false;

  (async () => {
    const data = await fetch('/api/...');
    if (!cancelled) {
      result = data;
    }
  })();

  return () => { cancelled = true; };
});
```

**Potential Enhancement (when Svelte 5 async mode is stable):**

Check `svelte.config.js` for `compilerOptions.async: true`, then:

```svelte
<script>
  let { id } = $props();

  // Top-level await in async mode
  const comments = await loadComments(id);
</script>
```

**Note:** This requires async component support. Check Svelte 5 docs for current status.

---

## 12. Drag Manager Class Consolidation

**File:** `src/lib/stores/dragManager.svelte.js:52-60`

**Current Pattern:**
```javascript
const INITIAL_DRAG_STATE = {
  isDragging: false,
  dragType: null,
  sourceSection: null,
  // ... 20+ properties
};

export const dragState = $state({ ...INITIAL_DRAG_STATE });

export function startDrag(type, data) {
  dragState.isDragging = true;
  dragState.dragType = type;
  // ...
}
```

**Enhancement:**

Convert to class for better encapsulation:

```javascript
class DragManager {
  // State
  isDragging = $state(false);
  dragType = $state(null);
  sourceSection = $state(null);
  sourceItem = $state(null);
  // ... other state

  // Derived
  canDrop = $derived(this.isDragging && this.dropTarget !== null);

  // Methods
  startDrag(type, source) {
    this.isDragging = true;
    this.dragType = type;
    this.sourceSection = source.section;
    this.sourceItem = source.item;
  }

  endDrag() {
    this.isDragging = false;
    this.dragType = null;
    // ... reset all
  }
}

export const dragManager = new DragManager();
```

**Benefits:**
- Better TypeScript support
- Methods co-located with state
- Easier to test

---

## Summary

| Enhancement | Priority | Effort | Benefit |
|-------------|----------|--------|---------|
| `SvelteSet` for mutated props | High | Low | Fix reactivity |
| Extract window event utility | High | Low | Remove duplication |
| `createSubscriber` for IntersectionObserver | Medium | Medium | Reusable pattern |
| `createSubscriber` for matchMedia | Medium | Low | Cleaner theme store |
| `<svelte:boundary>` for errors | Medium | Medium | Better error UX |
| Loading state modernization | Medium | Low | Cleaner API |
| `$state.raw` for sections | Low | High | Performance (needs profiling) |
| Drag manager class | Low | Medium | Better organization |
| `$props.id()` expansion | Low | Low | Better accessibility |
| Attachments for actions | Low | Medium | Composability |

---

## Quick Reference: When to Use What

### Use `SvelteSet`/`SvelteMap` when:
- A Set/Map is stored in `$state` and mutated with `.add()/.delete()/.set()`
- A Set/Map is passed as a prop and mutated by children
- UI needs to react to collection changes

### Use regular `Set`/`Map` when:
- Inside `$derived` (recomputed each time anyway)
- For temporary local calculations
- When you replace the whole collection (not mutate)

### Use `$state.raw` when:
- Large arrays/objects (100+ items)
- Always replaced, never mutated in place
- Performance profiling shows deep proxy overhead

### Use `createSubscriber` when:
- Wrapping browser APIs (IntersectionObserver, matchMedia, WebSocket)
- You want lazy activation (only subscribe when value is read)
- Building reusable reactive utilities

### Use `<svelte:boundary>` when:
- Catching render-time errors in a component subtree
- Providing localized error UI
- Wrapping third-party components that might throw

---

## Next Steps

1. **Quick wins (this week):**
   - Extract `onWindowEvent` utility to eliminate duplication
   - Ensure mutated Set/Map props use `SvelteSet`/`SvelteMap`

2. **Medium term:**
   - Create `createSubscriber` utilities for observers and media queries
   - Modernize `loadingStates.js` to use runes

3. **Evaluate (profile first):**
   - `$state.raw` for sections store
   - Drag manager class consolidation

4. **Future consideration:**
   - `<svelte:boundary>` hybrid approach
   - Async component patterns when stable
