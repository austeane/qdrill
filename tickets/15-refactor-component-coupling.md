# Ticket 15: Decouple Shared Components from Stores

**Priority:** Medium

**Status:** In Progress

**Current State:** Shared components in the practice plan feature now receive data via props and communicate actions through events. Direct calls to `sectionsStore` have been removed from the main item and section components. Drag-and-drop handlers from `dragManager` are still imported directly. `TimelineSelectorModal` imports constants from `sectionsStore`, and `SectionHeader.svelte` still calls `handleTimelineSelect`.

**Affected Files:**

- [`src/lib/components/practice-plan/sections/SectionContainer.svelte`](src/lib/components/practice-plan/sections/SectionContainer.svelte)
- [`src/lib/components/practice-plan/items/DrillItem.svelte`](src/lib/components/practice-plan/items/DrillItem.svelte)
- [`src/lib/components/practice-plan/items/ParallelGroup.svelte`](src/lib/components/practice-plan/items/ParallelGroup.svelte)
- [`src/lib/components/practice-plan/items/TimelineColumn.svelte`](src/lib/components/practice-plan/items/TimelineColumn.svelte)
- [`src/lib/components/practice-plan/modals/DrillSearchModal.svelte`](src/lib/components/practice-plan/modals/DrillSearchModal.svelte)
- [`src/lib/components/practice-plan/modals/TimelineSelectorModal.svelte`](src/lib/components/practice-plan/modals/TimelineSelectorModal.svelte)
- [`src/lib/components/practice-plan/sections/SectionHeader.svelte`](src/lib/components/practice-plan/sections/SectionHeader.svelte)

**Related Notes:**

- [`code-review/shared-components-notes.md`](code-review/shared-components-notes.md)
- [`code-review/practice-plan-modal-notes.md`](code-review/practice-plan-modal-notes.md)
- [`code-review/holistic-summary.md`](code-review/holistic-summary.md) (Key Themes: State Management Complexity & Coupling, Component Design)

**Action Required:**

1.  ~~**Identify Coupled Components:** Review components intended for reuse (especially those in `src/components/practice-plan/`) and modals.~~ **Done**
2.  ~~**Refactor Interaction Pattern:** Modify these components to interact via props and events instead of direct store imports:~~ **Done**
    - **Data Input:** Components should receive all necessary data to render via props (e.g., `SectionContainer` receives the `section` object, `DrillItem` receives the `item` object).
    - **Action Callbacks:** Instead of importing store functions (like `removeItem`, `handleDurationChange`, `handleUngroup`), components should accept callback functions as props (e.g., `onRemove: () => void`, `onDurationChange: (newDuration: number) => void`).
    - **Event Dispatching:** For actions initiated within the component, use Svelte's `createEventDispatcher` to dispatch events with relevant data (e.g., `dispatch('remove', { itemId: item.id })`).
3.  ~~**Update Parent Components:** Modify the parent components that use these shared components ([`PracticePlanForm`](src/routes/practice-plans/PracticePlanForm.svelte), wizard steps) to:~~ **Done**
    - Pass the required data down as props.
    - Provide the necessary callback functions as props, wrapping the actual store function calls (e.g., `<DrillItem onRemove={() => sectionsStore.removeItem(...)} />`).
    - Listen for dispatched events (`on:remove`) and call the appropriate store functions.
4.  ~~**Refactor Modals:** Apply the same principle to modals like [`DrillSearchModal`](src/components/practice-plan/modals/DrillSearchModal.svelte) and [`TimelineSelectorModal`](src/components/practice-plan/modals/TimelineSelectorModal.svelte). Instead of importing store functions, they should dispatch events with the user's selection/action (e.g., `dispatch('addItem', { type: 'break', sectionId: ... })`, `dispatch('saveTimelines', { names: ..., colors: ... })`). The parent component ([`PracticePlanForm`](src/routes/practice-plans/PracticePlanForm.svelte) or wizard step) listens for these events and interacts with the store.~~ **Done**
5.  **Test Reusability:** Verify that the refactored shared components can be used within both the main [`PracticePlanForm`](src/routes/practice-plans/PracticePlanForm.svelte) and the Practice Plan Wizard steps. Consider abstracting drag handlers to reduce coupling to `dragManager`.
