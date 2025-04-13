# Ticket 20: Enhance BaseEntityService Filtering/Flexibility

- **Priority:** Medium
- **Issue:** The `BaseEntityService` provides a good foundation but has limitations:
    - Filtering in `getAll` is basic (only exact match or `ANY` array check). Lacks range, LIKE, NULL, OR support.
    - Permission model is rigid (fixed columns, public/unlisted/private).
    - Search uses inefficient `LIKE '%term%'`.
    - Services often bypass it with direct DB calls due to these limitations.
- **Affected Files:**
    - `src/lib/server/services/baseEntityService.js`
    - Services extending it (`drillService.js`, `practicePlanService.js`, `formationService.js`, `userService.js`, `skillService.js`)
- **Recommendations:**
    - **Enhance Filtering:** Integrate a more powerful query builder or filtering library (or manually add support for more operators like `>`, `<`, `LIKE`, `IS NULL`, basic `OR` conditions) in `getAll`.
    - **Flexible Permissions:** Allow configuration of permission columns/logic, or provide hooks for custom permission checks.
    - **Improve Search:** Implement full-text search capabilities (e.g., using `tsvector`/`tsquery`).
    - **Refactor Services:** Encourage inheriting services to use enhanced base methods instead of direct DB calls where possible.
- **Related Tickets:** [6](./06-api-scalability-drills.md), [7](./07-api-scalability-practice-plans.md), [12](./12-api-service-bypass.md) 