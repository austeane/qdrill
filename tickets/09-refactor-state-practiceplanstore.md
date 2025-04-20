# Ticket 09: Refactor Bloated `practicePlanStore`

**Priority:** High

**Description:** The [`src/lib/stores/practicePlanStore.js`](src/lib/stores/practicePlanStore.js) store violates the single responsibility principle by mixing numerous concerns: form field state, form UI state, form submission logic (including API calls, validation, normalization, navigation, toasts), utility functions, and unrelated state/helpers for filtering and drag-and-drop.

**Affected Files:**

*   [`src/lib/stores/practicePlanStore.js`](src/lib/stores/practicePlanStore.js)
*   [`src/routes/practice-plans/PracticePlanForm.svelte`](src/routes/practice-plans/PracticePlanForm.svelte) (Primary consumer)
*   [`src/routes/practice-plans/+page.svelte`](src/routes/practice-plans/+page.svelte) (Uses filter state from this store)
*   [`src/components/FilterPanel.svelte`](src/components/FilterPanel.svelte) (Uses filter state from this store)
*   Potentially other components importing utils or state from this store.

**Related Notes:**

*   [`code-review/practice-plan-notes.md`](code-review/practice-plan-notes.md) (`practicePlanStore` review)
*   [`code-review/holistic-summary.md`](code-review/holistic-summary.md) (Key Themes: State Management)

**Action Required:**

1.  **Separate Concerns:** Break down [`practicePlanStore.js`](src/lib/stores/practicePlanStore.js) into smaller, focused stores/modules:
    *   **Create `practicePlanMetadataStore.js`:** This store should manage the core data fields of the practice plan form (e.g., `planName`, `planDescription`, `phaseOfSeason`, `practiceGoals`, `estimatedParticipants`, `visibility`). Include functions for managing `practiceGoals` (`add/remove/updatePracticeGoal`). Include `initializeForm` logic relevant to these fields.
    *   **Create `practicePlanFilterStore.js`:** Move all state related to filtering the practice plan list page (e.g., `selectedPhaseOfSeason`, `selectedPracticeGoals`, `selectedEstimatedParticipants`, `selectedDrillIds`) into this new store.
    *   **Move Submission Logic:** Extract the `submitPracticePlan` function and its helper `normalizeItems`. The best practice is likely to implement this as a **SvelteKit Form Action** within [`src/routes/practice-plans/create/+page.server.js`](src/routes/practice-plans/create/+page.server.js) and [`src/routes/practice-plans/[id]/edit/+page.server.js`](src/routes/practice-plans/[id]/edit/+page.server.js). This keeps API calls, validation (can reuse shared validation logic - Ticket 14), normalization, database interaction (via service), and redirects/feedback handling on the server-side, associated directly with the form submission.
    *   **Move Drag/Drop Helpers:** Move misplaced drag/drop helpers (`handleDrillMove`, `mergeIntoParallelGroup`, `removeFromParallelGroup`) into [`sectionsStore.js`](src/lib/stores/sectionsStore.js) (Ticket 10) or [`dragManager.js`](src/lib/stores/dragManager.js) (Ticket 16) where they logically belong.
    *   **Move Utility Functions:** Move generic utility functions like `formatTime`, `addMinutes` to a shared `src/lib/utils/` directory if they are used elsewhere, or keep them co-located with the store/component that primarily uses them if not.
2.  **Refactor Consumers:** Update components ([`PracticePlanForm`](src/routes/practice-plans/PracticePlanForm.svelte), [`practice-plans/+page.svelte`](src/routes/practice-plans/+page.svelte), [`FilterPanel`](src/components/FilterPanel.svelte)) to import state and functions from the new, refactored stores or use the new Form Action for submission.
3.  **Remove Original Store:** Once all functionality is migrated, the original [`practicePlanStore.js`](src/lib/stores/practicePlanStore.js) can be significantly simplified or potentially removed if all its responsibilities are delegated. 