## Practice Plan Wizard Feature Review

This section reviews the code related to creating practice plans using the step-by-step wizard interface.

**Files Reviewed:**

*   `src/lib/stores/wizardStore.js`:
    *   **Notes:** Manages the state for the practice plan wizard. Uses `writable` stores for `currentStep`, `maxStep`, `planDetails` (basic info like name, description, etc.), `selectedDrills` (array of drill objects), `sections` (the core structure, similar to `sectionsStore`), and UI state like `isLoading`. It also directly imports and uses `practicePlanStore` and `sectionsStore` for initialization and final submission, acting as a bridge. Includes logic for navigation (`nextStep`, `prevStep`, `goToStep`), data initialization (`initializeWizard`, `resetWizard`), and the final submission (`submitPlan`). The `submitPlan` function essentially transfers the wizard's state (`planDetails`, `sections`) into the main `practicePlanStore` and `sectionsStore` and then calls the `submitPracticePlan` function from `practicePlanStore`. Helpers exist for managing selected drills (`addDrill`, `removeDrill`).
    *   **Potential Issues:**
        *   **Dual State Management:** The wizard maintains its own `sections` store *and* interacts with the global `sectionsStore`. This is confusing and potentially error-prone. State is copied between them during initialization and submission. This suggests the wizard was possibly built separately and then integrated, but the dual state isn't ideal. Why not have the wizard directly manipulate the main `sectionsStore`?
        *   **Coupling:** Tightly coupled to `practicePlanStore` and `sectionsStore` for the final submission step. This makes it difficult to understand the flow without looking at all three stores.
        *   **State Synchronization:** If a user were somehow able to navigate between the wizard and the main form (unlikely but possible), the state could become desynchronized due to the separate `sections` stores.
        *   **Reset Logic:** `resetWizard` aims to clear the state, but it manually resets individual stores. It also calls `practicePlanStore.resetForm()` and `sectionsStore.resetSections()`, further highlighting the intertwined state. Ensuring a complete reset across all involved stores needs careful verification.
*   `src/lib/stores/wizardValidation.js`:
    *   **Notes:** Provides validation logic specifically for the wizard steps. Exports `writable` stores for errors related to each step (`basicInfoErrors`, `drillsErrors`, `sectionsErrors`, `timelineErrors`). Contains validation functions (`validateBasicInfo`, `validateDrills`, `validateSections`, `validateTimeline`) that check the data held in `wizardStore` and update the corresponding error stores. A `validateStep` function acts as a dispatcher, calling the appropriate validation function based on the current step.
    *   **Potential Issues:**
        *   **Duplicated Validation Logic:** The validation rules (e.g., checking for plan name, non-empty sections) likely overlap significantly with the validation performed in `practicePlanStore`'s `validateForm` and `submitPracticePlan` functions (and potentially server-side validation). This duplication increases maintenance overhead.
        *   **Separation:** While separating validation is good, having it tightly coupled to `wizardStore` means it cannot easily be reused for the main form.
        *   **Completeness:** Need to ensure the validation rules here are consistent with the rules enforced during the final submission via `practicePlanStore`.
*   `src/routes/practice-plans/wizard/+layout.svelte`:
    *   **Notes:** Provides the main structure for the wizard interface. Displays navigation controls (Previous/Next/Finish buttons) and a progress indicator (Steps). Uses `wizardStore` extensively to determine the current step, maximum step reached, disable/enable navigation buttons, and trigger navigation/submission actions (`prevStep`, `nextStep`, `submitPlan`). Uses `wizardValidation` to check step validity before allowing progression (`validateStep`). Includes `onMount` logic to initialize the wizard (`initializeWizard`) potentially from `page.data` (though the corresponding server load function doesn't seem to pass initial data). Includes keyboard shortcuts for navigation. Uses `onDestroy` to call `resetWizard`.
    *   **Potential Issues:**
        *   **Initialization Logic:** The `onMount` calls `initializeWizard($page.data.practicePlan)`. However, `/practice-plans/wizard/+page.server.js` doesn't load a `practicePlan`. This suggests either dead code or reliance on data being loaded differently (perhaps if navigating *to* the wizard from an existing plan, which isn't a standard flow). If starting fresh, `$page.data.practicePlan` would be undefined, and `initializeWizard` needs to handle that gracefully (which it seems designed to do).
        *   **Tight Coupling:** Highly coupled to `wizardStore` and `wizardValidation` for its entire operation.
        *   **Reset on Destroy:** Calling `resetWizard` in `onDestroy` ensures cleanup when navigating away *from* the wizard layout entirely. This is generally good, but assumes the wizard state isn't needed elsewhere (e.g., if a background submission was intended).
