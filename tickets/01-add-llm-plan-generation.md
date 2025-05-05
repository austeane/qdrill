# Plan: Add LLM Practice Plan Generation using Platform API Key

This plan outlines the steps to implement AI-powered practice plan generation using a platform-provided LLM API key (starting with Anthropic), integrating with the existing practice plan creation flow.

**Assumptions:**
*   The primary entry point will be the standard practice plan creation form (`src/routes/practice-plans/create/+page.svelte` using `PracticePlanForm.svelte`), not the wizard for initial implementation.
*   The platform's LLM API key (e.g., Anthropic) will be securely stored server-side (e.g., environment variable) and never exposed to the client.
*   The generation process populates the existing form for user review and saving, leveraging existing state management (`practicePlanStore`, `sectionsStore`) and save mechanisms.
*   Costs associated with LLM API usage will be borne by the platform. Rate limiting and monitoring will be necessary.

**Steps:**

1.  **Backend: Create Dedicated API Endpoint** (Partially Done - Basic endpoint created)
    *   **File:** `src/routes/api/practice-plans/generate-ai/+server.js` (New file)
    *   **Action:** Implement a `POST` request handler.
    *   **Inputs:** Expects a JSON body containing:
        *   `parameters`: An object with generation parameters (e.g., `durationMinutes`, `goals`, `skillLevel`, `participantCount`, `focusAreas`).
    *   **Logic:**
        *   Retrieve `userId` from `locals.user.id` (for potential rate limiting or logging).
        *   **Security:** Validate input parameters. Retrieve the platform's Anthropic API key securely from environment variables (e.g., `ANTHROPIC_API_KEY` via `$env/static/private`). **Never log or expose this key.**
        *   Implement per-user rate limiting to manage costs and prevent abuse.
        *   **(Optional but Recommended):** Fetch available drill names/IDs using `drillService.getAllDrillNames()` (add this method if needed) to provide context to the LLM.
        *   **Prompt Engineering:** Construct a detailed prompt instructing the LLM (Anthropic Claude) to generate a practice plan in a specific JSON format matching the structure expected by `practicePlanStore` and `sectionsStore`. Include user parameters and known drill names. Consider Anthropic's specific prompting guidelines if applicable.
        *   **LLM Interaction:**
            *   Use an appropriate Anthropic client library (e.g., `@anthropic-ai/sdk`).
            *   Initialize the client/make the API call using the platform's `ANTHROPIC_API_KEY`.
            *   Handle Anthropic API errors gracefully (authentication errors, rate limits, timeouts, content moderation blocks, etc.), returning appropriate HTTP status codes (401, 429, 503, 400).
        *   **Response Processing:**
            *   Parse the JSON response from the LLM.
            *   **Validate:** Rigorously validate the structure and data types of the received JSON against the expected format.
            *   **Map Drills:** Iterate through generated `items`. If `type: 'drill'`, attempt to map `name` to `drill_id` using `drillService`. If no match, treat as a one-off (ensure `drill_id` is null).
            *   Sanitize any free-text fields (e.g., description).
        *   **Output:** On success, return the validated and processed plan JSON (`{ planDetails: {...}, sections: [...] }`) with a `200 OK` status. On failure, return appropriate error status and message.

2.  **Backend: Add Helper Method to DrillService (If Needed)** (Done)
    *   **File:** `src/lib/server/services/drillService.js`
    *   **Action:** If a method to efficiently fetch just drill names/IDs doesn't exist, add `getAllDrillNames()`.
    *   **Logic:** Query the `drills` table for `id` and `name` only.

3.  **Frontend: Modify Practice Plan Form UI** (Next)
    *   **File:** `src/routes/practice-plans/PracticePlanForm.svelte` (or potentially `src/routes/practice-plans/create/+page.svelte` to wrap it)
    *   **Action:** Add a new distinct section (e.g., `<fieldset>` or `<Card>`) labelled "Generate Plan with AI".
    *   **UI Elements:**
        *   Input fields for generation parameters (`durationMinutes`, `skillLevel`, `participantCount`, etc.).
        *   A "Generate Plan" button.
        *   A loading indicator element (controlled by a reactive variable).
        *   (Remove the input field for `userApiKey`).

4.  **Frontend: Implement Client-Side Generation Logic**
    *   **File:** `src/routes/practice-plans/PracticePlanForm.svelte` (or its parent/wrapper)
    *   **Action:** Add a function (`handleGenerateAI`) triggered by the "Generate Plan" button.
    *   **Logic:**
        *   Set loading state to `true`.
        *   Clear any potentially conflicting existing form state (e.g., call `practicePlanStore.resetForm()`, `sectionsStore.resetSections()` - ensure these properly clear the state).
        *   Gather parameters from the new UI inputs.
        *   Make a `fetch` POST request to `/api/practice-plans/generate-ai` with the gathered `parameters` data in the body.
        *   **On Success (`response.ok`):**
            *   Parse the response JSON.
            *   Use store functions to populate the form:
                *   `practicePlanStore.initializeForm(responseJson.planDetails)`
                *   `sectionsStore.initializeSections(responseJson.sections)`
            *   Provide success feedback (e.g., `toast.success('Plan generated! Review and save.')`).
        *   **On Failure:**
            *   Parse error details if possible from the response.
            *   Provide specific error feedback (e.g., `toast.error('Generation failed: Rate limit exceeded')` or generic `toast.error('AI generation failed.')`).
        *   Set loading state to `false` in both success and failure cases.

5.  **State Management Considerations:**
    *   **File:** `src/lib/stores/practicePlanStore.js`, `src/lib/stores/sectionsStore.js`
    *   **Action:** Review `resetForm` and `resetSections` functions (if they exist, or create them) to ensure they fully clear the relevant state before `initializeForm`/`initializeSections` are called with AI-generated data. Ensure `initializeForm` and `initializeSections` robustly handle the structure provided by the AI endpoint.

6.  **Testing:**
    *   Test successful generation and form population.
    *   Test error handling (invalid parameters, LLM API errors like rate limits/authentication, malformed LLM response, content moderation blocks).
    *   Test rate limiting enforcement.
    *   Test interaction with existing form validation after generation.
    *   Test saving the AI-generated plan after potential user edits.

**Potential Challenges:**
*   **LLM Reliability & Cost:** LLMs can be inconsistent. Robust validation and error handling for the LLM response are critical. API usage incurs costs that need management (monitoring, rate limiting, potential future monetization).
*   **Prompt Engineering (Anthropic):** Achieving consistent, high-quality JSON output in the desired format requires careful prompt design specific to Anthropic models and iteration. (Partially addressed - initial prompt created)
*   **Drill Mapping:** Mapping generated drill names to existing DB entries might be imperfect. (Partially addressed - mapping logic implemented)
*   **Platform API Key Security:** The platform's Anthropic API key must be kept strictly confidential and only accessed server-side.
*   **Rate Limiting Implementation:** Designing and implementing effective rate limiting per user is crucial for cost control and abuse prevention. (TODO)
*   **User Experience:** Clearly communicating the AI generation process and potential inaccuracies is important. Ensure loading states and error messages are user-friendly. (TODO - Frontend)
