**Overall Goal:** Improve application load times and responsiveness by eliminating large upfront data fetches (`?all=true`), moving filtering/sorting logic to the server/database, and optimizing data payloads, particularly for formation details.

---

### Phase 1: Backend API & Service Optimization (Foundation)

This phase focuses on modifying the server-side code to handle data fetching efficiently.

1.  **Optimize Formation Detail Payload (`formationService` & API)** **[VERIFIED - NO ACTION NEEDED]**
    *   **File:** `src/lib/server/services/formationService.js`
    *   **File:** `src/routes/api/formations/[id]/+server.js`
    *   **Status:** Verified that `formationService.getById` (inherited from `BaseEntityService`) and the API route `GET /api/formations/[id]` only fetch the core formation data. They do **not** currently fetch associated drills. Optimizing the initial load of formation details (without drills) will be handled in Phase 2 (frontend).
    *   ~~**Action:** Modify the `getById` method (or the underlying database query).~~ (Not required)
    *   ~~**Action:** No changes likely needed here *if* the change is made purely within `formationService.getById`. However, verify it returns the slimmer payload.~~ (Verified)
    *   **Considerations:**
        *   The mechanism for fetching drills for a specific formation needs to be identified (likely in `/formations/[id]/+page.server.js` or `/formations/[id]/+page.svelte`) and potentially optimized or deferred in Phase 2.
    *   **Risks:**
        *   The frontend component (`/formations/[id]/+page.svelte`) currently expects the full list of detailed drills immediately. This requires coordinated changes in Phase 2.

2.  **Implement Backend Filtering/Sorting for Formations**
    *   **File:** `src/lib/server/services/formationService.js` (or equivalent)
    *   **Action:** Create a new method, e.g., `getFilteredFormations(filters, sortOptions, paginationOptions)`.
        *   This method should accept parameters for:
            *   `filters`: `tags` (array), `formation_type` (string), `searchQuery` (string).
            *   `sortOptions`: `sortBy` (string, e.g., 'name', 'created_at'), `sortOrder` ('asc' | 'desc').
            *   `paginationOptions`: `page` (number), `limit` (number).
        *   Translate these parameters into an efficient SQL query using `WHERE`, `ORDER BY`, `LIMIT`, `OFFSET` clauses. **Consider using a query builder** (like `knex`, though not strictly necessary if queries remain simple) to construct this SQL dynamically and safely before executing it with the `query` function from `src/lib/server/db.js`.
    *   **File:** `src/routes/api/formations/+server.js`
    *   **Action:** Modify the `GET` handler.
        *   Remove the `all=true` parameter handling.
        *   Parse query parameters for filters (tags, type, search), sorting (sortBy, sortOrder), and pagination (page, limit) from `url.searchParams`.
        *   Call the new `formationService.getFilteredFormations` with the parsed parameters.
        *   Return the results (`{ items: ..., pagination: ... }`) as JSON.
    *   **Considerations:**
        *   Define clear query parameter names (e.g., `tags=tag1,tag2`, `type=offense`, `q=searchterm`, `sort=name`, `order=asc`, `page=2`, `limit=20`).
        *   Ensure database indexes exist for fields used in filtering (tags, formation_type, name) and sorting (name, created_at). **Create necessary SQL migration files** using `node-pg-migrate` to add these indexes. **[COMPLETED]**
            *   **Status:** Completed via migration `1744527001396_add-performance-indexes.js`.
            *   **Added indexes:** `formations_tags_index` (GIN on `tags`), `formations_formation_type_index` (B-tree on `formation_type`). Verified existing `idx_formations_name` and `idx_formations_created_at`.
    *   **Risks:**
        *   SQL query construction can become complex, especially with multiple filters. A query builder could help manage this.
        *   Performance heavily depends on database schema and indexing.
        *   Changes the API contract, requiring frontend updates (Phase 2).