*   `src/routes/practice-plans/wizard/+page.server.js`:
    *   **Notes:** Seems minimal. It currently only returns an empty object. It doesn't appear to load any prerequisite data for the wizard itself.
    *   **Potential Issues:**
        *   As noted above, the layout seems to expect potential `practicePlan` data, which isn't provided here. If initialization data *is* needed (e.g., shared filter options, user defaults), it should be loaded here.
*   `src/routes/practice-plans/wizard/+page.svelte`:
    *   **Notes:** Acts as the main container for the wizard steps. Uses an `{#if ...}` block based on `$wizardStore.currentStep` to conditionally render the component corresponding to the current step (`BasicInfoStep`, `DrillsStep`, `SectionsStep`, `TimelineStep`, `OverviewStep`). Imports the step components.
    *   **Potential Issues:**
        *   Simple container, no major issues beyond inheriting dependencies from the layout and child steps.
*   `src/routes/practice-plans/wizard/basic-info/+page.svelte`:
    *   **Notes:** Implements the first step of the wizard. Provides input fields for Plan Name, Description (using TinyMCE dynamically imported), Phase of Season, Practice Goals, Estimated Participants, and Visibility (Public/Unlisted). Binds input values directly to the `$wizardStore.planDetails` object's properties. Displays validation errors from `$wizardValidation.basicInfoErrors`. Uses helper functions from `practicePlanStore` for managing `practiceGoals` array (`addPracticeGoal`, `removePracticeGoal`).
    *   **Potential Issues:**
        *   **Direct Store Mutation:** Binds directly to properties within the `$wizardStore.planDetails` object (e.g., `bind:value={$wizardStore.planDetails.name}`). While convenient in Svelte, complex state objects in stores are often better managed via update functions within the store to encapsulate logic, especially if side effects or validation need to occur on change.
        *   **Using `practicePlanStore` Helpers:** Calls `addPracticeGoal`/`removePracticeGoal` directly from `practicePlanStore`, but the state being modified is `$wizardStore.planDetails.practice_goals`. This is inconsistent. The wizard should either use its own goal management logic updating its own state, or the stores need refactoring so goal management isn't duplicated/confused.
        *   **TinyMCE:** Similar to `PracticePlanForm`, integrates TinyMCE. Ensure API key is handled.
*   `src/routes/practice-plans/wizard/drills/+page.server.js`:
    *   **Notes:** Loads *all* drills via the API (`/api/drills?all=true`), similar to the `create/+page.server.js` for the main form. This data is used for the drill selection UI in the corresponding Svelte page.
    *   **Potential Issues:**
        *   **Scalability:** Fetching all drills is inefficient for large drill libraries. A server-side search/filter mechanism for drills is needed here, just like in the main form's context.
*   `src/routes/practice-plans/wizard/drills/+page.svelte`:
    *   **Notes:** Implements the drill selection step. Displays available drills (loaded from `+page.server.js`) and the list of currently selected drills (from `$wizardStore.selectedDrills`). Allows users to search/filter available drills (client-side). Provides buttons to add/remove drills, calling `wizardStore.addDrill` and `wizardStore.removeDrill`. Displays validation errors from `$wizardValidation.drillsErrors`. Uses a `DrillCard` component for display.
    *   **Potential Issues:**
        *   **Client-Side Filtering:** Filtering the loaded drills happens client-side, which won't scale well if the server loads all drills. Needs server-side filtering integrated with the UI.
        *   **Data Structure:** Assumes the structure of `data.drills` from the load function and the structure within `$wizardStore.selectedDrills`.
