# Ticket: Svelte 5 Runes Migration

Owner: TBD
Priority: P2 (medium urgency — blocking E2E test reliability and future maintainability)
Target branch: `main` (feature branch for incremental migration)
Related: bits-ui removal (completed), Svelte 5 upgrade (completed but running in legacy mode)

---

## 0. Problem Statement

QDrill upgraded to Svelte 5.45.10 but runs with `runes: false` in `svelte.config.js` to maintain Svelte 4-style implicit reactivity. This causes:

1. **E2E Test Failures**: 6 of 21 Playwright tests fail because client-side state updates don't trigger re-renders reliably in fresh browser contexts (tabs, dialogs, theme toggle, mobile menu, command palette)

2. **Library Incompatibility**: bits-ui 2.x required runes and had to be replaced with custom implementations. Future UI libraries will increasingly require runes mode.

3. **Mixed Paradigms**: The codebase mixes Svelte 4 patterns (`let`, `$:`, `export let`, `createEventDispatcher`) with Svelte 5 runtime, creating unpredictable behavior.

4. **Technical Debt**: Running in legacy compatibility mode is unsupported long-term and blocks access to Svelte 5 performance benefits and new features.

---

## 1. Goal / Non-Goals

### Goals

- Enable `runes: true` in svelte.config.js (remove legacy mode)
- Migrate all components to Svelte 5 runes syntax
- Restore full E2E test reliability
- Enable use of modern Svelte 5 UI libraries (bits-ui 2.x, melt-ui, etc.)
- Improve TypeScript type inference with explicit props

### Non-Goals

- No feature changes or UI redesign
- No new component library adoption (just enable compatibility)
- No SvelteKit upgrade (already on 2.x)

---

## 2. Current Architecture

### Compiler Configuration

```javascript
// svelte.config.js (current)
compilerOptions: {
  runes: false,  // Legacy mode — problem source
  compatibility: {
    componentApi: 4
  }
}
```

### Component Patterns in Use

| Pattern | Count | Svelte 5 Replacement |
|---------|-------|---------------------|
| `let x = value` (reactive) | ~500+ | `let x = $state(value)` |
| `$: derived = expr` | ~100+ | `const derived = $derived(expr)` |
| `$: { sideEffect }` | ~50+ | `$effect(() => { sideEffect })` |
| `export let prop` | ~200+ | `let { prop } = $props()` |
| `on:click={handler}` | ~300+ | `onclick={handler}` |
| `createEventDispatcher()` | ~30+ | Callback props |
| `<slot />` / `<slot name="x">` | ~50+ | `{@render children()}` / snippet props |

### Affected E2E Tests (Current Failures)

| Test | Issue |
|------|-------|
| Button interactions | `data-loading` state not updating |
| Tab switching | `aria-selected` not changing, content not switching |
| Dialog opening | Dialog not appearing after button click |
| Theme toggle | `data-theme` not changing on first click |
| Mobile menu | Sidebar not getting `open` class |
| Command palette | Not opening on keyboard shortcut |

### Store Files Requiring Migration

```
src/lib/stores/
├── cartStore.js           # Uses writable(), needs $state class
├── dragManager.js         # Complex state machine
├── filterStore.js         # Derived stores
├── practicePlanStore.js   # Large store with methods
├── themeStore.ts          # Already partially migrated
├── sectionStore.js        # Writable with custom methods
└── wizardStore.js         # Multi-step form state
```

---

## 3. Migration Strategy

### 3.1 Rune Syntax Reference

**State Declaration:**
```svelte
<!-- Before (Svelte 4) -->
<script>
  let count = 0;
  let items = [];
</script>

<!-- After (Svelte 5) -->
<script>
  let count = $state(0);
  let items = $state([]);
</script>
```

**Derived Values:**
```svelte
<!-- Before -->
$: doubled = count * 2;
$: filtered = items.filter(i => i.active);

<!-- After -->
const doubled = $derived(count * 2);
const filtered = $derived(items.filter(i => i.active));
```

**Complex Derivations:**
```svelte
<!-- Before -->
$: {
  if (count > 10) {
    result = 'high';
  } else {
    result = 'low';
  }
}

<!-- After -->
const result = $derived.by(() => {
  if (count > 10) return 'high';
  return 'low';
});
```

