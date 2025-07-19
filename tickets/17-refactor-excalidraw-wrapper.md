# Ticket 17: Refactor Complex `ExcalidrawWrapper` Component

**Priority:** Medium

**Description:** The [`src/lib/components/ExcalidrawWrapper.svelte`](src/lib/components/ExcalidrawWrapper.svelte) component remains quite large (~600 lines) and still handles many responsibilities related to integrating the Excalidraw React library into Svelte. A previous refactor extracted template generation and image utilities into [`src/lib/utils/excalidrawTemplates.js`](../src/lib/utils/excalidrawTemplates.js) and [`src/lib/utils/imageUtils.js`](../src/lib/utils/imageUtils.js), but the wrapper still manages rendering, data loading/saving, sidebar logic, fullscreen mode (using a second Excalidraw instance), state synchronization, and several workarounds.

**Affected Files:**

- [`src/lib/components/ExcalidrawWrapper.svelte`](../src/lib/components/ExcalidrawWrapper.svelte)
- Components using it (e.g., `DrillForm.svelte`, `FormationForm.svelte`, potentially [`bulk-upload/+page.svelte`](src/routes/bulk-upload/+page.svelte), detail pages)

**Related Notes:**

- [`code-review/diagram-notes.md`](code-review/diagram-notes.md)
- [`code-review/holistic-summary.md`](code-review/holistic-summary.md) (Key Themes: Component Design, React Dependency)

**Action Required:**

1.  **Break Down Component:** Refactor the component into smaller, more focused sub-components or modules:
    - **Template Generation Logic:** Already moved to `src/lib/utils/excalidrawTemplates.js`; review remaining logic in the wrapper and keep only the mounting concerns.
    - **Sidebar/Icon Logic:** Image fetching and caching lives in `src/lib/utils/imageUtils.js`, but the sidebar UI and placement logic are still inside the wrapper. Consider extracting this to a dedicated component.
    - **Fullscreen Logic:** Re-evaluate the fullscreen implementation. Can the existing instance be reused/restyled instead of creating a second instance? If not, encapsulate the fullscreen modal logic more cleanly.
    - **React Integration:** Isolate the core React mounting/unmounting/updating logic.
2.  **Optimize Asset Handling:** Caching for `fetchImageAsDataURL` now exists in `imageUtils.js`. Investigate whether Excalidraw can reference external URLs or leverage its internal file cache to further reduce scene size and avoid storing large data URLs.
3.  **Improve State Synchronization:** The wrapper mounts a second Excalidraw instance for fullscreen via `createFullscreenComponent` and manually copies scene data between the two. Simplify this flow or reuse a single instance so data stays consistent without extra bookkeeping.
4.  **Remove Hardcoding:** Replace hardcoded layouts, positions, colors, and asset paths with configuration objects or props where possible.
5.  **Address Workarounds:** Investigate the root causes for workarounds like `window.process.env` injection and guide rectangle repositioning (`fixGuideRectanglePosition`) and try to address them directly.
6.  **Consider Alternatives (Long Term):** Evaluate if a native Svelte diagramming library could meet the requirements, potentially reducing complexity and eliminating the React dependency, although finding one with feature parity to Excalidraw might be difficult.
