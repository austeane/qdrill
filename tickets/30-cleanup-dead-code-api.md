# Ticket 30: Remove Unused API Routes and Corresponding Pages

**Priority:** Low

**Description:** Earlier code review notes suggested there were unused API routes for a feedback feature and for one-off drill diagram migrations. The repository has since evolved:

- The feedback feature is **implemented**. The global `FeedbackButton` and `FeedbackModal` components use the `/api/feedback` endpoints, and there is a `/feedback` page served by `+page.svelte` and `+page.server.js`.
- The diagram migration utilities (`migrate-diagrams` and `test-migration`) and their helper (`diagramMigration.js`) have already been removed.

This ticket now serves as documentation that the migration code cleanup is complete and that the feedback endpoints are active, not dead code.

**Affected Files (previously identified):**

- `src/routes/api/feedback/**` and `src/routes/feedback/**` – these are now confirmed in use.
- `src/routes/api/drills/migrate-diagrams/+server.js` – **removed**.
- `src/routes/api/drills/test-migration/+server.js` – **removed**.

**Related Notes:**

- [`code-review/library-notes.md`](code-review/library-notes.md) (re: `feedback.js`)
- [`code-review/drill-notes.md`](code-review/drill-notes.md) (re: migration routes)
- [`code-review/feedback-page-notes.md`](code-review/feedback-page-notes.md)
- [`code-review/holistic-summary.md`](code-review/holistic-summary.md)

**Action Required:**

1.  No further action for the migration utilities—they have already been deleted.
2.  Ensure the feedback API routes remain protected and maintain any database schema required for them.
3.  Continue to monitor for any other unused API routes or pages and remove them as discovered.
