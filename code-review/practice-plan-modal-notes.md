## Practice Plan Modals Review

This section reviews the modal components used within the practice plan features.

**Files Reviewed:**

- `src/components/practice-plan/modals/DrillSearchModal.svelte`:

  - **Notes:** This modal provides options for adding items to a specific practice plan section (`selectedSectionId` prop). It allows:
    1.  Adding a standard break (`addBreak` from `sectionsStore`).
    2.  Adding a one-off, named activity (`addOneOffDrill` from `sectionsStore`).
    3.  Searching for existing drills via the `/api/drills/search` endpoint and adding a selected drill (`addDrillToPlan` from `sectionsStore`).
        The modal clears its state and dispatches a `close` event when an item is added or the close button is pressed. Uses toasts for error feedback.
  - **Potential Issues:**
    - **Store Coupling:** Directly imports and calls functions (`addBreak`, `addDrillToPlan`, `addOneOffDrill`) from `sectionsStore`. This prevents reuse in contexts that don't use this specific store (like the wizard). Refactoring to dispatch events with the necessary data (e.g., `{ type: 'addBreak', sectionId: selectedSectionId }`) or accept callbacks via props would improve reusability.
    - **API Error Handling:** The `searchDrills` function catches errors and shows toasts but only logs details to the console. More specific user feedback could be helpful depending on the error type (e.g., distinguishing between "not found" and "server error").
    - **Input Validation:** Basic check for empty one-off activity name exists, which is good.
    - **UI:** The search results list shows an "Add" button next to each drill. Clicking anywhere on the list item also triggers the add action, which is convenient but might slightly violate the principle of least surprise for some users.

- `src/components/practice-plan/modals/EmptyCartModal.svelte`:

  - **Notes:** A simple modal displayed when a user tries to create a practice plan without any drills in their cart. It informs the user and provides two actions: "Go to Drills" (navigates to `/drills` using `goto`) and "Exit" (closes the modal). Controlled by the `show` prop.
  - **Potential Issues:**
    - **Hardcoded Route:** The navigation target `/drills` is hardcoded. Using a constant or a route mapping might be slightly more maintainable if routes change frequently, but it's a minor point.
    - **No Event Dispatch:** Closing the modal only sets `show = false`. It doesn't dispatch a `close` event, which might be inconsistent with other modals if the parent component relies on events. However, since the parent likely controls the `show` prop directly, this might be intentional.

- `src/components/practice-plan/modals/TimelineSelectorModal.svelte`:
  - **Notes:** This modal allows users to select which parallel timelines are active (`selectedTimelines` store) and configure their names (`customTimelineNames` store) and colors (`updateTimelineColor`). It iterates through `PARALLEL_TIMELINES` (from `sectionsStore`) to display options. Uses helper functions from `sectionsStore` (`getTimelineName`, `getTimelineColor`, `updateTimelineName`, `updateTimelineColor`, `handleTimelineSave`, `debugTimelineNames`). Contains local state to manage the UI for editing names/colors (`activeTimeline`, `showColorPicker`, `showNameEditor`, `editingName`). Includes considerable debugging logs and some potentially complex logic to ensure reactivity when names/colors change, including attempts to force component updates.
  - **Potential Issues:**
    - **Heavy Store Coupling:** Deeply intertwined with `sectionsStore` constants, stores, and functions. This makes it entirely dependent on that store and unsuitable for reuse elsewhere. Configuration logic (like managing custom names/colors) should ideally be encapsulated within the store itself or passed via props/events.
    - **State Management Complexity:** Managing the selection state (`selectedTimelines`), custom names (`customTimelineNames`), and colors involves multiple stores and local component state. The logic to keep the UI synchronized, especially the name display and editor (`timelineNamesStore`, `editingName`, `getTimelineName`, `PARALLEL_TIMELINES[key].name` updates), seems overly complex and potentially fragile. The use of `setTimeout` to force updates is a strong indicator of potential issues in reactivity management.
    - **Reactivity Issues?:** The numerous `console.log` statements related to debugging name updates and forcing reactivity suggest that achieving the desired state synchronization was challenging. Relying on manual updates to the local `PARALLEL_TIMELINES` object and `setTimeout` is brittle. Svelte's reactivity should handle this more cleanly if the stores and components are structured appropriately. Perhaps the issue lies in mutating objects/arrays within stores without triggering updates correctly, or complex dependencies between derived state and store updates.
    - **UI/UX:** The flow of selecting a timeline, then clicking separate "Rename" or "Color" buttons which reveal inline editors/pickers, is functional but could potentially be streamlined.
    - **Color Validation:** Includes a check to ensure the selected color is valid, which is good defensive programming.

---

<!-- Add next component notes above this line -->
