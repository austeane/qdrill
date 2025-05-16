# LLM Guide: Creating Drills in QDrill

**Objective:** To reliably create new drills in the QDrill database by leveraging the existing API endpoints and tools, ensuring data validation, consistency, and security. Avoid direct database manipulation.

**Related Ticket:** tickets/llm-practice-plan-tools.md

**Workflow:**

1.  **Search for Existing Drill:**

    - **Action:** Before creating a new drill, always check if a similar one already exists. Use the `search_drills` tool (if available) or simulate it by querying the search API endpoint.
    - **Purpose:** Avoid creating duplicate drills.
    - **Tool/Endpoint:** `search_drills(query: str)` or `GET /api/drills/search?query={encoded_query}`.
    - **Example Query:** `curl "http://localhost:3000/api/drills/search?query=Passing%20Around%20Hoops" | cat`
    - **Input:** A search query derived from the drill's name or key description elements from the source document (e.g., a practice plan markdown file).
    - **Output:** A list of potential matches, including `id`, `name`, and `brief_description`.
    - **Decision:** If a suitable existing drill is found, use its `id`. If not, proceed to step 2.

2.  **Prepare New Drill Data:**

    - **Action:** Extract the necessary information for the new drill from the source document (e.g., `East April TC Practice.docx.md`).
    - **Key Fields:** `name` (required), `brief_description` (required), `detailed_description`, `skill_level` (required, array), `complexity`, `suggested_length` (required, object), `number_of_people_min`, `number_of_people_max`, `skills_focused_on` (required, array), `positions_focused_on` (required, array), `drill_type` (required, array), `video_link`, `diagrams`, `images`, `visibility`, `is_editable_by_others`, `parent_drill_id`.
    - **Critical Formatting Notes (Based on API Validation):**
      - **Enums:** Use specific, capitalized strings for single-select enums (e.g., `complexity`: `"Medium"`).
      - **Enum Arrays:** Use arrays of specific, capitalized strings for multi-select enums (e.g., `skill_level`: `["Intermediate", "Advanced"]`). Refer to the Zod schema (`createDrillSchema`) or `DrillForm.svelte` for exact allowed values, but prioritize the capitalized format required by the API.
      - **`suggested_length`:** Provide as a JSON object: `{ "min": <number>, "max": <number> }` (e.g., `{ "min": 15, "max": 30 }`). **Do not send a string.**
      - **Arrays:** Ensure fields like `skill_level`, `skills_focused_on`, `positions_focused_on`, `drill_type`, `diagrams`, `images` are formatted as arrays.
    - **Reference:** You can look at `createDrillSchema` (validation schema) and `DrillForm.svelte` (frontend form) for hints, but the API's actual validation rules (discovered via testing) are paramount.

3.  **Use the Creation Script:**

    - **Action:** Update the `passing_drill_data` dictionary within the dedicated Python script with the correctly formatted data extracted in Step 2.
    - **Script File:** `create_drill_script.py` (located in the project root).
    - **Execution:** **Ask the user** to run the script from their terminal using the command: `python create_drill_script.py`.
    - **Reasoning:** As an LLM, you likely cannot directly execute this script due to environment limitations (no network access via `requests`, etc.). The user must run it.

4.  **Verify Script Output:**

    - **Action:** Carefully examine the output printed to the terminal after the user runs the script.
    - **Success:** Look for the "--- Success! ---" message followed by the JSON response from the API, which includes the `id` of the newly created drill.
    - **Failure:** Look for error messages like "--- HTTP Request failed ---", "--- API returned an error ---", or "--- Failed to decode JSON response ---". Pay close attention to validation error details provided by the API to correct the data in `create_drill_script.py` and ask the user to retry.

5.  **Check Database (Recommended):**
    - **Action:** After successful creation via the script, verify the data was saved correctly in the database using `psql`.
    - **Purpose:** Confirm persistence and observe how the data was ultimately stored (e.g., case normalization, JSON stringification).
    - **Command:** Use `psql` with the correct `DATABASE_URL` and query the `drills` table.
    - **Example:** `psql "YOUR_DATABASE_URL" -c "SELECT id, name, brief_description, skill_level, complexity, suggested_length, number_of_people_min, number_of_people_max FROM drills WHERE id = <new_drill_id>;" | cat` (Replace URL and ID).

**Important Reminders:**

- Always use the API endpoints (via tools or script simulation) for creating/modifying data. **Never** generate direct SQL insert/update commands.
- Pay close attention to the **exact data format** required by the API, especially for enums and structured fields like `suggested_length`. Use `curl` to test the API directly if unsure about formatting errors.
- The `create_drill_script.py` is the mechanism for executing the `create_drill` action until a dedicated tool is available.
- Be aware that the service layer might apply defaults or normalizations (e.g., lowercase conversion, default min/max people) not immediately obvious from the schema alone. Database checks help confirm the final state.
