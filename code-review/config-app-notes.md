# Configuration and Core App File Review Notes

This file contains notes from the review of root configuration files (`svelte.config.js`, `tailwind.config.js`, `tsconfig.json`, `vercel.json`, `vite.config.js`, `vitest.config.js`) and core app files (`src/app.html`, `src/hooks.server.js`, `src/styles.css`).

## Files Reviewed

*   `svelte.config.js`
*   `tailwind.config.js`
*   `tsconfig.json`
*   `vercel.json`
*   `vite.config.js`
*   `vitest.config.js`
*   `src/app.html`
*   `src/hooks.server.js`
*   `src/styles.css`

## Notes

**Overall:** Configurations are mostly standard for a SvelteKit project using Vercel, Tailwind, TypeScript, and Vitest. Core app files (`app.html`, `hooks.server.js`, `routes/styles.css`) are straightforward.

**Key Findings & Recommendations:**

1.  **TypeScript Strictness (`tsconfig.json`):**
    *   `noImplicitAny` is set to `false`.
    *   **Recommendation:** Enable `strict: true` in `compilerOptions` (or at least `noImplicitAny: true`) for significantly improved type safety and maintainability. This is a standard practice in professional TypeScript projects.

2.  **Color Theme Inconsistency (`tailwind.config.js` vs `src/routes/styles.css`):**
    *   `tailwind.config.js` defines theme colors (e.g., `theme-1: '#ff3e00'` - orange).
    *   `src/routes/styles.css` defines CSS variables for colors (e.g., `--color-theme-1: #3b82f6` - blue) and uses them for the body background and some specific classes (`.selected`).
    *   Drag-and-drop styles in `src/routes/styles.css` use hardcoded blue values (`#3b82f6`).
    *   **Recommendation:** Consolidate the color theme definitions. Either:
        *   Make the CSS variables in `styles.css` match the Tailwind theme colors and use the CSS variables consistently.
        *   Remove the theme-related CSS variables and rely *only* on Tailwind utility classes (`bg-theme-1`, `text-theme-1`, etc.) generated from `tailwind.config.js`. This is often the preferred approach when using Tailwind.
        *   Refactor hardcoded colors in `styles.css` (like drag/drop styles) to use the chosen theme system (Tailwind classes or CSS variables).

3.  **Vercel Rewrites (`vercel.json`):**
    *   Contains rewrites: `{ "source": "/api/drills/(.*)", "destination": "/api/drills" }` and similar for practice plans.
    *   **Question:** Are these rewrites still necessary? SvelteKit's standard filesystem routing (`src/routes/api/drills/[id]/+server.js`) usually handles parameterized routes automatically.
    *   **Recommendation:** Investigate if these rewrites can be removed. They might be redundant or could potentially interfere with SvelteKit's expected routing behavior.

4.  **Error Handling Cleanup (`src/hooks.server.js`):**
    *   The `handleError` hook calls `cleanup()` from `$lib/server/db` on *any* uncaught error.
    *   **Question:** What exactly does `db.cleanup()` do? Does it handle transaction rollbacks, release connections, or something else? Is it safe and appropriate to call unconditionally on all errors?
    *   **Recommendation:** Review the implementation of `db.cleanup()` to ensure it's robust, doesn't hide the original error (e.g., if cleanup itself fails), and doesn't have unintended side effects when called outside specific contexts (like after a database operation).

5.  **Vitest Globals (`vitest.config.js`):**
    *   `globals: true` is configured.
    *   **Recommendation (Minor):** Consider setting `globals: false` and using explicit imports (`describe`, `it`, `expect`, etc.) in test files. This makes dependencies clearer and avoids potential global namespace conflicts.

6.  **TS Module/Target (`tsconfig.json`):**
    *   Uses `target: "es6"` and `module: "commonjs"`.
    *   **Recommendation (Minor):** Consider updating to more recent ECMAScript targets/modules (e.g., `es2020`, `esnext`) if compatible with the runtime environment (Node version on Vercel) and dependencies, although `commonjs` is often necessary for Node.

**Minor Points:**

*   `svelte.config.js`: Minimal, uses Vercel adapter, prerenders root. Standard.
*   `vite.config.js`: Includes React deps for Excalidraw. Defines useful aliases. Standard.
*   `vitest.config.js`: Mocks `$app/*` modules correctly for testing. Coverage setup looks reasonable.
*   `src/app.html`: Standard SvelteKit HTML shell.
*   `src/routes/styles.css`: Defines some utility classes (`.visually-hidden`) and drag/drop styles (see point 2 regarding hardcoded colors). 