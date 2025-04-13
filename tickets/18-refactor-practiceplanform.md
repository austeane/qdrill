# Ticket 18: Refactor Complex `PracticePlanForm` Component

**Priority:** Medium

**Description:** The `src/routes/practice-plans/PracticePlanForm.svelte` component is very large and complex. It manages the entire UI for creating/editing practice plans, integrates multiple stores (`practicePlanStore`, `sectionsStore`, `historyStore`, `cartStore`), handles a fragile authentication flow using `sessionStorage`, loads TinyMCE, manages modals, and contains complex initialization logic.

**Affected Files:**

*   `src/routes/practice-plans/PracticePlanForm.svelte`

**Related Notes:**

*   `code-review/practice-plan-notes.md` (`PracticePlanForm` review)
*   `code-review/modal-notes.md` (Modal interactions)
*   `code-review/holistic-summary.md` (Key Themes: Component Design, State Management)

**Action Required:**

1.  **Break Down Component:** Decompose the form into smaller, more manageable sub-components. Potential candidates:
    *   `PracticePlanMetadataForm`: Handles basic fields (name, description, goals, visibility, etc.).
    *   `PracticePlanSectionsEditor`: Handles the rendering and high-level interaction with the sections/items list (using `SectionContainer` etc.).
    *   `PracticePlanActions`: Handles buttons like Save, Cancel, Undo/Redo.
    *   `PracticePlanAuthHandler`: Encapsulates the logic for handling anonymous user saving and post-login association (though ideally replaced by server-side patterns).
2.  **Simplify State Management:** This component will benefit significantly from the refactoring of `practicePlanStore` (Ticket 09) and `sectionsStore` (Ticket 10), and decoupling of shared components (Ticket 15).
    *   The refactored component should primarily coordinate the sub-components, passing data down and handling events up.
    *   It should interact with the refactored, focused stores (`practicePlanMetadataStore`, `sectionsStore`).
3.  **Replace Fragile Auth Flow:** The `sessionStorage`-based flow for handling saves across login redirects is unreliable. Replace it with a more robust approach:
    *   **Prefer Server-Side Handling:** Use SvelteKit Form Actions. The form submission should go to a server action. If the user isn't logged in, the action can redirect to login, potentially passing a redirect URL back to the form page. SvelteKit's form enhancement can preserve form data across redirects more reliably than manual `sessionStorage` use (needs verification for OAuth flows).
    *   **Alternative Client-Side:** If client-side handling is strictly necessary, ensure error handling for `sessionStorage` issues and consider alternative temporary storage if needed.
4.  **Improve Initialization Logic:** Simplify the `onMount` logic. With Form Actions, much of the state restoration might become unnecessary. Initialization should clearly handle create vs. edit scenarios based on data passed from the `load` function.
5.  **Centralize Submission:** Use SvelteKit Form Actions for submission logic (as per Ticket 09 refactoring). This moves API calls, validation, normalization, and feedback handling to the server-side action associated with the form.
6.  **Clarify Validation:** Integrate with the centralized validation system (Ticket 14). Use form actions to report validation errors back to the form UI.
7.  **Review Modal Interactions:** Ensure interactions with modals (`EmptyCartModal`, `DrillSearchModal`, `TimelineSelectorModal`) follow the decoupled pattern (dispatching events, handling events) proposed in Ticket 15. 