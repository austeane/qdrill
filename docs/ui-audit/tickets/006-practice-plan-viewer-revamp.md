## Ticket 006: Practice Plan Viewer Revamp (Two-Pane, Scrollspy, Overlay Drill)

Branch: `feat/ui-revamp-one-shot`

Objectives
- Improve readability and navigation of long plans

Scope of Work
- Edit: `src/routes/practice-plans/[id]/+page.svelte`
- Edit: `src/routes/practice-plans/viewer/Section.svelte`, `ParallelGroup.svelte`, `DrillCard.svelte`
- Implement two-pane layout (desktop): left outline/scrollspy, right content
- Collapsible sections; per-section and total time summaries
- Drill cards are `<a href="/drills/[id]">` and also open overlay detail (Dialog) in-context
- Replace heavy tinted backgrounds with subtle rails/borders using tokens

Acceptance Criteria
- Scrollspy highlights the current section; clicking outline scrolls to section
- Middle-click on drills opens new tab; overlay detail renders with focus trap
- Print/export view hides navigation chrome and prints cleanly

Notes
- Use `content-visibility: auto` to improve scroll performance


