# Ticket 08: Unify Practice Plan State Management (Eliminate Wizard Section Duplication)

**Priority:** High

**Description:** There are two parallel systems for managing the core practice plan structure (sections, items, timelines): the main form uses `sectionsStore.js`, while the wizard uses its own state within `wizardStore.js`. This duplication leads to confusion, maintenance overhead, and potential inconsistencies. The wizard currently copies state to/from the main stores during initialization and submission.

**Affected Files:**

*   `src/lib/stores/wizardStore.js` (Manages duplicated `sections` state)
*   `src/lib/stores/sectionsStore.js` (The primary store for the main form)
*   `src/routes/practice-plans/wizard/**` (Wizard step components interacting with `wizardStore.sections`)
*   `src/components/practice-plan/**` (Shared components currently coupled to `sectionsStore`)
*   `src/routes/practice-plans/PracticePlanForm.svelte` (Uses `sectionsStore`)

**Related Notes:**

*   `code-review/practice-plan-wizard-notes.md`
*   `code-review/practice-plan-notes.md`
*   `code-review/shared-components-notes.md`
*   `code-review/holistic-summary.md` (Key Themes: State Management, Code Duplication)

**Action Required:**

1.  **Choose Single Source:** Decide to use `sectionsStore` as the single source of truth for the practice plan structure.
2.  **Remove Duplication:**
    *   Remove the `sections` writable store and related manipulation logic from `wizardStore.js`.
    *   Remove the logic in `wizardStore` that copies section data between the wizard and `sectionsStore` during initialization and submission.
3.  **Refactor Wizard Steps:** Modify the wizard step components (`sections/+page.svelte`, `timeline/+page.svelte`, `overview/+page.svelte`) to directly read from and write to the main `sectionsStore`. They should use the functions exported by `sectionsStore` (e.g., `addSection`, `removeItem`, `createParallelBlock`) instead of any wizard-specific logic for manipulating sections.
4.  **Decouple Shared Components:** Ensure shared components (`SectionContainer`, `DrillItem`, `ParallelGroup`, `TimelineColumn`) are decoupled from direct `sectionsStore` imports (as per Ticket 15). They should accept data and action callbacks via props.
5.  **Adapt Wizard Usage:** The wizard steps will need to pass the appropriate data (e.g., the relevant part of the `$sections` array) and action callbacks (wrapping `sectionsStore` functions) down to the shared components.
6.  **Test Thoroughly:** Verify that the wizard flow correctly modifies the `sectionsStore` state and that the final submission process uses the state from `sectionsStore` as intended. 