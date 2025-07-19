# Ticket 32: Consolidate Theme Definitions (Tailwind vs CSS Vars)

**Priority:** Low

**Description:** Theme colors are defined in two places with different values: `tailwind.config.js` (e.g., `theme-1: '#ff3e00'`) and `src/routes/styles.css` (e.g., `--color-theme-1: #3b82f6`). Additionally, some styles in `src/routes/styles.css` (like drag-and-drop indicators) use hardcoded color values that don't match either theme definition.

**Affected Files:**

- [`tailwind.config.js`](tailwind.config.js)
- [`src/routes/styles.css`](src/routes/styles.css)

**Related Notes:**

- [`code-review/config-app-notes.md`](code-review/config-app-notes.md)
- [`code-review/holistic-summary.md`](code-review/holistic-summary.md)

**Action Required:**

1.  Decide on a single source of truth for theme colors.
    - **Option A (Tailwind Preferred):** Define colors _only_ in [`tailwind.config.js`](tailwind.config.js). Remove the theme-related CSS variables (`--color-theme-1`, etc.) from [`src/routes/styles.css`](src/routes/styles.css). Update any elements currently styled with these CSS variables to use the corresponding Tailwind utility classes (e.g., `bg-theme-1`, `text-theme-1`).
    - **Option B (CSS Vars):** Define colors _only_ as CSS variables in [`src/routes/styles.css`](src/routes/styles.css). Ensure the Tailwind theme configuration (`theme.extend.colors`) references these CSS variables (e.g., `theme-1: 'var(--color-theme-1)'`).
2.  Refactor hardcoded color values in [`src/routes/styles.css`](src/routes/styles.css) (e.g., `#3b82f6` used for drag/drop indicators) to use the chosen theme system (either Tailwind utility classes like `bg-blue-500` or theme-specific classes like `bg-theme-1`, or the corresponding CSS variable like `var(--color-theme-1)`).
3.  Ensure visual consistency across the application after consolidation.

## Implementation Notes (Completed)

- Chose **Option B**: CSS variables in `src/routes/styles.css` serve as the
  single source of truth for theme colors.
- `tailwind.config.js` now references these variables for `theme-1`,
  `theme-2`, `primary`, and drag-related colors.
- Hardcoded drag-and-drop colors in `src/routes/styles.css` were replaced with
  references to the theme variables.
