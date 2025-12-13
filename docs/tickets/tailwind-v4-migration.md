# Ticket: Tailwind CSS v4 Migration

Owner: TBD
Priority: P3 (low urgency, high effort, wait for ecosystem maturity)
Target branch: `main` (feature branch for testing)
Related: Package update session December 2025

---

## 0. Problem Statement

Tailwind CSS v4 introduces a fundamentally new architecture:

- **CSS-first configuration** replaces JavaScript config files
- **Native CSS nesting** eliminates need for postcss-nesting
- **New @theme directive** replaces theme.extend in JS
- **Simplified plugin system** moves away from JS-based plugins

Current setup (v3.4.19) works but will eventually fall behind on features and performance improvements. Tailwind 4 offers:

- 10x faster builds (full Rust engine)
- Smaller CSS output via automatic content detection
- Native CSS cascade layers
- Container queries built-in

---

## 1. Goal / Non-Goals

### Goals

- Migrate from Tailwind CSS v3.4 to v4.x
- Convert `tailwind.config.js` to CSS-first `@theme` configuration
- Replace `theme()` function calls with CSS variables
- Update `@tailwindcss/typography` plugin to v4-compatible version
- Maintain visual parity (no design changes)

### Non-Goals

- No design system overhaul
- No new utility usage beyond migration requirements
- No Svelte component refactoring (beyond theme() replacements)

---

## 2. Current Architecture

### Configuration Files

| File | Purpose |
|------|---------|
| `tailwind.config.js` | JS-based config with custom colors, fonts, typography, animations |
| `postcss.config.cjs` | PostCSS with tailwindcss, autoprefixer, postcss-nesting |
| `src/app.css` | Entry point with @tailwind directives |
| `src/lib/styles/tokens.css` | CSS variables for design tokens (light/dark themes) |

### Custom Theme Extensions

```javascript
// Current tailwind.config.js structure
{
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'theme-1': 'var(--color-theme-1)',
        'theme-2': 'var(--color-theme-2)',
        primary: 'var(--color-theme-2)',
        // ... 6 more custom colors
      },
      fontFamily: {
        body: ['Arial', ...systemFonts],
        mono: ['Fira Mono', 'monospace']
      },
      typography: { /* prose customizations */ },
      animation: { 'pulse-border': '...' },
      keyframes: { 'pulse-border': { ... } }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
```

### theme() Function Usage

~70 occurrences across 7 files in `<style>` blocks:

| File | Count | Example |
|------|-------|---------|
| `src/routes/practice-plans/viewer/DrillCard.svelte` | 20 | `theme('colors.gray.800')` |
| `src/routes/practice-plans/viewer/Timeline.svelte` | 17 | `theme('colors.blue.500')` |
| `src/routes/practice-plans/viewer/ParallelGroup.svelte` | 9 | `theme('colors.gray.200')` |
| `src/lib/components/practice-plan/PositionFilter.svelte` | 9 | `theme('colors.gray.700')` |
| `src/routes/practice-plans/viewer/Section.svelte` | 6 | `theme('colors.gray.900')` |
| `src/lib/components/practice-plan/FormationReference.svelte` | 6 | `theme('colors.blue.600')` |
| `src/lib/components/practice-plan/sections/SectionContainer.svelte` | 2 | `theme('colors.blue.500')` |

### @apply Usage

**None** in src directory. This significantly reduces migration complexity.

---

## 3. End-State Design

### 3.1 New CSS-First Configuration

Replace `tailwind.config.js` with CSS-based `@theme` in `src/app.css`:

```css
@import "tailwindcss";
@import './lib/styles/tokens.css';

@theme {
  /* Custom colors - reference existing CSS variables */
  --color-theme-1: var(--color-theme-1);
  --color-theme-2: var(--color-theme-2);
  --color-primary: var(--color-theme-2);
  --color-primary-foreground: var(--primary-foreground);
  --color-bg-0: rgb(202, 216, 228);
  --color-bg-1: hsl(209, 36%, 86%);
  --color-bg-2: hsl(224, 44%, 95%);
  --color-text: rgba(0, 0, 0, 0.7);
  --color-drag-indicator: var(--color-theme-1);
  --color-drag-highlight: rgba(255, 62, 0, 0.05);
  --color-drag-border: var(--color-theme-1);

  /* Font families */
  --font-family-body: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  --font-family-mono: "Fira Mono", monospace;

  /* Custom animations */
  --animate-pulse-border: pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-border {
  0%, 100% { border-color: rgba(59, 130, 246, 0.7); }
  50% { border-color: rgba(59, 130, 246, 0.3); }
}
```