*   `src/routes/practice-plans/wizard/sections/+page.svelte`:
    *   **Notes:** Allows the user to organize the selected drills (`$wizardStore.selectedDrills`) into sections. Displays the current sections structure from `$wizardStore.sections`. Allows adding/removing sections and dragging drills from the "Selected Drills" list into sections. Uses components like `SectionContainer` (likely shared with the main form). It seems to directly manipulate the `$wizardStore.sections` array.
    *   **Potential Issues:**
        *   **Complex State Manipulation:** Directly manipulating the nested `$wizardStore.sections` array for adding/removing sections and items via drag-and-drop can be complex and error-prone, especially ensuring immutable updates. This likely duplicates logic found in `sectionsStore.js`.
        *   **Reusing `SectionContainer`:** Assumes `SectionContainer` can work with the `$wizardStore.sections` structure, which might differ subtly from the `$sectionsStore.sections` structure it was likely designed for. Needs verification.
        *   **Drag and Drop:** Relies on drag-and-drop interactions, which need robust implementation. Potential dependency on `dragManager.js` or similar stores needs checking.
*   `src/routes/practice-plans/wizard/timeline/+page.svelte`:
    *   **Notes:** Focuses on arranging items within sections onto timelines, particularly handling parallel groups. It likely displays the sections and items from `$wizardStore.sections` using components that visualize timelines (`TimelineColumn`?, `ParallelGroup`?). Users can probably drag items between timelines or create/manage parallel groups. Needs components to manage custom timeline names/colors (potentially reusing logic/state from `sectionsStore`). Displays validation errors from `$wizardValidation.timelineErrors`.
    *   **Potential Issues:**
        *   **Highest Complexity:** This step mirrors the most complex part of the main `PracticePlanForm` and `sectionsStore` – managing the nested structure with parallel items and timelines. Implementing this correctly based on `$wizardStore.sections` likely involves significant duplicated or adapted logic from `sectionsStore`.
        *   **State Synchronization/Duplication:** This is where the problems of having a separate `$wizardStore.sections` store become most apparent. The complex logic for parallel groups, timeline durations, etc., present in `sectionsStore`, would need to be replicated or the wizard needs to directly use `sectionsStore`.
*   `src/routes/practice-plans/wizard/overview/+page.svelte`:
    *   **Notes:** Provides a summary of the plan created through the previous steps. Displays basic info (`$wizardStore.planDetails`) and the sections/items (`$wizardStore.sections`). Likely uses read-only versions of components used in the view/edit pages (`Timeline`?, `Section`?). This is the final step before submitting via the layout's "Finish" button.
    *   **Potential Issues:**
        *   **Data Display:** Needs to correctly interpret and display the final state held in `wizardStore`. Potential for discrepancies if the structure differs from what display components expect.

**Comparison: Wizard vs. Cart-Based Form (`PracticePlanForm.svelte`)**

*   **Core Logic Duplication:** Both methods ultimately need to:
    *   Collect basic plan details (name, description, goals, etc.).
    *   Select drills.
    *   Organize drills into sections and timelines (including parallel items).
    *   Validate the data.
    *   Format the data for the API.
    *   Submit the data to the `/api/practice-plans` endpoint.
    *   The wizard duplicates significant amounts of this logic, especially around state management (`wizardStore` vs. `practicePlanStore`/`sectionsStore`), validation (`wizardValidation` vs. `practicePlanStore`), and UI for section/timeline manipulation.
