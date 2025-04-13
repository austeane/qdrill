# Ticket 01: Fix Missing Auth Check in Practice Plan Edit Load Function

**Priority:** Critical

**Description:** The `load` function in `src/routes/practice-plans/[id]/edit/+page.server.js` fetches practice plan data but fails to verify if the currently logged-in user has permission to edit that specific plan. This is a significant security vulnerability, potentially allowing unauthorized users to access the edit page for any plan.

**Affected Files:**

*   `src/routes/practice-plans/[id]/edit/+page.server.js`

**Related Notes:**

*   `code-review/practice-plan-notes.md` (Review of `src/routes/practice-plans/[id]/edit/+page.server.js`)

**Action Required:**

1.  Modify the `load` function in `src/routes/practice-plans/[id]/edit/+page.server.js`.
2.  After fetching the `practicePlan` data, retrieve the user session (`locals.session` or `locals.user`).
3.  Implement an authorization check comparing the user's ID (`session.user.id`) against the plan's `created_by` field and potentially the `is_editable_by_others` flag (if applicable).
4.  Consider using the `practicePlanService.canUserEdit` method (if available and appropriate) or replicating the logic from `drills/[id]/edit/+page.server.js`.
5.  If the user is not authorized, throw a 403 Forbidden error using SvelteKit's `error` helper or redirect the user (e.g., `throw redirect(303, /practice-plans/${id}?error=unauthorized)`). 