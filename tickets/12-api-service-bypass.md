# Ticket 12: Refactor API Routes Bypassing Service Layer/Shared DB

**Priority:** Medium

**Description:** Several API routes contain logic that bypasses the established service layer pattern or the shared database connection pool ([`$lib/server/db.js`](/$lib/server/db.js)). Some create their own `pg.Pool` or `pg.Client` instances, and others implement data fetching/manipulation logic directly within the route handler instead of delegating to a service.

**Affected Files:**

*   [`src/routes/api/drills/filter-options/+server.js`](/src/routes/api/drills/filter-options/+server.js) (Creates own client, contains complex fetching logic)
*   [`src/routes/api/drills/import/+server.js`](/src/routes/api/drills/import/+server.js) (Creates own pool)
*   [`src/routes/api/drills/migrate-diagrams/+server.js`](/src/routes/api/drills/migrate-diagrams/+server.js) (Creates own client)
*   [`src/routes/api/drills/[id]/+server.js`](/src/routes/api/drills/[id]/+server.js) (Direct DB calls for votes, user names)
*   Potentially others needing review.

**Related Notes:**

*   [`code-review/drill-notes.md`](/code-review/drill-notes.md)
*   [`code-review/holistic-summary.md`](/code-review/holistic-summary.md)
*   [`code-review/library-notes.md`](/code-review/library-notes.md) (Review of `db.js`)

**Action Required:**

1.  **Identify Bypasses:** Review all API route handlers (`src/routes/api/**/*.js`).
2.  **Refactor Direct DB Client Creation:** Modify routes creating their own `pg` clients/pools (`filter-options`, `import`, `migrate-diagrams`) to use the shared [`$lib/server/db.js`](/$lib/server/db.js) module's `query` function or `getClient` function (if transactions are needed manually within the handler, though preferably transactions are handled in the service layer).
3.  **Move Logic to Services:**
    *   For routes with complex data fetching/business logic directly in the handler (e.g., `filter-options`), move that logic into a new method within the appropriate service (e.g., `drillService.getFilterOptions()`). The API handler should then simply call this service method.
    *   For routes making incidental direct DB calls (e.g., [`drills/[id]/+server.js`](/src/routes/api/drills/[id]/+server.js) fetching user names), abstract these calls into the relevant service (e.g., `userService.getUserNamesByIds(...)` or add it to the data returned by the primary service call like `drillService.getById`).
4.  **Ensure Consistent Pattern:** Enforce the pattern where API handlers are thin layers responsible for: receiving requests, parsing/validating input, calling appropriate service methods, handling errors (see Ticket 11), and formatting responses. All business logic and database interaction should reside within the service layer. 