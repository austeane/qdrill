# Week View Authentication and Data Loading Debug Report

Status: Resolved (migrated Week View to server-side data loading)

## Issue Summary
The Week View page at `/teams/[teamId]/season/week` is stuck showing "Loading week data..." despite the user being logged in as "Austin Wallace" with admin privileges. Client-side API calls are failing with "Authentication required" errors.

## Implementation Context
**Phase 6: Week View** - Implementing a practical week-by-week practice management interface for coaches with quick navigation and at-a-glance views.

## Files Created/Modified

### New Files Created
1. **`/src/lib/components/season/WeekView.svelte`**
   - Main week view component with 7-day grid layout
   - Handles week navigation, practice display, and quick actions
   - Contains markers display and practice status indicators

2. **`/src/routes/teams/[teamId]/season/week/+page.svelte`**
   - Week view page component
   - Contains `onMount` with `loadWeekData()` function
   - Makes client-side fetch calls to API endpoints

3. **`/src/routes/teams/[teamId]/season/week/+page.server.js`**
   - Server-side load function for authentication
   - Returns user, userRole, and teamId

4. **`/src/routes/api/teams/[teamId]/seasons/active/+server.js`**
   - API endpoint for fetching active season
   - Checks team membership before returning data

### Modified Files
1. **`/src/routes/api/teams/[teamId]/practice-plans/+server.js`**
   - Changed import from `practicePlanService` to direct `query` import
   - Fixed column references: `practice_date` → `scheduled_date`
   - Fixed status filtering to use `is_published` boolean

2. **`/src/lib/server/services/baseEntityService.js`**
   - Added `.js` extensions to import paths
   - Fixed import from `$lib/server/errors` → `$lib/server/errors.js`

3. **`/src/lib/validation/seasonMarkerSchema.js`**
   - Separated base schema from refined schema
   - Fixed `.partial()` not working with `.refine()` issue

4. **`/src/routes/teams/[teamId]/season/+page.svelte`**
   - Added Week View navigation link

## Database Schema Findings

### practice_plans table
- Uses `scheduled_date` (date type) NOT `practice_date`
- Uses `is_published` (boolean) NOT `status` field
- Has `team_id` (uuid) and `season_id` (uuid) foreign keys
- Includes `start_time` (time) and `created_at` (timestamp)

### teams table
- Uses UUID for primary key
- Test team ID: `3017adc7-5b70-4a69-8545-b152b1957c98`
- Name: "Test Team Alpha"

### seasons table
- Active season ID: `bfa73012-8864-46c6-aee0-885e1de2c462`
- Name: "Winter 2025"
- Date range: 2025-01-01 to 2025-03-31
- `is_active`: true

### season_markers table
- Exists and properly structured
- Has timeline-related fields for events

## Issues Encountered and Resolutions

### 1. Svelte {@const} Syntax Error
**Error:** `{@const}` must be immediate child of block
**Location:** `/src/lib/components/season/SeasonTimeline.svelte`
**Fix:** Wrapped in `{#if true}` block

### 2. SSR Window Undefined Error
**Error:** `window is not defined` during server-side rendering
**Location:** `/src/routes/teams/[teamId]/season/week/+page.svelte:100-105`
**Fix:** Added `typeof window !== 'undefined'` check

### 3. Database Connection Issue
**Error:** `Cannot read properties of undefined (reading 'query')`
**Location:** `/src/routes/api/teams/[teamId]/seasons/active/+server.js`
**Fix:** Import `query` directly instead of non-existent `db` export

### 4. UUID Type Mismatch
**Error:** `invalid input syntax for type uuid: "1"`
**Location:** API endpoints expecting UUID team IDs
**Fix:** Use actual UUID: `3017adc7-5b70-4a69-8545-b152b1957c98`

### 5. Column Name Mismatch
**Error:** `column pp.practice_date does not exist`
**Location:** `/src/routes/api/teams/[teamId]/practice-plans/+server.js`
**Fix:** Changed all references to use `scheduled_date`

### 6. Zod Schema Refinement Issue
**Error:** `createSeasonMarkerSchema.partial is not a function`
**Location:** `/src/lib/validation/seasonMarkerSchema.js`
**Fix:** Created separate base schema and refined schemas

## Current Authentication Issue

### Symptoms
- Page shows user logged in (Austin Wallace visible in header)
- API calls return "Failed to fetch" error in browser console
- Adding `credentials: 'include'` to fetch calls didn't resolve issue
- Direct curl tests return "Authentication required"
- Server logs show no API endpoint hits from client-side fetches

### Debugging Attempts
1. **Added credentials to fetch calls**
   ```javascript
   fetch(url, { credentials: 'include' })
   ```
   Result: No improvement

2. **Restarted development server**
   Result: Server starts cleanly, issue persists

3. **Created server-side load function**
   Added `+page.server.js` with authentication check
   Result: Load function works but client-side fetches still fail

4. **Verified authentication state**
   Playwright shows "Austin Wallace" in header
   Result: User is authenticated at page level

5. **Tested API directly**
   ```bash
   curl "http://localhost:3000/api/teams/.../seasons/active"
   ```
   Result: Returns "Authentication required"

