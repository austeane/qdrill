# Ticket 26: Investigate/Fix Reactivity Issues (e.g., TimelineSelectorModal)

- **Priority:** Medium
- **Issue:** Several components contain workarounds that fight against Svelte's reactive model. `TimelineSelectorModal` reassigns a local copy of `customTimelineNames` and uses `setTimeout` to refresh UI state after saving (`timelineNamesStore = { ...timelineNamesStore }`). It also forces updates to a `Set` of timelines by reassigning `$selectedTimelines = $selectedTimelines`. `EnhancedAddItemModal` similarly spreads objects/sets to trigger updates, and `sectionsStore.js` mutates the global `PARALLEL_TIMELINES` object outside of Svelte stores. These patterns indicate underlying reactivity or state management issues.
- **Affected Files:**
  - [`src/lib/components/practice-plan/modals/TimelineSelectorModal.svelte`](src/lib/components/practice-plan/modals/TimelineSelectorModal.svelte)
  - [`src/lib/components/practice-plan/modals/EnhancedAddItemModal.svelte`](src/lib/components/practice-plan/modals/EnhancedAddItemModal.svelte)
  - [`src/routes/practice-plans/viewer/ParallelGroup.svelte`](src/routes/practice-plans/viewer/ParallelGroup.svelte)
  - [`src/lib/stores/sectionsStore.js`](src/lib/stores/sectionsStore.js) (state management and global mutations)
- **Recommendations:**
  - **Investigate `TimelineSelectorModal`:** review why the modal uses a local variable and a `setTimeout` to refresh `customTimelineNames`. Consider replacing the manual reassignment patterns with store-driven updates.
  - **Audit Other Modals:** `EnhancedAddItemModal` also spreads objects and sets to force changes. Refactor these components so that updates flow naturally through Svelte stores without recreation hacks.
  - **Review `sectionsStore`:** the store mutates a global `PARALLEL_TIMELINES` object. Evaluate converting this to a store or derived store so that changes propagate automatically.
  - **Search for Similar Patterns:** scan the codebase for manual assignments like `store = { ...store }` or `new Set(store)` and for uses of `setTimeout` that attempt to trigger reactivity. Remove or refactor where possible.
  - **Simplify State Dependencies:** reduce unnecessary interdependencies between stores to avoid cascading manual updates.
- **Related Tickets:** [10](./10-refactor-state-sectionsstore.md), [15](./15-refactor-component-coupling.md)
