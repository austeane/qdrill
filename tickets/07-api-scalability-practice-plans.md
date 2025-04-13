# Ticket 07: Implement Server-Side Pagination/Filtering/Sorting for Practice Plans

**Priority:** High

**Description:** Similar to the drills list, the main practice plans list page (`/practice-plans`) currently fetches *all* plans in its `load` function and performs filtering and sorting client-side. This is not scalable.

**Affected Files:**

*   `src/routes/practice-plans/+page.server.js` (Needs to handle params and pass to service)
*   `src/routes/practice-plans/+page.svelte` (Needs to trigger reloads based on filter/sort/page changes via URL)
*   `src/routes/api/practice-plans/+server.js` (GET handler needs to accept and use params)
*   `src/lib/server/services/practicePlanService.js` (`getAll` method needs overhaul for pagination/filtering/sorting)
*   `src/lib/stores/practicePlanStore.js` (Filter-related parts need review/separation, role changes)
*   `src/components/FilterPanel.svelte` (Needs to update URL parameters correctly for practice plan filters)

**Related Notes:**

*   `code-review/practice-plan-notes.md`
*   `code-review/holistic-summary.md` (Key Themes: API Scalability)

**Action Required:**

1.  **Modify `practicePlanService`:** Overhaul the `practicePlanService.getAll` method (or create a new paginated method) to accept parameters for:
    *   Pagination (`page`, `limit`)
    *   Sorting (`sortBy`, `sortOrder` - e.g., by name, date, duration)
    *   Filtering (by name/description, phase of season, practice goals, estimated participants, contained drills - requires joining/subqueries). Implement efficient query patterns.
2.  **Update API Route (`GET /api/practice-plans`):** Modify the GET handler in `src/routes/api/practice-plans/+server.js` to parse pagination, sorting, and filtering parameters from the URL's search parameters. Pass these parameters to the updated `practicePlanService` method. Return the paginated results along with pagination metadata.
3.  **Update Page Server Load (`practice-plans/+page.server.js`):** Modify the `load` function to parse pagination, sorting, and filtering parameters from the `event.url.searchParams`. Call the updated API endpoint (or service method directly) with these parameters. Return the fetched paginated data and potentially dynamic filter options (if filter options aren't hardcoded anymore).
4.  **Refactor Page Component (`practice-plans/+page.svelte`):**
    *   Remove client-side filtering and sorting logic.
    *   Display only the practice plans returned by the `load` function for the current page.
    *   Ensure pagination controls update the URL (`page` parameter) via `goto`.
    *   Ensure filter changes in `FilterPanel` update the relevant URL parameters via `goto` (debounced).
    *   Ensure sorting controls update the URL (`sortBy`, `sortOrder` parameters) via `goto`.
    *   Review usage of stores holding filter state (likely separating them from `practicePlanStore` as per Ticket 09 is recommended).
5.  **Update `FilterPanel`:** Ensure it correctly updates URL search parameters for practice plan filters, triggering server-side data fetching. 