### What's Been Ruled Out
- ❌ **Database issues** - Direct psql queries work fine
- ❌ **Svelte syntax errors** - All fixed, server compiles cleanly
- ❌ **Missing endpoints** - All API files exist
- ❌ **Schema mismatches** - Column names corrected
- ❌ **Import errors** - All paths fixed with .js extensions

### Remaining Possibilities

1. **HttpOnly Cookie Issue**
   - Authentication cookies might be httpOnly
   - Client-side JavaScript can't access them
   - Server-side requests would work, client-side wouldn't

2. **CORS/Same-Origin Policy**
   - Browser might be blocking requests
   - Though same-origin shouldn't be an issue

3. **Reactive Statement Loop**
   - The `$: if (currentWeek && !loading)` might cause issues
   - Could be triggering infinite re-renders

4. **Session Context Mismatch**
   - Client and server might have different session contexts
   - SvelteKit's built-in fetch might be required

5. **Network Layer Blocking**
   - Something at Vite/Vercel dev server level
   - Might be intercepting or blocking requests

## Root Cause Analysis

### Most Likely Cause
**Client-side fetch in `onMount` doesn't have access to httpOnly authentication cookies.**

SvelteKit uses httpOnly cookies for security, which are not accessible to client-side JavaScript. The fetch API in the browser can't send these cookies unless:
1. The request is made from a server-side context
2. The request uses SvelteKit's special fetch that handles cookies

### Evidence Supporting This Theory
1. Server-side load function (`+page.server.js`) successfully authenticates
2. Direct API calls with curl fail (no cookie sent)
3. Browser shows user as logged in (server-rendered HTML has auth)
4. Client-side fetches fail immediately without hitting server

## Resolution

The Week View has been refactored to load all data on the server, eliminating the need for client-side authenticated fetches. SSR now provides `season`, `practices`, `markers`, and `currentWeek` to the page, and week navigation updates the `week` query param to trigger an SSR reload.

### Implemented Changes

- Week data loading moved to `+page.server.js` using the platform-provided `fetch` (sends cookies):
  - File: `src/routes/teams/[teamId]/season/week/+page.server.js`
  - Auth check with `locals.user`, membership check via `teamMemberService.getMember`
  - Server fetches:
    - `GET /api/teams/[teamId]/seasons/active`
    - `GET /api/teams/[teamId]/practice-plans?start_date=...&end_date=...&season_id=...`
    - `GET /api/seasons/[seasonId]/markers` (then filtered to week range)

- Page component updated to consume server data (no client fetch):
  - File: `src/routes/teams/[teamId]/season/week/+page.svelte`
  - Receives `season`, `practices`, `markers`, `currentWeek`, `userRole`
  - Keeps URL `week` param in sync only (no data fetching)

- Week view component navigation triggers SSR reloads:
  - File: `src/lib/components/season/WeekView.svelte`
  - Added `teamId` prop and `goto(/teams/[teamId]/season/week?week=YYYY-MM-DD)` on Next/Prev/Today
  - Rendering updated to use `is_published` instead of deprecated `status`

- Practice plans API already supports `is_published`; verified usage:
  - File: `src/routes/api/teams/[teamId]/practice-plans/+server.js` (filters by `is_published`)

- Added publish/unpublish endpoint (admin or creator):
  - New: `src/routes/api/practice-plans/[id]/publish/+server.js`
  - Uses DB `query` and `teamMemberService` for permission checks
  - Updates `practice_plans.is_published` and `published_at`

- Service alignment with `is_published`:
  - File: `src/lib/server/services/practicePlanService.js`
  - `createWithContent` writes `is_published` boolean
  - `publishPracticePlan`/`unpublishPracticePlan` update `is_published`

### Verification

- Navigated to `/teams/3017adc7-5b70-4a69-8545-b152b1957c98/season/week` while authenticated
  - Header shows "Austin Wallace"; page renders "Winter 2025 • Admin view"
  - Week grid renders; no client fetch errors
- Clicking "Next week" updates `?week=YYYY-MM-DD` and reloads SSR data
- "Today" returns to current week; counts update correctly

### Outcome

- Week View no longer gets stuck on "Loading week data..."
- All data loads server-side with correct authentication
- Week navigation works and remains fully SSR-compatible

## Notes

- For quick-create drafts, use the "+ Add Practice" button on a future day. This calls `POST /api/seasons/[seasonId]/instantiate` (admin) and navigates to the edit page.
- Publishing from Week View uses `POST /api/practice-plans/[id]/publish` and updates the UI to "Published".

## Next Steps

- Consider adding optimistic UI updates after publish/unpublish.
- Add loading indicators for SSR transitions (e.g., skeletons) if desired.

## Lessons Learned

1. **Authentication in SvelteKit is primarily server-side** - Client-side fetches need special handling
2. **Always check column names** - Database schemas may differ from assumptions
3. **Import paths need .js extensions** - ESM modules require explicit extensions
4. **Zod schemas with refinements** - Can't use `.partial()` directly on refined schemas
5. **UUID vs Integer IDs** - Always verify the actual data types in the database

## References

- SvelteKit Authentication: https://kit.svelte.dev/docs/load#cookies
- Server-side vs Client-side: https://kit.svelte.dev/docs/load#universal-vs-server
- HttpOnly Cookies: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies