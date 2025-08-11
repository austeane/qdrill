### Phase 9: Polish, docs, analytics

Scope
- UX polish on timeline (zoom, drag handles, labels), empty states, loading.
- Docs and guides for teams, seasons, recurrence, publishing, ICS, AI.
- Basic analytics/logging on season features usage.

Files to update
- Docs
  - `docs/season-planning-tickets.md/season-planning.md` (keep in sync)
  - `docs/index.md` (add links)
  - `docs/guides/creating-practice-plans-guide.md` (note season context)
  - New: `docs/guides/season-planning.md` (end-user guide)
- UI polish
  - `src/lib/components/season/SeasonTimeline.svelte`
  - `src/routes/teams/[teamId]/season/+page.svelte`
- Optional analytics hooks (lightweight)
  - `src/lib/utils/analytics.js` (new) with no-op in dev

Tests
- E2E happy paths across features

