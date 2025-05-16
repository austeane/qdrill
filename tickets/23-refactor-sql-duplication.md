# Ticket 23: Refactor Duplicated SQL Logic (Skill Counts)

- **Priority:** Medium
- **Issue:** Complex SQL logic involving `ON CONFLICT DO UPDATE` with conditional subqueries (`NOT EXISTS`) to manage skill usage counts (`drills_used_in`, `usage_count`) is duplicated in both `DrillService` (`updateSkills`) and `SkillService` (`addSkillsToDatabase`).
- **Affected Files:**
  - [`src/lib/server/services/drillService.js`](src/lib/server/services/drillService.js)
  - [`src/lib/server/services/skillService.js`](src/lib/server/services/skillService.js)
- **Recommendations:**
  - **Centralize Logic:** Abstract the duplicated SQL logic into a single, reusable function or helper method.
  - **Location:** This helper could potentially reside within `SkillService` (as it directly manipulates the skills table counts) or a dedicated database utility module.
  - **Simplification:** Review the SQL logic itself to see if it can be simplified while maintaining correctness.
- **Related Tickets:** [14](./14-refactor-validation.md)