### 3.2 Dark Mode Configuration

Tailwind v4 uses CSS-native dark mode. Update approach:

```css
/* Tailwind v4 uses @variant or built-in dark: prefix */
/* Our existing data-theme="dark" approach needs adaptation */

@variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

### 3.3 PostCSS Simplification

```javascript
// New postcss.config.cjs
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}
    // autoprefixer and nesting now built into Tailwind v4
  }
}
```

### 3.4 theme() Replacement Strategy

All `theme('colors.X.Y')` calls must be replaced with direct CSS variable references:

| Before (v3) | After (v4) |
|-------------|------------|
| `theme('colors.gray.800')` | `var(--color-gray-800)` |
| `theme('colors.blue.500')` | `var(--color-blue-500)` |
| `theme('colors.red.200')` | `var(--color-red-200)` |

Tailwind v4 exposes all default colors as CSS variables automatically.

### 3.5 Typography Plugin Migration

The `@tailwindcss/typography` plugin v4 uses CSS-based customization:

```css
@plugin "@tailwindcss/typography";

/* Customize prose via CSS instead of JS config */
.prose {
  --tw-prose-body: rgba(0, 0, 0, 0.7);
  --tw-prose-headings: rgba(0, 0, 0, 0.8);
  --tw-prose-links: var(--color-theme-1);
  max-width: none;
}
```

---

## 4. Migration Plan

### PR0 — Research & Compatibility Check

**Objective**: Verify ecosystem readiness

Tasks:
1. Check `@tailwindcss/typography` v4 release status
2. Verify Vite + SvelteKit compatibility with `@tailwindcss/vite`
3. Test bits-ui, lucide-svelte, and other dependencies for conflicts
4. Review Tailwind v4 migration guide for any missed breaking changes

Exit criteria:
- Documented compatibility matrix
- Go/no-go decision on proceeding

### PR1 — Create Migration Branch & Baseline

**Objective**: Establish comparison baseline

Tasks:
1. Create `feat/tailwind-v4` branch
2. Take screenshots of key pages for visual regression:
   - `/drills` (list view with filters)
   - `/drills/[id]` (detail view)
   - `/practice-plans` (list view)
   - `/practice-plans/viewer/[id]` (timeline view - most theme() usage)
   - Light and dark mode variants
3. Document current bundle size: `pnpm build && ls -la .svelte-kit/output`

Exit criteria:
- Visual baseline captured
- Bundle metrics recorded

### PR2 — Core Configuration Migration

**Objective**: Convert JS config to CSS-first

Tasks:
1. Update packages:
   ```bash
   pnpm remove tailwindcss @tailwindcss/typography postcss-nesting autoprefixer
   pnpm add tailwindcss@next @tailwindcss/typography@next @tailwindcss/postcss@next
   ```

2. Create new `src/app.css` with @theme directive (per section 3.1)

3. Update `postcss.config.cjs` (per section 3.3)

4. Delete `tailwind.config.js`

5. Update `vite.config.js` if needed for `@tailwindcss/vite`

6. Run `pnpm run check` and fix any immediate errors

Exit criteria:
- Build succeeds
- No TypeScript/Svelte errors

### PR3 — Replace theme() Function Calls

**Objective**: Convert all theme() to CSS variables

Files to update (in order of complexity):

1. `src/lib/components/practice-plan/sections/SectionContainer.svelte` (2 changes)
2. `src/lib/components/practice-plan/FormationReference.svelte` (6 changes)
3. `src/routes/practice-plans/viewer/Section.svelte` (6 changes)
4. `src/lib/components/practice-plan/PositionFilter.svelte` (9 changes)
5. `src/routes/practice-plans/viewer/ParallelGroup.svelte` (9 changes)
6. `src/routes/practice-plans/viewer/Timeline.svelte` (17 changes)
7. `src/routes/practice-plans/viewer/DrillCard.svelte` (20 changes)

Replacement pattern:
```css
/* Before */
border-color: theme('colors.blue.500');

