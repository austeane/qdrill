# Ticket 22: Refactor UserService Permission Logic & Profile Fetch Performance

- **Priority:** Medium
- **Issue:** `UserService` contains problematic logic:
    - `isAdmin` uses a hardcoded email list (security risk, inflexible).
    - `canUserPerformAction` duplicates permission logic found elsewhere (inefficient, inconsistent).
    - `getUserProfile` fetches potentially large amounts of related data (drills, plans, votes, comments) eagerly, which could cause performance issues for active users.
- **Affected Files:**
    - `src/lib/server/services/userService.js`
- **Recommendations:**
    - **Implement Role System:** Replace hardcoded `isAdmin` check with a database-driven role/permission system associated with user accounts.
    - **Remove Redundant Permission Logic:** Delete `canUserPerformAction`. Rely on permission checks within `BaseEntityService` or specific entity services (`canUserView`/`canUserEdit`).
    - **Optimize Profile Fetching:** Refactor `getUserProfile`:
        - Add pagination to the queries fetching related items (drills, plans, etc.).
        - Consider fetching related data lazily (on demand via separate API calls from the profile page) instead of eagerly loading everything.
- **Related Tickets:** [3](./03-fix-hardcoded-admin-check.md), [12](./12-api-service-bypass.md), [20](./20-refactor-baseentityservice.md) 