# Ticket 21: Review/Refactor PracticePlanService Update Strategy

**Priority:** Medium
**Status:** Open

**Current Issue:** The `updatePracticePlan` method still removes all sections and items before re‑inserting them. While the logic now runs inside `withTransaction`, uses the base `update` helper, and calls `_resequenceItems` after inserting each section's drills, the approach remains heavy for large plans.

**Affected File**
- [`src/lib/server/services/practicePlanService.js`](src/lib/server/services/practicePlanService.js) (`updatePracticePlan` method)

**Implementation Notes**
- Anonymous updates force `visibility: 'public'` and `is_editable_by_others: true`.
- `created_by` cannot be changed; it is stripped from the update payload.
- Sections and drills are fully deleted, re‑inserted, then resequenced using `_resequenceItems`.

**Recommendations**
- **Investigate Granular Updates:** Compare incoming data with existing records to update only changed sections and drills.
- **Consider Reordering Updates:** Use targeted `UPDATE` statements for ordering instead of full deletion when items are merely moved.
- **If Complexity Outweighs Gains:** Keep the current strategy but ensure transactions remain short and indexes cover relevant columns.

**Related Tickets:** [7](./07-api-scalability-practice-plans.md), [10](./10-refactor-state-sectionsstore.md)
