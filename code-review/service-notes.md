## Service Layer Review

This section reviews common services and the base service class.

**Files Reviewed:**

*   `src/lib/server/services/baseEntityService.js`:
    *   **Notes:** Provides a reusable base class for entity services. Configurable via constructor parameters (`tableName`, `primaryKey`, `defaultColumns`, `allowedColumns`, `columnTypes`). Implements standard CRUD methods (`getAll`, `getById`, `create`, `update`, `delete`, `exists`). `getAll` supports pagination (`page`, `limit`), filtering (exact match, basic array support using `ANY`), sorting, and returning specific columns. `create` and `update` filter data based on `allowedColumns`. Includes a basic text `search` method across specified columns (using `LIKE` and `LOWER`). Provides a `withTransaction` helper using `db.getClient()` for atomic operations. Includes an optional standard permissions model (`enableStandardPermissions`, `canUserEdit`, `canUserView`) assuming `created_by`, `is_editable_by_others`, and `visibility` columns exist. Includes helper methods for validation (`isColumnAllowed`, `validateSortOrder`), data normalization (`normalizeArrayFields`), and timestamp management (`addTimestamps`).
    *   **Potential Issues:**
        *   **Limited Filtering:** The `getAll` filtering logic is basic. It only supports exact matches (`=`) or array checks (`= ANY`). It lacks support for range queries (>, <), partial matches (LIKE), null checks, OR conditions between different fields, etc. This limits the querying capabilities for inheriting services unless they override `getAll` significantly (like `practicePlanService` partly does).
        *   **Permission Model Rigidity:** The standard permissions model is hardcoded to check `created_by`, `is_editable_by_others`, and `visibility` (`public`, `unlisted`, `private`). While configurable via `enableStandardPermissions`, it's not flexible for more complex permission scenarios. `canUserEdit` allows editing if `created_by` is null, which might be unintentional depending on the desired behavior for entities without creators.
        *   **Column Validation:** Relies heavily on `isColumnAllowed` for security (preventing SQL injection via column names in filters/sorts). Ensure the `allowedColumns` list is correctly defined in inheriting services.
        *   **Search Limitations:** The `search` method uses `LOWER` and `LIKE '%term%'`, which is generally inefficient for large datasets. It doesn't leverage full-text search capabilities of the database.
        *   **Array Handling:** The `getAll` filter logic for arrays (`= ANY`) only works for checking if a *single* provided value exists in the array column. It doesn't support checking if *all* provided values exist (intersection) or if *any* of the provided values exist (overlap). The `normalizeArrayFields` helper seems intended for input data normalization, but its usage isn't shown within the base class itself.
        *   **Error Handling:** Uses `console.error` and re-throws generic errors. More specific error types or codes could be beneficial for API layers.
        *   **No Select For Update:** The `update` method doesn't fetch the entity first to check permissions before attempting the update (unlike `canUserEdit` which fetches). It relies on the database potentially throwing an error if the `WHERE` clause (including the permission check) fails, or returning `rowCount === 0`. It also doesn't perform a `SELECT ... FOR UPDATE` if concurrency control is needed.

**Files Pending Review:**

*(List remaining files)*

*   `src/lib/server/services/formationService.js`:
    *   **Notes:** Extends `BaseEntityService` for formations. Defines allowed columns, specifying `diagrams` as `json` and `tags` as `array`. Overrides `getAll` but simply calls the base implementation. Provides `createFormation` and `updateFormation` which add timestamps/user info, normalize data (`normalizeFormationData`), and call the base `create`/`update`. Includes `searchFormations` (using base `search`) and `getFormationsByUser` (using base `getAll` with a filter). `normalizeFormationData` ensures `diagrams` and `tags` are arrays. Implements `associateFormation` similar to other services. Includes a `getFilteredFormations` method for advanced filtering by tags (`@>`), `formation_type`, text search (`ILIKE`), and standard visibility rules.
    *   **Potential Issues:**
        *   **Base `getAll` Override:** The `getAll` method is overridden but just calls `super.getAll(options)`. This override is currently redundant.
        *   **Permissions:** This service doesn't explicitly enable the standard permissions model (`enableStandardPermissions()`) in its constructor, unlike `DrillService` and `PracticePlanService`. However, `getFilteredFormations` *does* implement the standard visibility logic, and `associateFormation` relies on `created_by`. It should likely call `enableStandardPermissions()` for consistency and to ensure base permission methods (`canUserView`, `canUserEdit`) work if used.
        *   **Tag Filtering:** `getFilteredFormations` uses the array contains operator (`@>`) for tag filtering. This checks if the `tags` column contains *all* the tags provided in the filter. This might not be the intended behavior; often, filtering by tags implies matching *any* of the provided tags (overlap `&&` operator) or checking if *a single* tag exists (`= ANY`). Verify the desired tag filtering logic. Requires a GIN index on `tags` for performance.
        *   **Normalization:** `normalizeFormationData` ensures `diagrams` is an array but comments out the stringification step, stating the DB handles JSONB arrays. This differs from `DrillService` which stringified diagrams. Ensure consistency or verify the DB schema/requirements.
        *   **Limited Filtering/Sorting:** Relies on `BaseEntityService` for basic CRUD and search, inheriting its limitations (e.g., basic filter operators in `getAll`, basic search in `search`). `getFilteredFormations` adds more power but is specific to that method.

