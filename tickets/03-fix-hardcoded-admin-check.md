# Ticket 03: Replace Hardcoded Admin Email Check in UserService

**Priority:** High

**Description:** The `isAdmin` method in `UserService` determines administrator privileges by checking the user's email against a hardcoded list within the code. This is insecure, difficult to manage, and inflexible.

**Affected Files:**

*   [`src/lib/server/services/userService.js`](src/lib/server/services/userService.js)

**Related Notes:**

*   [`code-review/service-notes.md`](code-review/service-notes.md) (UserService review)
*   [`code-review/holistic-summary.md`](code-review/holistic-summary.md) (Database & Service Layer theme)

**Action Required:**

1.  Introduce a role-based access control system. This could involve:
    *   Adding a `role` column (e.g., 'admin', 'user') to the `users` table in the database.
    *   Updating the Auth.js configuration ([`src/lib/server/auth.js`](src/lib/server/auth.js)) to include the user's role in the session object (`locals.session.user.role`).
2.  Modify the `isAdmin` method (or replace relevant checks) in `UserService` to check the `user.role` from the session instead of the hardcoded email list.
3.  Update the user management process (if any exists) or database seeding to allow assigning the 'admin' role to appropriate users.
4.  Review all places where the hardcoded check might have been implicitly relied upon (e.g., [`Header.svelte`](src/components/Header.svelte) admin link visibility depends on the session having the role correctly populated). 