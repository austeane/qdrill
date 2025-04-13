# Ticket 19: Refactor Complex FilterPanel Component

- **Priority:** Medium
- **Issue:** The `FilterPanel` component is large and complex, managing state for numerous filters across different entity types (drills, practice plans) using multiple stores (`drillsStore`, `sortStore`, `practicePlanStore`). It also handles URL manipulation (`goto`) and specific API calls (drill search).
- **Affected Files:**
    - `src/components/FilterPanel.svelte`
    - Stores it interacts with (`drillsStore.js`, `practicePlanStore.js`, `sortStore.js`)
- **Recommendations:**
    - Break down `FilterPanel` into smaller, more focused sub-components (e.g., `RangeFilter`, `ThreeStateFilter`, `DrillSearchFilter`).
    - Decouple filter state management. Instead of importing multiple specific stores, consider passing filter configurations and state/callbacks via props, or create a more unified filter store strategy.
    - Abstract URL update logic. The component shouldn't be solely responsible for complex URL construction; this could be handled by the parent page or a dedicated utility.
    - Improve API interaction for the drill search (loading state, error handling).
    - Simplify the reactive logic that subscribes to numerous store changes.
- **Related Tickets:** [15](./15-refactor-component-coupling.md), [9](./09-refactor-state-practiceplanstore.md) 