3.  **Enhance Backend Filtering/Sorting for Drills**
    *   **File:** `src/lib/server/services/drillService.js` (or equivalent)
    *   **Action:** Verify and enhance the existing `getFilteredDrills(filters, options)` method.
        *   Ensure it accepts *all* necessary filter parameters in the `filters` object (skill levels, complexity, skills focused, positions focused, drill types, number of people range, suggested length range, hasVideo, hasDiagrams, hasImages, searchQuery).
        *   Ensure it correctly applies these filters using efficient SQL query clauses (`WHERE`, potentially involving array checks or range queries). **Consider using a query builder** (like `knex`, though not strictly necessary if queries remain simple) to construct this SQL dynamically and safely.
        *   Ensure `options.sortBy`, `options.sortOrder`, `options.page`, `options.limit` are correctly translated to `ORDER BY`, `LIMIT`, `OFFSET`.
        *   Remove any logic that bypasses filtering/pagination when `all=true` was passed (this parameter should no longer be used).
    *   **File:** `src/routes/api/drills/+server.js`
    *   **Action:** Modify the `GET` handler.
        *   Remove the `all=true` parameter handling.
        *   Parse *all* relevant filter query parameters from `url.searchParams` (e.g., `skillLevel=intermediate`, `complexity=medium`, `skills=passing,shooting`, `q=search`, `hasVideo=true`, `minPeople=5`, `maxPeople=10`, etc.).
        *   Construct the `filters` object and `options` (page, limit, sort, order) based on these parameters.
        *   Call `drillService.getFilteredDrills(filters, options)`.
        *   Return the paginated results.
    *   **Considerations:**
        *   Define how array-like filters (e.g., skills, positions) are passed via URL (e.g., comma-separated `skills=passing,shooting` or repeated params `skill=passing&skill=shooting`). Choose one and be consistent. Handle array parameters appropriately in SQL (e.g., `WHERE skill = ANY($1::text[])`).
        *   Database indexing is critical for performance across all filterable/sortable fields. **Create necessary SQL migration files** using `node-pg-migrate` to add these indexes. **[COMPLETED]**
            *   **Status:** Completed via migration `1744527001396_add-performance-indexes.js`.
            *   **Added indexes:** `drills_name_index` (B-tree on `name`), `drills_date_created_index` (B-tree on `date_created`), `drills_number_of_people_min_index`, `drills_number_of_people_max_index` (B-tree for range filtering), `idx_drills_has_video` (Partial on `video_link`), `idx_drills_has_images` (Expression on `images`), `idx_drills_has_diagrams` (Expression on `diagrams`).
            *   **Verified existing indexes:** `idx_drills_complexity`, `idx_drills_drill_type` (GIN), `idx_drills_positions_focused_on` (GIN), `idx_drills_skill_level` (GIN), `idx_drills_suggested_length`.
        *   Search implementation (`LIKE`/`ILIKE` or full-text search).
    *   **Risks:**
        *   Very complex SQL query building logic might be required in the service layer, especially without a query builder.
        *   Performance is highly dependent on efficient database queries and indexes.
        *   Changes API contract, requiring frontend updates (Phase 2).

---

### Phase 2: Frontend Store & Component Refactoring (Adaptation)

This phase adapts the frontend to work with the optimized backend.

1.  **Refactor Stores (`drillsStore.js`, `formationsStore.js`)**
    *   **Files:** `src/lib/stores/drillsStore.js`, `src/lib/stores/formationsStore.js`
    *   **Action:**
        *   **Remove:** `allDrills`, `allDrillsLoaded`, `allFormations`, `allFormationsLoaded` stores.
        *   **Remove:** `fetchAllDrills`, `fetchAllFormations` functions.
        *   **Remove:** `filteredDrills`, `filteredFormations` derived stores (and their complex filtering/sorting logic).
        *   **Keep/Use:** Stores for *current filter state* (e.g., `selectedSkillLevels`, `searchQuery`, `selectedTags`, etc.), *current sort state* (`selectedSortOption`, `selectedSortOrder`), *pagination state* (`currentPage`, `totalPages`, `isLoading`), and the *current page's data* (`drills`, `formations`).
        *   Modify `initializeDrills`/`initializeFormations` (or similar functions) to accept the paginated data structure `{ items: [], pagination: {} }` passed from the `load` functions.
    *   **Considerations:** Stores become much simpler, primarily holding UI state and the current data slice.
    *   **Risks:** This is a major breaking change for any component relying on the removed stores or functions. Requires careful updates across the UI.

