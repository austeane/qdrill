### Phase 7: ICS + share link; member read-only timeline

Scope
- Tokenized ICS feed per season with team timezone; includes published practices and markers; excludes drafts and templates.
- Public share view via token; members also have read-only view reflecting visibility flags.

Server/services
- Add `src/lib/server/services/icsService.js` (new) to generate ICS text
- Extend `seasonService` with token rotation helpers

API routes (new)
- GET `src/routes/api/seasons/[seasonId]/calendar.ics/+server.js?token=...`
- GET `src/routes/api/seasons/[seasonId]/share/+server.js` (read/rotate public token)

UI (Svelte)
- In season dashboard: controls to copy ICS URL and share link (admin-only)
- Public read-only page exists from Phase 3

Integration touchpoints
- `src/routes/seasons/[seasonId]/view/+page.server.js` validate token access
- Practice plan duration calculation via `PracticePlanService.calculateSectionDuration` (ensure accurate ICS end time)

Tests
- Unit: ICS generation (timezones, durations, markers)
- Integration: token gating, visibility, published-only inclusion

