# Ticket 22: Refactor UserService Permission Logic & Profile Fetch Performance

- **Priority:** Medium
- **Issue:** `UserService` permission handling is incomplete:
  - `isAdmin` is currently a stub that always returns `false`. A role-based system has not been implemented yet.
  - `getUserProfile` fetches large amounts of related data (drills, plans, votes, comments) eagerly, which could cause performance issues for active users.
- **Affected Files:**
  - [`src/lib/server/services/userService.js`](src/lib/server/services/userService.js)
- **Recommendations:**
  - **Implement Role System:** Introduce a `role` column on the `users` table and include the user's role in the session so that `isAdmin` can perform a real role check.
  - **Remove Redundant Permission Logic:** `canUserPerformAction` has already been deleted. Rely on permission checks within `BaseEntityService` or specific entity services (`canUserView`/`canUserEdit`).
  - **Optimize Profile Fetching:** Refactor `getUserProfile`:
    - Add pagination to the queries fetching related items (drills, plans, etc.).
    - Consider fetching related data lazily (on demand via separate API calls from the profile page) instead of eagerly loading everything.
- **Related Tickets:** [3](./03-fix-hardcoded-admin-check.md), [12](./12-api-service-bypass.md), [20](./20-refactor-baseentityservice.md)