/* After */
border-color: var(--color-blue-500);
```

Exit criteria:
- No `theme(` calls remain in codebase
- `rg "theme\(" src` returns empty

### PR4 — Typography Plugin Migration

**Objective**: Convert prose customizations to CSS

Tasks:
1. Remove `typography` config from old tailwind.config.js reference
2. Add CSS-based prose customization to `src/lib/styles/tokens.css`:
   ```css
   .prose {
     --tw-prose-body: rgba(0, 0, 0, 0.7);
     --tw-prose-headings: rgba(0, 0, 0, 0.8);
     --tw-prose-links: var(--color-theme-1);
     --tw-prose-links-hover: #2563eb;
     max-width: none;
   }
   .prose ul { list-style-type: disc; }
   ```
3. Test all pages using `.prose` class

Exit criteria:
- Typography renders identically to v3

### PR5 — Dark Mode Adaptation

**Objective**: Ensure dark mode works with v4's approach

Tasks:
1. Verify `[data-theme="dark"]` selector still works
2. If not, add custom variant (per section 3.2)
3. Test all pages in both light and dark modes
4. Compare against PR1 baseline screenshots

Exit criteria:
- Dark mode visually identical to baseline

### PR6 — Visual Regression & Cleanup

**Objective**: Verify visual parity and clean up

Tasks:
1. Compare all baseline screenshots against new build
2. Fix any visual regressions
3. Remove any unused CSS/config
4. Update documentation (CLAUDE.md references)
5. Run full test suite: `pnpm run test && pnpm run check`

Exit criteria:
- No visual regressions
- All tests pass
- Build size equal or smaller

### PR7 — Merge & Monitor

**Objective**: Production deployment

Tasks:
1. Merge to main
2. Deploy to Vercel preview
3. Manual smoke test on preview URL
4. Monitor for any CSS issues in production
5. Document any gotchas for future reference

---

## 5. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Typography plugin not ready for v4 | Medium | High | Wait for stable release or inline styles |
| Dark mode selector incompatibility | Low | Medium | Custom @variant fallback |
| Vite/SvelteKit integration issues | Low | High | Test in isolation first |
| Visual regressions in complex components | Medium | Medium | Baseline screenshots + manual QA |
| Build performance regression | Low | Low | Rust engine should be faster |

---

## 6. Files Changed Summary

| File | Action |
|------|--------|
| `tailwind.config.js` | Delete |
| `postcss.config.cjs` | Simplify (remove nesting, autoprefixer) |
| `src/app.css` | Add @theme directive, @plugin |
| `src/lib/styles/tokens.css` | Add prose CSS variables |
| `src/lib/components/practice-plan/sections/SectionContainer.svelte` | Replace 2 theme() |
| `src/lib/components/practice-plan/PositionFilter.svelte` | Replace 9 theme() |
| `src/lib/components/practice-plan/FormationReference.svelte` | Replace 6 theme() |
| `src/routes/practice-plans/viewer/ParallelGroup.svelte` | Replace 9 theme() |
| `src/routes/practice-plans/viewer/Timeline.svelte` | Replace 17 theme() |
| `src/routes/practice-plans/viewer/Section.svelte` | Replace 6 theme() |
| `src/routes/practice-plans/viewer/DrillCard.svelte` | Replace 20 theme() |
| `package.json` | Update tailwind deps |

---

## 7. Definition of Done

- [ ] Tailwind CSS v4.x installed and configured
- [ ] No `tailwind.config.js` file (CSS-first config only)
- [ ] No `theme()` function calls in codebase
- [ ] Typography plugin migrated to CSS-based customization
- [ ] Dark mode working with `[data-theme="dark"]`
- [ ] Visual parity confirmed via screenshot comparison
- [ ] Build size equal or smaller than v3
- [ ] All tests passing
- [ ] Documentation updated

---

## 8. Recommendation

**Wait for Tailwind v4 stable release and ecosystem maturity.**

Current state (December 2025):
- Tailwind v4 is in late beta
- @tailwindcss/typography v4 compatibility unclear
- SvelteKit + Vite integration path still evolving

Revisit criteria:
- Tailwind v4.0.0 stable released
- @tailwindcss/typography v4 stable released
- 2+ months of community feedback on SvelteKit integration

The migration is medium effort (~70 theme() replacements + config rewrite) but low urgency since v3.4 is stable and fully supported. The performance benefits of v4 are compelling but not critical for current app scale.
