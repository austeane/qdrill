# Ticket 23: Refactor Duplicated SQL Logic (Skill Counts)

- **Priority:** Medium
- **Issue:** Complex SQL logic involving `ON CONFLICT DO UPDATE` with conditional subqueries (`NOT EXISTS`) to manage skill usage counts (`drills_used_in`, `usage_count`) is duplicated in both `DrillService` (`updateSkills`) and `SkillService` (`addSkillsToDatabase`). Each service also exposes an `updateSkillCounts` helper that performs nearly identical add/remove logic around this query.
- **Affected Files:**
  - [`src/lib/server/services/drillService.js`](src/lib/server/services/drillService.js)
  - [`src/lib/server/services/skillService.js`](src/lib/server/services/skillService.js)
- **Current State:**
  - `DrillService.updateSkills` uses an `INSERT ... ON CONFLICT` statement to increment `drills_used_in` and `usage_count` when adding skills. The query lives around lines 893–905【F:src/lib/server/services/drillService.js†L893-L905】.
  - `SkillService.addSkillsToDatabase` contains the exact same SQL around lines 164–177【F:src/lib/server/services/skillService.js†L164-L177】.
  - Both services implement an `updateSkillCounts` method which wraps this logic in slightly different transaction helpers.
- **Recommendations:**
  - **Centralize Logic:** Abstract the duplicated SQL logic into a single, reusable function or helper method.
  - **Location:** This helper could potentially reside within `SkillService` (as it directly manipulates the skills table counts) or a dedicated database utility module.
  - **Simplification:** Review the SQL logic itself to see if it can be simplified while maintaining correctness.
- **Related Tickets:** [14](./14-refactor-validation.md)
