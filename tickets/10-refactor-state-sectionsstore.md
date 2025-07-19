# Ticket 10: Simplify/Refactor Complex `sectionsStore`

**Priority:** High

**Description:** The [`src/lib/stores/sectionsStore.js`](/src/lib/stores/sectionsStore.js) file is still very large (about 1350 lines) and manages the nested state for practice plan sections, items, parallel groups and timeline configuration. It exports several writable stores (`sections`, `selectedTimelines`, `selectedSectionId`, `customTimelineColors`, `customTimelineNames`) and many helper functions. IDs are generated using a module level `sectionCounter` and `Date.now()` for group/item IDs. Numerous `console` logs and `toast` calls mix debugging or UI concerns with state logic.

The practice plan wizard now imports this store directly, eliminating previous duplication, but components and `dragManager` continue to mutate `$sections` directly. Overall complexity and coupling make the store difficult to maintain and test.

**Affected Files:**

- [`src/lib/stores/sectionsStore.js`](src/lib/stores/sectionsStore.js)
- [`src/lib/stores/historyStore.js`](src/lib/stores/historyStore.js) (captures snapshots from `sectionsStore`)
- [`src/lib/components/practice-plan/**`](src/lib/components/practice-plan/) (components rely on the store)
- [`src/routes/practice-plans/PracticePlanForm.svelte`](src/routes/practice-plans/PracticePlanForm.svelte)
- [`src/routes/practice-plans/wizard/**`](src/routes/practice-plans/wizard/) (uses this store)
- [`src/lib/stores/dragManager.js`](src/lib/stores/dragManager.js) (directly mutates `$sections`)

**Related Notes:**

- [`code-review/practice-plan-notes.md`](code-review/practice-plan-notes.md)
- [`code-review/practice-plan-wizard-notes.md`](code-review/practice-plan-wizard-notes.md)
- [`code-review/shared-components-notes.md`](code-review/shared-components-notes.md)
- [`code-review/holistic-summary.md`](code-review/holistic-summary.md)

**Action Required:**

1. **Analyze Core Complexity:**
   - Parallel group management (`createParallelBlock`, `updateParallelBlockTimelines`, `handleUngroup`, `groupTimelines` property).
   - Immutable updates for deeply nested `sections` data.
   - Initialization/formatting logic (`initializeSections`, `formatDrillItem`).
   - Derived calculations for durations and timelines.
2. **Explore Simplification Strategies:**
   - Reconsider the state shape for parallel timelines; reduce nesting if possible.
   - Extract timeline name/color logic and duration helpers into separate modules or derived stores.
   - Introduce utility functions for common immutable updates.
   - Evaluate libraries like Immer (`svelte-immer`) if they reduce complexity.
3. **Refactor Implementation:**
   - Improve function clarity and modularity within the store.
   - Replace module counters and `Date.now()` IDs with stable generation (e.g., UUIDs).
   - Remove direct UI side effects (`toast` and extensive `console` logging).
   - The old `selectedItems` store is no longer present and can be removed from docs.
   - Ensure initialization functions handle all edge cases around parallel groups and item types.
4. **Address Drag/Drop Interaction:** Ensure `dragManager` interacts via exported functions rather than direct mutation of `$sections` (see Ticket 16).
5. **Improve History Integration:** Verify `historyStore` properly captures and restores the refactored state.
6. **Test Extensively:** Unit and integration tests are crucial after refactoring this core store.
