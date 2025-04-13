# Ticket 33: Investigate/Remove Vercel Rewrites if Unnecessary

**Priority:** Low

**Description:** The `vercel.json` configuration includes rewrites for `/api/drills/(.*)` and `/api/practice-plans/(.*)` to their respective base paths (`/api/drills`, `/api/practice-plans`). These might be artifacts from an older routing setup and may no longer be necessary with SvelteKit's standard filesystem-based routing for parameterized routes (e.g., `src/routes/api/drills/[id]/+server.js`).

**Affected Files:**

*   `vercel.json`

**Related Notes:**

*   `code-review/config-app-notes.md`
*   `code-review/holistic-summary.md`

**Action Required:**

1.  **Investigate:** Determine if these rewrites serve any current purpose. Test API routes like `/api/drills/some-id` with the rewrites temporarily removed in a development or preview environment.
2.  **Verify SvelteKit Routing:** Confirm that SvelteKit's filesystem routing (`[id]/+server.js`) correctly handles requests to parameterized API endpoints without the rewrites.
3.  **Remove if Redundant:** If the rewrites are confirmed to be unnecessary, remove them from `vercel.json` to simplify the configuration and rely solely on SvelteKit's routing. 