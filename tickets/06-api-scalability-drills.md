# Ticket 06: Implement Server-Side Pagination/Filtering/Sorting for Drills

**Priority:** High

**Description:** The main drills list page (`/drills`) currently fetches *all* drills in its `load` function and performs filtering and sorting client-side. This approach will not scale as the number of drills increases, leading to poor performance and high memory usage.

**Affected Files:**

*   [`src/routes/drills/+page.server.js`](src/routes/drills/+page.server.js) (Needs to handle params and pass to service)
*   [`src/routes/drills/+page.svelte`](src/routes/drills/+page.svelte) (Needs to trigger reloads based on filter/sort/page changes via URL)
*   [`src/routes/api/drills/+server.js`](src/routes/api/drills/+server.js) (GET handler needs to accept and use params)
*   [`src/lib/server/services/drillService.js`](src/lib/server/services/drillService.js) (Needs methods like `getFilteredDrills` to accept pagination, filter, and sort options)
*   [`src/lib/stores/drillsStore.js`](src/lib/stores/drillsStore.js) (Role will shift from holding all data to holding current page data and filter state)
*   [`src/components/FilterPanel.svelte`](src/components/FilterPanel.svelte) (Needs to update URL parameters correctly to trigger server reloads)

**Related Notes:**

*   [`code-review/drill-notes.md`](code-review/drill-notes.md)
*   [`code-review/holistic-summary.md`](code-review/holistic-summary.md) (Key Themes: API Scalability)

**Action Required:**

1.  **Modify `drillService`:** Enhance [`drillService.getFilteredDrills`](src/lib/server/services/drillService.js) (or create a new paginated method) to accept parameters for:
    *   Pagination (`page`, `limit`)
    *   Sorting (`sortBy`, `sortOrder`)
    *   Filtering (across all relevant fields: name, description, skill levels, complexity, skills focused on, positions, tags, number of people, length, media presence, etc.). Implement efficient query patterns for these filters (e.g., using appropriate indexes, potentially full-text search for text fields).
2.  **Update API Route (`GET /api/drills`):** Modify the GET handler in [`src/routes/api/drills/+server.js`](src/routes/api/drills/+server.js) to parse pagination, sorting, and filtering parameters from the URL's search parameters. Pass these parameters to the updated `drillService` method. Return the paginated results along with pagination metadata (total items, total pages, current page).
3.  **Update Page Server Load ([`drills/+page.server.js`](src/routes/drills/+page.server.js)):** Modify the `load` function to parse pagination, sorting, and filtering parameters from the `event.url.searchParams`. Call the updated API endpoint (or potentially the service method directly, though API call is common) with these parameters. Return the fetched paginated data and filter options.
4.  **Refactor Page Component ([`drills/+page.svelte`](src/routes/drills/+page.svelte)):
    *   Remove client-side filtering and sorting logic.
    *   Display only the drills returned by the `load` function for the current page.
    *   Ensure pagination controls update the URL (`page` parameter) via `goto` to trigger reloads.
    *   Ensure filter changes in [`FilterPanel`](src/components/FilterPanel.svelte) update the relevant URL parameters via `goto` (debounced) to trigger reloads.
    *   Ensure sorting controls update the URL (`sortBy`, `sortOrder` parameters) via `goto` to trigger reloads.
    *   Update [`drillsStore`](src/lib/stores/drillsStore.js) usage to reflect that it now holds state for the *current view* (filters, pagination state) rather than all data.
5.  **Update [`FilterPanel`](src/components/FilterPanel.svelte):** Ensure it correctly updates URL search parameters when filter/sort options change, triggering the server-side data fetching. 