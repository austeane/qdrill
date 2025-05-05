# Ticket: Maintain Explicit Order of Practice Plan Items

**Goal:** Ensure that the visual order of drills and breaks within a practice plan section consistently reflects the order explicitly set by the user in the editor, regardless of calculated start times.

**Problem:** Currently, the database stores an `order_in_plan` for each item, and the backend retrieves items in this order. However, visual discrepancies can arise if the explicit order doesn't match the chronological order based on calculated start times (e.g., an item intended to be first has a higher `order_in_plan`). Relying solely on front-end sorting based on calculated times can lead to confusing shifts in layout that don't match the user's saved arrangement.

**Proposed Solution:** Establish the `practice_plan_drills.order_in_plan` column as the definitive source of truth for item display order within a section. The frontend viewer will render items strictly in the sequence provided by the backend, which respects this database order. The editor components will be responsible for updating this order in the database whenever items are rearranged.

**Implementation Steps:**

**1. Backend (`practicePlanService.js` & API):**

*   **Verify Fetch Order:** Confirm that `getPracticePlanById` consistently fetches items using `ORDER BY ppd.section_id, ppd.order_in_plan`. (This seems to be the current behavior).
*   **Update Endpoint (`/api/practice-plans/[id]` - PUT):**
    *   Ensure the `updatePracticePlan` service function correctly deletes and re-inserts `practice_plan_drills` records with the new `order_in_plan` based *exactly* on the index of items received in the `sections[].items` array from the client. The current implementation using `[index, item]` in the loop already does this.
*   **(Optional but Recommended) Add Resequence Helper:**
    *   Implement a helper function `resequenceItems(sectionId, client)` within `practicePlanService.js` (as outlined in the previous discussion) that recalculates `order_in_plan` sequentially (0, 1, 2...) for all items in a given section. This prevents gaps if items are deleted individually.
    *   Call this helper within `updatePracticePlan` after the delete/re-insert loop for each affected section, or potentially after individual item deletions if separate endpoints exist for that.
*   **(Optional) Dedicated Reorder Endpoint:**
    *   Consider creating a new API endpoint (e.g., `POST /api/practice-plans/[id]/sections/[sectionId]/reorder`) that accepts an array of item IDs in the desired new order.
    *   This endpoint would efficiently update *only* the `order_in_plan` column for the items in that section, perhaps using a `CASE` statement or the `resequenceItems` helper, without needing to re-insert all item data. This is more efficient if only the order changes frequently (like during drag-and-drop).

**2. Frontend (Editor Components - *Assumed locations*):**

*   **Drag-and-Drop/Reorder Logic:** In the practice plan editor components (e.g., where sections/drills are managed, likely in `src/routes/practice-plans/[id]/edit/...` or similar):
    *   When a user finishes dragging an item to a new position, update the local state representing the `sections` array and its `items` to reflect the new order.
    *   Trigger a call to the main `PUT /api/practice-plans/[id]` endpoint, sending the *entire* updated plan structure with the items in their new order.
    *   *Alternatively*, if the dedicated reorder endpoint is implemented, call that instead, sending only the necessary information (section ID, new item ID order).
*   **Item Insertion/Deletion:** When items are added or removed in the editor, ensure the subsequent save operation (calling the `PUT` endpoint) sends the items array in the correct final order so the backend assigns the right `order_in_plan`.

**3. Frontend (Viewer Components - `Section.svelte`, `ParallelGroup.svelte`, `DrillCard.svelte`):**

*   **No Changes Needed:** These components should *not* perform any re-sorting based on `startTime`. They should continue to render sections and items in the exact order they receive them in the `section.items` array prop. The start time calculation is purely for display on the card/group header.

**4. Database (`practice_plan_drills` table):**

*   **No Schema Changes Needed:** The `order_in_plan` column already exists. Ensure it's indexed if not already, especially if the optional reorder endpoint is added.

**Acceptance Criteria:**

*   Items displayed in the practice plan viewer (`/practice-plans/[id]`) appear in the exact same vertical order as arranged by the user in the editor.
*   Dragging and dropping an item in the editor updates its position visually and persists this new order upon saving.
*   Calculated start times update correctly based on the persisted order, but do not influence the display sequence itself.
*   The "TC Warmup Part One" example item appears visually before the parallel group in the viewer after its `order_in_plan` is corrected (either manually in the DB for plan 43 or by editing/saving the plan).
