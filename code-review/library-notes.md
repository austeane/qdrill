# Library Code Review Notes

This file contains notes on the review of the `src/lib` directory, evaluating code structure, potential issues, and usage.

## `src/lib/__mocks__`

*   `environment.js`, `navigation.js`, `stores.js`
    *   **Notes:** These files provide mock implementations for SvelteKit's environment variables (`$app/environment`), navigation functions (`$app/navigation`), and stores (`$app/stores`). They export simple constants or no-op functions, suitable for isolating components or functions during unit testing (e.g., with Vitest).
    *   **Potential Issues:** None apparent. They serve their purpose as simple mocks for testing environments where the actual SvelteKit modules aren't available or needed. Standard practice for unit testing. Marked as reviewed (`✅*`) in `code-review.md`.

## `src/lib/constants/skills.js`

*   **Notes:** Exports a single constant array `PREDEFINED_SKILLS` containing a list of strings representing various skills relevant to the application domain (presumably sports drills).
*   **Potential Issues:**
    *   **Hardcoded:** The list is hardcoded. If these skills need to be managed (added/edited/deleted) dynamically, they should be moved to the database and fetched via an API/service. However, for a stable, predefined list, this approach is acceptable.
    *   **Usage:** Checked previously via `grep_search`. It's used in the Skills API (`api/skills/+server.js`), Drill Form (`routes/drills/DrillForm.svelte`), bulk upload (`api/drills/bulk-upload/+server.js`), and initializing the `drillsStore`. Seems appropriately used.

## `src/lib/constants.js`

*   **Notes:** Exports a single constant object `FILTER_STATES` with string values representing the three possible states for filter controls (`neutral`, `required`, `excluded`).
*   **Potential Issues:**
    *   **Usage:** Checked previously via `grep_search`. It's widely used in components dealing with filtering logic, such as `FilterPanel.svelte`, `ThreeStateCheckbox.svelte`, `practicePlanStore.js`, `drillsStore.js`, and various page components (`practice-plans/+page.svelte`). This ensures consistency in filter state representation. Seems appropriate.

## `src/lib/server/db.js`

*   **Notes:** Manages the application's PostgreSQL connection pool using the `pg` library. Implements a singleton pattern for the pool (`getPool`). Exports an async `query` function for executing parameterized queries, which handles client connection acquisition and release. Also exports `getClient` for obtaining a client instance directly (necessary for manual transaction management) and `cleanup` (currently a no-op, intended for request-specific resource cleanup) and `end` (for gracefully closing the pool). Includes basic error handling for idle clients. Connection parameters are taken from `process.env.POSTGRES_URL`. Sets pool limits (`max: 10`).
*   **Potential Issues:**
    *   **`end()` Usage:** The `end()` function, intended for graceful shutdown, appears **unused**. While Node.js might terminate connections on exit, explicitly calling `end()` during application shutdown (e.g., via process signal handlers) is best practice to ensure the pool drains correctly.
    *   **`cleanup()` Purpose:** The `cleanup()` function is a no-op. Its intended purpose isn't clear from the code or comments ("request-specific cleanup"). If it's meant to be used (e.g., in `hooks.server.js`), it should either have functionality or be removed. Currently, its usage in `hooks.server.js` does nothing.
    *   **Error Handling:** Pool error handling (`pool.on('error', ...)`) logs the error but sets `pool = null`. While this might trigger pool recreation on the next `getPool()` call, it could be more robust (e.g., attempting reconnection or implementing circuit breaking). Query error handling in the `query` function logs the error and re-throws, allowing callers to handle it, which is good.
    *   **Configuration:** Pool settings (`max`, `idleTimeoutMillis`, etc.) are hardcoded. Making these configurable via environment variables might be beneficial. SSL is configured with `rejectUnauthorized: false`, which might be necessary for certain hosting providers (like Vercel Postgres) but implies less strict security; ensure this is the intended configuration.

## `src/lib/server/auth.js`

