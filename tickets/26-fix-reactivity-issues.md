# Ticket 26: Investigate/Fix Reactivity Issues (e.g., TimelineSelectorModal)

- **Priority:** Medium
- **Issue:** Some components exhibit signs of potential reactivity problems or workarounds that fight against Svelte's reactive system. The most prominent example is `TimelineSelectorModal`, which uses manual object recreation (`timelineNamesStore = { ... }`) and `setTimeout` to force UI updates for timeline names, suggesting issues with state propagation or component updates.
- **Affected Files:**
  - [`src/components/practice-plan/modals/TimelineSelectorModal.svelte`](src/components/practice-plan/modals/TimelineSelectorModal.svelte)
  - [`src/lib/stores/sectionsStore.js`](src/lib/stores/sectionsStore.js) (potentially related state management complexity)
  - Other components using complex reactive dependencies or workarounds (if found).
- **Recommendations:**
  - **Investigate `TimelineSelectorModal`:** Deeply analyze the state flow for timeline names and colors. Why are manual updates needed? Is state being mutated directly instead of through store methods? Are derived stores being used correctly? Refactor to rely on Svelte's natural reactivity.
  - **Review `sectionsStore`:** The complexity of [`sectionsStore`](src/lib/stores/sectionsStore.js) might contribute to reactivity challenges. Simplify its structure and ensure updates are handled immutably and correctly trigger dependent computations.
  - **Look for Similar Patterns:** Search the codebase for other instances of `setTimeout` used for delayed updates, manual store updates (`store = { ...$store }`), or complex reactive statements (`$:`) that might indicate underlying reactivity issues.
  - **Simplify State Dependencies:** Reduce complex inter-dependencies between stores where possible.
- **Related Tickets:** [10](./10-refactor-state-sectionsstore.md), [15](./15-refactor-component-coupling.md)
