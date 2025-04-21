# Ticket 14: Centralize Validation Logic

**Priority:** Medium

**Status:** In Progress

**Description:** Validation logic for entities like drills and practice plans is currently duplicated across different parts of the application:
*   Client-side within components/stores (e.g., [`PracticePlanForm`](src/routes/practice-plans/PracticePlanForm.svelte)/[`practicePlanStore`](src/lib/stores/practicePlanStore.js), `wizardValidation`, [`bulk-upload/+page.svelte`](src/routes/drills/bulk-upload/+page.svelte)).
*   Server-side within API routes (e.g., [`/api/drills/bulk-upload`](src/routes/api/drills/bulk-upload/+server.js) uses Yup).
*   Potentially within service layer methods.
This duplication makes it hard to maintain consistency and increases the risk of validation rules diverging.

**Affected Files:**

*   ~~[`src/lib/stores/practicePlanStore.js`](src/lib/stores/practicePlanStore.js) (`validateForm`)~~ -> Restored using Zod (`practicePlanMetadataSchema`)
*   ~~[`src/lib/stores/wizardValidation.js`](src/lib/stores/wizardValidation.js) (All validation functions)~~ -> Removed (Needs Zod re-implementation)
*   ~~[`src/routes/drills/bulk-upload/+page.svelte`](src/routes/drills/bulk-upload/+page.svelte) (`validateDrill`)~~ -> Refactored using Zod (`bulkUploadDrillInputSchema`)
*   ~~[`src/routes/api/drills/bulk-upload/+server.js`](src/routes/api/drills/bulk-upload/+server.js) (Uses Yup `drillSchema`)~~ -> Refactored using Zod
*   ~~[`src/lib/server/services/practicePlanService.js`](src/lib/server/services/practicePlanService.js) (`validatePracticePlan`)~~ -> Restored using Zod (`practicePlanSchema`), but primary validation moved to API boundary.
*   `src/routes/api/drills/+server.js` -> Refactored using Zod (`createDrillSchema`, `updateDrillSchema`)
*   `src/routes/api/practice-plans/+server.js` -> Refactored using Zod (`createPracticePlanSchema`)
*   Potentially other form components or API endpoints performing validation.

**Related Notes:**

*   [`code-review/practice-plan-notes.md`](code-review/practice-plan-notes.md)
*   [`code-review/practice-plan-wizard-notes.md`](code-review/practice-plan-wizard-notes.md)
*   [`code-review/drill-notes.md`](code-review/drill-notes.md)
*   [`code-review/holistic-summary.md`](code-review/holistic-summary.md) (Key Themes: Code Duplication)

**Action Required:**

1.  **Choose Validation Library/Approach:** ~~Select a single library or approach for defining validation schemas (e.g., Zod, Yup, or custom validation functions).~~ -> **Done (Zod)**
2.  **Define Shared Schemas:** ~~Create shared validation schemas (e.g., `drillSchema`, `practicePlanSchema`, `practicePlanSectionSchema`, `practicePlanItemSchema`) in a central location (e.g., `src/lib/validation/`). Define all validation rules consistently within these schemas.~~ -> **Done**
    *   Created `src/lib/validation/drillSchema.ts`
    *   Created `src/lib/validation/practicePlanSchema.ts` (includes base, create, update, metadata, section, item schemas)
3.  **Refactor Server-Side Validation:** ~~Update API routes (especially POST/PUT handlers like in [`/api/drills`](src/routes/api/drills/+server.js), [`/api/practice-plans`](src/routes/api/practice-plans/+server.js), [`/api/drills/bulk-upload`](src/routes/api/drills/bulk-upload/+server.js)) and potentially service methods (`create...`, `update...`) to import and use these shared schemas for validating incoming data. Ensure consistent error reporting (linking back to Ticket 11).~~ -> **Done**
    *   Updated `/api/drills/+server.js` (POST, PUT) with Zod.
    *   Updated `/api/practice-plans/+server.js` (POST) with Zod.
    *   Updated `/api/drills/bulk-upload/+server.js` with Zod.
    *   Reinstated `validatePracticePlan` in `practicePlanService` using Zod, but primary validation occurs at API boundary.
    *   Updated `handleApiError` in relevant endpoints to format Zod errors.
4.  **Refactor Client-Side Validation:**
    *   ~~Update form components ([`PracticePlanForm`](src/routes/practice-plans/PracticePlanForm.svelte), wizard steps, [`bulk-upload/+page.svelte`](src/routes/drills/bulk-upload/+page.svelte)) and stores (`practicePlanMetadataStore`, `wizardStore`) to import and use the same shared schemas for client-side validation.~~
        *   **Done** for `bulk-upload/+page.svelte` (uses `bulkUploadDrillInputSchema`).
        *   **Done** for `practicePlanStore.js` (`validateForm` uses `practicePlanMetadataSchema`).
        *   **TODO:** Update `PracticePlanForm.svelte` (or equivalent) to correctly display errors from `practicePlanStore` based on Zod's error structure.
        *   **TODO:** Re-implement validation in `wizardValidation.js` and wizard components using step-specific Zod schemas.
    *   Consider using SvelteKit Form Actions, which integrate well with server-side validation using libraries like Zod/Yup, potentially simplifying client-side validation logic. -> **Deferred**
    *   ~~Remove duplicated validation functions from components/stores (like `validateDrill` in `bulk-upload`, functions in [`wizardValidation.js`](src/lib/stores/wizardValidation.js)).~~
        *   **Done** for `bulk-upload`. `validateForm` in `practicePlanStore` was restored with Zod.
        *   **Done** for `wizardValidation.js` (removed, needs reimplementation).
5.  **Ensure Consistency:** ~~Verify that the same validation rules are enforced consistently across client-side feedback, server-side API request handling, and database constraints where applicable.~~ -> **Partially Done**
    *   Shared Zod schemas enforce consistency between client/server logic where used.
    *   **TODO:** Testing required to verify consistency in practice.
    *   **TODO:** Review database constraints against Zod schemas (potential future task). 
  



Also, make sure that error messages if validation fails are informative