*   **State Management:**
    *   **Cart:** Uses `practicePlanStore` (for basic info/submission) and `sectionsStore` (for complex section/item structure), with `PracticePlanForm` coordinating and initializing from props or `cartStore`. Suffers from bloated stores (`practicePlanStore` doing too much) and the complexity of `sectionsStore`.
    *   **Wizard:** Introduces `wizardStore` and `wizardValidation`. `wizardStore` holds most of the state during creation *but* relies on `practicePlanStore`/`sectionsStore` for helpers (goals) and the final submission, creating confusing coupling and state duplication (especially for sections).
*   **User Experience:**
    *   **Cart:** Single, potentially overwhelming form. Allows seeing everything at once. Undo/redo is implemented (though complex). Initial state comes from a separate "cart" concept.
    *   **Wizard:** Step-by-step, guided process. Might be simpler for new users. Breaks down complexity. No obvious undo/redo across steps. State persists between steps via `wizardStore`.
*   **Initialization:**
    *   **Cart:** Can start blank or be initialized from `cartStore` (for create) or `practicePlan` prop (for edit).
    *   **Wizard:** Starts blank (via `initializeWizard`/`resetWizard`). Initialization seems less flexible than the main form.

**Potential Abstractions & Refactoring Suggestions:**

1.  **Consolidate State Management:** The biggest issue is the duplicated state, especially for sections.
    *   **Option A (Preferred):** Eliminate `wizardStore.sections`. Have the wizard steps directly read from and write to the single `sectionsStore`. This requires `sectionsStore` to be robust enough to handle partial updates as the wizard progresses. `wizardStore` would then only manage `currentStep`, `planDetails`, `selectedDrills` (maybe), and wizard-specific UI state.
    *   **Option B:** Keep `wizardStore.sections` but make the synchronization explicit and one-way *into* `sectionsStore` only at the *very end* during submission prep. This avoids complexity during wizard steps but still feels suboptimal.
2.  **Refactor `practicePlanStore`:** As noted in `practice-plan-notes.md`, this store does too much (form fields, filters, submission logic, utils). Break it down:
    *   `practicePlanMetadataStore`: Handles `name`, `description`, `goals`, `visibility`, etc.
    *   `practicePlanFilterStore`: Handles filter state for the list view.
    *   Keep `sectionsStore` for the complex section/item structure.
    *   Move submission logic (`submitPracticePlan`) to SvelteKit Form Actions on the respective forms (`PracticePlanForm`, wizard layout) or a dedicated API service module. This decouples stores from API calls/navigation/toasts.
3.  **Unify Validation:** Create a shared validation module/library.
    *   Define validation rules (using a schema library like Zod or Yup, or just plain functions) independent of stores.
    *   Both the main form and the wizard validation logic (`wizardValidation.js`) can import and use these common rules, applying them to their respective state sources (`practicePlanMetadataStore`/`sectionsStore` or `wizardStore`).
    *   Validation errors could be managed closer to the components or via derived stores based on the primary state stores + validation rules.
4.  **Share Components:** Ensure components like `SectionContainer`, `TimelineColumn`, `ParallelGroup`, `DrillCard` are truly reusable and can work with the data structure from the (ideally unified) `sectionsStore`. Pass necessary callbacks for actions (add/remove/move items).
5.  **Abstract API Interaction:** Create a `practicePlanApiService.js` module that handles all `fetch` calls to the practice plan API endpoints. Both the main form's submission logic (wherever it ends up) and the wizard's `submitPlan` function would use this service.
6.  **Address Scalability:** Implement server-side filtering and pagination for drill selection in both the wizard (`drills/+page.server.js`) and the main form (`create/+page.server.js` / `DrillSearchModal`).

By unifying state management (especially for sections), centralizing validation, abstracting API calls, and refactoring the bloated `practicePlanStore`, both the cart-based form and the wizard can become simpler, share more code, and be easier to maintain. The choice between wizard and single form then becomes purely a UX decision, leveraging the same underlying core logic.