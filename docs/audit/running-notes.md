# Running Notes — Codebase Review

These are incremental notes while reconciling the two external reviews against the actual repo. I’ll keep appending here as we go.

## 2025-12-12 — Initial validation pass

### Drill access / permissions

- **Confirmed P0:** `DrillService` enables standard permissions because `permissionConfig` is a non-null object (even if empty). `BaseEntityService.getById` enforces `canUserView(entity, userId)` when `userId` is null → private drills are forbidden.
  - `src/routes/api/drills/[id]/+server.js` GET calls `getById(drillId)` / `getDrillWithVariations(drillId)` without `userId`.
  - `src/routes/api/drills/[id]/variations/+server.js` GET also calls `getById` / `getDrillWithVariations` without `userId`.
  - `src/routes/drills/[id]/edit/+page.server.js` load calls `getById(drillId)` without `userId` before checking `canUserEdit`.
- **Confirmed P0:** list endpoint passes user context incorrectly.
  - `src/routes/api/drills/+server.js` GET sets `filters.userId = userId`.
  - `DrillService.getFilteredDrills` expects `options.userId`, not `filters.userId`, so private drills won’t appear in listings.

### Drill validation / DTO shape

- **Confirmed P0 data-loss:** Zod schema accepts nested `number_of_people: {min,max}` but `normalizeDrillData` does **not** map this object to `number_of_people_min/max`. Those keys are not in `allowedColumns`, so they’re silently dropped on create/update.
  - `src/lib/validation/drillSchema.ts`
  - `src/lib/server/services/drillService.js#normalizeDrillData`
- **Half-fixed:** `suggested_length` _is_ mapped to `suggested_length_min/max`.
- **Confirmed P1 contract/UX:** Zod enums use Title Case (e.g., `"Beginner"`) but `normalizeDrillData` lowercases array fields before persistence. UI renders stored arrays directly in places, so users will see lowercase unless there’s a display mapping.

### Drill filtering

- **Confirmed P1:** complexity multi-select mismatch.
  - UI uses comma-separated values (`parseCommaSeparatedToStore('complexity', ...)`).
  - API list route parses complexity as a single string (`filters.complexity = get('complexity')?.toLowerCase()`), so `low,medium` becomes one value and matches nothing.
  - `DrillService.getFilteredDrills` supports array or single string, not comma-string.

### Dev bypass

- **Confirmed P1 safety risk:** DELETE bypass in dev.
  - `src/routes/api/drills/[id]/+server.js` DELETE bypasses auth when `dev` true and calls `deleteDrill(..., { deleteRelated: true })`.
  - `DrillService.deleteDrill` bypasses permission checks when `options.deleteRelated && dev`.
  - Needs an explicit env kill-switch + admin requirement to avoid accidental prod exposure.

### Practice plans

- **Confirmed P0:** `groupTimelines` vs `group_timelines` mismatch.
  - Zod schema uses `group_timelines`.
  - API hydration sets `item.groupTimelines` before `createPracticePlanSchema.safeParse`, so Zod strips it; parallel timelines likely break.
  - `PracticePlanService` expects `groupTimelines` in JS layer and maps to `group_timelines` at SQL boundary.
- **Confirmed P0/P1:** formation item duration.
  - Zod enforces `duration >= 1` for all items.
  - Store creates formation items with `duration: 0`.
  - API POST will reject plans containing formations unless schema is conditional.
- **Confirmed P1 maintainability:** `PracticePlanService` is extended via prototype patching (`PracticePlanService.prototype.*`) instead of class methods, making behavior harder to discover and type.

### Skills

- **Confirmed P1 logic bug:** `SkillService.getSkillRecommendations` second query filters out everything:
  - It selects drills overlapping current skills, then adds `AND NOT (skills_focused_on && currentSkills)` on those drills.
  - Should instead unnest and exclude currentSkills at the skill level.

### Maintainability / security smells

- **Confirmed P2:** circular dependency between `sectionsStore.js` and `historyStore.js` (mutual imports).
- **Confirmed P1 security smell:** `sql.literal(...)` used to build array overlap clauses in `DrillService.getFilteredDrills`. Should be parameterized arrays to avoid injection/escaping footguns.
- **Confirmed P1 security gap:** anonymous “claim/associate” flows rely on `sessionStorage` IDs and server-side association endpoints do not require a claim token.
  - `src/routes/+layout.svelte` posts `/api/drills/:id/associate`, `/api/formations/:id/associate`, `/api/practice-plans/:id/associate`.
  - `associateDrill/Formation/PracticePlan` only check `created_by IS NULL`; any logged-in user can claim any anonymous entity if they know the ID.
- **Confirmed P1 maintainability:** duplicate drill mutation endpoints exist (`/api/drills` PUT/DELETE and `/api/drills/[id]` PUT/DELETE, plus `/api/drills/associate` and `/api/drills/[id]/associate`).
- **Confirmed P2 safety/perf:** `src/lib/server/db.js` uses a stub pool returning empty rows when no connection string is present, which can mask accidental DB access during build/CI.
- **Confirmed P2 perf:** `hooks.server.js` ensures user existence + role lookup on every request, likely duplicating Better Auth callbacks and adding DB load.

