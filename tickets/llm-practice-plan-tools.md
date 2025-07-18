# Ticket: Create API Wrapper Tools for LLM Practice Plan Generation

**Goal:** Enable an LLM assistant (like me) to reliably create practice plans and associated drills in the database by parsing markdown descriptions (e.g., `East April TC Practice.docx.md`).

**Problem:** Directly generating and executing SQL commands from the LLM is brittle, bypasses application logic (validation, permissions, transactions), and poses security risks.

**Solution:** Create tools for the LLM that act as wrappers around the existing SvelteKit API endpoints. This leverages existing code, validation, security, and transactional integrity.

**Required Tools / Endpoint Wrappers:**

1.  **[DONE] `search_drills(query: str, *, limit: int = 10, page: int = 1, include_pagination: bool = False)` Tool:**

    - **Purpose:** Allows an LLM to check if a drill exists using full-text search on its name and descriptions.
    - **Underlying API:** `GET /api/drills/search`
    - **Inputs:**
      - `query` **(required)** – The search phrase (e.g., "five point star").
      - `limit` _(optional, default 10)_
      - `page` _(optional, default 1)_
      - `include_pagination` _(optional, default False)_ – Controls whether pagination metadata is returned.
    - **Output:**
      - When `include_pagination = False`: `list[{ id: number, name: string, brief_description: string }]`.
      - When `include_pagination = True`: `{ items: [...], pagination: { page, limit, totalItems, totalPages } }`.
    - **Verification:** The endpoint was updated to return `id`, `name`, and `brief_description`. I successfully tested it by running `curl "http://localhost:3000/api/drills/search?query=5%20point%20star"` and received the expected result:
      ```json
      [
      	{
      		"id": 62,
      		"name": "5 point star",
      		"brief_description": "Passing warmup drill"
      	}
      ]
      ```
    - If the returned list is empty, the LLM can proceed to use `create_drill`.

2.  **[DONE] `create_drill(drill_data: object)` Tool:**

    - **Purpose:** Create a new drill when one doesn't exist.
    - **Underlying API:** `POST /api/drills` (implemented in `src/routes/api/drills/+server.js`).
      - Incoming data is validated with `createDrillSchema` and persisted via `drillService.createDrill`.
    - **Implementation:** Wrapper script `create_drill_script.py` posts JSON data matching `createDrillSchema` to the API. Edit the `DRILLS_TO_CREATE` list and run `python create_drill_script.py`.

3.  **[DONE] `create_practice_plan(plan_data: object)` Tool:**
    - **Purpose:** Create the entire practice plan structure, including metadata, sections, and items (linking to existing or newly created drills).
    - **Underlying API:** `POST /api/practice-plans`.
      - The endpoint uses `createPracticePlanSchema` (Zod schema located in `src/lib/validation/practicePlanSchema.ts`) for validation.
      - It internally calls `practicePlanService.createPracticePlan`, which handles the creation of the plan, sections, and items within a single database transaction.
    - **Input:** `plan_data` (object): A nested JSON object representing the entire plan, conforming to `createPracticePlanSchema`. Requires top-level metadata (`name`) and at least one section containing at least one item.
      - See `createPracticePlanSchema` in `src/lib/validation/practicePlanSchema.ts` for the exact expected structure and fields for the plan, sections, and items.
    - **Output:** `{id: number, message: string}`: Object containing the ID of the newly created practice plan and a success message.
    - **Implementation:** Wrapper script `create_practice_plan_script.py` sends a full practice plan object to the API. Edit `PRACTICE_PLAN_DATA` and run `python create_practice_plan_script.py`.

By building these tools, the LLM can interact with the application safely and efficiently, leveraging the existing robust backend logic.
