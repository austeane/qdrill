## Ticket 005: Drill Detail Improvements (Tabs, Meta, Related)

Branch: `feat/ui-revamp-one-shot`

Objectives
- Present drill information clearly with actionable controls

Scope of Work
- Edit/New: `src/routes/drills/[id]/+page.svelte`
  - Header: title, role, duration, difficulty, actions (Add to Plan, Upvote, Share)
  - Tabs: Description, Steps, Equipment, Variations
  - Related drills section (based on tags/role)

Acceptance Criteria
- Drill detail shows structured meta and tabs; actions visible without scrolling
- Related drills render with clickable cards linking to their detail pages

Notes
- Ensure canonical URL and SEO-friendly structure


