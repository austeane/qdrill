### Season Planning feature: implementation plan

#### Scope and principles
- First-class `Team` with membership (admin, member). Users can belong to multiple teams.
- One active `Season` per team. Season has start/end, timezone, uses team default start time.
- Season Sections: named date ranges stacked as horizontal lanes; can carry notes, visibility flag, linked drills/formations, and default practice plan sections.
- Create practices by clicking on the season timeline or via recurrence. Each creates a draft plan prefilled from union rules. Drafts are private to admins until published.
- Templates: one “Season Template Practice Plan” per season. Unedited drafts stay linked and receive template updates. Any change other than date change detaches the instance.
- ICS feed per season, includes published practices and markers. Shareable view-only link for the season timeline.
- Drag-reschedule practices and sections; unedited drafts auto re-evaluate contents when overlaps change.

### Data model

New tables
- `teams`
  - `id` (pk), `name`, `slug` (unique), `default_start_time` (time), `timezone` (IANA), `created_by`, timestamps.
  - Indexes: `slug`, `created_by`.
- `team_members`
  - `team_id` fk→teams, `user_id` fk→users, `role` enum('admin','member'), unique(team_id, user_id).
  - Indexes: `team_id`, `user_id`.
- `seasons`
  - `id`, `team_id` fk, `name`, `start_date` (date), `end_date` (date), `is_active` boolean, `template_practice_plan_id` fk→practice_plans (nullable), `public_view_token` (uuid), `ics_token` (uuid), timestamps.
  - Constraint: at most one active season per team (partial unique index on `(team_id)` where `is_active = true`).
  - Indexes: `team_id`, `(team_id, is_active)`.
- `season_sections`
  - `id`, `season_id` fk, `name`, `start_date`, `end_date`, `notes` text, `overview_visible_to_members` boolean default true, `display_order` int.
  - Indexes: `season_id`, `start_date`, `end_date`, `(season_id, display_order)`.
- `season_section_default_sections`
  - `id`, `season_section_id` fk, `section_name` text, `order` int.
  - Indexes: `season_section_id`, `(season_section_id, order)`.
- `season_section_drills`
  - `id`, `season_section_id` fk, `drill_id` fk→drills (nullable if freeform), `formation_id` fk→formations (nullable), `name` (for freeform), `type` enum('drill','formation'), `default_duration_minutes` int nullable (if absent use 30), unique logical key to prevent duplicates within a section.
  - Indexes: `season_section_id`, `drill_id`, `formation_id`.
- `season_markers`
  - `id`, `season_id` fk, `type` enum('tournament','break','scrimmage','custom'), `title`, `notes`, `start_date`, `end_date` nullable (all-day or multi-day).
  - Indexes: `season_id`, `start_date`, `end_date`.

Practice plans (extend existing `practice_plans`)
- Add columns:
  - `team_id` fk→teams (nullable for personal plans), `season_id` fk→seasons (nullable), `scheduled_date` (date, nullable), `status` enum('draft','published') default 'draft', `is_template` boolean default false, `template_plan_id` fk→practice_plans (nullable), `is_edited` boolean default false, `published_at` timestamptz nullable.
- Indexes: `team_id`, `season_id`, `(season_id, scheduled_date)`, `(team_id, status)`, `(template_plan_id, is_edited)`.
- Notes:
  - Keep existing `start_time` but for team/season-bound plans set it from team.default_start_time at creation and when re-propagating (see propagation). “Always use team default” means: we do not store per-instance overrides; if team default changes, unedited drafts update their `start_time` accordingly.

Permissions model
- Team-scoped objects (seasons, season_sections, markers, team-bound practice_plans):
  - Admins: full CRUD.
  - Members: view published practice plans; view season sections’ overviews only if `overview_visible_to_members` is true; can access season read-only via share link if they have it.
  - Non-members: no access except via share links and ICS feeds.

### Behavior rules

Prefill union on plan instantiation (click or recurrence)
- Base = Season Template Practice Plan (if set).
- Overlaps: find `season_sections` where `scheduled_date` ∈ [start_date, end_date].
- Sections: use union of base template sections and all overlapping sections’ default plan sections.
  - Order: template sections in their stored order, then season-section defaults by each section’s `display_order`, preserving their own order.
