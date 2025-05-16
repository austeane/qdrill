# Ticket 31: Improve Adherence to REST Conventions / Remove Redundant Endpoints

**Priority:** Low

**Description:** Some API route handlers violate standard REST conventions (e.g., using PUT/DELETE on collection routes), and some redundant endpoints exist that duplicate functionality.

**Affected Files:**

- [`src/routes/api/drills/+server.js`](src/routes/api/drills/+server.js): Contains non-functional DELETE and an unconventional PUT handler (should be on `[id]/+server.js`).
- [`src/routes/api/drills/associate/+server.js`](src/routes/api/drills/associate/+server.js): Functionally duplicates [`src/routes/api/drills/[id]/associate/+server.js`](src/routes/api/drills/[id]/associate/+server.js). The `[id]` version is more conventional.
- [`src/routes/api/drills/names/+server.js`](src/routes/api/drills/names/+server.js): Functionally overlaps significantly with [`src/routes/api/drills/search/+server.js`](src/routes/api/drills/search/+server.js) (when query is empty). Has a hardcoded limit of 1000.
- [`src/routes/api/drills/search/+server.js`](src/routes/api/drills/search/+server.js): Serves two purposes (search vs. get-all-names) based on query param presence. Has an arbitrary limit (50) when getting all names.

**Related Notes:**

- [`code-review/drill-notes.md`](code-review/drill-notes.md)
- [`code-review/holistic-summary.md`](code-review/holistic-summary.md)

**Action Required:**

1.  **Refactor `api/drills/+server.js`:** Remove the non-functional DELETE handler. Move the PUT logic to `api/drills/[id]/+server.js` if it isn't already duplicated there, or remove it if redundant.
2.  **Remove Redundant Association Endpoint:** Choose one association endpoint (preferably [`api/drills/[id]/associate/+server.js`](api/drills/[id]/associate/+server.js)) and remove the other ([`api/drills/associate/+server.js`](api/drills/associate/+server.js)). Update any client-side code calling the removed endpoint.
3.  **Consolidate Name/Search Endpoints:**
    - Decide on a single endpoint for fetching drill names/searching.
    - If keeping `/search`, remove the arbitrary limit (50) when no query is present and ensure it correctly handles fetching all names (perhaps via a specific parameter like `?fetchAllNames=true` or relying on pagination with a large default limit if appropriate, avoiding hardcoded limits).
    - If keeping `/names`, remove the hardcoded limit (1000) and implement proper pagination or clarify its intended use case (e.g., only for small-scale typeaheads).
    - Remove the unused endpoint.
    - Ensure consistent filtering behavior (e.g., passing `userId` for visibility) in the chosen endpoint.
