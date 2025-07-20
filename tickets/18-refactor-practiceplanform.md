# Ticket 18: Refactor Complex `PracticePlanForm` Component

**Priority:** Medium

**Description:** The [`src/routes/practice-plans/PracticePlanForm.svelte`](src/routes/practice-plans/PracticePlanForm.svelte) component remains quite large. It coordinates creation/editing of practice plans, integrates several stores (`practicePlanMetadataStore`, `sectionsStore`, `historyStore`, `cartStore`), loads TinyMCE, manages modals and undo/redo, and contains initialization logic for pulling drills from the cart when creating a new plan. The old `practicePlanStore` has been removed and basic metadata fields were moved to `PlanMetadataFields.svelte`. Authentication during save now uses a cookie-based "pending plan" flow handled by `/api/pending-plans` instead of `sessionStorage`.

**Affected Files:**

- [`src/routes/practice-plans/PracticePlanForm.svelte`](src/routes/practice-plans/PracticePlanForm.svelte)

**Related Notes:**

- [`code-review/practice-plan-notes.md`](code-review/practice-plan-notes.md) (`PracticePlanForm` review)
- [`code-review/modal-notes.md`](code-review/modal-notes.md) (Modal interactions)
- [`code-review/holistic-summary.md`](code-review/holistic-summary.md) (Key Themes: Component Design, State Management)

**Action Required:**

1.  **Break Down Component:** Decompose the form into smaller, more manageable sub-components. `PlanMetadataFields.svelte` already encapsulates the metadata inputs, but additional pieces could be extracted:
    - `PracticePlanSectionsEditor`: Handles the rendering and high-level interaction with the sections/items list (using [`SectionContainer`](src/components/practice-plan/sections/SectionContainer.svelte) etc.).
    - `PracticePlanActions`: Handles buttons like Save, Cancel, Undo/Redo. The `SimpleButton` workaround for adding sections lives in `src/routes/practice-plans/components/SimpleButton.svelte`.
    - `PracticePlanAuthHandler`: Encapsulates the logic for handling anonymous user saving and post-login association (now via the `/api/pending-plans` flow).
2.  **Simplify State Management:** `practicePlanStore` has been removed. The form now uses `practicePlanMetadataStore` for basic fields and `sectionsStore` for plan structure. Further cleanup is still needed so the component merely coordinates sub-components and delegates mutations to these stores.
3.  **Replace Fragile Auth Flow:** The previous `sessionStorage` approach has been dropped. Saving a plan while unauthenticated now posts the data to `/api/pending-plans`, sets a `pendingPlanToken` cookie, and redirects to login. After login, `/practice-plans/[id]/edit/+page.server.js` loads the pending plan via that cookie. Verify this flow works across OAuth redirects and consider persisting pending plans in a durable store if needed.
4.  **Improve Initialization Logic:** Some initialization has been simplified; the form now initializes from a passed in `practicePlan` object and pulls drills from `cartStore` when creating a new plan. Remaining logic around history setup and cart population could be encapsulated in helper functions.
5.  **Centralize Submission:** Implemented. Both `create/+page.server.js` and `[id]/edit/+page.server.js` now contain form actions that validate with Zod, normalize sections and redirect on success.
6.  **Clarify Validation:** Metadata fields validate via `practicePlanMetadataStore.validateMetadataForm` and server actions use the shared `practicePlanSchema`. Errors are exposed on `$page.form` and displayed next to inputs, but review is needed to ensure all sections/items constraints surface correctly to the user.
7.  **Review Modal Interactions:** Ensure interactions with modals ([`EmptyCartModal`](src/components/practice-plan/modals/EmptyCartModal.svelte), [`DrillSearchModal`](src/components/practice-plan/modals/DrillSearchModal.svelte), [`TimelineSelectorModal`](src/components/practice-plan/modals/TimelineSelectorModal.svelte)) follow the decoupled pattern (dispatching events, handling events) proposed in Ticket 15.