- Items: for each union section, start with template items; add linked drills/formations from overlapping season sections (dedupe by key: type+drill_id/formation_id/name; prefer template items).
- Default duration: 30 minutes for items from season_section_drills without explicit duration. Keep template item durations as-is.
- Set `start_time` from team.default_start_time. Set `status='draft'`, `is_template=false`, `template_plan_id=season.template_practice_plan_id`, `is_edited=false`, link `team_id`, `season_id`, `scheduled_date`.

Template propagation
- When `template_practice_plan_id` content changes:
  - Recompute union and overwrite sections/items/metadata for all linked, unedited drafts in that season.
  - Preserve each plan’s `scheduled_date`, recompute `start_time` from team default.
  - Do not touch plans where `is_edited=true`.
- When a draft is edited (any change other than `scheduled_date`), set `is_edited=true` and break future propagation.
- When team.default_start_time changes, update `start_time` for all unedited drafts in the active season.

Season section updates
- When section ranges change, automatically re-evaluate overlaps for unedited drafts in that season:
  - Add/remove section-default sections and linked drills accordingly, preserving template content and order rules.
- Notes and visibility changes affect member views immediately; no need to touch drafts.

Publishing and privacy
- Team-bound practice plans:
  - Draft: visible to team admins only (not members, not ICS).
  - Published: visible to team members; included in season ICS; reflected in share-link view.
  - Templates: `is_template=true` → admins only; never in ICS/share.
- Share-link read-only views use `seasons.public_view_token`.

Markers
- Show on timeline and include in ICS (as all-day or multi-day events).
- Types map to colors; stored per season.

Recurrence
- Store recurrence rules per season: weekly by weekday(s), every N weeks, until season end.
- Generate drafts in batch with `scheduled_date` set, content via union, `start_time` from team default.
- Safe delete: delete a subset of generated drafts (by date) without affecting others; if a target is `is_edited=true`, require admin confirmation.

ICS feed
- Per-season tokenized ICS feed using `seasons.ics_token`:
  - Include published practice plans (title from plan name; start from `scheduled_date + team.default_start_time`; duration from plan total).
  - Include season markers as all-day events (single or multi-day).
  - Respect team timezone.
  - Exclude drafts and templates.

AI generation
- Augment-only by default: AI suggests additions on top of the union result; optionally “replace content” action.
- Context to AI:
  - Season template plan (structure, goals)
  - Overlapping season sections’ notes, default plan sections, linked drills
  - Team context (skill focus if applicable)
  - Available drills/formations
- Endpoint extends current generator to accept `season_id`, `scheduled_date`.

Drag and timeline UX
- Season timeline:
  - Zoomable time scale (week/month/season).
  - Lanes: one per season section (full-width bars), plus tracks for practices and markers.
  - Click on timeline to create a draft on that date (apply union).
  - Drag practices laterally to change `scheduled_date`; for unedited drafts, re-run union (template content preserved).
  - Drag season sections to shift date ranges; triggers auto re-eval for unedited drafts.
  - Admin-only edit affordances; members get read-only timeline based on visibility flags.

### API surface (new/changed)
- Teams
  - POST `/api/teams` (admin), GET/PUT `/api/teams/[teamId]`, members: `/api/teams/[teamId]/members` CRUD (admin).
- Seasons
  - POST `/api/teams/[teamId]/seasons` (admin), GET/PUT `/api/seasons/[seasonId]`, ensure one active.
  - GET `/api/seasons/[seasonId]/share` → returns/readies `public_view_token` (admin).
  - GET `/api/seasons/[seasonId]/calendar.ics?token=...` → ICS (public with token).
- Season Sections
  - CRUD `/api/seasons/[seasonId]/sections` (admin).
  - Nested: `/default-sections` and `/linked-drills` endpoints for batch upsert.
- Markers
  - CRUD `/api/seasons/[seasonId]/markers` (admin).
- Plan instantiation
  - POST `/api/seasons/[seasonId]/instantiate` with `scheduled_date` (admin): creates draft plan via union.
- Recurrence
  - POST `/api/seasons/[seasonId]/recurrences` (admin) with rule; POST `/api/seasons/[seasonId]/generate-drafts` to materialize.
  - DELETE `/api/seasons/[seasonId]/drafts` with date range/list to delete.
