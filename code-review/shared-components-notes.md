## Shared Practice Plan Components & Drag Manager Review

This section reviews components and stores shared between the main Practice Plan form/editor and potentially the wizard or viewer.

**Files Reviewed:**

- `src/lib/stores/dragManager.js`:
  - **Notes:** Orchestrates all drag-and-drop operations for sections, groups (parallel blocks), and individual items (drills/breaks). Manages a central `dragState` store holding information about the source, target, type of drag, and drop position. Uses a combination of indices, item/group IDs, generated element IDs (used as classes), and data attributes (`data-*`) to track elements. Directly interacts with `sectionsStore` to modify the sections array upon a successful `handleDrop` and uses `historyStore` (`addToHistory`) to record changes. Implements visual feedback by adding/removing CSS classes (`dragging`, `drop-before`, `drop-after`, etc.). Includes helper functions for calculating drop position and finding source items using multiple strategies (ID, name, index). Contains significant debugging (`logger.debug`) and some recovery logic (e.g., reading data from `event.dataTransfer` or `dataset` if state seems inconsistent).
  - **Potential Issues:**
    - **High Complexity:** The logic, especially within `handleDrop` and its sub-handlers (`handleItemDrop`, `handleGroupDrop`, `handleSectionDrop`, `handleTimelineDrop`, `handleSameTimelineReordering`), is extremely complex due to the variety of drag types, drop targets (item, group, section, timeline, empty area), and the need to handle nested structures (items within sections, items within timelines within groups). This makes it hard to follow and prone to bugs.
    - **Fragile Tracking:** Relies on a mix of identifiers (sectionIndex, itemIndex, timelineItemIndex, itemId, groupId, data attributes). While attempts are made to use stable IDs (`itemId`), indices are still heavily used. If the underlying `sections` array changes unexpectedly during a drag (perhaps due to a race condition or external update), using indices could lead to incorrect operations. The `findSourceItem` function attempts to mitigate this with fallbacks, but it adds complexity.
    - **Tight Coupling to `sectionsStore`:** Directly imports and modifies the `sections` writable store from `sectionsStore`. This makes `dragManager` unusable with any other state management approach (like the wizard's `wizardStore.sections`) without significant refactoring. It also assumes the structure of the objects within `sectionsStore`.
    - **DOM Dependency/Manipulation:** Relies on `getBoundingClientRect` for drop position calculations and directly manipulates CSS classes on DOM elements for visual feedback. While standard for drag/drop, it adds coupling to specific DOM structures and class names. The `multiPhaseCleanup` function suggests potential issues with reliably removing indicator classes.
    - **`window.__dragManager` Usage:** The store exposes its state via `window.__dragManager`. While useful for debugging, its use within `TimelineColumn.svelte`'s drop handler to _force-update_ the state before calling the main `handleDrop` is a major code smell, suggesting potential state synchronization issues or flaws in the core drop logic.
    - **Debugging Noise:** Extensive `console.log`/`logger.debug` calls remain, indicating the complexity and potential difficulty in debugging this system.
- `src/components/practice-plan/sections/SectionContainer.svelte`:
  - **Notes:** Renders a single practice plan section, including its header (`SectionHeader`) and items. Handles rendering of both individual items (`DrillItem`) and parallel groups (`ParallelGroup`) by iterating through `section.items`. Manages drag-and-drop for the _entire section_ itself (making the section draggable and a drop target for other sections). Also acts as a drop target for items dragged into an empty section.
  - **Store Interaction:** Imports and uses multiple drag handlers from `dragManager`. Imports `removeSection` and `removeItem` directly from `sectionsStore`. `removeSection` is passed to `SectionHeader`, while `removeItem` logic is implicitly passed down to `DrillItem`.
  - **Wizard Compatibility:** **Problematic.** While it receives the `section` object via props (making rendering potentially compatible if the wizard's section structure matches), the direct import and use of `removeSection` and `removeItem` from `sectionsStore` prevents straightforward use with `wizardStore`. The wizard would need to intercept these actions or the component needs refactoring to accept removal callbacks as props.
- `src/components/practice-plan/items/DrillItem.svelte`:
  - **Notes:** Renders a single non-parallel item (drill or break). Handles drag start for the item, passing necessary identifiers (indices, item ID, timeline info) to `dragManager.startItemDrag`. Acts as a drop target for other items (`handleItemDragOver`). Includes functionality to change the item's duration and remove the item. Makes extensive use of `data-*` attributes to store identifiers, likely for recovery/consistency within `dragManager`.
  - **Store Interaction:** Imports and uses drag handlers from `dragManager`. Imports and calls `handleDurationChange` directly from `sectionsStore`. Calls `onRemove` prop for removal.
  - **Wizard Compatibility:** **Problematic.** Similar to `SectionContainer`, the direct import and use of `handleDurationChange` from `sectionsStore` breaks compatibility with `wizardStore`. The component correctly uses an `onRemove` prop, which is good, but duration changes need the same pattern (pass callback via prop) or store refactoring.
- `src/components/practice-plan/items/ParallelGroup.svelte`:
  - **Notes:** Renders a container for a parallel group of items. Determines the group's timelines and calculates a display name. Handles drag start for the _entire group_ and acts as a drop target for other groups/items. Renders `TimelineColumn` components for each timeline within the group. Provides an "Ungroup" button. Calculates timeline durations.
  - **Store Interaction:** Imports and uses drag handlers from `dragManager`. Imports and calls `handleUngroup` directly from `sectionsStore`. Imports and uses duration calculation helpers (`calculateTimelineDurations`) and timeline naming functions/stores (`getTimelineName`, `customTimelineNames`) from `sectionsStore`.
  - **Wizard Compatibility:** **Highly Problematic.** Deeply coupled to `sectionsStore` for ungrouping, duration calculation, and timeline naming. Cannot be used with the wizard's separate state without replicating all this complex logic or refactoring the stores.
- `src/components/practice-plan/items/TimelineColumn.svelte`:
  - **Notes:** Renders a single vertical timeline within a `ParallelGroup`. Filters the section's items to display only those belonging to this timeline and group. Acts as a drop target for items being dragged _into_ this timeline (`handleTimelineDragOver`, `handleDrop`). Displays the timeline name and total duration. Renders `DrillItem` components for the items within it. Contains complex logic within its `on:drop` handler to manually update `dragState` via `window.__dragManager` before calling the main `handleDrop`.
  - **Store Interaction:** Imports and uses drag handlers from `dragManager`. Imports `removeItem` and timeline naming helpers (`getTimelineName`, `customTimelineNames`) from `sectionsStore`. Passes the imported `removeItem` down to `DrillItem` via its `onRemove` prop.
  - **Wizard Compatibility:** **Highly Problematic.** Coupled to `sectionsStore` for item removal and timeline naming. The reliance on `window.__dragManager` in the drop handler is concerning and indicates fragility. Requires significant refactoring for wizard use.

**Overall Conclusion:**

The shared components for displaying and interacting with practice plan sections and items are functional for the main form but suffer from **tight coupling to `sectionsStore` and the complex `dragManager`**. This coupling makes them **unsuitable for direct reuse within the Practice Plan Wizard** as it currently stands with its separate `wizardStore`.

The `dragManager` itself is a major source of complexity and potential fragility. Refactoring the drag-and-drop logic to be less reliant on specific store implementations and potentially simplifying the state tracking could be beneficial.

To enable code sharing and reduce duplication between the main form and the wizard, the primary recommendation remains: **Refactor the state management to use a single source of truth (likely `sectionsStore`, potentially broken down further) for the core plan structure (sections and items), and ensure components receive all necessary data and action callbacks via props rather than importing store functions directly.** This would allow components like `SectionContainer`, `DrillItem`, `ParallelGroup`, and `TimelineColumn` to be truly reusable UI elements, agnostic of whether they are part of the main form or the wizard.

## `src/components/Breadcrumb.svelte`

- **Notes:** This component generates breadcrumb navigation links. It can automatically create segments based on the current URL path (`$page.url.pathname`) or accept a custom array (`customSegments`) for manual control over names and URLs. It includes basic formatting to capitalize kebab-cased segments. Styling is done with Tailwind CSS.
- **Potential Issues:**
  - The automatic segment generation relies heavily on the URL structure matching the desired breadcrumb hierarchy. This can be fragile if route paths change or contain non-human-readable segments (like IDs). The `customSegments` prop provides a necessary escape hatch for these cases.
  - The `formatSegment` function provides basic capitalization for kebab-case but may not handle other naming conventions or complex segments (e.g., UUIDs) well.
  - If a custom segment is provided without a `url`, the link defaults to `href="#"`, which might not be the desired behavior (perhaps it should be non-interactive text).

## `src/components/Cart.svelte`

- **Notes:** This component renders a floating action button (FAB) that displays the number of drills currently in the `cartStore`. Clicking the button reveals a pop-up panel listing the selected drills. Users can remove drills from the list (triggering `cart.toggleDrill`) or click a link to proceed to the practice plan creation page. The panel closes automatically on page navigation or when clicking outside the component.
- **Potential Issues:**
  - **Accessibility:** The pop-up panel is a `div`. For better accessibility, consider using a more semantic structure (like a dialog) or ensuring proper ARIA attributes (`aria-expanded`, `aria-controls`, roles) and focus management are implemented.
  - **Store Interaction:** Uses `cart.toggleDrill` for removal. A dedicated `cart.removeDrill` might offer slightly better semantic clarity, though the current approach works. (See `library-notes.md` on `cartStore.js`).
  - **User Experience:** The automatic closing on navigation is generally sensible for this app's likely workflow but could be inconvenient if users intend to browse multiple pages while building the cart.
  - **Hardcoded Link:** The link `/practice-plans/create` is hardcoded. Using constants or SvelteKit's routing features could improve maintainability.
  - **Missing Feature:** There's no UI element to trigger the `cart.clear()` function, which might be a useful addition.

## `src/components/Comments.svelte`

- **Notes:** This component displays and manages comments for a specific entity (either a drill or a practice plan, determined by the `drillId` or `practicePlanId` prop). It fetches comments from `/api/comments` on mount. Logged-in users can add new comments (POST to `/api/comments`) and delete their own comments (DELETE to `/api/comments`). It uses local `writable` stores for state.
- **Potential Issues:**
  - **Error Handling:** Relies solely on `console.error` for API failures. User-facing feedback (e.g., toasts, inline messages) is missing for errors during fetching, adding, or deleting comments.
  - **Reactivity/Staleness:** Comments are only fetched `onMount`. The list won't update automatically if other users add/delete comments while the component is visible. A refresh mechanism (polling, websockets, manual refresh) would be needed for real-time updates.
  - **Optimistic UI:** Comment additions/deletions update the UI only after successful API confirmation. Optimistic updates could improve perceived performance.
  - **API Coupling:** Tightly coupled to the `/api/comments` endpoint structure.
  - **Prop Handling:** Assumes only one ID prop (`drillId` or `practicePlanId`) will be provided. Explicitly handling edge cases (both/neither) could be slightly more robust, although the `onMount` check covers the 'neither' case.
  - **User State:** The `user` variable is assigned once using `get(page)` and isn't reactive. If the user's login state changes while the component is mounted (unlikely in typical flows), the UI might not update correctly. Using `$: user = $page.data.session?.user;` would be more robust.
  - **Security:** The component relies on the API server for authorization (e.g., ensuring only the owner can delete a comment).

## `src/components/DeletePracticePlan.svelte`

- **Notes:** This component renders a "Delete" button for a practice plan. The button is only visible if the currently logged-in user (`$page.data.session?.user?.id`) matches the `createdBy` prop, or if the application is running in development mode (`dev`). Clicking the button prompts the user for confirmation. If confirmed, it sends a DELETE request to `/api/practice-plans/{planId}`. On success, it calls the `onDelete` callback prop, shows a success toast, and navigates to the practice plans list page (`/practice-plans`) if the user was currently viewing the deleted plan. On failure, it logs the error and shows an error toast.
- **Potential Issues:**
  - **Development Mode Bypass:** Allowing deletion in `dev` mode regardless of `createdBy` might be intended for easier testing, but it's a potential risk if development builds are ever exposed or used with production data. A more explicit admin role check might be safer long-term.
  - **Authorization Assumption:** Relies entirely on the `createdBy` prop being correct and the session data being accurate. The ultimate authorization check should always happen server-side in the API endpoint, which seems to be the case here, but the client-side check could potentially be bypassed.
  - **Error Handling:** Provides user feedback via toasts, which is good. Extracts the error message from the API response if available.
  - **`onDelete` Callback:** The `onDelete` prop allows parent components to react to the deletion (e.g., removing the item from a list) without needing to know the deletion succeeded (as the toast/navigation handles that). This is a decent pattern.
  - **Navigation:** The conditional navigation (`if ($page.url.pathname === ...`) is specific to the detail page. If this component were used elsewhere (e.g., directly in a list item), this navigation wouldn't occur, which might be the intended behavior.

## `src/components/ExcalidrawWrapper.svelte`

- **Notes:**

  - Wraps the `@excalidraw/excalidraw` React component for use in Svelte.
  - Handles loading initial Excalidraw scene data (`data` prop) and saving changes via a `save` event dispatch.
  - Supports `readonly` mode.
  - Provides diagram templates (`blank`, `halfCourt`, `fullCourt`) with predefined court layouts and player positions.
  - Generates a "sidebar" area outside the main canvas containing draggable icons (players, balls, hoops, cones) fetched from `/images/` and converted to base64 data URLs.
  - Implements a fullscreen editing mode, which appears to instantiate a _second_ Excalidraw instance within a modal.
  - Includes utility functions for zooming and centering the canvas content (e.g., `zoomToIncludeAllElements`, `centerAndZoomToGuideRectangle`).
  - Draws a fixed red dashed "guide rectangle" to delineate the main diagram area.
  - Contains logic to try and automatically reposition elements if the guide rectangle drifts from `(0,0)`.
  - Adds workarounds like injecting `window.process.env` for the Excalidraw library and storing `staticPath` alongside image data URLs.

- **Potential Issues:**
  - **Major Complexity:** This component is over 1000 lines long and mixes many concerns: React/Svelte integration, template generation, custom UI elements (sidebar), image fetching/conversion, state synchronization (especially for fullscreen), coordinate manipulation, and workarounds for the underlying library. This makes it very difficult to understand, maintain, and debug.
  - **Performance:**
    - Fetching _all_ sidebar icons and converting them to base64 on _every mount_ via `fetchImageAsDataURL` is likely inefficient, potentially causing slow initial load times and high memory usage. Caching or lazy-loading these assets would be much better.
    - Using two separate Excalidraw instances for normal and fullscreen modes seems resource-intensive and adds complexity for state synchronization.
    - Dispatching `save` on every `onChange` event from Excalidraw could lead to excessive updates; debouncing might be needed.
  - **React Integration:** The dynamic import and manual rendering/unmounting of the React component (`fullscreenExcalidrawComponent`) adds complexity. State synchronization between the Svelte wrapper and the React instances (especially `initialSceneData`) is intricate.
  - **Hardcoded Logic:** Template layouts, element positions, sizes, colors, asset paths, and canvas dimensions are hardcoded throughout, making customization difficult.
  - **Image Handling:** The `fetchImageAsDataURL` logic (HEAD then GET, `console.warn` on errors) could be improved. The need to store `staticPath` suggests potential issues with how image data is handled or persisted by Excalidraw itself.
  - **Workarounds:** Injecting `window.process.env` is a fragile hack. Identifying the guide rectangle by its style properties (`strokeColor`, `strokeStyle`) is brittle.
  - **Maintainability:** Due to its size and mixed concerns, refactoring this component into smaller, more focused modules would significantly improve maintainability. For instance, the template generation, sidebar creation, and image fetching could potentially be separated.
  - **Unused Code:** `openEditor` and `closeEditor` functions seem unused.

## `src/components/FeedbackButton.svelte`

- **Notes:** This is a very simple component. It renders a fixed-position "Feedback" button. Clicking the button sets the `feedbackModalVisible` store to `true`, presumably to open the `FeedbackModal` component (which is also rendered here).
- **Potential Issues:**
  - **Component Placement:** Rendering the `FeedbackModal` directly within the `FeedbackButton` component tightly couples them. It might be cleaner to have a higher-level layout component render the modal conditionally based on the `feedbackModalVisible` store, making the button solely responsible for triggering the state change.
  - **Store Coupling:** Relies directly on the `feedbackModalVisible` store. This is standard Svelte store usage, but as noted in `library-notes.md`, the feedback feature (including this store) appears largely unused or incomplete in the application. If the feedback feature is removed, this component should also be removed.

## `src/components/FilterPanel.svelte`

- **Notes:**
  - A complex component responsible for displaying and managing filters for either Drills or Practice Plans, determined by the `filterType` prop.
  - Uses various Svelte stores (`drillsStore`, `sortStore`, `practicePlanStore`) to manage the state of selected filters (skill levels, complexity, skills, positions, number of people, length, media presence, phase of season, goals, participants).
  - Includes range sliders (`svelte-range-slider-pips`) for numerical ranges and `ThreeStateCheckbox` for multi-state categorical filters (Required/Excluded/Neutral).
  - Handles fetching filter options (like skill levels, complexities) passed down as props.
  - Includes a "Contains Drill" filter for practice plans, involving a debounced search against the `/api/drills/search` endpoint.
  - Updates the URL search parameters (`$page.url.searchParams`) via `goto` upon filter changes (debounced), effectively triggering data reloading on the list pages.
  - Manages the display state (open/closed) of individual filter dropdowns.
  - Includes a "Reset Filters" button.
- **Potential Issues:**
  - **High Complexity & State Management:** Manages a large number of filter states across multiple stores. The interaction logic, especially the `onMount` reactive statement subscribing to many stores and the `updateFilters` function that rebuilds the URL, is complex and potentially hard to debug.
  - **Store Coupling:** Tightly coupled to specific stores (`drillsStore`, `practicePlanStore`, `sortStore`). While necessary for its function, this makes it less reusable in different contexts without these exact stores.
  - **Prop Drilling/Dependencies:** Relies on numerous props (`skillLevels`, `complexities`, etc.) being passed in, likely from the parent page's load function. This creates a dependency chain.
  - **URL Management:** Directly manipulating the URL with `goto` is a common SvelteKit pattern, but the logic to construct the `URLSearchParams` is intricate and specific to the expected API query parameters. Changes in the API or filter requirements would necessitate careful updates here.
  - **UI/UX:**
    - The dropdown behavior (closing others when one opens) is standard but could potentially be slightly annoying if a user wants to compare options across filters.
    - The use of `ThreeStateCheckbox` adds complexity; ensuring users understand the Required/Excluded/Neutral states is important.
    - Error handling for the "Contains Drill" API fetch is limited to `console.error`.
  - **Performance:** The debounced `updateFilters` function helps, but complex filtering logic tied to many reactive store updates could still potentially lead to performance issues on slower devices or with very large filter option sets, although the debouncing mitigates this significantly. The `subscribe` helper function subscribing to many stores at once might trigger the callback more often than strictly necessary if not all store changes actually require a URL update.
  - **Code Duplication:** Some logic is duplicated slightly between the `filterType === 'drills'` and `filterType === 'practice-plans'` blocks (e.g., URL param construction).

## `src/components/LoginButton.svelte`

- **Notes:** A very simple component that conditionally renders either a "Sign in with Google" button or a "Sign out" button based on the presence of `$page.data.session`. Uses `signIn` and `signOut` functions from `@auth/sveltekit/client`.
- **Potential Issues:** None significant. It's straightforward and does its job effectively. Could potentially abstract the provider ('google') if other login methods were added, but not an issue currently.

## `src/components/Spinner.svelte`

- **Notes:** A presentational component for displaying an animated loading spinner. Customizable via props for `size`, `color`, and display mode (`overlay`, `fullScreen`). Uses Tailwind CSS classes for styling.
- **Potential Issues:** None significant. It's a simple, reusable utility component.

## `src/components/ThreeStateCheckbox.svelte`

- **Notes:** Implements a checkbox with three states: Neutral, Required (check mark), and Excluded (cross mark), corresponding to `FILTER_STATES` constants. Used within `FilterPanel`. Clicking cycles through the states. Dispatches state changes via the `onChange` callback prop.
- **Potential Issues:**
  - **Accessibility:** While it uses a `<label>`, the clickable element is a `<div>`. Ensuring this is fully accessible to keyboard users and screen readers might require additional ARIA attributes (e.g., `role="checkbox"`, `aria-checked` appropriately reflecting the tri-state) beyond the `data-testid`. The click handler uses `preventDefault`, which might interfere with standard checkbox interactions if roles were added without careful testing.
  - **User Understanding:** As mentioned for `FilterPanel`, the three states might require clear explanation or context for users to understand their meaning (Include / Exclude / Don't care).

## `src/components/UpvoteDownvote.svelte`

- **Notes:** Allows logged-in users to upvote or downvote a specific Drill or Practice Plan. Fetches current vote counts and the user's existing vote from `/api/votes` on mount. Handles casting new votes, changing votes, and removing votes via POST and DELETE requests to `/api/votes`. Prompts non-logged-in users to log in via Google (`signIn`). Displays the net score (upvotes - downvotes). Uses local `writable` stores for component state. Provides feedback via toasts.
- **Potential Issues:**
  - **API Interaction:** Assumes specific API endpoint structures (`/api/votes`, `/api/votes/user`) and request/response formats. Contains careful ID parsing (`parseInt`) before sending requests. Error handling uses toasts and `console.error`.
  - **User State Reactivity:** Like `Comments.svelte`, it reads `$page.data.session.user` once in the main script block. If the user's login state could somehow change _while this component is mounted_, the UI wouldn't react. Using a reactive declaration (`$: user = $page.data.session?.user;`) would be safer, although likely unnecessary in most practical app flows.
  - **Optimistic UI:** Updates vote counts and the user's vote state _after_ the API call succeeds. An optimistic update (changing the UI immediately and reverting on error) could improve perceived responsiveness.
  - **Error Handling Granularity:** The `castVote` error handling catches errors but bundles different potential failure reasons (invalid ID, network error, API error response) into a generic "Failed to cast vote" message, though it does include the error message text from the catch block. More specific feedback might be helpful.
  - **Prop Handling:** Correctly handles receiving either `drillId` or `practicePlanId`.

---

<!-- Add next component notes above this line -->
