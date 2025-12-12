# Teams Feature — UI Redesign Assessment and Plan

Last updated: 2025-08-17

## Overview

Goal: align the Teams feature (teams list + creation, team settings + members, seasons management) with the new component library and UX patterns introduced in the UI redesign. This includes replacing ad‑hoc Tailwind/Daisy usage with shared UI components, standardizing API calls via `apiFetch`, and adding Playwright UI tests for core flows.

## Summary of Improvements (Completed)

### UI Component Migration

- **Replaced DaisyUI classes** with modern UI components (Card, Button, Input, Select, Dialog, Badge, Tabs)
- **Consistent theming** with dark mode support via Tailwind CSS variables
- **Improved accessibility** with proper ARIA labels and semantic HTML
- **Enhanced visual hierarchy** using Cards for content grouping

### Member Management Enhancements

- **Full CRUD operations** for team members with email-based user search
- **Visual member list** with avatars, names, and email addresses
- **Inline role management** with dropdown selection
- **Safety constraints** preventing removal of last admin
- **Tabbed interface** separating General settings from Members management

### API Standardization

- **Unified error handling** via `apiFetch` utility across all components
- **Consistent loading states** with disabled buttons during operations
- **Toast notifications** for success/error feedback
- **Proper data refresh** using SvelteKit's `invalidate` function

### Season Management Updates

- **Sections page**: Drag-and-drop reordering with color coding
- **Markers page**: Timeline markers with type categorization and badges
- **Dialog-based forms** replacing inline editing for better UX
- **Validation feedback** with inline error messages

## Current State — Key Findings

- Backend

  - API routes are complete and consistent: `src/routes/api/teams/*`, `src/routes/api/teams/[teamId]/*`, and season-related APIs.
  - Services and permissions look good: `teamService`, `teamMemberService`, and `teamPermissions` provide required operations and guards.
  - Validation schemas exist and are in TS/JS mix; `teamSchema.ts` enforces expected shapes and regex for `default_start_time`.

- Frontend pages (Teams)

  - Teams list/create: `src/routes/teams/+page.svelte` — previously raw Tailwind + manual modal; now migrated to component library.
  - Team settings: `src/routes/teams/[teamId]/settings/+page.svelte` — previously raw Tailwind; now migrated to component library. Members section still basic (lists `user_id` and role only).
  - Season overview: `src/routes/teams/[teamId]/season/+page.svelte` — now uses `Button`, `Card`, `Dialog`, `Input`, `Checkbox`, and `apiFetch` for create/activate flows.
  - Season subpages:
    - Sections: `src/routes/teams/[teamId]/season/sections/+page.svelte` — still Daisy/Tailwind (btn/card classes), not migrated.
    - Markers: `src/routes/teams/[teamId]/season/markers/+page.svelte` — still Daisy/Tailwind, not yet migrated.
    - Recurrences: `src/routes/teams/[teamId]/season/recurrences/+page.svelte` — Tailwind table/forms, not migrated.
    - Week view: `src/routes/teams/[teamId]/season/week/+page.svelte` — action links and alerts in Tailwind; not migrated.

- Navigation/Scaffold

  - App shell and sidebar use the new design. Teams appears in nav and routes are integrated.

- Tests and MCP
  - Playwright tests exist for redesign demo and main areas only: `tests/ui-redesign.test.js`. No Teams-specific tests.
  - MCP dev log shows local dev server cannot bind a port in this sandbox: `.playwright-mcp/dev.log` (EPERM). Live browsing validation not possible here.

## Changes Implemented

1. Teams list/create — `src/routes/teams/+page.svelte`

   - Replaced manual modal and raw inputs with `Dialog`, `Input`, `Textarea`, `Select`, `Button`, `Card`.
   - Standardized API calls via `apiFetch` with consistent error handling.
   - Added `timezoneOptions` for `Select` component.

2. Team settings — `src/routes/teams/[teamId]/settings/+page.svelte`

   - Replaced raw form elements with `Input`, `Textarea`, `Select`, wrapped in `Card`.
   - Standardized update via `apiFetch`.
   - Kept basic members list intact (to be enhanced in next pass).

3. Season overview — `src/routes/teams/[teamId]/season/+page.svelte`
   - Replaced create season modal with `Dialog` and new form inputs.
   - Migrated actions to `Button` components and wrapped sections in `Card`.
   - Switched data fetches to `apiFetch` and improved UX states.

Note: Migration for Season subpages (Sections, Markers, Recurrences, Week) is planned; markers migration was started but not applied yet.

## Gaps vs. Redesign (Outstanding)

- Component usage

  - Sections/Markers/Recurrences/Week still rely on Daisy/Tailwind classes; need conversion to shared components.

- Members management UX

  - Team settings currently show `user_id` and role only. No add/remove/invite UI.
  - Should support: add by email/ID, change role (admin/member), remove (with safeguards), and surface user display info.

- Error/empty states

  - Some pages hand-roll alerts. Should switch to consistent patterns (inline error props and/or toast convention used elsewhere).