*   **Notes:** Configures and exports Auth.js (formerly NextAuth.js) functionality for SvelteKit using `@auth/sveltekit`. Sets up the Google OAuth provider using client ID/secret from environment variables. Configures the Postgres adapter (`@auth/pg-adapter`) to interact with the database, passing it the custom `query` function from `./db.js`. Defines a `session` callback to include the user's database `id` in the session object, making it available in `locals.session`. Sets `trustHost: true` (common for SvelteKit deployments) and `secret` from environment variables. Includes a placeholder `signIn` callback. Enables debug mode.
*   **Potential Issues:**
    *   **Callbacks:** The `signIn` callback currently just returns `true`. Depending on requirements, this could be used for custom logic like restricting sign-ins based on email domain or creating associated user profiles in other tables on first sign-in.
    *   **Adapter Query Mapping:** The adapter configuration manually maps the `db.js` `query` function's return shape (`{ rows, rowCount }`) to what the adapter expects. Ensure this mapping remains compatible if the `db.js` or `@auth/pg-adapter` changes.
    *   **Debug Mode:** `debug: true` is enabled, which is useful in development but should generally be **disabled in production** to avoid leaking sensitive information in logs.

## `src/lib/server/authGuard.js`

*   **Notes:** Provides a higher-order function `authGuard` intended to wrap SvelteKit `load` functions or API route handlers. It retrieves the user session from `event.locals.getSession()`. If no session or user exists, it throws a 401 Unauthorized error using SvelteKit's `error` helper. Otherwise, it calls the original handler function (`handler(event)`).
*   **Potential Issues:**
    *   **Usage:** Checked previously via `grep_search`. It's used correctly in various API routes and some server `load` functions to protect resources that require authentication. However, it was noted as crucially **missing** from `src/routes/practice-plans/[id]/edit/+page.server.js`.
    *   **Granularity:** It performs a simple check for *any* logged-in user. It doesn't handle role-based or permission-based authorization checks; such logic would need to be implemented within the wrapped handler or a separate authorization mechanism.

## `src/lib/server/feedback.js`

*   **Notes:** Defines server-side functions for managing user feedback: `saveFeedback` (inserts into `feedback` table), `getAllFeedback` (retrieves all feedback), `upvoteFeedback` (increments upvotes), and `deleteFeedback` (deletes by ID). Uses the `query` function from `./db.js` for database interactions.
*   **Potential Issues:**
    *   **Unused Code:** Based on previous `grep_search`, this entire module appears **unused**. The corresponding API routes or components that would call these functions seem to be missing or non-functional. This represents dead code that should likely be **removed** unless the feedback feature is planned for implementation.
    *   **Authorization:** None of the functions implement any authorization checks. `getAllFeedback` would return all feedback to anyone, and `upvoteFeedback`/`deleteFeedback` could be called by anyone if exposed via an API without protection. If this were to be used, authorization (e.g., admin-only for delete/view all, user-specific for upvote) would be essential.
    *   **Error Handling:** Basic error handling relies on the `query` function; specific errors (e.g., feedback not found on upvote/delete) are not handled distinctly.

## `src/lib/server/services/`

*   **Notes:** Contains service classes (`practicePlanService.js`, `drillService.js`, etc.) that encapsulate business logic and database interactions for different entities. They extend a `baseEntityService.js`. These were reviewed in detail previously (see `service-notes.md` and `practice-plan-notes.md`).
*   **Potential Issues:** Key issues noted previously include scalability problems (lack of pagination/filtering in `getAll` methods), complex update strategies (delete-then-insert), reliance on specific error message strings, and the critical importance of the `BaseEntityService` implementation. Refer to `service-notes.md` and `practice-plan-notes.md` for full details.

## `src/lib/stores/cartStore.js`

*   **Notes:** Implements a custom Svelte store for managing a 'cart' of drills. Uses a factory function `createCartStore` to encapsulate logic. Initializes state from `localStorage` ('cartDrills') if available, ensuring persistence across browser sessions. Provides methods `addDrill` (adds if not present), `removeDrill` (removes by ID), `toggleDrill` (adds or removes), and `clear` (empties the cart). Updates `localStorage` on modifications.
*   **Potential Issues:**
    *   **Client-Side Only:** Relies entirely on `localStorage`, meaning the cart is specific to the browser and not persistent across devices or linked to a user account on the server. This might be the intended behavior for a temporary selection mechanism.
    *   **Error Handling:** Doesn't include specific error handling for `localStorage` operations (e.g., quota exceeded, security restrictions), though these are generally rare in modern browsers for small amounts of data.
    *   **Structure:** Stores the entire drill objects in the cart. Depending on object size and cart capacity, storing only IDs might be slightly more efficient, requiring re-fetching details when needed. The current approach is simpler.

