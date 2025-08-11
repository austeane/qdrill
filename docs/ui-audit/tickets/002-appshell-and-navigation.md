## Ticket 002: AppShell Layout and Navigation (Topbar, Sidebar, Breadcrumbs, Mobile Nav)

Branch: `feat/ui-revamp-one-shot`

Objectives
- Establish a consistent application shell with global navigation
- Add a CMD+K command palette for quick navigation
- Provide a sticky bottom nav on mobile

Scope of Work
- New: `src/lib/components/nav/Topbar.svelte`
  - Logo, global search stub, theme toggle, user menu placeholder
- New: `src/lib/components/nav/Sidebar.svelte`
  - Primary nav: Drills, Practice Plans, Formations, Whiteboard, Teams
  - Collapsible behavior at md breakpoint
- New: `src/lib/components/nav/Breadcrumbs.svelte`
  - Accepts segments from page load data; supports optional dropdown for sibling pages
- New: `src/lib/components/CommandPalette.svelte` (cmdk-sv)
  - Routes: Drills, Plans, Formations, Whiteboard, Teams
- Edit: `src/routes/+layout.svelte`
  - Wrap slot with AppShell (sidebar + topbar + main); inject breadcrumbs and mobile bottom nav

Acceptance Criteria
- All pages render within AppShell; breadcrumbs show current hierarchy
- Sidebar collapses on smaller widths; bottom nav visible on mobile
- CMD+K opens command palette and navigates to selected route

Notes
- Keep palette search simple (static routes only) for now
- Defer user auth/menu integration


