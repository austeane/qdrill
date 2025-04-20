# Ticket 17: Refactor Complex `ExcalidrawWrapper` Component

**Priority:** Medium

**Description:** The [`src/components/ExcalidrawWrapper.svelte`](src/components/ExcalidrawWrapper.svelte) component is extremely large (>1000 lines) and handles too many responsibilities related to integrating the Excalidraw React library into Svelte. It manages rendering, data loading/saving, template generation, a custom sidebar with image assets, fullscreen mode (via a second instance), state synchronization, and various workarounds.

**Affected Files:**

*   [`src/components/ExcalidrawWrapper.svelte`](src/components/ExcalidrawWrapper.svelte)
*   Components using it (e.g., `DrillForm.svelte`, `FormationForm.svelte`, potentially [`bulk-upload/+page.svelte`](src/routes/bulk-upload/+page.svelte), detail pages)

**Related Notes:**

*   [`code-review/diagram-notes.md`](code-review/diagram-notes.md)
*   [`code-review/holistic-summary.md`](code-review/holistic-summary.md) (Key Themes: Component Design, React Dependency)

**Action Required:**

1.  **Break Down Component:** Refactor the component into smaller, more focused sub-components or modules:
    *   **Template Generation Logic:** Extract the code for generating `blank`, `halfCourt`, and `fullCourt` templates into a separate utility or module.
    *   **Sidebar/Icon Logic:** Extract the logic for fetching, converting (`fetchImageAsDataURL`), and positioning sidebar icons into a separate component or utility. Consider caching the base64 data URLs.
    *   **Fullscreen Logic:** Re-evaluate the fullscreen implementation. Can the existing instance be reused/restyled instead of creating a second instance? If not, encapsulate the fullscreen modal logic more cleanly.
    *   **React Integration:** Isolate the core React mounting/unmounting/updating logic.
2.  **Optimize Asset Handling:** Improve the `fetchImageAsDataURL` logic. Implement caching for the base64 URLs to avoid refetching on every mount. Explore if Excalidraw can reference external URLs or use its file cache more effectively to avoid bloating saved scene data with base64 strings.
3.  **Improve State Synchronization:** Simplify the state management between the normal and fullscreen instances if the two-instance approach remains. Ensure data consistency.
4.  **Remove Hardcoding:** Replace hardcoded layouts, positions, colors, and asset paths with configuration objects or props where possible.
5.  **Address Workarounds:** Investigate the root causes for workarounds like `window.process.env` injection and guide rectangle repositioning (`fixGuideRectanglePosition`) and try to address them directly.
6.  **Consider Alternatives (Long Term):** Evaluate if a native Svelte diagramming library could meet the requirements, potentially reducing complexity and eliminating the React dependency, although finding one with feature parity to Excalidraw might be difficult. 