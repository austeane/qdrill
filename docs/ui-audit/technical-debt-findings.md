## QDrill Technical Debt and UX Issues (2025-08-11)

This log collects notable technical and UX issues observed while navigating local dev (`vercel dev`) and the live plan page [Practice Plan 65](https://www.qdrill.app/practice-plans/65).

### Environment/Tooling

- vercel dev selected port 3002 due to conflicts on 3000/3001; consider documenting or reserving ports
- Vite warning: svelte-forms-lib missing exports condition for svelte field; evaluate replacing with superforms or pinning versions

### Console Signals from Live Plan Page

Captured via console capture on the live page.

- Excessive logging from components (`[Section]`, `[DrillCard]`, `UpvoteDownvote`) cluttering console
  - Action: strip debug logs in production builds (guarded by env), or use a structured logger with levels
- “[DrillCard] Drill data:” sometimes logs empty handle after items load, implies optional chaining/async normalization edge; validate data contract
- Repeated “Using default name for …” logs indicate fallback logic firing regularly; move to development-only logging

### Navigation/Linking

- On the live plan page, automated DOM scan found no drill anchor tags returned at runtime via the query used.
  - Likely rendered via components without direct `a[href]`, or nested clickable cards without anchors
  - Action: ensure drill cards are anchored links to `/drills/[id]` for accessibility, SEO, and easy middle-click/open in new tab

### Accessibility and Structure

- Sections use multiple tinted backgrounds (e.g., `bg-*-50`) that may reduce contrast in long pages
  - Action: prefer borders/rails or subtle background with strong text contrast
- Ensure keyboard focus management for overlays (drill details, modals) and stepper
- Add ARIA roles/labels to tabs, accordions, and section headings for better navigation

### State/UX Consistency

- Role filters (Chasers/Beaters/Seekers) behave like tabs; ensure consistent selected/hover/disabled states
- Voting components initialize with practicePlanId only; ensure drillId paths are distinct in drill context to avoid data confusion

### Performance

- Heavy sections lists likely benefit from `content-visibility: auto` and virtualization for very long plans
- Lazy-load large images/diagrams on drill cards; ensure width/height to prevent CLS

### Data Contracts and Normalization

- Logs suggest multiple normalization passes for the same items; dedupe or memoize normalized results
- Validate that each drill item has stable `id`, role, duration; guard against missing properties to avoid transient UI gaps

### Recommendations Summary

- Replace ad-hoc logs with a leveled logger; production builds should be quiet by default
- Ensure all drill cards link to canonical `/drills/[id]` routes
- Reduce tinted backgrounds; improve contrast and scannability
- Adopt superforms + zod for consistent validation
- Introduce design tokens and standardized components to reduce UI divergence

### References

- Live plan used for observation: [https://www.qdrill.app/practice-plans/65](https://www.qdrill.app/practice-plans/65)
