# Ticket 33: Investigate/Remove Vercel Rewrites if Unnecessary

**Priority:** Low

**Description:** `vercel.json` currently defines rewrites that map `/api/drills` and `/api/practice-plans` to the exact same paths. Earlier versions used wildcard rewrites during the old Flask-based backend, but the app now relies solely on SvelteKit's filesystem API routes (e.g. `src/routes/api/drills/[id]/+server.js`). These identity rewrites appear redundant.

**Affected Files:**

- [`vercel.json`](vercel.json)

**Related Notes:**

- [`code-review/config-app-notes.md`](code-review/config-app-notes.md)
- [`code-review/holistic-summary.md`](code-review/holistic-summary.md)

**Status:** Completed – the redundant rewrites have been removed from `vercel.json`. The file now contains an empty object (`{}`), and SvelteKit's filesystem routes handle the API paths without issue.

**Action Taken:**

1. Confirmed locally that `vercel dev` serves API routes correctly with the rewrites removed.
2. Deleted the `"rewrites"` array from [`vercel.json`](vercel.json) to simplify the configuration.