**Side Effects:**
```svelte
<!-- Before -->
$: if (count) {
  console.log('Count changed:', count);
  localStorage.setItem('count', count);
}

<!-- After -->
$effect(() => {
  console.log('Count changed:', count);
  localStorage.setItem('count', count);
});
```

**Props:**
```svelte
<!-- Before -->
<script>
  export let name;
  export let count = 0;
  export let items = [];
</script>

<!-- After -->
<script>
  let { name, count = 0, items = [] } = $props();
</script>
```

**Bindable Props:**
```svelte
<!-- Before -->
<script>
  export let value;  // Used with bind:value
</script>

<!-- After -->
<script>
  let { value = $bindable() } = $props();
</script>
```

**Event Handlers:**
```svelte
<!-- Before -->
<button on:click={handleClick}>Click</button>
<button on:click|preventDefault={handleSubmit}>Submit</button>
<input on:input={handleInput} on:focus={handleFocus} />

<!-- After -->
<button onclick={handleClick}>Click</button>
<button onclick={(e) => { e.preventDefault(); handleSubmit(e); }}>Submit</button>
<input oninput={handleInput} onfocus={handleFocus} />
```

**Component Events → Callback Props:**
```svelte
<!-- Before (Child.svelte) -->
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function handleSave() {
    dispatch('save', { data: formData });
  }
</script>

<!-- After (Child.svelte) -->
<script>
  let { onSave } = $props();

  function handleSave() {
    onSave?.({ data: formData });
  }
</script>

<!-- Parent usage changes from on:save to onsave or onSave -->
<Child onSave={(data) => console.log(data)} />
```

**Slots → Snippets:**
```svelte
<!-- Before -->
<Card>
  <h2 slot="header">Title</h2>
  <p>Content</p>
  <button slot="footer">Action</button>
</Card>

<!-- Card.svelte (before) -->
<div class="card">
  <slot name="header" />
  <slot />
  <slot name="footer" />
</div>

<!-- After -->
<Card header={headerSnippet} footer={footerSnippet}>
  <p>Content</p>
</Card>

{#snippet headerSnippet()}
  <h2>Title</h2>
{/snippet}

{#snippet footerSnippet()}
  <button>Action</button>
{/snippet}

<!-- Card.svelte (after) -->
<script>
  let { header, children, footer } = $props();
</script>

<div class="card">
  {@render header?.()}
  {@render children?.()}
  {@render footer?.()}
</div>
```

### 3.2 Store Migration Pattern

```javascript
// Before: src/lib/stores/cartStore.js
import { writable, derived } from 'svelte/store';

function createCartStore() {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    addItem: (item) => update(items => [...items, item]),
    removeItem: (id) => update(items => items.filter(i => i.id !== id)),
    clear: () => set([])
  };
}

export const cart = createCartStore();
export const cartTotal = derived(cart, $cart =>
  $cart.reduce((sum, item) => sum + item.price, 0)
);

// After: src/lib/stores/cartStore.svelte.js (note .svelte.js extension!)
class CartStore {
  items = $state([]);

  get total() {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }

  addItem(item) {
    this.items.push(item);  // Direct mutation works with $state
  }

  removeItem(id) {
    this.items = this.items.filter(i => i.id !== id);
  }

  clear() {
    this.items = [];
  }
}

export const cart = new CartStore();
```

---

## 4. Migration Plan

### PR0 — Preparation & Baseline

**Objective**: Establish migration baseline and tooling

Tasks:
1. Run automated migration analysis:
   ```bash
   npx sv migrate svelte-5 --dry-run
   ```
2. Document component count by pattern:
   ```bash
   rg "export let" src --type svelte -c
   rg "on:" src --type svelte -c
   rg "\$:" src --type svelte -c
   rg "createEventDispatcher" src -c
   rg "<slot" src --type svelte -c
   ```
3. Create baseline E2E test results
4. Identify highest-impact components (most state, most events)

Exit criteria:
- Component inventory complete
- Migration order prioritized
- Baseline metrics captured

### PR1 — Store Migration

**Objective**: Convert Svelte stores to runes-based classes

