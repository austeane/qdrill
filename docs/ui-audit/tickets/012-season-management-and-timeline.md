# 012 — Season Management & Timeline UX

Status: Proposed

Scope:
- Season timeline (admin view), Sections management, Events/Markers management, Week view entry points, Share settings

Why:
- Current flows are split across separate pages with minimal guidance. Creating/editing sections and markers requires navigation away from the timeline. Error and success feedback are inconsistent. Timeline interactions are not yet inline or discoverable.

Key UX Changes (updated after seeding real data)

1) Consolidate management into one surface
- Replace separate Manage Sections and Manage Events pages with a single Season Settings page using tabs: Overview, Sections, Events, Share.
- Keep the timeline visible at the top with admin controls below, so updates reflect immediately.

2) Inline editing on the timeline
- Sections: draw to create range, drag edges to adjust dates, color picker inline, rename inline.
- Markers: click on a day to add, drag to move, optional multi-day support via resize.
- Immediate optimistic UI update, with toast confirmation and server reconciliation.

3) Clear empty states and onboarding
- Empty season: CTA cards “Add your first Section” and “Add an Event”.
- Short helper text and quick tips.

4) Permissions clarity
- Show “Admin only” badges on mutation actions. Non-admins see read-only labels and disabled controls with hints.

5) Week view integration
- From timeline: right-click / context menu to “Create practice on this date”, “Go to week view here”.
- Week view chips reflect published/draft state; toggle publish inline.

6) Error/feedback consistency
- Replace alerts with toasts and inline error rows. Keep errors anchored next to the form that failed.

7) Accessibility
- Keyboard navigation across days and controls; ARIA roles for timeline grid; focus rings; larger hit areas for dates.

Data/Backend Alignment
- Markers API returns a flat array (GET) and accepts UI shape (name/date) or service shape (title/start_date). Normalize server-side.
- Sections/Markers server loads pass `locals.user.id` for visibility and permissions.

UI Components Needed
- TimelineDay (with badges for practices, published status)
- SectionPill (draggable, resizable)
- MarkerDot/Label (draggable)
- AdminToolbar (mode: select, add section, add marker)
- ShareSettings panel

Milestones
- M1: Merge settings pages; flat markers API; toasts; basic SSR of timeline with skeletons
- M2: Inline create/edit for markers and sections; optimistic updates with conflict resolution
- M3: Drag/resize interactions and keyboard access; larger hit targets and snapping
- M4: Context menus and Week view deep links; recurrence preview (ghost chips) with skip markers
- M5: Polish, print styles, a11y QA, e2e flows (create season, add section, add marker, open week)

Risks
- Date math edge cases; SSR vs client interactions; permission edge cases on shared links

Acceptance Criteria (high-level)
- Keyboard-only timeline editing supported (arrow to move focus, Shift+Arrow to extend range, Enter to confirm, Esc to cancel)
- Admin-only actions gated with visible cues; non-admins see read-only affordances
- Creating a practice from timeline shows non-blocking feedback with actions to open existing or view week
- Share settings panel saves and reflects state inline with clear success/error toasts

References

Observed Pain Points (from current screenshots and flow)
- Markers are small colored squares with floating labels; hard to scan and select precisely.
- Section pills extend under month headers; boundaries aren’t clear when overlapping.
- No inline controls for creating/editing sections or markers; separate pages feel disjointed.
- Alerts interrupt the flow (e.g., duplicate practice creation). Prefer inline, contextual messaging.
- Share settings sometimes fail to load; surface retry and status inline with skeletons.
- Recurrence patterns live on another page; discovering and previewing effects from the timeline is hard.

Proposals mapped to issues
- Marker affordance: use larger circular dots with a short text chip; show vertical guide line on hover/focus.
- Section editing: on-hover toolbar for rename, color, and drag handles; prevent overlap with gentle snapping.
- Inline create: click to add marker; drag across days to add a section; ESC to cancel.
- Conflicts: when creating a practice, show a non-blocking toast with “Open existing plan” and “View week” actions.
- Recurrence: add “Add Recurrence” from timeline toolbar; preview in-place as ghost practice chips, with skip markers highlighted.
- Accessibility: enable arrow key navigation across days, Enter to activate, Shift+Arrow to extend range; ARIA grid semantics.

Screenshots to capture (after seeding)
- Timeline with Regular Season and Postseason sections and three markers (provided).
- Week view after generating from a Tue/Thu recurrence.
- Inline marker create popover and section color change.
- Screenshots captured in `docs/ui-audit/playwright/`