2.  **Update Page Load Functions (`+page.server.js`)**
    *   **Files:** `src/routes/drills/+page.server.js`, `src/routes/formations/[id]/+page.server.js`, `src/routes/formations/+page.server.js` (create or modify)
    *   **Action:**
        *   Modify the `load` functions to:
            *   Extract *all* relevant filter, sort, and pagination parameters from `url.searchParams`. Provide sensible defaults (e.g., `page = 1`, `limit = 10`, default sort).
            *   Call the appropriate backend service method (`drillService.getFilteredDrills`, `formationService.getFilteredFormations`, `formationService.getById`) *directly*, passing the extracted parameters. Alternatively, `fetch` the corresponding API endpoint (`/api/drills?...`, `/api/formations?...`, `/api/formations/[id]`) with the parameters in the query string.
            *   Return the paginated data structure (e.g., `{ drills: results.items, pagination: results.pagination, filterOptions }` or `{ formation }`).
    *   **Considerations:**
        *   Using `fetch` maintains separation but adds a slight overhead. Calling services directly is often preferred in `+page.server.js`.
        *   Ensure consistent parameter handling between URL parsing and service/API calls.
        *   Pass necessary data for filter UI population (like `filterOptions` in the drills example).
    *   **Risks:** Errors in parameter parsing or passing will lead to incorrect data being fetched.

3.  **Update Page Components (`+page.svelte`)**
    *   **Files:** `src/routes/drills/+page.svelte`, `src/routes/formations/+page.svelte`, `src/routes/formations/[id]/+page.svelte` (and any components using the stores heavily, like `FilterPanel.svelte`)
    *   **Action:**
        *   Accept the data passed from `load` functions (`export let data;`).
        *   Display the `data.items` (or `data.drills`, `data.formation`) instead of relying on the old derived stores.
        *   Update UI elements (filters, sort dropdowns, search input) to read from and write to the corresponding state stores (`selectedSkillLevels`, `searchQuery`, `selectedSortOption`, etc.).
        *   When a filter, sort option, or page number changes:
            *   Update the relevant store value.
            *   Trigger a navigation using `goto` from `$app/navigation`, constructing a new URL with the updated query parameters based on the current state of *all* filter/sort/page stores. Alternatively, use `invalidate` if appropriate, ensuring the URL reflects the state.
        *   Implement pagination controls based on `data.pagination`.
        *   Use the `isLoading` store to show loading indicators during data fetches.
        *   For `/formations/[id]/+page.svelte`, adapt the UI to expect only the core formation data initially. Implement logic to fetch full drill details on demand if needed (e.g., fetch `/api/drills/[id]` when a drill is clicked).
    *   **Considerations:**
        *   Use `$page.url.searchParams` to potentially initialize filter/sort UI state on initial load to match the URL.
        *   Debounce inputs (like search) before triggering navigation/invalidation to avoid excessive requests.
        *   Plan the UX for loading associated data on detail pages (e.g., formation drills).
    *   **Risks:** Significant changes to component logic and template structure. State synchronization between UI controls, stores, and the URL needs careful handling. Potential for UI bugs during refactoring.

---

### General Considerations & Risks

*   **Incremental Approach:** This refactor can likely be done incrementally (e.g., optimize drills APIs and pages first, then formations). This reduces risk per step.
*   **Testing:** Crucial at all stages.
    *   **API Testing:** Verify endpoints return correct filtered/paginated data and handle edge cases/invalid parameters.
    *   **Database Query Performance:** Profile the new database queries under load using tools like `EXPLAIN ANALYZE`.
    *   **UI Testing:** Ensure filtering, sorting, pagination, and detail page interactions work correctly.
    *   **Performance Benchmarking:** Measure load times before and after using browser dev tools and HAR analysis.
*   **Database Indexing:** Re-evaluate and add necessary database indexes for all fields used in filtering and sorting via **SQL migration files** using `node-pg-migrate`. This is *critical* for backend performance. **[COMPLETED]**
*   **API Contract:** Clearly document the new query parameters for the updated API endpoints.
*   **Effort:** This is a non-trivial refactoring effort involving both backend and frontend changes.
*   **Team Coordination:** If multiple developers are involved, clear communication is needed due to the tight coupling between backend API changes and frontend consumption.
