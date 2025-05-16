## Diagrams Feature Review

This section reviews the code related to creating and managing diagrams using Excalidraw.

**Files Reviewed:**

- `src/components/ExcalidrawWrapper.svelte`
  - **Notes:** Wraps the `@excalidraw/excalidraw` React component for Svelte. Handles initialization, data loading (from prop or template), fullscreen editing mode, and saving scene data. Dynamically imports React/Excalidraw. Includes logic to programmatically generate initial elements for templates ('blank', 'halfCourt', 'fullCourt') and a sidebar library of draggable icons (players, hoops, balls, cone). Converts image assets to base64 Data URLs for embedding.
  - **Potential Issues:**
    - **Major: React Dependency:** Pulling `react`, `react-dom`, and `@excalidraw/excalidraw` into a Svelte project adds significant complexity, bundle size, and potential performance overhead. Managing the React component lifecycle manually (`ReactDOM.createRoot`, `root.render`, `root.unmount`) within Svelte hooks is non-standard.
    - **High Complexity:** The component is very large (>1000 lines) and handles multiple distinct concerns: Excalidraw rendering, data serialization/deserialization, template generation, image fetching/conversion, fullscreen modal logic, sidebar element creation, view/zoom management. Consider breaking down responsibilities.
    - **State Synchronization:** Managing state between the inline preview instance and the separate fullscreen modal instance (copying `elements`, `appState`, `files`) appears complex and potentially fragile.
    - **Image Data URLs:** Fetching images and converting them to Base64 Data URLs (`fetchImageAsDataURL`) happens on component initialization and template generation. This increases initial load time and significantly bloats the saved scene data JSON. While potentially necessary for Excalidraw's image handling, it's a notable drawback. Explore if Excalidraw offers alternative image handling (e.g., referencing URLs directly if persistence isn't needed within the Excalidraw blob itself, or using the file cache more effectively).
    - **Hardcoded Layouts:** Template element positions (`addHalfCourtElements`, `addFullCourtElements`) and sidebar element positions (`addSidebarElements`) are hardcoded. This makes layout adjustments cumbersome. Consider defining layouts in configuration objects.
    - **Fullscreen Implementation:** Creates an entirely new Excalidraw instance for fullscreen mode (`createFullscreenComponent`) rather than potentially reusing or simply restyling the existing one. This doubles the resources needed when fullscreen is active.
    - **Asynchronous Timing:** Relies on `tick()` and `setTimeout` in several places (especially around fullscreen transitions and initial zoom) which can sometimes indicate tricky timing requirements or race conditions.
    - **Guide Rectangle Logic:** The presence of `fixGuideRectanglePosition` suggests potential issues with elements drifting or the guide rectangle not staying at (0,0), requiring a corrective mechanism.
    - Minor: Uses `window.process` polyfill, which is standard but worth noting. Error handling uses `console.error`/`console.warn`.

**Files Pending Review:**

_(Add more files as review progresses)_