## 2025-12-12 — Patches applied + verification

### Fixes implemented (P0 → P2)

- **Drill access/permissions fixed:** all drill reads now pass `userId` through service methods, including variations and edit loads. Private drills are visible to owners and not leaked to others. (`src/routes/api/drills/[id]/+server.js`, `src/routes/api/drills/[id]/variations/+server.js`, `src/routes/api/drills/+server.js`, `src/lib/server/services/drillService.js`)
- **Filtered drill listings fixed:** `options.userId` is now used correctly and `complexity` is parsed as comma-separated multi-select. (`src/routes/api/drills/+server.js`)
- **Drill DTO contract fixed:** `number_of_people {min,max}` is normalized to DB columns and DrillForm submits nested objects consistently. (`src/lib/server/services/drillService.js`, `src/routes/drills/DrillForm.svelte`)
- **Enum casing made canonical:** values are stored lowercased; service denormalizes to display labels on read. (`src/lib/server/services/drillService.js`)
- **Kysely array overlap safety:** removed `sql.literal` array construction in drill filters; now uses parameterized `sql.array(...)`. (`src/lib/server/services/drillService.js`)
- **Dev delete bypass gated:** drills DELETE bypass requires `ALLOW_DEV_DELETE_BYPASS==='true'` plus admin even in dev, and service enforces same. (`src/routes/api/drills/[id]/+server.js`, `src/lib/server/services/drillService.js`)
- **Anonymous claim/associate hardened:** added signed claim tokens and required them for drill/formation/practice-plan association; UI stores/sends claimToken. (`src/lib/server/utils/claimTokens.js`, `src/routes/api/**/associate/+server.js`, `src/routes/+layout.svelte`)
- **Practice plan contract fixes:** `groupTimelines` camelCase accepted (snake_case backward compatible), formation duration 0 allowed, and prototype patching removed into class. (`src/lib/validation/practicePlanSchema.ts`, `src/lib/server/services/practicePlanService.js`)
- **Skill recommendations logic fixed:** now recommends new skills by unnesting overlaps and excluding current skills. (`src/lib/server/services/skillService.js`)
- **Circular store dependency removed:** historyStore no longer imports sectionsStore; snapshot getter injected. (`src/lib/stores/historyStore.js`, `src/lib/stores/sectionsStore.js`)
- **Duplicate drill mutation endpoints removed:** `/api/drills` now only GET/POST. (`src/routes/api/drills/+server.js`)
- **DB stub safety + hooks perf:** DB throws if missing connection string in production; hooks upsert gated by `ENABLE_HOOKS_USER_UPSERT`. (`src/lib/server/db.js`, `src/hooks.server.js`)
- **BaseEntityService read perf:** removed unnecessary read transactions in `getAll`. (`src/lib/server/services/baseEntityService.js`)
- **Recurrence date correctness:** recurrence generation now parses YYYY‑MM‑DD as local dates and skip_dates are matched locally to avoid off‑by‑one errors. (`src/lib/server/services/recurrenceService.js`)
- **deletePracticePlan now returns true** for clearer semantics. (`src/lib/server/services/practicePlanService.js`)

### Unit tests

- Updated/realigned failing suites for practice plans, formations, recurrence, and practice plan service to match current contracts and permissions.
- `pnpm run test:unit:run` passes cleanly (306 tests, 8 skipped).

### Typecheck / lint

- `pnpm run check` passes with existing Svelte a11y/style warnings (not addressed here).
- `pnpm run lint` prints many pre‑existing ESLint/Prettier issues across the repo but exits 0 due to script `|| true`.

### Playwright MCP smoke

- Started dev server and verified key pages load without runtime errors:
  - Home (`/`)
  - Drills list + create form (`/drills`, `/drills/create`)
  - Practice plans list (`/practice-plans`)
  - Formations list + create form (`/formations`, `/formations/create`)
- TinyMCE shows expected dev warnings for missing API key; unrelated to patches.

## 2025-12-12 — Prod smoke follow-up

- **Found new regression in practice plan create:** clicking “Add Drill” then selecting a drill in `EnhancedAddItemModal` always toasted “No section selected” in prod.
  - Root cause: `SectionHeader.svelte` dispatched `openDrillSearch` with raw `section.id`, but `PracticePlanForm.svelte` expects `{ sectionId }`.
  - Fixed by dispatching `{ sectionId: section.id }` (commit `26f1802`) and pushed to `main`. Waiting for prod deploy to re‑verify full practice plan flow.

- **Formation search modal mismatch:** `EnhancedAddItemModal` calls `/api/formations/search?query=...` but the endpoint only read `q`, causing 500 “Search term is required” in prod.
  - Patched search route to accept both `query` and legacy `q` (commit `c1a55a2`) and pushed to `main`; will re‑verify after deploy.
