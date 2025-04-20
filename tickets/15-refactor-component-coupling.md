# Ticket 15: Decouple Shared Components from Stores

**Priority:** Medium

**Description:** Shared components used within the practice plan builder/viewer (e.g., `SectionContainer`, `DrillItem`, `ParallelGroup`, `TimelineColumn`) are often tightly coupled to specific Svelte stores (`sectionsStore`, `dragManager`). They directly import and call store functions or access store variables. This prevents their reuse in different contexts (like the Practice Plan Wizard, which uses `wizardStore`) and makes them harder to test and maintain.

**Affected Files:**

*   [`src/components/practice-plan/sections/SectionContainer.svelte`](src/components/practice-plan/sections/SectionContainer.svelte) (Imports `removeSection`, `removeItem` from `sectionsStore`; drag handlers from `dragManager`)
*   [`src/components/practice-plan/items/DrillItem.svelte`](src/components/practice-plan/items/DrillItem.svelte) (Imports `handleDurationChange` from `sectionsStore`; drag handlers from `dragManager`)
*   [`src/components/practice-plan/items/ParallelGroup.svelte`](src/components/practice-plan/items/ParallelGroup.svelte) (Imports `handleUngroup`, duration/naming helpers from `sectionsStore`; drag handlers from `dragManager`)
*   [`src/components/practice-plan/items/TimelineColumn.svelte`](src/components/practice-plan/items/TimelineColumn.svelte) (Imports `removeItem`, naming helpers from `sectionsStore`; drag handlers from `dragManager`)
*   Practice Plan Modals (e.g., [`DrillSearchModal`](src/components/practice-plan/modals/DrillSearchModal.svelte), [`TimelineSelectorModal`](src/components/practice-plan/modals/TimelineSelectorModal.svelte) - import store functions)

**Related Notes:**

*   [`code-review/shared-components-notes.md`](code-review/shared-components-notes.md)
*   [`code-review/practice-plan-modal-notes.md`](code-review/practice-plan-modal-notes.md)
*   [`code-review/holistic-summary.md`](code-review/holistic-summary.md) (Key Themes: State Management Complexity & Coupling, Component Design)

**Action Required:**

1.  **Identify Coupled Components:** Review components intended for reuse (especially those in `src/components/practice-plan/`) and modals.
2.  **Refactor Interaction Pattern:** Modify these components to interact via props and events instead of direct store imports:
    *   **Data Input:** Components should receive all necessary data to render via props (e.g., `SectionContainer` receives the `section` object, `DrillItem` receives the `item` object).
    *   **Action Callbacks:** Instead of importing store functions (like `removeItem`, `handleDurationChange`, `handleUngroup`), components should accept callback functions as props (e.g., `onRemove: () => void`, `onDurationChange: (newDuration: number) => void`).
    *   **Event Dispatching:** For actions initiated within the component, use Svelte's `createEventDispatcher` to dispatch events with relevant data (e.g., `dispatch('remove', { itemId: item.id })`).
3.  **Update Parent Components:** Modify the parent components that use these shared components ([`PracticePlanForm`](src/routes/practice-plans/PracticePlanForm.svelte), wizard steps) to:
    *   Pass the required data down as props.
    *   Provide the necessary callback functions as props, wrapping the actual store function calls (e.g., `<DrillItem onRemove={() => sectionsStore.removeItem(...)} />`).
    *   Listen for dispatched events (`on:remove`) and call the appropriate store functions.
4.  **Refactor Modals:** Apply the same principle to modals like [`DrillSearchModal`](src/components/practice-plan/modals/DrillSearchModal.svelte) and [`TimelineSelectorModal`](src/components/practice-plan/modals/TimelineSelectorModal.svelte). Instead of importing store functions, they should dispatch events with the user's selection/action (e.g., `dispatch('addItem', { type: 'break', sectionId: ... })`, `dispatch('saveTimelines', { names: ..., colors: ... })`). The parent component ([`PracticePlanForm`](src/routes/practice-plans/PracticePlanForm.svelte) or wizard step) listens for these events and interacts with the store.
5.  **Test Reusability:** Verify that the refactored shared components can now be used correctly within both the main [`PracticePlanForm`](src/routes/practice-plans/PracticePlanForm.svelte) (interacting with `sectionsStore`) and the Practice Plan Wizard steps (interacting with `sectionsStore` after Ticket 08 is implemented). 