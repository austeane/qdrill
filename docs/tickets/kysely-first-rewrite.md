# Ticket: Kysely‑First Data Access Rewrite (Full Migration, TDD/Parity)

Owner: TBD  
Priority: P2–P1 (large refactor, but unlocks velocity + correctness)  
Target branch: `main` (feature‑flagged roll‑out)  
Related feedback: BaseEntityService/Kysely unification discussion

---

## 0. Problem statement

The repo currently has three competing data‑access paradigms:

1. **Raw SQL CRUD + `_buildWhereClause`** in `src/lib/server/services/baseEntityService.js`  
2. **Kysely complex reads** inside domain services (notably `DrillService.getFilteredDrills`, large list/search paths in practice plans and formations)  
3. **Kysely FTS helpers** (`_buildSearchQuery`, `_executeSearch`) embedded in the raw‑SQL base service

This hybrid state causes:

- No clear “right way” to query.
- Manual re‑implementation of permissions and filters in every Kysely list query.
- Drift between list results vs count queries, and between raw‑SQL search vs Kysely search.
- Harder reviews and higher risk of permission leaks / owner‑can’t‑see‑private regressions.

---

## 1. Goal / non‑goals

### Goals

- **Kysely becomes the canonical database API** for all reads and writes.  
  - Raw SQL allowed only as `sql\`\`` fragments *executed through Kysely*.
- **One Kysely‑first `BaseEntityService`** that owns cross‑cutting concerns:
  - standard read/edit permissions (visibility + ownership)
  - filter DSL translation
  - one FTS + trigram fallback search
  - pagination + count parity
  - generic CRUD
- **Entity services remain thin**: build base query (joins/computed cols), then call base helpers, return shaped results.
- **Routes stop duplicating permission checks** unless purely route‑specific.
- Migration is **incremental and parity‑verified** via golden‑master tests (legacy vs Kysely outputs).

### Non‑goals

- No UI changes.
- No schema changes unless required for parity (e.g., column renames already in backlog are out of scope).
- No “big‑bang” rewrite without tests.

---

## 2. Current architecture map (files to touch)

### Base layer

- Legacy base (raw SQL + permission/filter DSL + Kysely search helpers):  
  `src/lib/server/services/baseEntityService.js`
- DB export + Kysely instance:  
  `src/lib/server/db.js`

### Domain services extending base (must migrate)

All of these extend `BaseEntityService` today:

- `src/lib/server/services/drillService.js`
- `src/lib/server/services/practicePlanService.js`
- `src/lib/server/services/formationService.js`
- `src/lib/server/services/skillService.js`
- `src/lib/server/services/teamService.js`
- `src/lib/server/services/teamMemberService.js`
- `src/lib/server/services/recurrenceService.js`
- `src/lib/server/services/seasonService.js`
- `src/lib/server/services/seasonSectionService.js`
- `src/lib/server/services/seasonMarkerService.js`
- `src/lib/server/services/userService.js`

### API routes that currently rely on base behavior

These should not change signature during migration (parity tests cover):

- Drills:
  - `src/routes/api/drills/+server.js` (GET list, POST create)
  - `src/routes/api/drills/[id]/+server.js`
  - `src/routes/api/drills/search/+server.js`
  - `src/routes/api/drills/[id]/variations/+server.js`
- Practice plans:
  - `src/routes/api/practice-plans/+server.js`
  - `src/routes/api/practice-plans/[id]/+server.js`
  - `src/routes/api/practice-plans/search/+server.js`
- Formations:
  - `src/routes/api/formations/+server.js`
  - `src/routes/api/formations/[id]/+server.js`
  - `src/routes/api/formations/search/+server.js`
- Skills/teams/seasons endpoints as needed.

---

## 3. End‑state design

### 3.1 New BaseEntityService (Kysely‑first)

Create a new file **side‑by‑side**:

- `src/lib/server/services/kyselyBaseEntityService.js`
- Copy current base to `src/lib/server/services/legacyBaseEntityService.js` (for parity tests).

Public API of the new base must match today:

- `getAll(options)`
- `getById(id, columns, userId, trx?)`
- `create(data, trx?)`
- `update(id, data, trx?)`
- `delete(id, trx?)`
- `exists(id)`
- `withTransaction(callback)`
- `canUserView(entity, viewerUserId)`
- `canUserEdit(entityId, viewerUserId, trx?)`

#### Kysely base structure (high‑level)

- `constructor(tableName, primaryKey, defaultColumns, allowedColumns, columnTypes, permissionConfig)`
  - Same config shape as legacy base.
  - Keep `allowedColumns` semantics identical for parity.
- `_db(trx)` returns `trx ?? kyselyDb` from `src/lib/server/db.js`
- `_selectFrom(trx, alias?)` returns `this._db(trx).selectFrom(alias ?? this.tableName)`

#### Canonical read permissions helper