Priority order (by complexity and dependencies):
1. `themeStore.ts` — Already partially done, small
2. `cartStore.js` — Simple, few dependents
3. `filterStore.js` — Medium complexity
4. `sectionStore.js` — Medium complexity
5. `wizardStore.js` — Complex multi-step state
6. `practicePlanStore.js` — Large, many dependents
7. `dragManager.js` — Complex state machine (hardest)

Tasks per store:
1. Rename to `.svelte.js` or `.svelte.ts`
2. Convert to class with `$state` properties
3. Replace `derived()` with getters or `$derived`
4. Update all importing components to remove `$` prefix
5. Test functionality

Exit criteria:
- All stores converted to runes
- No `writable()` or `derived()` imports from 'svelte/store'
- Unit tests passing

### PR2 — Core UI Components

**Objective**: Migrate shared components in `src/lib/components/ui/`

Components (alphabetical):
- Badge.svelte
- BottomSheet.svelte
- Button.svelte
- Card.svelte
- Checkbox.svelte
- Dialog.svelte (already pure Svelte, needs runes)
- Input.svelte
- Select.svelte
- SkeletonLoader.svelte
- Tabs.svelte (already pure Svelte, needs runes)
- Textarea.svelte

Per component:
1. Run VS Code "Migrate Component to Svelte 5 Syntax"
2. Review and fix any `$:` → `$derived` vs `$effect` misclassifications
3. Convert `on:` to `on` attributes
4. Test component in isolation

Exit criteria:
- All UI components using runes
- Storybook/ui-demo page working
- No legacy syntax warnings

### PR3 — Navigation & Layout Components

**Objective**: Migrate app shell and navigation

Components:
- `src/lib/components/nav/Sidebar.svelte`
- `src/lib/components/nav/Topbar.svelte`
- `src/lib/components/nav/Breadcrumbs.svelte`
- `src/routes/+layout.svelte`
- `src/lib/components/CommandPalette.svelte`
- `src/lib/components/FeedbackModal.svelte`
- `src/lib/components/FeedbackButton.svelte`

Exit criteria:
- Navigation working
- Mobile menu toggle working
- Command palette opening on Cmd+K
- Theme toggle working

### PR4 — Practice Plan Components

**Objective**: Migrate complex practice plan editor

High-priority (most state):
- `PracticePlanSectionsEditor.svelte`
- `DrillItem.svelte`
- `ParallelGroup.svelte`
- `TimelineColumn.svelte`
- `SectionContainer.svelte`

Medium:
- `EnhancedAddItemModal.svelte`
- `TimelineSelectorModal.svelte`
- `AiPlanGenerator.svelte`
- Filter components (GroupFilter, PositionFilter)

Exit criteria:
- Practice plan editor fully functional
- Drag and drop working
- All modals opening/closing correctly

### PR5 — Route Pages

**Objective**: Migrate all page components

Order by traffic/importance:
1. `/drills/+page.svelte` and `/drills/[id]/+page.svelte`
2. `/practice-plans/+page.svelte` and viewer components
3. `/teams/*` pages
4. `/formations/*` pages
5. Remaining pages (profile, admin, poll, etc.)

Exit criteria:
- All pages rendering
- All interactions working
- No console errors

### PR6 — Enable Runes Mode & Test

**Objective**: Flip the switch and validate

Tasks:
1. Update svelte.config.js:
   ```javascript
   compilerOptions: {
     runes: true  // Enable runes mode
     // Remove compatibility block
   }
   ```
2. Run full build: `pnpm run build`
3. Fix any remaining compilation errors
4. Run unit tests: `pnpm test:unit:run`
5. Run E2E tests: `pnpm exec playwright test`
6. Manual smoke test of critical flows

Exit criteria:
- Build succeeds with `runes: true`
- All 310 unit tests pass
- All 21 E2E tests pass (including previously failing 6)
- No runtime errors in console

### PR7 — Cleanup & Documentation

**Objective**: Remove legacy code and document

Tasks:
1. Remove any remaining legacy imports:
   ```bash
   rg "from 'svelte/store'" src
   rg "createEventDispatcher" src
   ```
2. Update CLAUDE.md with new patterns
3. Add migration notes to docs/
4. Remove `compatibility` config if no longer needed

