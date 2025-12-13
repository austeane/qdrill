# Svelte 5 Runes Post‑Migration Guide (QDrill)

This doc captures **Svelte 5 runes‑mode features that become practical _after_ a full migration**, plus concrete places in QDrill where they help.

## What runes mode unlocks (practical checklist)

### 1) Hydration‑stable DOM IDs with `$props.id()`

Use when you need a unique `id`/`for`/`aria-*` relationship and don’t want SSR → client “generated id” mismatch code.

```svelte
<script>
	let { id = '' } = $props();
	const baseId = $props.id();
	const uid = $derived(id || `input-${baseId}`);
</script>

<label for={uid}>Name</label>
<input id={uid} />
```

**QDrill hits**
- `src/lib/components/ui/Input.svelte`
- `src/lib/components/ui/Select.svelte`
- `src/lib/components/ui/Textarea.svelte`

### 2) Reactive `Map`/`Set`/`Date`/`URL*` via `svelte/reactivity`

`$state({})` gives you **deep proxies for plain objects/arrays**, but **class instances are not proxied**. If you want to mutate a `Set`/`Map` and have the UI update, use `SvelteSet`/`SvelteMap` (or reassign, which is noisier).

```js
import { SvelteSet } from 'svelte/reactivity';

const selected = new SvelteSet(['A']);
selected.add('B'); // reactive (no “reassign to trigger” hacks)
```

**QDrill hits**
- `src/lib/components/practice-plan/modals/EnhancedAddItemModal.svelte` (local `SvelteSet`)
- `src/lib/stores/sectionsStore.svelte.js` (shared `SvelteSet` for `selectedTimelines`)

### 3) `$state.raw` for “big but immutable-ish” state

If you keep large arrays/objects in state and you mostly **replace** them rather than mutate deeply, `$state.raw(...)` avoids the cost of deep proxying.

```js
let results = $state.raw([]); // must reassign, not mutate
results = nextResults;
```

Rule of thumb: only use when you can guarantee you won’t do `results.push(...)` / `results[0].x = ...`.

### 4) `$state.snapshot` when crossing boundaries (serialization, cloning, external libs)

Deep `$state` values are proxies. Snapshot before sending to things that expect plain data.

```js
const plain = $state.snapshot(sections);
localStorage.setItem('x', JSON.stringify(plain));
```

**QDrill hits**
- `src/lib/stores/sectionsStore.svelte.js` (snapshots used for history + updates)
- `src/routes/practice-plans/PracticePlanForm.svelte` (snapshot used for submission)

### 5) `createSubscriber` for reactive wrappers around event sources

Great for `matchMedia`, `IntersectionObserver`, `WebSocket`, etc. It avoids “always‑on listeners” and gives you reactive getters.

```js
import { createSubscriber } from 'svelte/reactivity';
import { on } from 'svelte/events';

export class MediaQuery {
	#mq;
	#subscribe;

	constructor(query) {
		this.#mq = window.matchMedia(`(${query})`);
		this.#subscribe = createSubscriber((update) => on(this.#mq, 'change', update));
	}

	get matches() {
		this.#subscribe();
		return this.#mq.matches;
	}
}
```

**QDrill candidates**
- IntersectionObserver setup in:
  - `src/routes/practice-plans/[id]/+page.svelte`
  - `src/routes/teams/[slug=slug]/plans/[id]/+page.svelte`
- `window.matchMedia` wiring in `src/lib/stores/themeStore.svelte.ts` (could use `MediaQuery` from `svelte/reactivity`)

### 6) Attachments: `{@attach ...}` + `fromAction`

Attachments are a reactive, prop‑passable alternative to many `use:` patterns. They’re especially useful with **wrapper components that spread props**, since attachments can “flow through” the spread.

```svelte
<Button {@attach tooltip(text)}>Hover</Button>
```

**QDrill candidates**
- UI wrappers that already spread `...restProps`, like `src/lib/components/ui/button/button.svelte`

### 7) `<svelte:boundary>` for local error + loading UI

Boundaries are Svelte 5’s native “error boundary” + async pending UI.

Notes:
- Catches errors during **render** or while running **effects**
- Does **not** catch errors from event handlers / timers / async work that escapes the render/effect pipeline

**QDrill candidates**
- `src/lib/components/ErrorBoundary.svelte` could be reworked to use `<svelte:boundary>` for “in‑tree” errors (and keep any global error handling separate).

### 8) Debugging: `$inspect` and `$inspect.trace`

Use in dev to answer “what changed?” and “why did this rerun?” without littering manual logs.

## Build/tooling note: dependency compile mode

QDrill currently compiles `node_modules/**/*.svelte` in legacy mode (`runes: false`) to support third‑party packages that still ship legacy syntax.

If you adopt a dependency that ships **runes‑mode** components, add it to `RUNES_NODE_MODULES` in `svelte.config.js` so it compiles with `runes: true`.

## Repo follow-ups worth considering

- Prefer `$props.id()` over client‑only UUID generation for DOM IDs (done in the UI input components).
- Prefer `SvelteSet/SvelteMap` when you find yourself cloning/reassigning Sets/Maps “to trigger reactivity”.
- Evaluate where `$state.raw` helps (large lists that are always replaced, never mutated).
- Consider `<svelte:boundary>` for “blast radius reduction” on flaky/third‑party UI (Excalidraw, rich editors).

