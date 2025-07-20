# Ticket 31: Improve Adherence to REST Conventions / Remove Redundant Endpoints

**Priority:** Low

**Description:** Some API route handlers violate standard REST conventions (e.g., using PUT/DELETE on collection routes), and some redundant endpoints exist that duplicate functionality.

**Affected Files:**

- [`src/routes/api/drills/+server.js`](src/routes/api/drills/+server.js): Implements `GET`, `POST`, `PUT`, and `DELETE` on the collection route. The `PUT` and `DELETE` handlers accept a drill ID from the request body or params but duplicate the more conventional handlers found in [`src/routes/api/drills/[id]/+server.js`](src/routes/api/drills/[id]/+server.js).
- [`src/routes/api/drills/associate/+server.js`](src/routes/api/drills/associate/+server.js): Posts a `drillId` in the request body to associate the drill with the current user. Duplicates [`src/routes/api/drills/[id]/associate/+server.js`](src/routes/api/drills/[id]/associate/+server.js), which expects the ID in the URL.
- [`src/routes/api/drills/names/+server.js`](src/routes/api/drills/names/+server.js): Returns `{ id, name }` for drills visible to the user using `drillService.getFilteredDrills` with `limit: 10000`.
- [`src/routes/api/drills/search/+server.js`](src/routes/api/drills/search/+server.js): Uses `drillService.getFilteredDrills` for searching by name. Default pagination limit is 10; no longer enforces an arbitrary 50-name cap.

**Related Notes:**

- [`code-review/drill-notes.md`](code-review/drill-notes.md)
- [`code-review/holistic-summary.md`](code-review/holistic-summary.md)

**Action Required:**

1.  **Refactor `api/drills/+server.js`:** Decide whether the collection-level `PUT` and `DELETE` handlers are needed. If not, remove them and rely solely on the `[id]` route. Otherwise ensure both routes behave consistently.
2.  **Remove Redundant Association Endpoint:** Choose one association endpoint (the `[id]` version is preferred) and remove the other. Update any client-side calls accordingly.
3.  **Consolidate Name/Search Endpoints:**
    - Pick a single endpoint for retrieving drill names and performing search. `/search` with pagination may be sufficient.
    - Eliminate the hardcoded `limit: 10000` in `/names` if that endpoint remains, or remove `/names` entirely.
    - Ensure consistent filtering behavior (e.g., passing `userId` for visibility) in the chosen endpoint.