## `src/lib/stores/dragManager.js`

*   **Notes:** Manages drag-and-drop state and logic primarily for adding items *from the drill search/cart* into the practice plan sections. It handles `dragstart` from the source (e.g., cart) and `dragover`/`drop` onto sections or items within the plan builder. It interacts with `sectionsStore` to add the new item at the correct position. (Reviewed in `practice-plan-wizard-notes.md`).
*   **Potential Issues:** Seems distinct from the (potentially unused) `dragStore.js`, focusing on adding *new* items rather than reordering existing ones within the plan.

## `src/lib/stores/dragStore.js`

*   **Notes:** Contains extensive logic and multiple `writable` stores (`draggedItem`, `dragOverItem`, `draggedSection`, etc.) to manage the state of drag-and-drop operations *within* the practice plan editor (reordering items, sections, groups). Includes functions for handling `dragstart`, `dragover`, `dragleave`, and `drop` events. Interacts with `sectionsStore` and `historyStore`.
*   **Potential Issues:**
    *   **Unused Code:** Based on previous `grep_search`, this entire module appears **completely unused**. This is highly suspicious given its size (~400 lines) and complexity. It might be legacy code from a refactor (perhaps replaced by `dragManager.js` for adding items, with reordering handled differently?), an incomplete feature, or intended for a different part of the application. Needs confirmation and likely **removal** if truly unused.
    *   **Complexity:** If it *were* used, managing drag-and-drop state for such a complex, nested structure (items, sections, parallel groups) is inherently difficult.
    *   **DOM Manipulation:** Some drag handlers directly manipulate element classes (`e.currentTarget.classList.add/remove`). While sometimes necessary, prefer reactive `class:` directives where possible.

## `src/lib/stores/drillsStore.js`

*   **Notes:** Manages state related to the drills list page, including filters (`selectedSkillLevels`, `selectedComplexities`, `selectedSkillsFocusedOn`, etc.), search query (`searchQuery`), pagination (`currentPage`, `drillsPerPage`, etc.), and the list of drills itself (`drills`). Initializes `allSkills` from `PREDEFINED_SKILLS`. (Reviewed in `drill-notes.md`).
*   **Potential Issues:** Primarily designed for client-side filtering/pagination state management; server-side implementation needed for scalability.

## `src/lib/stores/feedbackStore.js`

*   **Notes:** Simple store containing two `writable` stores: `feedbackModalVisible` (boolean, likely controlling visibility of a feedback modal) and `feedbackList` (array, likely intended to hold fetched feedback items).
*   **Potential Issues:**
    *   **Partial Usage:** `feedbackModalVisible` is used (`FeedbackButton.svelte`, `FeedbackModal.svelte`). `feedbackList` appears **unused**.
    *   **Connection to Unused Server Code:** Likely related to the unused `src/lib/server/feedback.js`. If the feedback feature is removed/unimplemented, this store (or at least `feedbackList`) should be **removed**.

## `src/lib/stores/formationsStore.js`

*   **Notes:** Manages state related to browsing and filtering formations. Includes `writable` stores for pagination (`currentPage`, `formationsPerPage`, `totalPages`, `totalItems`), loading state (`isLoading`), formation data (`formations`), filters (`selectedTags`, `searchQuery`, `selectedFormationType`), and sorting (`selectedSortOption`, `selectedSortOrder`). Provides `initializeFormations` and `resetFormationFilters` functions.
*   **Potential Issues:**
    *   **Client-Side Focus:** Primarily designed for client-side state management. Scalability requires server-side filtering/sorting/pagination.
    *   **Usage:** Used in `src/routes/formations/+page.svelte`.

## `src/lib/stores/historyStore.js`

