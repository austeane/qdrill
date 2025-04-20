# Ticket 25: Enable TypeScript Strictness Checks

- **Priority:** Medium
- **Issue:** The project's `tsconfig.json` currently has TypeScript's stricter type-checking options disabled (e.g., `noImplicitAny: false`, `strict: false`). This reduces type safety and can hide potential runtime errors.
- **Affected Files:**
    - [`tsconfig.json`](tsconfig.json)
    - Potentially many `.js` and `.svelte` files will require type annotations or fixes once strictness is enabled.
- **Recommendations:**
    - **Enable Strict Mode:** Set `"strict": true` in [`tsconfig.json`](tsconfig.json)'s `compilerOptions`.
    - **Address Errors Incrementally:** Enabling strict mode will likely reveal numerous type errors throughout the codebase.
        - Start by fixing errors related to `noImplicitAny` (adding explicit types to function parameters, variables, etc.).
        - Address errors related to `strictNullChecks` (handling potential `null` or `undefined` values explicitly).
        - Fix other strictness-related errors as they appear.
    - **Consider Migration:** Convert remaining `.js` files (especially stores and services) to `.ts` for better type coverage.
    - **Benefits:** Improved code quality, better maintainability, reduced runtime errors, enhanced developer tooling (autocompletion, refactoring).
- **Related Tickets:** None direct, but improves overall code health. 