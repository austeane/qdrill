# Ticket 14: Centralize Validation Logic

**Priority:** Medium

**Description:** Validation logic for entities like drills and practice plans is currently duplicated across different parts of the application:
*   Client-side within components/stores (e.g., `PracticePlanForm`/`practicePlanStore`, `wizardValidation`, `bulk-upload/+page.svelte`).
*   Server-side within API routes (e.g., `/api/drills/bulk-upload` uses Yup).
*   Potentially within service layer methods.
This duplication makes it hard to maintain consistency and increases the risk of validation rules diverging.

**Affected Files:**

*   `src/lib/stores/practicePlanStore.js` (`validateForm`)
*   `src/lib/stores/wizardValidation.js` (All validation functions)
*   `src/routes/drills/bulk-upload/+page.svelte` (`validateDrill`)
*   `src/routes/api/drills/bulk-upload/+server.js` (Uses Yup `drillSchema`)
*   `src/lib/server/services/practicePlanService.js` (`validatePracticePlan`)
*   Potentially other form components or API endpoints performing validation.

**Related Notes:**

*   `code-review/practice-plan-notes.md`
*   `code-review/practice-plan-wizard-notes.md`
*   `code-review/drill-notes.md`
*   `code-review/holistic-summary.md` (Key Themes: Code Duplication)

**Action Required:**

1.  **Choose Validation Library/Approach:** Select a single library or approach for defining validation schemas (e.g., Zod, Yup, or custom validation functions).
2.  **Define Shared Schemas:** Create shared validation schemas (e.g., `drillSchema`, `practicePlanSchema`, `practicePlanSectionSchema`, `practicePlanItemSchema`) in a central location (e.g., `src/lib/validation/`). Define all validation rules consistently within these schemas.
3.  **Refactor Server-Side Validation:** Update API routes (especially POST/PUT handlers like in `/api/drills`, `/api/practice-plans`, `/api/drills/bulk-upload`) and potentially service methods (`create...`, `update...`) to import and use these shared schemas for validating incoming data. Ensure consistent error reporting (linking back to Ticket 11).
4.  **Refactor Client-Side Validation:**
    *   Update form components (`PracticePlanForm`, wizard steps, `bulk-upload/+page.svelte`) and stores (`practicePlanMetadataStore`, `wizardStore`) to import and use the same shared schemas for client-side validation.
    *   Consider using SvelteKit Form Actions, which integrate well with server-side validation using libraries like Zod/Yup, potentially simplifying client-side validation logic.
    *   Remove duplicated validation functions from components/stores (like `validateDrill` in `bulk-upload`, functions in `wizardValidation.js`).
5.  **Ensure Consistency:** Verify that the same validation rules are enforced consistently across client-side feedback, server-side API request handling, and database constraints where applicable. 