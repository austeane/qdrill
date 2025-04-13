# Ticket 04: Review/Remove Dev Mode Permission Bypasses

**Priority:** High

**Description:** Several API routes and service methods contain logic that bypasses standard authorization checks when the application is running in development mode (`if (dev)` or similar checks using `$app/environment`). While potentially useful during development, this creates security risks if dev builds are exposed or if this logic is accidentally deployed to production.

**Affected Files:**

*   `src/routes/api/drills/[id]/+server.js` (DELETE handler)
*   `src/routes/api/practice-plans/[id]/+server.js` (DELETE handler - check seems redundant?)
*   `src/routes/api/formations/+server.js` (PUT handler)
*   `src/routes/formations/[id]/edit/+page.server.js` (Edit access load function)
*   `src/components/DeletePracticePlan.svelte` (Delete button visibility)
*   Potentially others where `$app/environment`'s `dev` flag is used for conditional authorization.

**Related Notes:**

*   `code-review/drill-notes.md`
*   `code-review/practice-plan-notes.md`
*   `code-review/formations-notes.md`
*   `code-review/shared-components-notes.md`
*   `code-review/holistic-summary.md`

**Action Required:**

1.  **Identify all instances** where the `dev` flag from `$app/environment` is used to bypass or alter authorization logic.
2.  **Evaluate Necessity:** Determine if these bypasses are genuinely required for development workflows.
3.  **Implement Alternatives:** If bypasses are needed for testing, consider alternative approaches:
    *   Using specific test accounts with admin roles (requires implementing Ticket 03).
    *   Using environment variables specifically for enabling test modes, separate from the general `dev` flag.
    *   Implementing configuration flags within services or components that can be toggled for testing.
4.  **Remove Bypasses:** Remove the direct `if (dev)` checks that bypass standard permission logic from API routes, load functions, and components.
5.  **Verify Redundancy:** Specifically investigate the `dev` check in `api/practice-plans/[id]/+server.js` DELETE handler, as it seemed redundant based on the code review. 