Exit criteria:
- No legacy Svelte 4 patterns in codebase
- Documentation updated
- PR merged to main

---

## 5. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Large component breaks during migration | Medium | High | Migrate incrementally, test each component |
| Store migration breaks dependent components | Medium | High | Migrate stores first, update consumers immediately |
| `$:` → `$derived` vs `$effect` misclassification | High | Medium | Manual review of each conversion |
| Event handler spread patterns break | Low | Medium | Test components with spread props |
| Slots → snippets breaks complex layouts | Medium | Medium | Test slot-heavy components thoroughly |
| Third-party component incompatibility | Low | Low | Most deps already Svelte 5 compatible |

---

## 6. Tooling & Commands

### Automated Migration
```bash
# Full project migration (creates backup)
npx sv migrate svelte-5

# VS Code command palette
"Migrate Component to Svelte 5 Syntax"
```

### Validation Commands
```bash
# Check for remaining legacy patterns
rg "export let" src --type svelte
rg "\$:" src --type svelte
rg "on:" src --type svelte | grep -v "onclick\|oninput\|onchange"
rg "createEventDispatcher" src
rg "<slot" src --type svelte

# Build and test
pnpm run check
pnpm run build
pnpm test:unit:run
pnpm exec playwright test
```

### File Naming for Stores
```
# Runes are only available in .svelte files or files ending with .svelte.js/.svelte.ts
cartStore.js → cartStore.svelte.js
themeStore.ts → themeStore.svelte.ts
```

---

## 7. Definition of Done

- [ ] `runes: true` in svelte.config.js
- [ ] No `export let` prop declarations (all using `$props()`)
- [ ] No `$:` reactive statements (all using `$derived` or `$effect`)
- [ ] No `on:event` syntax (all using `onevent` attributes)
- [ ] No `createEventDispatcher` (all using callback props)
- [ ] No `<slot>` elements (all using `{@render}` with snippets)
- [ ] No `writable()`/`derived()` store imports (all using `$state` classes)
- [ ] All 310 unit tests passing
- [ ] All 21 E2E tests passing
- [ ] No runtime console errors
- [ ] Documentation updated

---

## 8. Resources

### Official Documentation
- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide)
- [$props Documentation](https://svelte.dev/docs/svelte/$props)
- [$state Documentation](https://svelte.dev/docs/svelte/$state)
- [sv migrate CLI](https://svelte.dev/docs/cli/sv-migrate)

### Community Resources
- [Villa Plus Migration Experience](https://medium.com/villa-plus-engineering/migrating-from-svelte-4-to-svelte-5-our-experience-and-lessons-learned-6d383947819b)
- [Loopwerk: Refactoring Stores to Runes](https://www.loopwerk.io/articles/2025/svelte-5-stores/)
- [Converting Global Stores to Runes](https://inorganik.net/posts/2025-01-20-converting-svelte-store-to-runes)
- [SvelteSnacks Deep Dives](https://www.sveltesnacks.com/deep-dives)
- [Svelte GitHub Discussions](https://github.com/sveltejs/svelte/discussions/14131)

---

## 9. Estimated Effort

| Phase | Components | Estimated Time |
|-------|------------|----------------|
| PR0 - Preparation | N/A | 2-4 hours |
| PR1 - Stores | 7 stores | 4-8 hours |
| PR2 - UI Components | ~15 components | 4-6 hours |
| PR3 - Navigation | ~8 components | 2-4 hours |
| PR4 - Practice Plan | ~15 components | 6-10 hours |
| PR5 - Route Pages | ~25 pages | 6-10 hours |
| PR6 - Enable & Test | N/A | 4-8 hours |
| PR7 - Cleanup | N/A | 2-4 hours |

**Total: 30-54 hours** (1-2 weeks of focused work)

---

## 10. Recommendation

**Proceed with migration as P2 priority.**

The migration is necessary because:
1. Current E2E test failures block CI reliability
2. Legacy mode is not a supported long-term configuration
3. Modern Svelte libraries require runes mode
4. Explicit reactivity improves code maintainability

Suggested approach:
1. Start with stores (PR1) as they affect the most components
2. Use VS Code migration command for bulk conversion
3. Test incrementally — don't batch too many components
4. Keep `runes: false` until PR6 to allow gradual migration