- Accessibility

  - Ensure aria labels/roles are applied through the shared components, remove bespoke interactive patterns.

- Tests
  - Missing Teams-specific Playwright coverage for happy paths and validations.

## Proposed UI/UX Improvements

- Teams list

  - Use `Card` for team tiles; include secondary metadata (member count, next practice date if available).
  - Replace inline text links with `Button` link variants for consistency.

- Create Team dialog

  - Validate on blur and submit, show inline errors beneath inputs.
  - Default timezone dropdown; optionally remember last used timezone.

- Team settings

  - Split into tabs: “General”, “Members”, “Integrations” (future), using `Tabs` component.
  - Members tab:
    - Display members with avatar + name + email + role chip.
    - Provide add member form (email-based), role dropdown, and remove action with confirm.
    - Respect constraints from `teamMemberService` (last admin safeguards).

- Season overview

  - Surface “Active” banner as `Card` header; unify the management links as a compact button group.
  - Provide a small overview of upcoming practices/events for the week.

- Sections/Markers/Recurrences/Week
  - Convert add/edit forms to `Input`/`Select`/`Dialog` patterns, buttons to `Button`, lists/tables into consistent `Card` wrapping with clear section headers.
  - Use consistent badge styles for statuses and labels.

## Migration Plan (Next Steps)

1. Season Sections page migration

   - Replace Daisy classes with `Card`, `Button`, and input components.
   - Standardize CRUD operations using `apiFetch` and inline error display.

2. Season Markers page migration

   - Convert add/edit UI to `Card` and UI components; replace Toasts with inline errors + optional toasts for success.

3. Recurrences page migration

   - Replace table header/actions with tokens; inputs with `Input` components; action buttons to `Button` variants.
   - Switch all fetches to `apiFetch` with consistent error handling.

4. Week view polish

   - Replace text links with `Button` link variant; unify alert styles; ensure navigation controls align with tokens.

5. Members management enhancements

   - Add server loader enrichment for member user info (name, email, image) and render in UI.
   - Add add/change role/remove controls with client-side constraints and confirmations.

6. Playwright tests
   - Add Teams flows coverage:
     - Teams list renders, open/submit Create Team dialog, required validation, redirect to settings.
     - Team settings update success/failure messaging.
     - Members: add, change role, remove (admin only) with constraints.
     - Season overview: create season dialog, set active, quick navigation to subpages.

## Acceptance Criteria

- All Teams pages use shared UI components (`Button`, `Input`, `Textarea`, `Select`, `Card`, `Dialog`, `Tabs` where appropriate).
- API calls standardized through `apiFetch`; user-facing errors are clear and consistent.
- Members management allows CRUD of memberships with role enforcement and last-admin safeguards.
- Season subpages have consistent styles, spacing, and accessibility.
- Playwright tests cover core Teams flows and pass locally.

## Risks / Notes

- Sandbox limitation blocks live MCP validation here (EPERM on dev server port). Local verification is recommended after changes.
- `default_start_time` in `teamSchema.ts` accepts `HH:MM` and `HH:MM:SS` — UI currently sends `HH:MM` which is acceptable.
- Avoid circular dependency pitfalls by keeping lazy imports in permissions/services as-is.

## Work Completed (this branch)

- Migrated pages:

  - `src/routes/teams/+page.svelte` - Uses Dialog, Input, Select, Button, Card components
  - `src/routes/teams/[teamId]/settings/+page.svelte` - Enhanced with Tabs, Dialog, Badge, member avatars
  - `src/routes/teams/[teamId]/season/+page.svelte` - Uses new UI components
  - `src/routes/teams/[teamId]/season/sections/+page.svelte` - Migrated to Card, Button, Input, Dialog
  - `src/routes/teams/[teamId]/season/markers/+page.svelte` - Migrated to Card, Button, Input, Select, Dialog, Badge

- Enhanced features:

  - **Members Management**: Added full CRUD functionality with user search by email
  - **Tab Navigation**: Team settings now use tabbed interface for General/Members
  - **User Avatars**: Display user profile images and names in member list
  - **Role Management**: Inline role switching with safeguards for last admin
  - **API Integration**: All pages now use `apiFetch` for consistent error handling

- New API endpoints:

  - `/api/users/search` - Search users by email for member addition

- Not migrated yet:
  - `src/routes/teams/[teamId]/season/recurrences/+page.svelte`
  - `src/routes/teams/[teamId]/season/week/+page.svelte`

## Checklist

- [x] Migrate Teams list/create to new UI and `apiFetch`
- [x] Migrate Team settings to new UI and `apiFetch`
- [x] Migrate Season overview to new UI and `apiFetch`
- [x] Migrate Sections page UI and actions
- [x] Migrate Markers page UI and actions
- [ ] Migrate Recurrences page UI and actions
- [ ] Polish Week view actions and alerts
- [x] Implement Members management UI (add/change role/remove)
- [ ] Add Teams Playwright tests for key flows
