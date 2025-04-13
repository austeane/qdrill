# Ticket 11: Implement Consistent API Error Handling Strategy

**Priority:** Medium

**Description:** The error handling strategy across API routes (`src/routes/api/**/*.js`) is inconsistent. Some routes return generic 500 errors, others return custom JSON error payloads, and many rely on matching specific error message strings propagated from service layers to determine the appropriate HTTP status code (e.g., 404, 403). Relying on error message strings is brittle and makes refactoring services difficult.

**Affected Files:**

*   All API route handlers in `src/routes/api/` (e.g., `/drills`, `/practice-plans`, `/formations`, `/comments`, `/votes`, etc.)
*   All service layer files in `src/lib/server/services/` (as they currently throw generic `Error` objects with string messages).

**Related Notes:**

*   `code-review/holistic-summary.md` (Key Themes: API Design)
*   `code-review/drill-notes.md` (API route reviews)
*   `code-review/practice-plan-notes.md` (API route reviews)
*   `code-review/formations-notes.md` (API route reviews)
*   `code-review/service-notes.md` (Error handling in services)

**Action Required:**

1.  **Define Strategy:** Establish a consistent API error handling strategy. Recommendations:
    *   Define custom error classes (e.g., `NotFoundError`, `UnauthorizedError`, `ValidationError`, `DatabaseError`) within the service layer or a shared utility.
    *   Modify service methods to throw these specific error types instead of generic `new Error('message')`.
    *   In API route handlers, use `try...catch` blocks to catch these custom errors.
    *   Map specific error types to appropriate HTTP status codes (e.g., `NotFoundError` -> 404, `UnauthorizedError` -> 403, `ValidationError` -> 400).
    *   Return a consistent JSON error response body (e.g., `{ "error": { "code": "NOT_FOUND", "message": "Resource not found" } }`). Use SvelteKit's `error()` helper where appropriate, possibly customized for JSON responses.
2.  **Refactor Services:** Update service methods (`drillService`, `practicePlanService`, `baseEntityService`, etc.) to throw the defined custom error classes.
3.  **Refactor API Routes:** Update all API route handlers to catch the custom errors and return consistent, appropriate HTTP statuses and JSON responses based on the defined strategy. Remove brittle checks for specific error message strings.
4.  **Update Client-Side Handling:** Ensure client-side code that calls APIs can handle the new consistent error response format. 