**Files Pending Review:**

*(List remaining files)*

*   `src/lib/server/services/skillService.js`:
    *   **Notes:** Extends `BaseEntityService` for the `skills` table, using `skill` (the name) as the primary key. Provides methods to `getAllSkills` (ordered by usage), `addOrIncrementSkill` (using `ON CONFLICT DO UPDATE`), `getSkillsForDrill`, `getMostUsedSkills`. Implements `updateSkillCounts` and its helper `addSkillsToDatabase` to manage the `drills_used_in` and `usage_count` when drill skills are updated (similar complex `ON CONFLICT` logic as seen in `DrillService`). Includes a `getSkillRecommendations` method which finds drills related to current skills and suggests other skills commonly used in those drills.
    *   **Potential Issues:**
        *   **Limited Base Class Usage:** Primarily uses `BaseEntityService` for the constructor setup and `withTransaction`. Most methods (`getAllSkills`, `addOrIncrementSkill`, etc.) use direct `db.query` calls rather than base class methods, likely because the `skills` table structure (using `skill` as PK, specific counting logic) doesn't fit the base class's generic CRUD operations well.
        *   **Complex SQL (`addOrIncrementSkill`, `addSkillsToDatabase`):** The `ON CONFLICT DO UPDATE` logic with subqueries (`NOT EXISTS`) to conditionally update `drills_used_in` is complex and duplicated from `DrillService`. This logic should be centralized or simplified if possible.
        *   **Skill Name as PK:** Using the skill name (`skill`) as the primary key might cause issues if skills need renaming or if case sensitivity becomes a factor later. An integer ID might be more robust.
        *   **Recommendation Logic:** `getSkillRecommendations` uses basic logic (find related drills, find other skills in those drills). Performance might degrade with many skills/drills. The relevance of recommendations could be improved with more sophisticated algorithms if needed.
        *   **Error Handling:** Uses basic `throw new Error()` and `console.error`.

**Files Pending Review:**

*(List remaining files)*

*   `src/lib/server/services/userService.js`:
    *   **Notes:** Extends `BaseEntityService` for the `users` table. Defines basic allowed columns. Provides methods to get user by email (`getUserByEmail`) and a comprehensive `getUserProfile` method that aggregates user details along with their created drills, practice plans, formations, votes, and comments within a transaction. Includes an `isAdmin` check (based on a hardcoded email list) and a generic `canUserPerformAction` method intended to check permissions across different entity types.
    *   **Potential Issues:**
        *   **Hardcoded Admin Check (`isAdmin`):** Checking admin status against a hardcoded list of emails is insecure and inflexible. This should be replaced with a database-driven role system or configuration-based approach.
        *   **Redundant Permission Logic (`canUserPerformAction`):** This method largely duplicates permission logic that should reside within `BaseEntityService` (`canUserView`, `canUserEdit`) or the specific entity services (`DrillService`, `PracticePlanService`, etc.). It manually maps entity types to tables and re-fetches entity data, making it inefficient and prone to inconsistencies if permission rules change elsewhere. This method should likely be removed in favor of using the permission checks defined closer to the specific entities.
        *   **`getUserProfile` Performance:** This method fetches potentially large amounts of related data (all drills, plans, formations, votes, comments) in separate queries. For users with significant activity, this could become slow and resource-intensive. Consider adding pagination to the sub-queries or fetching related data on demand rather than eagerly loading everything.
        *   **Limited Base Class Usage:** Primarily uses `BaseEntityService` for the constructor and `withTransaction`. Most specific methods use direct `db.query` calls instead of leveraging base CRUD operations.
        *   **Error Handling:** Basic `console.error` and re-throws errors.

**Files Pending Review:**

*(List remaining files)* 