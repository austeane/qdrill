# Ticket 02: Refactor Fragile sessionStorage Auth Flow in PracticePlanForm

- **Priority:** Critical
- **Issue:** The `PracticePlanForm` uses `sessionStorage` to persist form state (including complex nested sections) and plan IDs across OAuth redirects (e.g., Google sign-in). This is inherently fragile as `sessionStorage` can be cleared or limited, leading to data loss for the user during the creation/edit process.
- **Affected Files:**
    - `src/routes/practice-plans/PracticePlanForm.svelte`
    - `src/lib/stores/practicePlanStore.js` (handles the `sessionStorage` logic)
- **Recommendations:**
    - **Option 1 (Ideal):** Use SvelteKit Form Actions. Design the form submission so that it can be handled entirely server-side after authentication. The action can potentially save partial state server-side if needed before redirecting to auth.
    - **Option 2 (Server-Side State):** Implement a temporary server-side storage mechanism (e.g., tied to the user's session or a temporary key) to hold the form state during the redirect, avoiding reliance on client-side `sessionStorage`.
    - **Option 3 (Improve SessionStorage):** If other options are infeasible, add more robust error handling, potentially warn the user about data loss risks, and simplify the data stored in `sessionStorage` (e.g., just essential IDs or flags) to minimize impact.
- **Related Tickets:** [18](./18-refactor-practiceplanform.md) 