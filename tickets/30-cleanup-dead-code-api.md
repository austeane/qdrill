# Ticket 30: Remove Unused API Routes and Corresponding Pages

**Priority:** Low

**Description:** Some API routes and potentially their corresponding SvelteKit pages appear to be unused or relate to features (like feedback) that are not currently implemented or used.

**Affected Files:**

- `src/routes/api/feedback/**` (All routes: [`/+server.js`](src/routes/api/feedback/+server.js), [`/[id]/delete/+server.js`](src/routes/api/feedback/[id]/delete/+server.js), [`/[id]/upvote/+server.js`](src/routes/api/feedback/[id]/upvote/+server.js))
- `src/routes/feedback/**` (Corresponding page: [`+page.svelte`](src/routes/feedback/+page.svelte), [`+page.server.js`](src/routes/feedback/+page.server.js))
- [`src/routes/api/drills/migrate-diagrams/+server.js`](src/routes/api/drills/migrate-diagrams/+server.js) (One-off migration utility)
- [`src/routes/api/drills/test-migration/+server.js`](src/routes/api/drills/test-migration/+server.js) (Migration testing utility)
- Potentially others if broader dead code analysis reveals them.

**Related Notes:**

- [`code-review/library-notes.md`](code-review/library-notes.md) (re: `feedback.js`)
- [`code-review/drill-notes.md`](code-review/drill-notes.md) (re: migration routes)
- [`code-review/feedback-page-notes.md`](code-review/feedback-page-notes.md)
- [`code-review/holistic-summary.md`](code-review/holistic-summary.md)

**Action Required:**

1.  Confirm the feedback feature is not implemented/used. If so, delete the `src/routes/api/feedback/` directory and the `src/routes/feedback/` directory.
2.  Confirm the diagram migration is complete. If so, delete [`src/routes/api/drills/migrate-diagrams/+server.js`](src/routes/api/drills/migrate-diagrams/+server.js) and [`src/routes/api/drills/test-migration/+server.js`](src/routes/api/drills/test-migration/+server.js) (along with the utility function [`src/lib/utils/diagramMigration.js`](src/lib/utils/diagramMigration.js) as per Ticket 29).
3.  Review other potentially unused API endpoints or pages.
