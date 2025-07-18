# Ticket 29: Remove Unused Services/Utils

**Priority:** Low

**Description:** This ticket originally flagged several service and utility modules as unused. Most of those files have since been removed from the repository or are in active use. The ticket should be updated to reflect the current situation.

**Current State:**

- [`src/lib/server/feedback.js`](src/lib/server/feedback.js) is actively used by the feedback API routes and the feedback page. It should remain.
- [`src/lib/utils/loggerUtils.js`](src/lib/utils/loggerUtils.js) and [`src/lib/vitals.js`](src/lib/vitals.js) no longer exist.
- [`src/lib/utils/diagramMigration.js`](src/lib/utils/diagramMigration.js) and the associated migration API routes have been removed, but `src/routes/admin/+page.svelte` still calls `/api/drills/migrate-diagrams` and `/api/drills/test-migration`.

**Related Notes:**

- [`code-review/library-notes.md`](code-review/library-notes.md)
- [`code-review/holistic-summary.md`](code-review/holistic-summary.md)

**Action Required:**

1. Clean up `src/routes/admin/+page.svelte` to remove or replace the calls to the deleted migration endpoints.
2. Verify that no code references the removed `loggerUtils` or `vitals` modules.
3. Close this ticket after the admin page cleanup is completed.
