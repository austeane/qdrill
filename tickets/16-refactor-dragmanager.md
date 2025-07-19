# Ticket 16: Simplify and Decouple `dragManager`

**Priority:** Medium

**Description:** The [`src/lib/stores/dragManager.js`](src/lib/stores/dragManager.js) store still handles all drag-and-drop interactions for the practice plan builder. The file has grown to nearly 2,000 lines and maintains a large `dragState` object containing source/target indices, IDs, timeline info, and DOM element identifiers. Drop handlers call `sections.update` directly in many places, leading to tight coupling with [`sectionsStore`](src/lib/stores/sectionsStore.js). A global `window.__dragManager` object is exposed for debugging; it is currently referenced only by [`TimelineColumn.svelte`](src/lib/components/practice-plan/items/TimelineColumn.svelte) to patch drop information before calling `handleDrop`.

**Affected Files:**

- [`src/lib/stores/dragManager.js`](src/lib/stores/dragManager.js)
- [`src/lib/stores/sectionsStore.js`](src/lib/stores/sectionsStore.js) (Directly modified by `dragManager`)
- [`src/components/practice-plan/items/TimelineColumn.svelte`](src/components/practice-plan/items/TimelineColumn.svelte) (still references `window.__dragManager`)
- Components importing drag handlers from `dragManager` ([`SectionContainer`](src/components/practice-plan/sections/SectionContainer.svelte), [`DrillItem`](src/lib/components/practice-plan/items/DrillItem.svelte), [`ParallelGroup`](src/lib/components/practice-plan/items/ParallelGroup.svelte), etc.) now receive most data via props (see Ticket 15) but remain dependent on `dragManager`'s API
- [`src/lib/stores/__tests__/dragManager.test.js`](src/lib/stores/__tests__/dragManager.test.js) (test suite exercising current behaviour)

**Related Notes:**

- [`code-review/shared-components-notes.md`](code-review/shared-components-notes.md) (`dragManager` review)
- [`code-review/practice-plan-notes.md`](code-review/practice-plan-notes.md) (`sectionsStore` coupling)
- [`code-review/holistic-summary.md`](code-review/holistic-summary.md) (Key Themes: State Management)

## Current State (2024-08)

- `dragState` tracks source and target info (indices, IDs, timelines) plus DOM element IDs for visual cues.
- Several helper functions manipulate the DOM (`updateDropIndicators`, `multiPhaseCleanup`) to add/remove CSS classes.
- Drop handlers (`handleTimelineDrop`, `handleRegularDrop`, `handleGroupDrop`, `handleSectionDrop`) perform complex mutations using `sections.update`.
- `window.__dragManager` exposes the store for debugging; only `TimelineColumn.svelte` accesses it.
- A Vitest suite (`dragManager.test.js`) covers drop calculations and state transitions.

**Action Required:**

1.  **Simplify State Tracking:** Re-evaluate the `dragState` structure. Can it be simplified? Reduce reliance on indices where possible; favor stable item/group IDs. Eliminate the need for the `window.__dragManager` workaround by addressing the underlying state synchronization issue.
2.  **Decouple from `sectionsStore`:** Modify `dragManager` so it does not directly import and modify the `$sections` writable from [`sectionsStore`](src/lib/stores/sectionsStore.js). Instead:
    - The `handleDrop` function (or equivalent) should determine the intended change (e.g., move item X before item Y in section Z).
    - It should then call a specific, well-defined function exported by `sectionsStore` to perform that exact modification (e.g., `sectionsStore.moveItem({ itemId, targetItemId, position: 'before', targetSectionId })`).
    - This enforces separation of concerns: `dragManager` determines _what_ should happen based on the drag events, and `sectionsStore` determines _how_ to update its state accordingly.
3.  **Refactor Drop Logic:** Simplify the complex conditional logic within `handleDrop` and its sub-handlers (`handleItemDrop`, etc.). Encapsulate logic into smaller, clearer functions. Improve the reliability of drop position calculation and source/target identification.
4.  **Improve DOM Interaction:** Review the direct DOM manipulation for visual feedback. Can some of this be achieved more declaratively using Svelte's `class:` directives bound to the `dragState`?
5.  **Remove Debugging Code:** Clean up the extensive `console.log`/`logger.debug` calls once the system is stable.
6.  **Update Consumers:** Components using drag handlers will need to be updated if the function signatures or required data attributes change during the refactoring.
7.  **Consider Alternatives (Optional):** If the complexity remains too high, investigate dedicated Svelte drag-and-drop libraries to see if they could manage some of the state and event handling more robustly, though integrating them with the custom requirements (nested structure, parallel timelines) might also be challenging.
