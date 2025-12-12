## QDrill UI/UX Revamp Proposal (2025-08-11)

This document proposes a wholesale UI/UX revamp for QDrill to improve aesthetics, usability, and consistency across the app. It is informed by a quick visual and behavioral audit of core routes, plus the live plan page [Practice Plan 65](https://www.qdrill.app/practice-plans/65).

### Goals

- Elevate visual polish and brand consistency
- Reduce cognitive load with clearer hierarchy and navigation
- Improve information density and scannability for coaches
- Standardize components, states, and interactions for speed and quality
- Ship accessible, responsive UI with dark mode

### Recommended Design Language and Tools

- **Tailwind CSS (existing)**: keep as the utility foundation
- **Radix Colors + CSS variables**: semantic tokens for color/theming (light/dark) with Tailwind integration
- **Component primitives**: Bits UI (Radix for Svelte) or Skeleton UI (Tailwind + Svelte)
  - Recommendation: **Skeleton UI** for a fast, cohesive Svelte + Tailwind system, supplemented with Bits UI where needed for complex a11y primitives (Dialog, Popover, Combobox)
- **Icons**: `lucide-svelte`
- **Typography**: Inter or Geist as primary font; define a modular type scale and Tailwind presets
- **Design tokens**: centralize colors, spacing, radii via CSS variables (e.g., `--radius-md`, `--spacing-4`)
- **Forms**: `sveltekit-superforms` + Zod schemas (aligns with current validation) for consistent errors, client/server validation and progressive enhancement

### Global App Shell and Navigation

- **Adopt an AppShell layout**
  - Topbar: product title/logo, global search, quick actions (Create Plan, Browse Drills), user menu
  - Left sidebar (desktop): primary navigation (Drills, Practice Plans, Formations, Whiteboard, Teams)
  - Collapsible to an icon-only rail; Bottom navigation (mobile)
- **Consistent page header**: breadcrumb, title, key metadata, primary actions grouped to the right
- **Standard content container**: max width (e.g., `max-w-screen-2xl`) with consistent gutters and vertical rhythm

### Visual System

- **8pt grid** for spacing; standard radii (`--radius-sm: 8px`, `--radius-md: 12px`)
- **Reduce tinted section backgrounds** (e.g., `bg-*-50`) in long documents; prefer subtle borders or left-accent rails to avoid low-contrast wash
- **Consistent shadows**: 2–3 elevation levels only
- **Chips/Tags** for roles (Chasers/Beaters/Seekers) with clear color coding and accessible contrast
- **Theme**: light and dark modes, brand accent; use Radix Colors scales for harmonious palettes

### Core Screens: Recommendations

1. Home/Landing

- Tighten hero with clearer CTA hierarchy: primary “Create Practice Plan”, secondary “Browse Drills”
- Use a clean split hero or full-bleed with soft overlay; remove heavy gradients/tints
- Add value props grid with concise copy and consistent iconography

2. Drills Library

- **Layout**: Two-column with sticky filter sidebar and responsive grid/list toggle
- **Search**: one prominent search bar with debounced query and keyboard focus shortcut ("/")
- **Filters**: roles, skills, difficulty, duration, tags; show active filters as chips with clear reset
- **Cards**: cover image/diagram, title, tags, duration, role, quick actions (View, Add to Plan)
- **Empty/Loading**: skeleton cards and expressive empty states

3. Drill Detail

- **Header**: title, meta (role, duration, difficulty), actions (Add to Plan, Upvote, Share)
- **Content**: description, steps, equipment, variations as tabs; related drills section
- **Deep links**: ensure a stable `/drills/[id]` with canonical link; support “open in overlay” for in-context viewing

4. Practice Plans – Browse

- Card grid with plan metadata (date, length, goals count), owners, upvotes; quick View/Copy actions
- Global search + filters (role coverage, duration range, formations included)

5. Practice Plan Viewer

- **Two-pane layout** (desktop):
  - Left: sticky time outline/sections (scrollspy)
  - Right: section content
- Collapsible sections; per-section time totals and sum at top; print/export-friendly layout
- **Drill cards clickable** to open drill detail (overlay) or navigate to `/drills/[id]`
- Inline formation chips with quick reference popover
- Per-role filtering with persistent tab state

6. Practice Plan Wizard

- **Stepper** across top with progress (%), step names, and validation states
- Sticky footer actions (Back, Next, Save Draft)
- Superforms + Zod for consistent client/server validation
- Inline field descriptions, contextual help, and error summaries on submit

7. Formations

- Grid of formation cards with previews; consistent actions (Duplicate, Associate, Share)
- Detail view: hero diagram, description, related drills/sections, quick add to plan

8. Whiteboard

- Clear, minimal toolbar with labeled groups and keyboard shortcuts
- Panels for templates/players with searchable lists; drag handles with clear affordances

### Accessibility

- Maintain the existing skip link; expand keyboard navigation coverage
- WCAG AA color contrast for text and interactive states
- Visible focus outlines consistent across components
- Aria roles/labels for tabs, dialogs, and accordions (use Bits UI/ARIA primitives)

### Performance and Loading

- Skeletons for lists/cards; optimistic UI for vote/add-to-plan where safe
- Lazy-load media; responsive images
- `content-visibility: auto` on long sections to limit layout work
- Cache common fetches (skills, filters) and use streaming where beneficial

### Implementation Plan (Phased)

- Phase 1: Design tokens, typography, colors, AppShell, and shared components (Button, Input, Select, Tabs, Dialog, Card, Skeleton)
- Phase 2: Drills Library + Drill Detail refactor; search and filters
- Phase 3: Practice Plan Viewer + Wizard redesign; print/export and overlay drill detail
- Phase 4: Formations, Whiteboard, Admin/Teams; finalize dark mode and theming

### Suggested Libraries and Setup

- Tailwind CSS + tailwind-forms plugin
- Radix Colors with Tailwind config mapping via CSS vars
- Skeleton UI (primary) and Bits UI (for advanced a11y primitives)
- lucide-svelte for icons
- sveltekit-superforms + zod for forms
- Style Dictionary (optional) to generate design tokens if expanding beyond Tailwind

### Artifacts

- Local screenshots captured under `docs/ui-audit/fast/`
- Live reference page: [Practice Plan 65](https://www.qdrill.app/practice-plans/65)

### Strengths of the Proposal

1. **Comprehensive approach**: The phased implementation plan is well-structured and realistic
2. **Modern tech stack**: Skeleton UI + Bits UI combination provides good balance of speed and accessibility
3. **Focus on information density**: Addressing coaches' need for quick scanning and decision-making
4. **Design token system**: CSS variables approach will improve maintainability and theming
5. **Performance considerations**: Skeleton loading states and lazy loading are essential for UX

### Suggested Refinements

#### 1. Navigation Strategy

- **Consider sticky mobile navigation**: Bottom nav should be sticky on mobile for quick access during scrolling
- **Breadcrumb enhancement**: Add dropdown menus to breadcrumbs for quick navigation between sibling pages
- **Quick switcher**: Add CMD+K search/command palette for power users to quickly navigate

#### 2. Drill Library Improvements

- **Visual preview priority**: Drill cards should prioritize diagram/image preview over text
- **Bulk actions**: Add checkbox selection for adding multiple drills to practice plan at once
- **Save filter presets**: Allow coaches to save common filter combinations
- **Grid density options**: Provide compact/comfortable/spacious view options
- **Shareable filters (URL-sync)**: Sync filter state to URLSearchParams so filtered lists can be bookmarked and shared; restore on reload and support Back/Forward history

#### 3. Practice Plan Editor

- **Inline editing**: Consider making drill durations and notes editable inline without modal
- **Keyboard shortcuts**: Document and implement shortcuts for common actions (duplicate, delete, reorder)
- **Auto-save with conflict resolution**: Implement optimistic updates with proper conflict handling
- **Export formats**: Include printable PDF with QR code linking back to online version

#### 4. Component Library Considerations

- **Toast notifications**: Add to the component list for success/error feedback
- **Command palette**: Consider cmdk-sv for powerful search and navigation
- **Data tables**: For admin/team management views, consider TanStack Table integration
- **Rich text editor**: If drill descriptions need formatting, consider Tiptap or similar

#### 5. Accessibility Enhancements

- **Focus management**: Implement focus trap for modals and proper focus restoration
- **Announce regions**: Use ARIA live regions for dynamic content updates
- **Keyboard navigation map**: Document all keyboard shortcuts in a help modal
- **High contrast mode**: Beyond dark mode, consider a high contrast theme option

#### 6. Mobile-First Refinements

- **Touch targets**: Ensure 44x44px minimum touch targets on mobile
- **Swipe gestures**: Consider swipe actions for drill cards (swipe to add to plan)
- **Progressive disclosure**: Use accordions more aggressively on mobile to reduce scroll
- **Offline support**: Implement service worker for offline viewing of cached plans

#### 7. Performance Optimizations

- **Virtual scrolling**: For drill library with 100+ items, implement virtual scrolling
- **Image optimization**: Use next-gen formats (WebP, AVIF) with fallbacks
- **Bundle splitting**: Lazy load heavy components (Excalidraw, whiteboard)
- **Edge caching**: Cache API responses at edge for faster global access

#### 8. Additional Features to Consider

- **Drill favorites**: Personal drill bookmarking system
- **Recent items**: Quick access to recently viewed/edited drills and plans
- **Collaborative editing**: Real-time collaboration indicators for team plans
- **Analytics dashboard**: Usage statistics for teams to track drill effectiveness

## Actionable Tickets: One-Shot Branch Plan (Solo Dev)

Constraints: one developer, single branch, deliver end-to-end in one pass. To reduce risk, we will favor a minimal dependency footprint: prioritize Tailwind + Bits UI + lucide-svelte + superforms/zod. Skeleton UI is deferred; tokens are introduced via CSS variables and Tailwind where feasible.

Branch and baseline

- Working branch name: `feat/ui-revamp-one-shot`
- Install libraries:

```bash
pnpm add bits-ui lucide-svelte sveltekit-superforms zod cmdk-sv
```

### Ticket 1: Design Tokens, Typography, and Theme (Light/Dark)

- Why: Establish consistent look and enable theming without broad refactors.
- Changes
  - New: `src/lib/styles/tokens.css` (CSS variables for colors, spacing, radii, shadows)
  - Edit: `src/app.css` to import tokens and set light/dark variables; base typography scale
  - Edit: `src/routes/+layout.svelte` to add `data-theme` on `<html>`/`<body>` and a toggler via store
  - New: `src/lib/stores/themeStore.ts` (persist in `localStorage`)
- Acceptance
  - App supports light/dark toggle in top bar; preference persists across reloads
  - Headings/body text use defined scale; color contrast meets AA for text and interactive states

### Ticket 2: AppShell Layout (Topbar + Sidebar + Breadcrumb Header)

- Why: Normalize navigation and page scaffolding.
- Changes
  - Edit: `src/routes/+layout.svelte` to wrap a left sidebar (desktop) + topbar + main content area
  - New: `src/lib/components/nav/Topbar.svelte`, `src/lib/components/nav/Sidebar.svelte`, `src/lib/components/nav/Breadcrumbs.svelte`
  - New: `src/lib/components/CommandPalette.svelte` (via `cmdk-sv`), wired to CMD+K
  - Edit: add bottom nav on mobile within layout when width < md
- Acceptance
  - Global navigation exists in all routes with consistent header and breadcrumbs
  - Command palette opens with CMD+K, can navigate to Drills, Plans, Formations, Whiteboard

### Ticket 3: Core UI Components

- Why: Align controls and states across the app.
- Changes
  - New: `src/lib/components/ui/Button.svelte` (primary/secondary/ghost/destructive, loading states)
  - New: `src/lib/components/ui/Input.svelte`, `Select.svelte` (Bits UI where applicable), `Tabs.svelte`, `Dialog.svelte`, `Card.svelte`, `Skeleton.svelte`, `ToastHost.svelte`
  - New: `src/lib/components/ui/icons.ts` exporting lucide icons used commonly
- Acceptance
  - All buttons and inputs in key pages use the new components
  - Toast host renders and can show success/error notifications programmatically

### Ticket 4: Drills Library Revamp

- Why: Searchability, scannability, and filter UX.
- Changes
  - Edit: `src/routes/drills/+page.svelte` to two-column layout with sticky filters; add search bar
  - New: `src/lib/components/drills/DrillCard.svelte` (image-first, title, tags, duration, role, quick actions)
  - New: `src/lib/components/drills/Filters.svelte` (role/skills/difficulty/duration/tags); display active filters as removable chips; save presets in `localStorage`
- Acceptance
  - Debounced search; filters persist during navigation; grid/list toggle; compact density option
  - Empty and loading states shown appropriately

### Ticket 5: Drill Detail Improvements

- Why: Clear structure and quick actions.
- Changes
  - Edit/New: `src/routes/drills/[id]/+page.svelte` to include header meta (role, duration, difficulty), tabs (Description, Steps, Equipment, Variations), related drills
  - Add primary actions: Add to Plan, Upvote, Share; use `Card` and `Tabs` components
- Acceptance
  - Navigating from library opens detail; content organized in tabs; related drills visible at bottom

### Ticket 6: Practice Plan Viewer Revamp

- Why: Better readability and navigation of long plans.
- Changes
  - Edit: `src/routes/practice-plans/[id]/+page.svelte` and `viewer/Section.svelte`, `viewer/ParallelGroup.svelte`, `viewer/DrillCard.svelte`
  - Two-pane (desktop): left scrollspy outline, right content; section collapse; per-section time totals and total at top
  - Drill cards link to canonical `/drills/[id]` and open overlay detail without leaving context
  - Reduce background tints; use left-accent rails and borders
- Acceptance
  - Outline highlights current section on scroll; drill cards are real `<a>` links and overlay detail works
  - Page prints cleanly without navigation chrome

### Ticket 7: Practice Plan Wizard UX

- Why: Clarity of progress, validation, and actions.
- Changes
  - Edit: `src/routes/practice-plans/wizard/+layout.svelte` and step pages to include a top stepper and sticky footer actions (Back/Next/Save)
  - Integrate `sveltekit-superforms` + `zod` for form validation; inline errors and error summary
  - Keyboard shortcuts for step navigation; autosave drafts
- Acceptance
  - Visual stepper with progress; validation prevents advancing with clear inline messages; autosave confirmed via toast

### Ticket 8: Accessibility and Keyboard

- Why: Baseline a11y coverage.
- Changes
  - Ensure focus outlines across interactive elements; Bits UI/Dialog with focus trap and restoration
  - ARIA labels/roles for tabs, accordions; maintain skip link and expand keyboard navigability
  - Add a help modal listing keyboard shortcuts; announce regions for dynamic updates
- Acceptance
  - Keyboard-only navigation succeeds across major flows; modals trap focus and restore correctly

### Ticket 9: Performance and Polish

- Why: Perceived speed and quality.
- Changes
  - Add `content-visibility: auto` to long sections; lazy-load images with width/height set
  - Replace console debug logs in production with leveled logger; silence by default in prod
  - Add subtle transitions via `tailwindcss-animate`-style classes for overlays and menus
- Acceptance
  - Long plan pages scroll smoothly; no noisy logs in production; no CLS from images

### Ticket 10: Command Palette and Quick Switcher

- Why: Power-user speed.
- Changes
  - Implement `src/lib/components/CommandPalette.svelte` using `cmdk-sv` with routes: Drills, Plans, Formations, Whiteboard, Teams
  - Bind to CMD+K in `Topbar.svelte`; add search providers for drills/plans by name
- Acceptance
  - CMD+K opens palette; typing navigates to matching routes; Enter performs navigation

### Ticket 11: Replace Heavy Tints and Ensure Drill Anchor Links

- Why: Readability and navigation basics.
- Changes
  - Refactor tinted `bg-*-50` blocks in viewer and other long pages to border/rail treatment using tokens
  - Ensure all drill renderings (cards/list items) are `<a href="/drills/[id]">`
- Add automated audit and e2e coverage to enforce anchor semantics (middle-click, context menu, right-click) and remove JS-only navigation
- Acceptance
  - Visual audit shows reduced large tinted blocks; middle-click open on drill links works everywhere

### Optional (If time permits): Exports and PDF

- Add print stylesheet and simple PDF export of a plan including QR code linking to online version

Notes

- Keep CSS variables and tokens minimal; expand as needed
- Defer Skeleton UI integration to a follow-up; Bits UI covers a11y needs with lower footprint
- Use `vercel dev` during development; add/update Cypress smoke tests for navigation as a final pass

### Tickets Index

- 001 Design Tokens and Theme: `docs/ui-audit/tickets/001-design-tokens-and-theme.md`
- 002 AppShell and Navigation: `docs/ui-audit/tickets/002-appshell-and-navigation.md`
- 003 Core UI Components: `docs/ui-audit/tickets/003-core-ui-components.md`
- 004 Drills Library Revamp: `docs/ui-audit/tickets/004-drills-library-revamp.md`
- 005 Drill Detail Improvements: `docs/ui-audit/tickets/005-drill-detail-improvements.md`
- 006 Practice Plan Viewer Revamp: `docs/ui-audit/tickets/006-practice-plan-viewer-revamp.md`
- 007 Practice Plan Wizard UX: `docs/ui-audit/tickets/007-practice-plan-wizard-ux.md`
- 008 Accessibility and Keyboard: `docs/ui-audit/tickets/008-accessibility-and-keyboard.md`
- 009 Performance and Polish: `docs/ui-audit/tickets/009-performance-and-polish.md`
- 010 Command Palette: `docs/ui-audit/tickets/010-command-palette.md`
- 011 Reduce Tints and Anchor Links: `docs/ui-audit/tickets/011-reduce-tints-and-anchor-links.md`