Implement `_applyReadPermissions(qb, viewerUserId, alias = null)`:

- Uses `permissionConfig` fields:
  - `visibilityColumn` (default `visibility`)
  - `publicValue` / `unlistedValue` / `privateValue`
  - `userIdColumn` (default `created_by`)
- Behavior must match legacy base `_buildWhereClause` and `canUserView()` exactly:
  - allow public + unlisted for everyone
  - allow private only for creator when viewerUserId is not null
  - treat missing publicValue as NULL‑public only if legacy did

Alias handling:

- If alias provided, use `${alias}.${column}` in comparisons.

#### Filter DSL translation helper

Implement `_applyFilters(qb, filters, alias = null)` to translate legacy DSL into Kysely `where` clauses.

Supported operators must match `_buildWhereClause`:

- `__exact` / `__eq` → `=`  
- `__neq` → `!=`  
- `__gt` / `__gte` / `__lt` / `__lte`  
- `__like` / `__ilike`  
- `__isnull`  
- `__in` (array values only)  
- `__any` for Postgres arrays:
  - scalar value → `$val = ANY(col)`
  - array value → `col && ARRAY[$vals]`

Implementation notes:

- Validate columns via `this.isColumnAllowed(column)` (same as legacy).
- Respect `columnTypes[col] === 'array'` semantics.
- Alias columns similarly to permissions.
- Keep “skip undefined, skip null unless isnull” behavior for parity.

#### Search helper (single implementation)

Port existing Kysely `_buildSearchQuery/_executeSearch` from legacy base:

- Keep prefix `:*` to_tsquery behavior.
- Keep trigram fallback with `similarity(...) > trigramThreshold`.
- Ensure fallback appends `similarity_score` without re‑selecting base columns (see current `src/lib/server/services/baseEntityService.js#_executeSearch`).

Public `.search()` in legacy base is deprecated; new base should **not** re‑introduce raw‑SQL search.

#### Pagination + count parity

New base `getAll()` should:

1. Start from a Kysely query builder with any service‑provided selects/joins.  
2. Apply filters → permissions → search.  
3. Clone for count:
   - `const countQb = qb.clone().clearSelect().select(({fn}) => fn.countAll().as('count'))`
4. Apply ordering + limit/offset on item qb only.  
5. Return `{ items, pagination }` matching legacy shape.

#### Transactions

New base `withTransaction(cb)` uses:

```js
return kyselyDb.transaction().execute(async (trx) => cb(trx));
```

To preserve call sites expecting a `client.query`, do one of:

- Option A (preferred): update service write methods to accept Kysely trx and convert their raw SQL to Kysely as they migrate.
- Option B (temporary): provide a small adapter in Kysely base exposing `trx.query(sql, params)` by delegating to `trx.executeQuery(sql)` for raw fragments. Avoid long‑term use.

---

## 4. Migration plan (TDD / golden‑master)

### PR0 — Parity harness + fixtures (tests first)

1. Add dev deps:
   - `testcontainers` + `@testcontainers/postgresql` (or equivalent)
   - ensure Vitest environment can run docker in CI.
2. Create helper:
   - `src/lib/server/services/__tests__/helpers/testDb.js`
     - starts pg container
     - runs a minimal schema SQL fixture
     - seeds deterministic data
3. Add fixture SQL in `src/lib/server/services/__tests__/fixtures/schema.sql` and `seed.sql`.
   - Cover tables used by parity tests: `drills`, `formations`, `practice_plans`, `users`, plus join tables as needed.
4. Add parity test suite:
   - `src/lib/server/services/__tests__/parity/baseEntityService.parity.test.js`
   - Instantiate legacy base (`legacyBaseEntityService.js`) and new base (`kyselyBaseEntityService.js`) on same DB.
   - For a matrix of inputs, assert deep equality on:
     - items length + IDs order
     - pagination counts
     - thrown errors and error codes

Matrix to cover:

- permissions:
  - public/unlisted/private items
  - viewerUserId null vs owner vs other user
- filters:
  - scalar eq/neq/gt/gte/lt/lte
  - ilike/like
  - in
  - any scalar + any array
- search:
  - FTS hit
  - FTS miss → trigram fallback hit
  - FTS miss → fallback miss
- pagination:
  - page 1 vs page N parity, count matches items.

Exit criteria PR0:

- Parity tests compile and pass *against legacy base only* (new base can be stubbed for now).

### PR1 — Introduce new Kysely base side‑by‑side

1. Copy `src/lib/server/services/baseEntityService.js` to:
   - `src/lib/server/services/legacyBaseEntityService.js` (unchanged logic)
2. Implement `src/lib/server/services/kyselyBaseEntityService.js` per section 3.
3. Update parity tests to compare legacy vs Kysely base.

Exit criteria PR1:

- Parity suite passes for base APIs (`getAll/getById/exists`, filters, permissions, search).

