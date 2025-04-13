# Ticket 29: Remove Unused Services/Utils

**Priority:** Low

**Description:** Several server-side service files and client-side utility functions appear to be unused, likely remnants of abandoned features or refactoring efforts.

**Affected Files:**

*   `src/lib/server/feedback.js` (Entire feedback service seems unused)
*   `src/lib/utils/loggerUtils.js` (Appears completely unused, `console.log` used directly instead)
*   `src/lib/vitals.js` (Web vitals reporting is explicitly disabled)
*   `src/lib/utils/diagramMigration.js` (Likely obsolete after one-time use)

**Related Notes:**

*   `code-review/library-notes.md`
*   `code-review/holistic-summary.md`

**Action Required:**

1.  Confirm that no components or API routes import or call functions from `src/lib/server/feedback.js`. If confirmed unused, delete the file.
2.  Confirm that no files import or call functions from `src/lib/utils/loggerUtils.js`. If confirmed unused, delete the file.
3.  Decide if web vitals reporting (`src/lib/vitals.js`) is needed. If not, the file can likely be removed (or kept as disabled if preferred).
4.  Confirm the Fabric.js to Excalidraw migration is complete and successful. If so, `src/lib/utils/diagramMigration.js` and the related API route (`src/routes/api/drills/migrate-diagrams/+server.js`, `src/routes/api/drills/test-migration/+server.js`) can be removed. 