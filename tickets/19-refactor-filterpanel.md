# Ticket 19: Refactor Complex FilterPanel Component

- **Priority:** Medium
- **Issue:** The `FilterPanel` in [`src/lib/components/FilterPanel.svelte`](src/lib/components/FilterPanel.svelte) is nearly one thousand lines long and manages filter UI for both drills and practice plans. It imports several stores directly (`drillsStore`, `sortStore`, `practicePlanFilterStore`) and contains extensive local state for dropdown visibility, range sliders, and tri‑state checkboxes. URL parameters are now updated by the page components, leaving unused `page` and `goto` imports in `FilterPanel`. The component still performs debounced drill search via `apiFetch` and includes console debugging statements.
- **Affected Files:**
  - [`src/lib/components/FilterPanel.svelte`](src/lib/components/FilterPanel.svelte)
  - Interacting stores: [`drillsStore.js`](src/lib/stores/drillsStore.js), [`practicePlanFilterStore.js`](src/lib/stores/practicePlanFilterStore.js), [`sortStore.js`](src/lib/stores/sortStore.js)
- **Recommendations:**
  - Break down `FilterPanel` into focused sub-components (`RangeFilter`, `ThreeStateFilter`, `DrillSearchFilter`, etc.).
  - Decouple filter state management by passing values and callbacks via props or by creating a unified filter store.
  - Remove the unused URL logic (`goto`, `page`) and keep navigation handling in the parent pages.
  - Improve drill search API interaction with explicit loading/error handling.
  - Reduce console logging and simplify reactive subscriptions.
- **Related Tickets:** [15](./15-refactor-component-coupling.md), [9](./09-refactor-state-practiceplanstore.md)