### PR2 — Migrate reads: Drills

Target file: `src/lib/server/services/drillService.js`

Tasks:

- Replace `extends BaseEntityService` import to new base.
- `getFilteredDrills(filters, options)`:
  - Build base Kysely query with joins/counts as now.
  - Remove manual visibility OR logic.
  - Call `this._applyReadPermissions(qb, options.userId)`
  - Replace duplicated filter logic by calling `_applyFilters(qb, filters)`
  - Call `_applySearch(qb, filters.searchQuery, {...})`
  - Use base pagination parity helper or clone logic identical to base.
- Any other drill reads using manual visibility should be re‑routed to `_applyReadPermissions`.
  - e.g., `getAllDrillDetailsForAI` in same file.

Add parity tests:

- `src/lib/server/services/__tests__/parity/drillService.parity.test.js`
- Compare legacy DrillService vs new DrillService on list/search outputs.

Exit criteria PR2:

- Drill reads parity tests pass.
- Drills API routes unchanged externally.

### PR3 — Migrate reads: Formations

Target file: `src/lib/server/services/formationService.js`

Tasks:

- Switch to Kysely base.
- `getAllFormations(options)`:
  - Remove manual visibility OR.
  - `_applyReadPermissions(qb, options.userId)`
  - `_applyFilters` and `_applySearch`.
- `searchFormations` should route through the same search helper (already consolidated; keep it).

Parity tests:

- `formationService.parity.test.js` covering list/search.

Exit criteria PR3:

- Formation reads parity pass.

### PR4 — Migrate reads: Practice plans + remaining list reads

Target file: `src/lib/server/services/practicePlanService.js`

Tasks:

- Switch to Kysely base.
- `getAll(options)` / `getAllForTeam` / list/search paths:
  - remove manual visibility OR logic
  - use base helpers with table alias (`pp`).
- Ensure count vs items uses shared where builder to avoid drift.

Parity tests:

- `practicePlanService.parity.test.js` for list/search.

Exit criteria PR4:

- Practice plan reads parity pass.

### PR5–PR7 — Migrate writes, service by service

Approach:

- For each service, convert simplest CRUD first:
  - Base CRUD now Kysely, so services should rely on `super.create/update/delete`.
- For multi‑table writes:
  - Move raw `client.query('BEGIN')...` blocks to `withTransaction(trx => { ... })`
  - Convert to Kysely inserts/updates gradually.  
  - Where raw SQL is clearer (bulk/CTE), keep as `trx.executeQuery(sql\`\`)`.

Priority order:

1. Drills writes (`createDrill`, `updateDrill`, `deleteDrill`, variation ops).
2. Formations writes (`createFormation`, `updateFormation`, `deleteFormation`).
3. Practice plan writes (multi‑table inserts in `createPracticePlan`, updates, deletes).
4. Remaining smaller services.

Add parity tests for writes:

- Use the same fixtures; perform write with legacy service, read state; reset DB; perform write with new service; compare resulting rows.

Exit criteria PR7:

- Writes parity pass for drills/plans/formations.

### PR8 — Remove legacy paths

Tasks:

- Delete `_buildWhereClause` and raw SQL CRUD from legacy base.
- Remove `.search()` usage anywhere:
  - Search `rg \"\\.search\\(\" src/lib/server/services src/routes/api`
  - Update callers to use Kysely list/search path instead.
- Rename `kyselyBaseEntityService.js` → `baseEntityService.js` (or update all imports).
- Remove `legacyBaseEntityService.js`.

Exit criteria PR8:

- No imports of legacy base remain.
- No raw SQL CRUD remains outside explicit escape‑hatch fragments.
- Full unit + parity suites pass.

---

## 5. Clean‑up / guardrails during migration

While PR0‑PR8 are in flight:

1. **No new features using `_buildWhereClause`**.  
   If you need a new filter/permission, add it to Kysely base helpers.
2. **No new search implementations.**  
   Use the Kysely FTS + trigram helper only.
3. **Routes should not add permissions beyond service rules.**  
   If a route needs special access, encode it in a service method.

---

## 6. Rollout + validation

### CI

- Run:
  - `pnpm run test:unit:run`
  - parity suite
  - `pnpm run check`

### Production smoke (Playwright)

After PR4 and after PR7:

1. Drills:
   - `/drills` list with multi‑filters + search
   - private drill visible to owner, hidden to others
   - create/edit/delete (dev and prod flows)
2. Practice plans:
   - create plan with formation duration 0 + parallel timelines
   - view + edit + reorder
3. Formations:
   - list/search
   - create anonymous then claim with token
4. Teams/seasons:
   - season overview/schedule/manage load

---

## 7. Definition of done

- Kysely base fully replaces legacy base.
- All parity tests removed or kept as regression.
- All services/routes operate on one paradigm.
- No duplicated visibility/search logic remains in services/routes.

