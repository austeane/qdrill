# LLM Guide: Creating Practice Plans in QDrill

**Objective:** To reliably create new practice plans in the QDrill database by leveraging the existing API endpoints and tools, ensuring data validation, consistency, and security. Avoid direct database manipulation.

**Related Ticket:** tickets/llm-practice-plan-tools.md
**Related Guide:** docs/guides/llm_creating_drills.md

**Workflow:**

1.  **Parse Source Document:**

    - **Action:** Extract the overall plan details (name, description, goals, etc.) and the structure of sections and items (drills, breaks, notes) from the source document (e.g., a markdown file like `East April TC Practice.docx.md`).
    - **Key Details:** Plan metadata (name, description, goals, phase, start time), section names, section notes, item types (drill, break), item names, item durations.

2.  **Identify & Create Necessary Drills:**

    - **Action:** For each drill mentioned in the plan, use the workflow outlined in `docs/guides/llm_creating_drills.md` to search for the drill and create it if it doesn't exist.
    - **Critical:** Record the `id` of each existing or newly created drill. These IDs are required to link drills within the practice plan structure.

3.  **Prepare Practice Plan Data Structure:**

    - **Action:** Construct a nested Python dictionary (or JSON object) that mirrors the structure expected by the `/api/practice-plans` endpoint and validated by `practicePlanSchema`.
    - **Key Fields:**
      - Top-level: `name` (string, required), `description` (string), `practice_goals` (array of strings), `phase_of_season` (string), `visibility` (enum: 'public', 'unlisted', 'private'), `is_editable_by_others` (boolean), `estimated_number_of_participants` (integer), `start_time` (string, HH:MM:SS).
      - `sections` (array of objects, required): Each section object needs:
        - `name` (string, required)
        - `order` (integer, optional - handled by API)
        - `notes` (string, optional)
        - `items` (array of objects, required): Each item object needs:
          - `type` (enum: 'drill', 'break', required) - Note: 'note' is **not** supported by the current API. Use 'break' for non-drill timed blocks.
          - `name` (string, required - typically the drill name or a description for breaks)
          - `duration` (integer, required, **min 1**)
          - `drill_id` (integer, **required** if `type` is 'drill')
    - **Validation Reference:** Consult `src/lib/validation/practicePlanSchema.ts` and the API endpoint (`src/routes/api/practice-plans/+server.js`) for the definitive structure and validation rules. Pay attention to required fields, data types (especially booleans like `is_editable_by_others` which must be `True`/`False` in Python), and enum values.
    - **Example:** See the final `actual_plan_data` structure in `create_practice_plan_script.py` after the corrections were made during the "East April TC Practice" plan creation.

4.  **Use the Creation Script:**

    - **Action:** Update the `actual_plan_data` (or equivalent variable) dictionary within the dedicated Python script with the correctly formatted data constructed in Step 3. Ensure the `if __name__ == "__main__":` block is uncommented and calls `create_practice_plan` with your data variable.
    - **Script File:** `create_practice_plan_script.py` (located in the project root).
    - **Execution:** **Ask the user** to run the script from their terminal using the command: `python create_practice_plan_script.py`.
    - **Reasoning:** Similar to drill creation, direct execution might be restricted. User execution ensures the script runs in the correct environment with necessary permissions and network access.

5.  **Verify Script Output:**

    - **Action:** Carefully examine the terminal output after the user runs the script.
    - **Success:** Look for the "--- Success! ---" message and the JSON response containing the `id` of the newly created practice plan (e.g., `{"id": 49, "message": "Practice plan created successfully"}`). Record this ID.
    - **Failure:** Look for error messages ("--- HTTP Request failed ---", "--- API Error or Invalid Response ---", etc.). Pay close attention to API validation errors (often detailed in the JSON response body) to correct the data structure in `create_practice_plan_script.py` (Step 3) and ask the user to retry (Step 4). Common errors include incorrect enum values, missing required fields, incorrect data types (e.g., JSON `true` vs Python `True`), or durations less than 1.

6.  **Check Database (Recommended):**
    - **Action:** After successful creation, verify the plan and its nested structure were saved correctly in the database using `psql`.
    - **Purpose:** Confirm persistence and check relationships.
    - **Commands:** Use `psql` with the correct `DATABASE_URL`.
      - Query `practice_plans` table for metadata: `SELECT id, name, description, visibility, created_by FROM practice_plans WHERE id = <new_plan_id>;`
      - Query `practice_plan_sections` table: `SELECT id, name, "order", notes FROM practice_plan_sections WHERE practice_plan_id = <new_plan_id> ORDER BY "order";`
      - Query `practice_plan_items` table: `SELECT id, section_id, type, name, duration, drill_id, "order" FROM practice_plan_items WHERE section_id IN (SELECT id FROM practice_plan_sections WHERE practice_plan_id = <new_plan_id>) ORDER BY section_id, "order";` (Replace `<new_plan_id>`).

**Important Reminders:**

- Always use the API (via the script) for creation. **Never** generate direct SQL.
- Ensure all necessary drills exist and their IDs are correctly included in the plan data structure **before** attempting to create the plan.
- The `create_practice_plan_script.py` handles the interaction with the `POST /api/practice-plans` endpoint.
- Pay strict attention to data types and required fields specified by `practicePlanSchema`.
- Use 'break' for non-drill timed blocks, as 'note' is not currently supported for items.
- Ensure all item durations are 1 minute or greater.
