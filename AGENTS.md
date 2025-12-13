# Repository Guidelines

## Project Overview

QDrill is a SvelteKit app (UI + API routes) for managing drills, formations, and practice plans, with a “Teams + Seasons” layer for shared planning. It deploys to Vercel (Node.js 20 runtime) and uses PostgreSQL (Vercel Postgres/Neon) via Kysely.

## Project Structure & Module Organization

- `src/routes/`: SvelteKit pages and API endpoints.
  - `src/routes/api/**/+server.js`: JSON/ICS APIs (drills, formations, practice plans, teams, seasons, votes, comments).
  - `src/routes/**/+page*.{js,svelte}`: UI routes (e.g., `/drills`, `/practice-plans`, `/teams/[slug]`).
- `src/lib/server/`: server-only modules (DB, services, auth/permissions, errors).
  - `src/lib/server/db.js`: Kysely + `@vercel/postgres` pool (reads `POSTGRES_URL`/`DATABASE_URL`).
  - `src/lib/server/services/*.js`: “service layer” (domain logic + DB access).
- `src/lib/validation/`: Zod schemas for API boundaries.
- `migrations/`: `node-pg-migrate` migrations (`*.cjs`) plus a few SQL scripts (`*.sql`) for schema changes.
- `tests/`: Playwright end-to-end tests.
- `cypress/`: Cypress e2e/component tests.
- `docs/`: architecture/implementation notes; start at `docs/index.md`.

## Tech Stack (What Runs Where)

- **SvelteKit + Svelte 5**: runes enabled in `svelte.config.js` (app code uses `$state/$derived/$effect` + `$props`). Some third‑party `.svelte` deps are compiled in legacy mode via `vitePlugin.dynamicCompileOptions` to keep builds working.
- **Styling**: Tailwind CSS (`tailwind.config.js`) + PostCSS (`postcss.config.cjs`).
- **DB**: Postgres via Kysely. Some endpoints/services use raw SQL via Kysely’s `sql` tag for complex joins/search.
- **Auth**: Better Auth (Google OAuth) configured in `src/lib/auth.js`; SvelteKit integration in `src/hooks.server.js`.
- **Observability**: Sentry in `src/hooks.server.js`; Vercel Analytics/Speed Insights injected from `src/routes/+layout.server.js` (gated to Vercel runtime).
- **Rich text**: TinyMCE is loaded dynamically in form routes (e.g. drills/formations/practice plans).
- **Diagramming**: Excalidraw is used for whiteboard/diagrams and pulls in React; see Vite `optimizeDeps` in `vite.config.js`.
- **AI**: `/api/practice-plans/generate-ai` uses Claude Opus 4.5 via the Vercel AI SDK (`@ai-sdk/anthropic`) and enforces per-user rate limits stored in `users`.

## Configuration & Environment Variables

Local development should run under `vercel dev` so runtime env vars and proxy headers match production behavior.

Common env vars (names only; don’t paste values in logs):

