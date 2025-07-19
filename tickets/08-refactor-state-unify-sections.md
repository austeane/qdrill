# Ticket 08: Unify Practice Plan State Management (Eliminate Wizard Section Duplication)

**Priority:** High
**Status:** In Progress

**Description:** The code previously contained two parallel systems for managing the practice plan structure: the main form used [`sectionsStore.js`](/src/lib/stores/sectionsStore.js) while the wizard kept its own `sections` store in [`wizardStore.js`](/src/lib/stores/wizardStore.js). This duplication caused confusion and required copying state back and forth. Recent refactoring removed the duplicated store – the wizard now imports and mutates `sectionsStore` directly. A writable `timeline` store remains in `wizardStore.js` for arranging section durations, but it relies on `sectionsStore` for the actual section list.

**Affected Files:**

- [`src/lib/stores/wizardStore.js`](/src/lib/stores/wizardStore.js) (Contains wizard-specific state like `timeline`; previously held a duplicated `sections` store)
- [`src/lib/stores/sectionsStore.js`](/src/lib/stores/sectionsStore.js) (The primary store for the main form)
- [`src/routes/practice-plans/wizard/**`](/src/routes/practice-plans/wizard/) (Wizard step components now import `sectionsStore` directly)
- [`src/components/practice-plan/**`](/src/components/practice-plan/) (Shared components accept data and callbacks; previously coupled to `sectionsStore`)
- [`src/routes/practice-plans/PracticePlanForm.svelte`](/src/routes/practice-plans/PracticePlanForm.svelte) (Uses `sectionsStore`)

**Related Notes:**

- [`code-review/practice-plan-wizard-notes.md`](/code-review/practice-plan-wizard-notes.md)
- [`code-review/practice-plan-notes.md`](/code-review/practice-plan-notes.md)
- [`code-review/shared-components-notes.md`](/code-review/shared-components-notes.md)
- [`code-review/holistic-summary.md`](/code-review/holistic-summary.md) (Key Themes: State Management, Code Duplication)

**Action Required:**

1.  **[DONE] Choose Single Source:** `sectionsStore` is now the single source of truth for sections.
2.  **[DONE] Remove Duplication:** The old `wizardStore.sections` writable store and related sync logic were removed.
3.  **[DONE] Refactor Wizard Steps:** Wizard components (`sections`, `timeline`, `overview`) read from and update `sectionsStore` directly using its exported functions.
4.  **[DONE] Decouple Shared Components:** `SectionContainer`, `DrillItem`, `ParallelGroup`, and `TimelineColumn` now accept data and callbacks via props instead of importing `sectionsStore`.
5.  **[DONE] Adapt Wizard Usage:** Wizard steps pass the relevant section data and wrap `sectionsStore` functions when invoking shared components.
6.  **Test Thoroughly:** Continue verifying that the wizard modifies `sectionsStore` correctly and that submission uses the updated state.
7.  **Review Timeline Sync:** Ensure the `timeline` store in `wizardStore.js` stays synchronized with changes made to `sectionsStore` (e.g., added or renamed sections).
