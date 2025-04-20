# Ticket 13: Ensure Consistent Use of `authGuard`

**Priority:** Medium

**Description:** The [`src/lib/server/authGuard.js`](src/lib/server/authGuard.js) helper provides a convenient way to protect SvelteKit `load` functions and API routes that require authentication. However, its usage is inconsistent across the codebase. Some routes implement manual session checks, while others (critically, [`practice-plans/[id]/edit/+page.server.js`](src/routes/practice-plans/[id]/edit/+page.server.js)) lack authentication checks entirely where they seem required.

**Affected Files:**

*   [`src/routes/practice-plans/[id]/edit/+page.server.js`](src/routes/practice-plans/[id]/edit/+page.server.js) (Missing check)
*   [`src/routes/api/practice-plans/[id]/+server.js`](src/routes/api/practice-plans/[id]/+server.js) (Uses manual checks for GET/PUT, uses `authGuard` for DELETE)
*   [`src/routes/api/drills/[id]/+server.js`](src/routes/api/drills/[id]/+server.js) (Uses manual checks)
*   [`src/routes/api/formations/[id]/+server.js`](src/routes/api/formations/[id]/+server.js) (Uses manual checks for DELETE)
*   [`src/routes/api/votes/+server.js`](src/routes/api/votes/+server.js) (Uses manual check)
*   [`src/routes/api/comments/+server.js`](src/routes/api/comments/+server.js) (Uses manual check for POST/DELETE)
*   Any other API routes or `+page.server.js` files that require authentication but don't use `authGuard`.

**Related Notes:**

*   [`code-review/library-notes.md`](code-review/library-notes.md) (`authGuard` review)
*   [`code-review/practice-plan-notes.md`](code-review/practice-plan-notes.md) (Highlighting missing check)
*   [`code-review/holistic-summary.md`](code-review/holistic-summary.md)

**Action Required:**

1.  **Identify Protected Resources:** Review all API routes (`src/routes/api/**/*.js`) and server `load` functions (`src/**/*.server.js`) to identify which ones require the user to be logged in for access (even if further authorization is needed).
2.  **Apply `authGuard` Consistently:**
    *   For all identified routes/functions that require authentication, wrap the exported handler (e.g., `GET`, `POST`, `load`) with the `authGuard` function.
    *   Remove redundant manual session checks (`if (!session?.user) { throw error(401); }`) where `authGuard` is applied.
3.  **Address Critical Gap:** Ensure `authGuard` (or equivalent manual check + specific authorization logic from Ticket 01) is added to [`src/routes/practice-plans/[id]/edit/+page.server.js`](src/routes/practice-plans/[id]/edit/+page.server.js)'s `load` function.
4.  **Verify Authorization Logic:** Remember that `authGuard` only checks for *authentication* (user is logged in). Ensure that *authorization* logic (user has permission to access/modify the specific resource) is still present within the guarded handler function or service layer call (as addressed in tickets like 01, 03, 04). 