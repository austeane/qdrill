# Ticket 33: Investigate/Remove Vercel Rewrites if Unnecessary

**Priority:** Low

**Description:** `vercel.json` currently defines rewrites that map `/api/drills` and `/api/practice-plans` to the exact same paths. Earlier versions used wildcard rewrites during the old Flask-based backend, but the app now relies solely on SvelteKit's filesystem API routes (e.g. `src/routes/api/drills/[id]/+server.js`). These identity rewrites appear redundant.

**Affected Files:**

- [`vercel.json`](vercel.json)

**Related Notes:**

- [`code-review/config-app-notes.md`](code-review/config-app-notes.md)
- [`code-review/holistic-summary.md`](code-review/holistic-summary.md)

**Action Required:**

1. **Confirm** that removing the rewrites does not affect API routing when deploying to Vercel. Test via `vercel dev` or a preview deployment.
2. **Remove** the `"rewrites"` block from [`vercel.json`](vercel.json) if everything works without it.
3. Simplify the configuration and rely solely on SvelteKit's built-in routing.
