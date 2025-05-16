# Modal Code Review Notes

This file contains notes related to the review of modal components and the files that interact with them.

## `src/components/practice-plan/modals/DrillSearchModal.svelte`

- **Overall:** The component provides functionality to add existing drills, one-off activities, or breaks to a specific section of a practice plan. It includes a search feature for finding drills.
- **Functionality:**
  - Handles adding drills, breaks, and one-off items correctly, interacting with the `sectionsStore`.
  - Includes basic error handling for the search API call using `svelte-toast`.
  - Resets state appropriately when closed.
- **Potential Improvements:**
  - **Debounce Search Input:** The search API is called on every keystroke (`on:input`). Debouncing this would prevent excessive API calls while the user is typing. Consider adding a delay (e.g., 300ms) before triggering the search.
  - **Loading State:** There's no visual indicator while the search results are being fetched. Adding a spinner or loading message would improve user experience.
  - **Accessibility (A11y):** While basic structure seems okay, review for proper focus management (trapping focus within the modal), keyboard navigation (especially for the search results list), and ARIA attributes (`aria-modal`, `aria-labelledby`, etc.) is recommended.
  - **Hardcoded Styles:** Width (`w-[32rem]`), top offset (`top-20`), max-height (`max-h-[400px]`) are hardcoded. Consider using theme variables or constants if applicable.
  - **Tight Coupling:** The modal directly imports and uses functions from `sectionsStore`. This is functional but creates tight coupling. An alternative could be dispatching events with the selected drill/item data and letting the parent component handle the store interaction, which might be slightly more reusable but also more verbose.

## `src/components/practice-plan/modals/EmptyCartModal.svelte`

- **Overall:** A simple modal that informs the user their cart is empty and prompts them to navigate to the drills page or close the modal.
- **Functionality:**
  - Uses a `show` prop for visibility.
  - Provides buttons to navigate to `/drills` or close the modal.
  - Uses `$app/navigation`'s `goto` for navigation.
- **Potential Improvements:**
  - **Dispatch Close Event:** Similar to `DrillSearchModal`, consider dispatching a `close` event instead of relying solely on two-way binding (`bind:show`). This makes the component's intent clearer and decouples it slightly from the parent. The parent would listen for `on:close` and update its state.
  - **Accessibility (A11y):** Ensure proper focus management (trapping focus within the modal), keyboard navigation, and ARIA attributes (`aria-modal`, `aria-labelledby`, `aria-describedby`).
  - **Hardcoded Styles:** Width (`w-96`) and top offset (`top-20`) are hardcoded.
  - **Loading State:** There's no visual indicator while the modal is being fetched. Adding a spinner or loading message would improve user experience.

## `src/components/practice-plan/modals/TimelineSelectorModal.svelte`

- **Overall:** Allows users to select which parallel timelines are active for a practice plan section, rename them, and change their associated colors. Relies heavily on the `sectionsStore` for state.
- **Functionality:**
  - Uses the `selectedTimelines` store (a Set) to track active timelines.
  - Allows editing timeline names and colors via `updateTimelineName` and `updateTimelineColor` from the store.
  - Uses `getTimelineName` and `getTimelineColor` to display current state.
  - Calls `handleTimelineSave` (presumably from the store) when saving changes.
  - Includes small inline dialogs for name editing and color picking.
- **Potential Issues & Improvements:**
  - **State Management Complexity:** The component directly manipulates the imported `PARALLEL_TIMELINES` object and uses a local cache (`timelineNamesCache`) along with reactive statements (`$:`) and even a `setTimeout` to try and force UI updates, particularly for timeline names. This suggests the state management approach might be overly complex or fighting Svelte's reactivity system. Direct mutation of imported objects is generally discouraged; actions should ideally be dispatched to the store, which then updates its own state, triggering reactivity naturally.
  - **Reactivity Workarounds:** The presence of `setTimeout` and manual object recreation (`timelineNamesStore = { ...timelineNamesStore };`) to trigger updates are strong indicators of potential issues in how state changes are propagated or how components are reacting to store updates. This should be refactored for a cleaner approach relying on Svelte's built-in reactivity.
  - **Tight Coupling:** Like `DrillSearchModal`, this modal is tightly coupled to `sectionsStore`, importing many specific functions and variables. Refactoring to use dispatched events for actions like 'save', 'updateName', 'updateColor' could improve decoupling, though it might increase boilerplate.
  - **Accessibility (A11y):**
    - Ensure focus is trapped within the modal.
    - The color picker needs to be keyboard navigable and selectable. Buttons made of `div`s or simple elements need `role="button"` and keyboard event handlers (Enter/Space).
    - The "Rename" input field should have an associated `<label>` (possibly visually hidden).
    - Verify ARIA attributes (`aria-modal`, `aria-labelledby`, etc.).
  - **User Feedback:** What happens if `handleTimelineSave()` returns `false`? The modal doesn't close, but does the user get any feedback explaining why? Consider adding a toast notification on failure.
  - **Hardcoded Styles:** Width (`w-[32rem]`), top offset (`top-20`).
  - **Debugging Code:** Leftover `console.log` statements should be removed.
  - **Repetitive Logic:** The pattern `timelineNamesStore ? getTimelineName(key) : PARALLEL_TIMELINES[key].name` appears multiple times. This might be simplified if the underlying state management were cleaner.

