# Teams Practice Plan Creation — Investigation, Fixes, and Verification

## Date: August 28, 2025

## Executive Summary

We reviewed the “Create Practice” flow in the Teams schedule and implemented front‑end fixes that address navigation and state issues that could make the UI feel stuck after creation. The instantiate API is present and validates payloads. If creation errors persist, they are more likely due to backend validation/permissions or environment data rather than client‑side navigation. A prior hypothesis around transaction isolation is retained below as historical context but was not reproduced during this pass.

## Current State (Verified)

- Dialog: `src/lib/components/season/desktop/CreatePracticeDialog.svelte`
  - Posts to `POST /api/seasons/[seasonId]/instantiate` with `scheduled_date`, `start_time`, `seed_default_sections`, `practice_type`.
  - When “Create and edit immediately” is checked, the dialog now closes and awaits navigation to `/teams/{teamId}/plans/{id}/edit` (which redirects to `/practice-plans/{id}/edit`).
  - Selected date is reactive to parent date changes while the dialog is open.
  - Pre‑check for existing practices is guarded and inside try/catch; API errors surface with toasts.

- Redirect route: `src/routes/teams/[teamId]/plans/[id]/edit/+page.server.js` — redirects to `/practice-plans/{id}/edit`.
- Editor load: `src/routes/practice-plans/[id]/edit/+page.server.js` — performs permission checks and can also load pending plan data via an API if present.
- Instantiate endpoint: `src/routes/api/seasons/[seasonId]/instantiate/+server.js` — validates input via zod, checks team admin membership, calls `seasonUnionService.instantiatePracticePlan`, returns created plan JSON with `id`.

## What Changed (Client)

- Close and await navigation when editing immediately:
  - After a successful create, `handleClose()` then `await goto(`/teams/${teamId}/plans/${response.id}/edit`)`.
- Route consistency: Navigate through team‑scoped route (already redirects to the shared editor).
- Safer pre‑check: `Array.isArray(existingPractices)` guard and central try/catch ensure unexpected API shapes don’t silently short‑circuit.
- Reactive date: `$:` keeps `selectedDate` synced with parent `date` when open.

## Remaining Risks / Gaps

- Backend validation: The instantiate route does not currently validate that `scheduled_date` is within the season’s range before calling services. An out‑of‑range date would be better rejected early with a 400.
- Error shape consistency: `apiFetch` supports non‑OK JSON/text responses, but backend should return consistent `{ error, code }` payloads to improve user messaging.
- Permissions: Instantiate requires team admin membership; missing/incorrect auth will yield 401/403 which appear as toasts in the dialog.

## Recommendations (Backend)

- Add season date guard to instantiate:
  - Validate `scheduled_date` bounds relative to `season.start_date` and `season.end_date`; return 400 with a clear message if invalid.
- Ensure consistent error payloads:
  - `{ error: 'message', code: '...' }` across failure cases to improve client toasts.
- Add structured logs around service call:
  - Log `season.id`, `team_id`, user id, and sanitized payload to help triage environment/data issues.

## Verification Plan (Manual / MCP / Playwright)

- Preconditions: Logged in as a team admin; dev server running on `http://localhost:3000`.
- Manual path:
  - Go to `/teams/{teamId}/season` (Schedule view).
  - Pick a date, click “Practice,” fill fields, optionally check “Create and edit immediately.”
  - Expect: success toast; dialog closes; navigate to `/teams/{teamId}/plans/{id}/edit` and land at `/practice-plans/{id}/edit`.
- Playwright sketch:
  - Intercept `POST /api/seasons/:seasonId/instantiate` and return `{ id: 123 }`.
  - Trigger dialog, fill inputs, tick the checkbox, click create.
  - Assert URL is `/practice-plans/123/edit`.

If you’d like, we can add a minimal Playwright spec under `tests/` that fakes the instantiate response to validate the UI flow without needing a full backend.

## Historical Hypothesis (Not Reproduced This Pass)

Earlier notes suggested a transaction visibility issue in service methods (e.g., `createWithContent` followed by `getByIdWithContent` inside a transaction). We did not observe evidence of this with the current code paths during this review. If errors persist server‑side, focus first on:

- Environment/auth issues causing 401/403/404.
- Season/date/section data assumptions in `seasonUnionService.instantiatePracticePlan`.
- Adding logging to `withTransaction` and service reads if a true TX visibility issue is suspected.

## Files Relevant to This Flow

- `src/lib/components/season/desktop/CreatePracticeDialog.svelte`
- `src/lib/components/season/views/Schedule.svelte`
- `src/routes/teams/[teamId]/plans/[id]/edit/+page.server.js`
- `src/routes/practice-plans/[id]/edit/+page.server.js`
- `src/routes/api/seasons/[seasonId]/instantiate/+server.js`

## Next Steps

- Implement recommended backend validations and error payload consistency.
- Optionally add a Playwright test to lock UI behavior.
- If server errors persist, capture logs around instantiate and service calls with correlation IDs.

## Conclusion

The client‑side issues that could make the UI feel stuck after creation are addressed. The instantiate endpoint is present and validates inputs. The most valuable next work is tighter backend validation and error shaping, plus a small e2e test to verify the new “Create & Edit immediately” behavior end‑to‑end.
