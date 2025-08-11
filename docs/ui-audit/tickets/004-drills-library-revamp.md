## Ticket 004: Drills Library Revamp (Search, Filters, Grid/List, Density)

Branch: `feat/ui-revamp-one-shot`

Objectives
- Improve discoverability and scannability of drills
- Provide persistent filters and debounced search

Scope of Work
- Edit: `src/routes/drills/+page.svelte`
  - Two-column layout: sticky filter sidebar + content
  - Search bar with `/` keyboard focus; debounced input
- New: `src/lib/components/drills/DrillCard.svelte`
  - Image-first card; title, tags, duration, role; quick actions (View, Add to Plan)
- New: `src/lib/components/drills/Filters.svelte`
  - Roles, skills, difficulty, duration, tags; active filter chips with clear-all
  - Save/load presets in `localStorage`
- Optional: grid/list toggle and density control (compact/comfortable)
- Optional: bulk selection with checkbox to add multiple drills to a plan at once
- Optional: virtual scrolling when result count > 100

Acceptance Criteria
- Searching and filtering update the list without full reloads
- Active filters are visible as chips; presets can be saved/loaded
- Empty state and skeleton loading are implemented

Out of Scope
- Server-side search/index changes; client-side only for this ticket

Notes
- Use real `<a href="/drills/[id]">` for navigation from cards
- Ensure images are lazy-loaded with width/height set to prevent CLS