- Practice plans (team-bound)
  - PATCH `/api/practice-plans/[id]` edits: on any content change (not date), set `is_edited=true`.
  - POST `/api/practice-plans/[id]/publish` → `status='published'`, `published_at=now`.
- AI
  - POST `/api/practice-plans/generate-ai` extended parameters: `season_id`, `scheduled_date`, `mode: 'augment' | 'replace'`.

### Services and permissions
- `TeamService`, `SeasonService`, `SeasonSectionService`, `SeasonMarkerService`.
- Extend `PracticePlanService`:
  - Creation with `team_id`, `season_id`, `scheduled_date`, `status`, `template_plan_id`, `is_edited`.
  - Union generator util taking template + overlapping sections + defaults/linked drills.
  - Propagation handlers on template/section updates.
- Authorization
  - Team-scoped guard: check membership/role via `team_members`.
  - Override practice plan access if `team_id` present (team rules take precedence over `visibility` column).

### UI/UX (Svelte)
- `routes/teams/+page.svelte`: team list/create.
- `routes/teams/[teamId]/settings/+page.svelte`: timezone, default start time, members.
- `routes/teams/[teamId]/season/+page.svelte`: season dashboard with:
  - `SeasonTimeline.svelte` (zoomable), `SeasonSectionEditor.svelte`, `MarkerEditor.svelte`,
  - Instantiate button/modals, recurrence scheduler, template picker.
- Read-only season view (share link): `routes/seasons/[seasonId]/view/+page.svelte` gated by token.
- Practice plan editor integrates existing components; respect `is_edited` logic; show “linked to template” status.

### Propagation and re-evaluation mechanics
- Template update:
  - Find `practice_plans` where `season_id=X AND template_plan_id=T AND is_edited=false`; regenerate via union.
- Season section change:
  - Find `practice_plans` `season_id=X AND is_edited=false` whose `scheduled_date` overlap changed; regenerate via union.
- Team default start time change:
  - Update `start_time` on all `practice_plans` `team_id=X AND is_edited=false`.

### ICS details
- Build with team timezone; practices as timed events (start = date + team default start time; duration = computed plan total).
- Markers as all-day/multi-day VEVENTs.
- Tokenized public URL; rotation control in UI.

### Indexing and performance
- Add indexes listed above for `team_id`, `season_id`, `scheduled_date`.
- Batch operations for propagation (limit N per job; background jobs if needed).
- Caching for season timeline queries (server-side).

### Validation/schema updates
- Extend Zod `practicePlanSchema` to allow server-managed fields in read responses; creation/edit schemas omit team/season/status fields or validate server-side.
- New schemas for season, section, markers, recurrence.

### Testing
- Unit tests: union algorithm, dedupe, propagation, permissions.
- Integration tests: instantiate, recurrence, publish, ICS content.
- E2E (Cypress): create season, sections, instantiate, drag-reschedule, template update propagation, member vs admin visibility.

### Rollout phases
- Phase 1: ✅ Teams and permissions; team settings (timezone, default start time). [COMPLETED]
- Phase 2: ✅ Seasons + one active constraint; template selection. [COMPLETED]
- Phase 3: ✅ Sections, markers; season timeline read-only. [COMPLETED]
- Phase 4: ✅ Instantiation (click), union algorithm; draft plans; publish flow. [COMPLETED]
- Phase 5: ✅ Recurrence and batch generation; deletion by date. [COMPLETED]
- Phase 6: ✅ Week View - Quick practice overview and management [COMPLETED]
- Phase 7: Sharing - ICS feed, public share links, member read-only access
- Phase 8: Season sections management UI - Full CRUD for sections and markers

- Data model: added `teams`, `team_members`, `seasons`, `season_sections`, `season_section_default_sections`, `season_section_drills`, `season_markers`; extended `practice_plans` for team/season binding and scheduling.
- Behavior: union rules, propagation, recurrence, drag re-eval, publishing/privacy, ICS with markers, AI augment.
- APIs/Services/UI: team/season/section/marker CRUD, instantiate/recurrence endpoints, tokenized ICS/share; new season timeline and editors; enforce team permissions.