# Ticket 10: Simplify/Refactor Complex `sectionsStore`

**Priority:** High

**Description:** The `src/lib/stores/sectionsStore.js` is extremely large (>1000 lines) and complex. It manages the intricate nested state of practice plan sections, items, parallel groups, and timelines. This complexity makes it difficult to understand, maintain, debug, and test. It also uses some non-standard practices like module-level counters for IDs.

**Affected Files:**

*   `src/lib/stores/sectionsStore.js`
*   `src/lib/stores/historyStore.js` (Relies heavily on `sectionsStore` snapshots)
*   `src/components/practice-plan/**` (Many shared components interact with it)
*   `src/routes/practice-plans/PracticePlanForm.svelte` (Uses it)
*   `src/routes/practice-plans/wizard/**` (Should use it after Ticket 08)
*   `src/lib/stores/dragManager.js` (Directly modifies `$sections`)

**Related Notes:**

*   `code-review/practice-plan-notes.md` (`sectionsStore` review)
*   `code-review/practice-plan-wizard-notes.md` (Impact of complexity on wizard)
*   `code-review/shared-components-notes.md` (Coupling issues)
*   `code-review/holistic-summary.md` (Key Themes: State Management)

**Action Required:**

1.  **Analyze Core Complexity:** Identify the main sources of complexity. Likely candidates include:
    *   Managing parallel groups (`createParallelBlock`, `handleUngroup`, `updateParallelBlockTimelines`, `groupTimelines` property).
    *   Ensuring immutable updates for the deeply nested `sections` array.
    *   Complex initialization/formatting logic (`initializeSections`, `formatDrillItem`).
    *   Calculating derived state (durations, timeline info).
2.  **Explore Simplification Strategies:** Consider ways to reduce complexity:
    *   **Simpler State Structure?** Can the state representation for parallel groups be simplified? Is the current level of nesting strictly necessary?
    *   **Break Down Store?** Could parts of the logic be extracted? (e.g., timeline name/color management might be separable, duration calculation logic could be in utils or derived stores).
    *   **Helper Functions:** Encapsulate complex immutable update patterns into reusable helper functions.
    *   **State Management Libraries:** For very complex nested state, explore if libraries designed for immutable updates (like Immer.js, integrated via `svelte-immer`) could simplify update logic, although this adds a dependency.
3.  **Refactor Implementation:**
    *   Improve function clarity and modularity within the store.
    *   Replace module-level counters with more robust ID generation (e.g., UUIDs).
    *   Remove direct UI side effects (e.g., `toast` calls) - move to components or event listeners.
    *   Verify and potentially remove the `selectedItems` store if unused.
    *   Ensure initialization (`initializeSections`, `initializeTimelinesFromPlan`) and formatting (`formatDrillItem`) logic is robust and handles all edge cases correctly, especially around parallel groups and item types.
4.  **Address Drag/Drop Interaction:** Ensure `dragManager` interacts with the refactored `sectionsStore` via defined functions rather than direct mutation of `$sections` (see Ticket 16).
5.  **Improve History Integration:** Verify that `historyStore` correctly captures and restores the potentially refactored state structure.
6.  **Test Extensively:** Given the store's centrality, thorough unit and integration tests are crucial after refactoring. 