*   **Notes:** Implements undo/redo functionality for the practice plan editor. Maintains `commandHistory` and `redoStack` arrays. Stores action `type`, `payload`, `description`, and a deep `snapshot` of the `$sections` store state before the action. Provides `addToHistory`, `undo`, `redo` functions. Uses `canUndo`/`canRedo` stores for UI state. Integrates with `svelte-toast`.
*   **Potential Issues:**
    *   **Complexity & State Dependency:** Undo/redo for the complex `$sections` state is difficult. Relies on deep copying via `JSON.stringify`.
    *   **Snapshot Target:** Only snapshots `$sections`. Other state (e.g., plan metadata) is not included in undo/redo.
    *   **Performance:** Deep copying large state via `JSON.stringify` on every action could be slow for very large plans.
    *   **`withHistory` Wrapper:** The `withHistory` function appears unused.

## `src/lib/stores/practicePlanStore.js`

*   **Notes:** Manages state for the `PracticePlanForm.svelte`. Includes stores for form fields, UI state, practice goals. Provides functions for initialization, validation, and submission (`submitPracticePlan` which calls API). Calculates total duration derived from `sectionsStore`. (Reviewed in detail in `practice-plan-notes.md`).
*   **Potential Issues:** Very large and mixes many concerns (form state, API logic, UI state, utilities, unrelated filter/drag-drop helpers). Needs significant refactoring for better separation of concerns. Relies on fragile `sessionStorage` auth flow. Validation could be improved.

## `src/lib/stores/sectionsStore.js`

*   **Notes:** Manages the core `sections` array for the practice plan builder (nested structure of sections and items). Includes state/logic for timeline management and parallel groups. Provides many functions for manipulating the structure (add/remove/update sections, items, groups, timelines). Calculates durations. Integrates with `historyStore`. (Reviewed in detail in `practice-plan-notes.md`).
*   **Potential Issues:** Extremely complex (>1000 lines) due to managing intricate nested state (especially parallel groups). High risk of bugs. Relies on careful immutable updates. Critical data formatting/initialization logic is complex. Undo/redo integration is challenging. Mixes some UI side effects (toasts) with state logic. `selectedItems` store might be unused. Uses module-level counters/non-standard IDs.

## `src/lib/stores/sortStore.js`

*   **Notes:** Simple store with `selectedSortOption` and `selectedSortOrder` writables.
*   **Potential Issues:**
    *   **Scope:** Generically named; might need refinement if sorting logic diverges across different views. Fine for now.
    *   **Usage:** Used in `FilterPanel.svelte` and `practice-plans/+page.svelte`.

## `src/lib/stores/wizardStore.js` & `wizardValidation.js`

*   **Notes:** Manages state (`wizardStore.js`) and validation logic (`wizardValidation.js`) for the multi-step practice plan creation wizard. (Reviewed in `practice-plan-wizard-notes.md`).
*   **Potential Issues:** Wizard state management involves coordinating state across multiple steps. Validation logic is separated but tightly coupled to the wizard flow.

## `src/lib/utils/diagramMigration.js`

*   **Notes:** Provides `fabricToExcalidraw` to convert Fabric.js JSON to Excalidraw format. Handles `line`, `circle`, `textbox`. Includes basic error handling.
*   **Potential Issues:**
    *   **Completeness:** Only handles a subset of Fabric.js types. Others will be ignored.
    *   **One-Off Utility:** Likely obsolete after data migration is complete. Should be documented as such or removed post-migration.

## `src/lib/utils/loggerUtils.js`

*   **Notes:** Provides client-side logging utilities (`simplifyForLogging`, `logState`, `logDebug`, `logError`) aiming for consistency and sanitization.
*   **Potential Issues:**
    *   **Unused Code:** Appears **completely unused**. Components/stores use `console.log` directly. Either integrate or **remove**.
    *   **`simplifyForLogging` Logic:** Simplification logic is specific to certain data structures (drills, sections) and restrictive for others.
    *   **Hardcoded Prefix:** `logState` uses a hardcoded `[PracticePlanForm]` prefix.

## `src/lib/vitals.js`

*   **Notes:** Exports an empty `webVitals` function (SvelteKit hook) with a `console.log` indicating tracking is disabled.
*   **Potential Issues:**
    *   **Unused/Disabled:** Web vitals reporting is disabled. Implement if needed, otherwise potentially remove (though SvelteKit might look for the file).


</rewritten_file> 