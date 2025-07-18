# Ticket 09: Refactor Bloated `practicePlanStore`

**Priority:** High

## Current State (2024-08-20)

The monolithic `practicePlanStore.js` has been **removed**. Its responsibilities were split into dedicated stores and server actions:

- [`src/lib/stores/practicePlanMetadataStore.js`](src/lib/stores/practicePlanMetadataStore.js) manages form fields, initialization logic and Zod based validation.
- [`src/lib/stores/practicePlanFilterStore.js`](src/lib/stores/practicePlanFilterStore.js) tracks filter state used on the practice plan list page.
- Form submission is now handled in [`src/routes/practice-plans/create/+page.server.js`](src/routes/practice-plans/create/+page.server.js) and [`src/routes/practice-plans/[id]/edit/+page.server.js`](src/routes/practice-plans/[id]/edit/+page.server.js) using SvelteKit actions.
- Drag and drop helpers (`handleDrillMove`, `mergeIntoParallelGroup`, `removeFromParallelGroup`) live in [`src/lib/stores/sectionsStore.js`](src/lib/stores/sectionsStore.js).
- Utility helpers `formatTime` and `addMinutes` were moved to [`src/lib/utils/timeUtils.js`](src/lib/utils/timeUtils.js); `normalizeItems` is provided by [`src/lib/utils/practicePlanUtils.js`](src/lib/utils/practicePlanUtils.js).

Relevant components (`PracticePlanForm.svelte`, `practice-plans/+page.svelte`, `FilterPanel.svelte`) import from these new stores. No references to the old `practicePlanStore.js` remain.

## Notes on Implementation

- `practicePlanMetadataStore.js` exposes individual writable stores for each field and a `validateMetadataForm` function which uses the shared schema in `validation/practicePlanSchema.ts`.
- `practicePlanFilterStore.js` includes helpers like `updateFilterState` and `resetPracticePlanFilters` to manage complex filter behaviour.
- Server actions normalize section items via `normalizeItems` before calling `practicePlanService`.

## Resolution

All tasks from the original ticket have been implemented:

1. **Separate Concerns** – completed via the new metadata and filter stores.
2. **Refactor Consumers** – components were updated to use the new stores and form actions.
3. **Remove Original Store** – `practicePlanStore.js` has been deleted.

This ticket can be marked **DONE**.
