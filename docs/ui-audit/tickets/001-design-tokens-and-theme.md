## Ticket 001: Design Tokens, Typography, and Theme (Light/Dark)

Branch: `feat/ui-revamp-one-shot`

Objectives
- Introduce CSS variable-based design tokens (colors, spacing, radii, shadows)
- Establish typography scale and apply globally
- Implement light/dark mode toggle with persistence

Scope of Work
- New file: `src/lib/styles/tokens.css`
  - Define color tokens using Radix scales mapped to semantic roles (bg, surface, text, border, focus, accent)
  - Define spacing, radius, and shadow tokens
- Edit: `src/app.css`
  - Import tokens, base typography, body defaults, and focus outline styles
- New: `src/lib/stores/themeStore.ts`
  - Writable store with localStorage persistence and `applyTheme()` util to set `data-theme`
- Edit: `src/routes/+layout.svelte`
  - Wire theme toggle in top bar placeholder; set `data-theme` on `<html>`/`<body>`

Acceptance Criteria
- Toggle switches between light and dark, persists across reloads
- Body, headings, links adopt the new type scale and colors; AA contrast for body text and interactive states
- No visual regressions in major pages; app loads without console errors

Notes
- Keep token set minimal to start; expand during component work
- Avoid Skeleton UI for now; rely on Tailwind + tokens


