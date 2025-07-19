# Ticket 27: Remove Unused Components

**Priority:** Low

**Description:** The codebase contains Svelte components that appear to be unused remnants from examples or previous development phases. Removing this dead code improves maintainability and reduces clutter.

**Affected Files:**

- [`src/routes/Counter.svelte`](src/routes/Counter.svelte) (removed in commit `b984680`)
- [`src/lib/components/Cart.svelte`](src/lib/components/Cart.svelte) (removed in commit `2a7b3e5`)
- [`src/lib/components/LoginButton.svelte`](src/lib/components/LoginButton.svelte) (removed in commit `2a7b3e5`)
- [`src/lib/components/SkeletonLoader.svelte`](src/lib/components/SkeletonLoader.svelte) (kept - actively used by loading states feature)
- [`src/lib/components/TitleWithTooltip.svelte`](src/lib/components/TitleWithTooltip.svelte) (removed in commit `2a7b3e5`)
- [`src/lib/components/practice-plan/ParallelActivityCreator.svelte`](src/lib/components/practice-plan/ParallelActivityCreator.svelte) (removed in commit `2a7b3e5`)
- [`src/lib/components/practice-plan/ParallelTimelineView.svelte`](src/lib/components/practice-plan/ParallelTimelineView.svelte) (removed in commit `2a7b3e5`)
- [`src/lib/components/practice-plan/modals/DrillSearchModal.svelte`](src/lib/components/practice-plan/modals/DrillSearchModal.svelte) (removed in commit `2a7b3e5`)

**Related Notes:**

- [`code-review/routes-base-notes.md`](code-review/routes-base-notes.md)
- [`code-review/holistic-summary.md`](code-review/holistic-summary.md)

**Action Required:**

1.  Confirm that the components listed above are not referenced anywhere in the application (beyond documentation). ✅
2.  Remove the truly unused components from the repository. ✅
3.  Continue scanning for any additional dead code components.
