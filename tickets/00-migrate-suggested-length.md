# Ticket: Align Codebase with `suggested_length_min`/`max` Columns

**Status:** Active
**Reporter:** AI Assistant
**Date:** 2025-05-04

## Problem

The database correctly stores drill duration using `suggested_length_min` (int) and `suggested_length_max` (int) columns. However, the codebase is inconsistent in how it interacts with these columns:

1.  **Validation Mismatch:** The Zod schema (`drillSchema.ts`) expects a single `suggested_length` object like `{ min: number, max: number }`.
2.  **Service Layer Issues:**
    *   `drillService.js` methods (`normalizeDrillData`, `getFilteredDrills`, `getDrillFilterOptions`, `importDrills`) are not consistently mapping between the `{ min, max }` object structure used in validation/forms and the separate `_min`/`_max` database columns.
    *   Data retrieved by the service might not be exposing `min` and `max` fields correctly to the frontend load functions, causing display issues (e.g., showing "N/A").
3.  **UI Inconsistency:**
    *   The `DrillForm.svelte` sends a `{ min, max }` object.
    *   Display components (`+page.svelte`, `[id]/+page.svelte`, `DrillCard.svelte`, etc.) need to consistently read from the `_min`/`_max` fields provided by the data layer.
    *   Filtering (`FilterPanel.svelte`) relies on separate min/max stores but needs correct data source.
4.  **External Scripts:** `create_drill_script.py` likely still sends the old object format, misaligned with how the service should ideally map data to the DB columns.

## Goal

Align all code (services, validation, UI, scripts) to consistently work with the `suggested_length_min` and `suggested_length_max` database columns, ensuring data integrity and correct display/filtering.

**Data Flow Strategy:**

*   **Database:** Stores `suggested_length_min` (int), `suggested_length_max` (int).
*   **Service Layer (`drillService`):**
    *   Fetches `_min`/`_max` columns.
    *   When returning data (e.g., in `getAll`, `getById`), include the raw `suggested_length_min`, `suggested_length_max` fields.
    *   When receiving data for create/update (the `{min, max}` object from Zod validation), map this object to the `_min`/`_max` columns before DB interaction.
*   **API Layer:** Receives and validates the `{min, max}` object structure via Zod schema.
*   **Frontend:**
    *   Forms send the `{min, max}` object.
    *   Display components read the `suggested_length_min` and `suggested_length_max` fields directly from the loaded data.
    *   Filtering uses `selectedSuggestedLengthsMin`/`Max` stores, driven by `_min`/`_max` data fetched via `getDrillFilterOptions`.

## Implementation Plan

1.  **`drillService.js` Updates:**
    *   **Constructor:** Ensure `allowedColumns` includes `suggested_length_min`, `suggested_length_max`. Remove `suggested_length` if present.
    *   **`normalizeDrillData` / Pre-Save Logic:** Modify this (or logic within `createDrill`/`updateDrill` *before* calling `this.create`/`this.update`) to map the incoming `data.suggested_length` object (`{min, max}`) to `normalizedData.suggested_length_min` and `normalizedData.suggested_length_max`. Delete `normalizedData.suggested_length` before saving. Handle potential null/undefined input object gracefully (e.g., set DB columns to 0).
    *   **`getFilteredDrills`:** Update filter logic to use `suggested_length_min__gte` / `suggested_length_max__lte` based on the `filters` argument. Ensure it selects the `_min`/`_max` columns.
    *   **`getDrillFilterOptions`:** Update the query to `SELECT MIN(suggested_length_min), MAX(suggested_length_max) FROM drills` and return these values in the `suggestedLengths` part of the result.
    *   **`importDrills`:** Ensure the incoming `suggested_length` object (from `drillInput`) is correctly mapped to `suggested_length_min` and `suggested_length_max` fields before calling `this.create`.
    *   **`getById`, `getAll`, etc.:** Ensure these methods select and return the `suggested_length_min` and `suggested_length_max` columns.

2.  **Validation (`lib/validation/drillSchema.ts`):**
    *   Keep the schema validating the `suggested_length: { min: number, max: number }` object format.

3.  **Frontend Form (`src/routes/drills/DrillForm.svelte`):**
    *   Verify it correctly creates and submits the `{ min, max }` object.

4.  **Frontend Stores & Filtering:**
    *   **`lib/stores/drillsStore.js`:** No changes needed.
    *   **`src/components/FilterPanel.svelte`:** Verify it correctly uses the updated `suggestedLengths` range from `getDrillFilterOptions` and binds sliders to the `selected...Min`/`Max` stores.

5.  **Frontend Display Components:**
    *   Update all display components to read `drill.suggested_length_min` and `drill.suggested_length_max` directly and format the output string (e.g., "min - max minutes").
    *   **Files:**
        *   `src/routes/drills/+page.svelte` (List)
        *   `src/routes/drills/[id]/+page.svelte` (Detail)
        *   `src/routes/practice-plans/viewer/DrillCard.svelte` (`normalizedItem` logic & display)
        *   `src/routes/practice-plans/wizard/drills/+page.svelte` (Display)
        *   `src/routes/practice-plans/viewer/Section.svelte` (Update `calculateSectionDuration` - e.g., use `parseInt(item.drill.suggested_length_max || item.duration || 15)`)

6.  **Bulk Upload Path:**
    *   **`src/routes/api/drills/bulk-upload/+server.js` (`parseDrill`):** Ensure it correctly creates the `suggested_length: { min: ..., max: ... }` object from the separate CSV columns.
    *   **`src/routes/drills/bulk-upload/+page.svelte`:** Ensure inline editing correctly binds to the `min`/`max` properties within the parsed drill object's `suggested_length` field.

7.  **External Scripts (`create_drill_script.py`):**
    *   Update script payload to send the `{ min, max }` object to the API.

## Affected Files Checklist (Revised)

-   [x] `src/lib/server/services/drillService.js` (constructor, normalize/pre-save logic, getFilteredDrills, getDrillFilterOptions, importDrills, data retrieval methods)
-   [x] `src/lib/validation/drillSchema.ts` (Verify schema expects `{min, max}` object)
-   [x] `src/routes/drills/DrillForm.svelte` (Verify object submission)
-   [x] `src/components/FilterPanel.svelte` (Verify filter range/binding)
-   [x] `src/routes/drills/+page.svelte` (Display logic)
-   [x] `src/routes/drills/[id]/+page.svelte` (Display logic)
-   [x] `src/routes/practice-plans/viewer/DrillCard.svelte` (Display logic, `normalizedItem`)
-   [x] `src/routes/practice-plans/wizard/drills/+page.svelte` (Display logic)
-   [x] `src/routes/practice-plans/viewer/Section.svelte` (Duration calculation logic)
-   [x] `src/routes/api/drills/bulk-upload/+server.js` (CSV parsing logic)
-   [x] `src/routes/drills/bulk-upload/+page.svelte` (Inline editing binding)
-   [x] `create_drill_script.py` (Payload format to match API schema)
