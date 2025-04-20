# Ticket 21: Review/Refactor PracticePlanService Update Strategy

- **Priority:** Medium
- **Issue:** `practicePlanService.updatePracticePlan` uses a simple but potentially inefficient "delete-then-insert" strategy for handling nested sections and items. For large plans or minor changes (like reordering), deleting and re-inserting all associated records can be slow and heavy on the database.
- **Affected Files:**
    - [`src/lib/server/services/practicePlanService.js`](src/lib/server/services/practicePlanService.js) (`updatePracticePlan` method)
- **Recommendations:**
    - **Investigate Granular Updates:** Evaluate the feasibility of implementing a more granular update strategy. This would involve:
        - Identifying changed/added/deleted sections and items by comparing the incoming data with the existing data.
        - Performing targeted `UPDATE`, `INSERT`, and `DELETE` operations only on the necessary records.
    - **Complexity vs. Performance:** Acknowledge that granular updates are significantly more complex to implement correctly, especially with nested structures and reordering. Weigh the development effort against the actual performance impact of the current strategy under expected load.
    - **Alternative:** If granular updates are too complex, ensure the current delete-then-insert happens within a tight transaction and explore potential database optimizations (indexing, connection pooling).
- **Related Tickets:** [7](./07-api-scalability-practice-plans.md), [10](./10-refactor-state-sectionsstore.md) 