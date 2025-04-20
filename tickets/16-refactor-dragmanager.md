# Ticket 16: Simplify and Decouple `dragManager`

**Priority:** Medium

**Description:** The [`src/lib/stores/dragManager.js`](src/lib/stores/dragManager.js) store, responsible for handling all drag-and-drop operations within the practice plan builder, is overly complex and tightly coupled to `sectionsStore`. Its intricate logic for tracking drag state and handling drops is fragile and hard to maintain. It also relies on concerning patterns like accessing state via `window.__dragManager`.

**Affected Files:**

*   [`src/lib/stores/dragManager.js`](src/lib/stores/dragManager.js)
*   [`src/lib/stores/sectionsStore.js`](src/lib/stores/sectionsStore.js) (Directly modified by `dragManager`)
*   [`src/components/practice-plan/items/TimelineColumn.svelte`](src/components/practice-plan/items/TimelineColumn.svelte) (Uses `window.__dragManager` workaround)
*   All components that import drag handlers from `dragManager` ([`SectionContainer`](src/components/practice-plan/sections/SectionContainer.svelte), [`DrillItem`](src/components/practice-plan/items/DrillItem.svelte), [`ParallelGroup`](src/components/practice-plan/items/ParallelGroup.svelte), etc.)

**Related Notes:**

*   [`code-review/shared-components-notes.md`](code-review/shared-components-notes.md) (`dragManager` review)
*   [`code-review/practice-plan-notes.md`](code-review/practice-plan-notes.md) (`sectionsStore` coupling)
*   [`code-review/holistic-summary.md`](code-review/holistic-summary.md) (Key Themes: State Management)

**Action Required:**

1.  **Simplify State Tracking:** Re-evaluate the `dragState` structure. Can it be simplified? Reduce reliance on indices where possible; favor stable item/group IDs. Eliminate the need for the `window.__dragManager` workaround by addressing the underlying state synchronization issue.
2.  **Decouple from `sectionsStore`:** Modify `dragManager` so it does not directly import and modify the `$sections` writable from [`sectionsStore`](src/lib/stores/sectionsStore.js). Instead:
    *   The `handleDrop` function (or equivalent) should determine the intended change (e.g., move item X before item Y in section Z).
    *   It should then call a specific, well-defined function exported by `sectionsStore` to perform that exact modification (e.g., `sectionsStore.moveItem({ itemId, targetItemId, position: 'before', targetSectionId })`).
    *   This enforces separation of concerns: `dragManager` determines *what* should happen based on the drag events, and `sectionsStore` determines *how* to update its state accordingly.
3.  **Refactor Drop Logic:** Simplify the complex conditional logic within `handleDrop` and its sub-handlers (`handleItemDrop`, etc.). Encapsulate logic into smaller, clearer functions. Improve the reliability of drop position calculation and source/target identification.
4.  **Improve DOM Interaction:** Review the direct DOM manipulation for visual feedback. Can some of this be achieved more declaratively using Svelte's `class:` directives bound to the `dragState`?
5.  **Remove Debugging Code:** Clean up the extensive `console.log`/`logger.debug` calls once the system is stable.
6.  **Update Consumers:** Components using drag handlers will need to be updated if the function signatures or required data attributes change during the refactoring.
7.  **Consider Alternatives (Optional):** If the complexity remains too high, investigate dedicated Svelte drag-and-drop libraries to see if they could manage some of the state and event handling more robustly, though integrating them with the custom requirements (nested structure, parallel timelines) might also be challenging. 