# UI Redesign + Teams — TODOs

Last updated: 2025-08-17

## Scope

- Bring remaining Teams views up to the new design system (AppShell + shared UI components) and standardize API usage and UX.
- Add UI tests for core Teams flows.

## Remaining Work

1. Season Recurrences page

- Migrate to UI kit components: `Card`, `Button`, `Input`, `Select`, `Dialog`.
- Replace `fetch` with `apiFetch` and consistent error handling (inline errors + toasts).
- Use consistent badge styles for active/inactive status.
- Align empty/loading states with shared patterns.

2. Season Week view

- Replace text links/alerts with `Button` variants and Card-based messages.
- Keep `WeekView` logic; align scaffold and controls with design tokens.
- Swap direct `fetch` calls to `apiFetch` for any client requests (if added later).

3. Playwright coverage for Teams

- Create E2E specs for:
  - Teams list: open Create Team dialog, validate required fields, submit, redirect to settings.
  - Settings: update General fields; Members add (email), change role, remove; enforce last-admin constraint.
  - Season overview: create season, set active, navigate to Sections/Markers/Recurrences/Week.
  - Recurrences: create/edit/delete, preview/generate batch.
  - Week view: navigate weeks, admin vs member visibility hints.

## Acceptance Criteria

- Recurrences and Week view use shared UI kit and consistent UX (loading, errors, toasts, accessibility).
- All Teams pages avoid ad‑hoc Daisy/inline patterns in favor of shared components.
- Playwright specs cover the above flows and run locally.

## Notes

- Schema expectations: `default_start_time` accepts `HH:MM(:SS)?`; UI currently sends `HH:MM` which is valid.
- Server guards already restrict admin actions; client UI should hide admin-only controls when `userRole !== 'admin'`.