## `src/components/FeedbackModal.svelte`

- **Overall:** A modal for submitting quick feedback (bug, feature request, general). It collects the feedback type, text, user agent, and current page. It also loads and potentially refreshes a list of existing feedback items.
- **Functionality:**
  - Uses the `feedbackModalVisible` store (a boolean writable) to control visibility.
  - Submits feedback to the `/api/feedback` endpoint.
  - Fetches existing feedback from the same endpoint on mount and after submission.
  - Uses `$app/environment` to check if running in the browser.
  - Uses `$app/stores` to get the current page path.
  - Provides a link to navigate to a more detailed `/feedback` page.
- **Potential Issues & Improvements:**
  - **Error Handling:** The `submitFeedback` function uses `alert()` for error reporting. This is generally disruptive and should be replaced with a less intrusive method, like a toast notification or displaying an error message within the modal.
  - **State Management:** Visibility is controlled directly via the `feedbackModalVisible` store. While functional, dispatching a `close` event is often a cleaner pattern for modals, as mentioned for other modals.
  - **Redundant Load:** The `loadFeedback` function is called on mount _and_ after successful submission. If the modal is intended only for _submitting_ quick feedback, loading the entire feedback list within this component might be unnecessary overhead, especially if the list isn't displayed here. The loading should likely happen on the main `/feedback` page or wherever the `feedbackList` is actually displayed. If the goal is just to _trigger_ a refresh elsewhere, a different mechanism (like a separate event or store update) might be better.
  - **Unused Variables:** `name` and `email` variables are declared but never used or collected from the user in this modal. They should be removed if not needed.
  - **Accessibility (A11y):**
    - Needs focus trapping.
    - The main container `div` could benefit from `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` (pointing to the `h2`).
    - The `<select>` and `<textarea>` should have associated `<label>`s (can be visually hidden if needed).
  - **Hardcoded Styles:** Max width (`max-w-md`).

## `src/routes/practice-plans/PracticePlanForm.svelte` (Modal User)

- **Overall:** This is a complex form component responsible for creating and editing practice plans. It integrates multiple stores (`practicePlanStore`, `sectionsStore`, `cartStore`, `historyStore`) and handles user authentication state, dynamic editor loading (TinyMCE), and interaction with several modals.
- **Modal Usage (`EmptyCartModal`, `DrillSearchModal`, `TimelineSelectorModal`):**
  - **Visibility Control:** Uses local boolean variables (`showEmptyCartModal`, `showDrillSearch`, `showTimelineSelector`) bound to each modal's `show` prop using `bind:show`. This is a standard Svelte pattern.
  - **Triggering:** Modals are triggered based on specific conditions (`EmptyCartModal` on mount if cart is empty) or events bubbled up from child components (`SectionContainer` emits `openDrillSearch` and `openTimelineSelector`).
  - **Data Passing:** Passes `selectedSectionId` to `DrillSearchModal` using `bind:selectedSectionId` to tell the modal which section to add items to.
  - **Interaction Pattern:** Relies on the modals themselves to set their internal `show` state to `false` upon closing, which updates the bound variable in `PracticePlanForm`. While functional, the alternative pattern (modal dispatches `close`, parent listens with `on:close`) could offer slightly clearer separation of concerns, though it adds verbosity. The current implementation is acceptable.
- **Other Notes:**
  - **Login Persistence:** Uses `sessionStorage` to persist form data (`pendingPracticePlanData`) and plan ID for association (`practicePlanToAssociate`) across Google login redirects. This is a practical solution for handling OAuth flows within a complex form. Ensure the stored data size remains within `sessionStorage` limits.
  - **Complexity:** The component manages a significant amount of state and logic. The modal interactions themselves are relatively straightforward parts of this larger system.
  - **History Management:** Correctly integrates undo/redo functionality from `historyStore`.

## `src/components/FeedbackButton.svelte` (Modal User)

- **Overall:** A simple component that displays a fixed-position button to trigger the feedback modal.
- \*\*Modal Interaction (`FeedbackModal`):
  - Imports and renders the `<FeedbackModal />` component directly.
  - Imports the `feedbackModalVisible` writable store.
  - On button click, it sets `feedbackModalVisible` to `true`. The visibility logic is handled within `FeedbackModal` by subscribing to this store.
- **Potential Improvements:**
  - **Decoupling/Placement:** It's generally better practice to place singleton modals like `FeedbackModal` higher in the component tree (e.g., in `+layout.svelte`). The button component would then only need to interact with the store (`feedbackModalVisible.set(true)`) on click, rather than importing and rendering the modal itself. This improves separation of concerns and prevents potential issues if the button component were ever used multiple times.
  - **Positioning:** The hardcoded `fixed bottom-4 left-4` might interfere with other UI elements. Consider if this positioning is universally appropriate or if it should be configurable or context-dependent.
