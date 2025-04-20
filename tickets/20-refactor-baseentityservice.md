# Ticket 20: Enhance BaseEntityService Filtering/Flexibility

- **Priority:** Medium
- **Status:** Completed
- **Issue:** The `BaseEntityService` provides a good foundation but has limitations:
    - Filtering in `getAll` is basic (only exact match or `ANY` array check). Lacks range, LIKE, NULL, OR support.
    - Permission model is rigid (fixed columns, public/unlisted/private).
    - Search uses inefficient `LIKE '%term%'`.
    - Services often bypass it with direct DB calls due to these limitations.
- **Affected Files:**
    - [`src/lib/server/services/baseEntityService.js`](src/lib/server/services/baseEntityService.js)
    - Services extending it ([`drillService.js`](src/lib/server/services/drillService.js), [`practicePlanService.js`](src/lib/server/services/practicePlanService.js), [`formationService.js`](src/lib/server/services/formationService.js), [`userService.js`](src/lib/server/services/userService.js), [`skillService.js`](src/lib/server/services/skillService.js))
- **Recommendations:**
    - **Enhance Filtering:** Integrate a more powerful query builder or filtering library (or manually add support for more operators like `>`, `<`, `LIKE`, `IS NULL`, basic `OR` conditions) in `getAll`.
    - **Flexible Permissions:** Allow configuration of permission columns/logic, or provide hooks for custom permission checks.
    - **Improve Search:** Implement full-text search capabilities (e.g., using `tsvector`/`tsquery`).
    - **Refactor Services:** Encourage inheriting services to use enhanced base methods instead of direct DB calls where possible.
- **Related Tickets:** [6](./06-api-scalability-drills.md), [7](./07-api-scalability-practice-plans.md), [12](./12-api-service-bypass.md)

## Progress

- **Completed:**
    - Enhanced `BaseEntityService` filtering (`_buildWhereClause` with operators like `__gt`, `__like`, `__isnull`, `__any`).
    - Made `BaseEntityService` permissions configurable via constructor (`permissionConfig`).
    - Improved `BaseEntityService` search to use `tsvector` (`search_vector`) column and `tsquery`/`ts_rank_cd`.
    - Refactored `DrillService` to use enhanced base methods (`getAll`, `search`, permissions).
    - Refactored `PracticePlanService` (constructor, permissions, FTS in Kysely query, other methods).
    - Added `search_vector` column, trigger, function, and index to `formations` table.
    - Refactored `FormationService` (constructor, permissions, FTS, getAll/filtering).
    - Refactored `UserService` (removed redundant `canUserPerformAction`).
    - Refactored `SkillService` (updated constructor `allowedColumns`, kept custom `getAllSkills` due to sort order).
    - Updated project documentation (`docs/implementation/service-layer.md`) regarding `tsvector` usage.
- **To Do:**