- **Database**: `POSTGRES_URL` or `DATABASE_URL` (used by `src/lib/server/db.js` and migrations). `VERCEL_ENV` + `NODE_ENV` affect “fail fast” vs stub DB behavior.
- **Auth (Better Auth + Google)**: `AUTH_SECRET`/`BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, optional `BETTER_AUTH_URL`/`PUBLIC_BETTER_AUTH_URL`.
- **Claim tokens**: `CLAIM_TOKEN_SECRET` (falls back to `AUTH_SECRET`).
- **Sentry**: `SENTRY_DSN`.
- **Feature flags**: `ENABLE_HOOKS_USER_UPSERT`, `ALLOW_DEV_DELETE_BYPASS`, `PUBLIC_TEAMS_LIST`.
- **AI**: `ANTHROPIC_API_KEY` (required for practice plan AI generation).

Local integration scripts under `scripts/` are not part of the SvelteKit runtime; they connect directly to Postgres using `NEON_DB_URL` (and often load `.env.development.local`).

## Authentication, Session, and User IDs (Deep Dive)

### Where `locals.session` comes from

`src/hooks.server.js` calls `auth.api.getSession({ headers })` on each request and sets:

- `event.locals.session`: Better Auth session + user payload
- `event.locals.user`: convenience alias of `event.locals.session.user`

Server load functions and endpoints should treat `event.locals.session?.user?.id` as the canonical logged-in user identifier.

Example:

```js
const session = locals.session;
const userId = session?.user?.id ?? null; // Better Auth user id (string)
```

### Better Auth + the app `users` table

Better Auth manages its own internal tables (created via `pnpm migrate:auth:up`) but the app also maintains an application-level `users` row keyed by the Better Auth id:

- `src/lib/auth.js` `callbacks.signIn`: upserts into `users` to prevent later FK failures.
- `src/lib/auth.js` `callbacks.session`: attaches `session.user.id` and ensures `session.user.role` (from `users.role`).
- `src/hooks.server.js`: optional safety net to “ensure user exists” when `ENABLE_HOOKS_USER_UPSERT=true` (or in dev).

**Important**: user IDs are **strings** (stored as `TEXT`), not integers/UUIDs. Any column named `created_by` or `user_id` in app tables generally refers to `users.id`.

## Authorization & Permissions

### Standard visibility model (public/unlisted/private)

Most content tables use the same “standard permissions” implemented in `src/lib/server/services/baseEntityService.js`:

- `visibility`: `public` and `unlisted` are readable by anyone.
- `private` is readable only by the owner (`created_by === viewerUserId`).
- Editing is allowed if you are:
  - the creator, **or**
  - `is_editable_by_others === true`, **or**
  - the record is unowned (`created_by IS NULL`), **or**
  - an app admin (`users.role === 'admin'`).

When adding a new endpoint, prefer calling the service method that already applies `_applyReadPermissions(...)` and `canUserEdit(...)` rather than re-implementing checks.

### Teams vs. global admin

There are two distinct role systems:

- **Global app role**: `users.role` (currently `admin`/`user`) used for admin-only UI under `src/routes/admin`.
- **Team role**: `team_members.role` (`admin`/`coach`/`member`) used for team/season permissions via `src/lib/server/auth/teamPermissions.js`.

Team URLs use slugs (see `src/routes/teams/[slug=slug]`), but DB relations use `teams.id` (UUID).

## Anonymous Creation + Claim Tokens

Drills/formations/practice plans can be created anonymously (`created_by = NULL`). The server returns a signed claim token so the creator can “claim” ownership after signing in:

- Token generation/verification: `src/lib/server/utils/claimTokens.js` (HMAC via `CLAIM_TOKEN_SECRET` or `AUTH_SECRET`).
- Create endpoints attach `claimToken` when `userId` is missing:
  - `src/routes/api/drills/+server.js`
  - `src/routes/api/formations/+server.js`
  - `src/routes/api/practice-plans/+server.js`
- Claim endpoints require auth + a valid token:
  - `src/routes/api/**/[id]/associate/+server.js`
- Client-side association: `src/routes/+layout.svelte` reads `sessionStorage` keys like `drillToAssociate` / `formationToAssociate` / `practicePlanToAssociate` and POSTs to the associate endpoints after login.

Separately, practice plan drafts may be stored server-side in `pending_practice_plans` and tracked with an HttpOnly cookie (`/api/pending-plans`).

## Database, Migrations, and Production Parity

### DB connection + environments

`src/lib/server/db.js` reads `POSTGRES_URL` or `DATABASE_URL` to create a Vercel-managed pool. If neither is set:

- In **production runtime** it throws (fail fast).
- In **dev/test/build** it uses a stub pool that returns empty results (useful for builds/tests, but don’t confuse it with a real DB).

### Schema and key tables (as used by code)

ID types are mixed and intentional:

- `users.id`: `TEXT` (Better Auth user id).
- `teams.id`, `seasons.id`: `UUID`.
- `drills.id`, `formations.id`, `practice_plans.id`: `INTEGER`.

Common relationships:

- `drills.created_by`, `formations.created_by`, `practice_plans.created_by` → `users.id`
- `team_members(team_id UUID, user_id TEXT)` → `teams.id` + `users.id`
- `practice_plan_drills` links `practice_plans` to `drills`/`formations` and stores timeline metadata (`parallel_group_id`, `parallel_timeline`, `group_timelines`).

Migrations live in `migrations/`:

- FTS: `search_vector` triggers + GIN indexes for drills/practice_plans/formations.
- Search fallback: `BaseEntityService` falls back to `pg_trgm` similarity when FTS yields 0 results (requires `pg_trgm` in the DB).
- Performance indexes for common filters (arrays, dates, votes, etc.).
- Teams/Seasons/Recurrence tables and constraints.

## Domain Model & Request Flows (Deep Dive)

### Drills

- **Primary table**: `drills` (integer `id`), with `created_by TEXT NULL`, `visibility`, and array columns like `skill_level`, `skills_focused_on`, `positions_focused_on`, `drill_type`.
- **Filtering/search**:
  - `/api/drills` and `DrillService.getFilteredDrills(...)` apply visibility rules and then use Postgres array operators (e.g. `skills_focused_on && $1`) plus FTS (`search_vector @@ to_tsquery(...)`).
  - If FTS returns 0 results, services may fall back to trigram similarity (`similarity(...) > 0.3`).
- **Ownership**: anonymous create sets `created_by = NULL`, returns a `claimToken`, and later POST `/api/drills/{id}/associate` verifies the token and sets `created_by = locals.session.user.id`.
- **Variants**: drills can reference `parent_drill_id`; UI allows promoting a variant to primary via `/api/drills/{id}/set-variant`.

### Formations

- **Primary table**: `formations` (integer `id`) with `tags[]`, `diagrams` (JSON), and the same visibility/ownership model.
- Search and claim flows mirror drills: `/api/formations`, `/api/formations/search`, `/api/formations/{id}/associate`.

### Practice Plans

- **Data model**:
  - `practice_plans` (integer `id`) stores metadata (`team_id UUID NULL`, `season_id UUID NULL`, `scheduled_date`, `status`, `is_published`, etc.).
  - `practice_plan_sections` stores ordered sections.
  - `practice_plan_drills` stores the timeline items: can link a `drill_id`, a `formation_id`, or represent a break/one-off.
- **Parallel timelines**:
  - Items can share a `parallel_group_id` and have distinct `parallel_timeline` values; `group_timelines` is used for filtering/rendering in the UI.
  - This is the core representation for “different position groups doing different things at the same time”.
- **Public vs team listing**:
  - `/api/practice-plans` uses `PracticePlanService.getAll(...)` (joins `votes` to compute `upvote_count`).
  - `/api/teams/{slug}/practice-plans` is team-scoped; members usually see only `is_published=true` while team `admin`/`coach` can view drafts too.
- **Publish workflow**: `PracticePlanService.publishPracticePlan(...)`/`unpublishPracticePlan(...)` enforce team membership/role when `team_id` is set.
- **Anonymous flows**:
  - Anonymous creates are forced to `visibility='public'` + `is_editable_by_others=true` and return a `claimToken`.
  - Drafts can also be stored server-side in `pending_practice_plans` and tracked via an HttpOnly cookie (`/api/pending-plans`).

### Teams, Seasons, and Scheduling

- **Teams**:
  - URLs use `teams.slug` (`src/routes/teams/[slug=slug]`), but permission checks and joins use `teams.id` (UUID).
  - Membership/roles live in `team_members(team_id UUID, user_id TEXT, role)`.
- **Seasons**:
  - `seasons` has share tokens (`public_view_token`, `ics_token`) and enforces “one active season per team” via a partial unique index.
  - ICS feed: `/api/seasons/{seasonId}/calendar.ics?token=...` is public if the token matches; otherwise it requires membership. Public feeds include only published practices.
- **Union-based practice instantiation**:
  - `/api/seasons/{seasonId}/instantiate` calls `seasonUnionService.instantiatePracticePlan(...)` to prefill a draft plan by combining:
    1) the season’s template practice plan,
    2) overlapping season sections’ default sections,
    3) overlapping season sections’ linked drills/formations.
- **Recurrences**:
  - `season_recurrences` stores patterns; `recurrenceService` can preview and batch-generate practices and records runs in `season_generation_logs`.

## Build, Test, and Development Commands

- Install: `pnpm install`
- Dev server (required): `vercel dev --listen 3000` (mirrors Vercel env + proxy behavior). Avoid `pnpm dev`/`vite dev` unless you explicitly don’t need Vercel-provided env vars.
- Typecheck: `pnpm check`
- Lint/format: `pnpm lint`, `pnpm format`
  - Note: `pnpm lint` is currently non-blocking (`|| true`). For a hard failure, run `pnpm exec prettier --check .` and `pnpm exec eslint .`.
- Migrations:
  - Create: `pnpm migrate:create`
  - App schema up/down: `pnpm migrate:up`, `pnpm migrate:down` (loads `.env.local`)
  - Better Auth tables: `pnpm migrate:auth:up`
- Unit tests (Vitest): `pnpm test:unit`, `pnpm test:unit:run`, `pnpm test:unit:coverage`
- Note: `pnpm test` is currently non-blocking (`|| true`); prefer `pnpm test:unit:run` for CI-grade unit test runs.
- Playwright (tests in `tests/`):
  - Against build+preview: `pnpm exec playwright test`
  - Against an existing dev server: `pnpm exec playwright test -c playwright-dev.config.js` (optionally `PW_NO_WEBSERVER=1`)
- Cypress:
  - Open: `pnpm exec cypress open`
  - Run headless: `pnpm exec cypress run`

## Coding Style & Naming Conventions

- Formatting: Prettier (`.prettierrc`) uses **tabs**, single quotes, `printWidth: 100`.
- Linting: ESLint flat config in `eslint.config.js`.
- Svelte: written in Svelte 5 runes mode (use `$state/$derived/$effect` + `$props()`, event attributes, and snippet props + `{@render ...}`).
- DB: column names are snake_case; avoid renaming DB fields in responses unless there’s a clear API boundary.
- Prefer the service layer (`src/lib/server/services/*`) for DB access; keep API routes thin and use `handleApiError` for consistent error shapes.

## Testing Guidelines

- Unit tests: colocated under `src/lib/**/__tests__` and `src/routes/api/__tests__` with Vitest.
- Prefer mocking DB via `src/lib/server/__tests__/mocks/db.js` for service tests; don’t require a live DB in unit tests.
- E2E: Playwright (`tests/`) and Cypress (`cypress/e2e`).

## Commit & Pull Request Guidelines

- Commits in this repo are generally short, imperative (“Fix…”, “Add…”, “Refactor…”), sometimes with lightweight prefixes like `chore:`.
- PRs should include: what changed, why, and how it was verified (commands run + screenshots for UI changes).
- Any schema change should include a migration in `migrations/` and a note about production rollout/backfill if needed.

## Agent-Specific Instructions

- Treat `locals.session.user.id` / `locals.user.id` as the source of truth for identity (string IDs).
- Run the app locally via `vercel dev` (not `pnpm dev`) so auth callbacks and runtime env vars match production expectations.
- When adding new endpoints, reuse `authGuard`, `requireTeamMember/admin`, and service-layer permission helpers instead of custom checks.
- Do not log secrets (DB URLs, OAuth secrets, API keys). Document env var **names** only.
