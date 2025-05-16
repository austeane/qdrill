## Progress Update (2024-08-17)

### Completed:

1. **Client-Side Refactoring:**
   - Created `apiFetch` utility function in `src/lib/utils/apiFetch.js` as a wrapper around native `fetch` to handle standardized API responses and errors.
   - Refactored several key components to use `apiFetch` instead of direct `fetch` calls:
     - Drill pages: `src/routes/drills/[id]/+page.svelte`, `DrillForm.svelte`, `bulk-upload/+page.svelte`, `+page.svelte`
     - Admin page: `src/routes/admin/+page.svelte`
     - Practice plan components: `src/components/practice-plan/modals/DrillSearchModal.svelte`
     - Feedback modal: `src/components/FeedbackModal.svelte`

### In Progress:

- Continuing to refactor remaining client-side components that use direct `fetch` calls, including:
  - `poll/+page.svelte`
  - `feedback/+page.svelte`
  - `UpvoteDownvote.svelte`
  - `Comments.svelte`
  - `FilterPanel.svelte`
  - `ExcalidrawWrapper.svelte`
  - Various practice plan and formation pages

### Benefits Realized:

- Unified network error handling and consistent `{ error: { code, message } }` parsing in high-traffic drill and admin flows
- Eliminated several hundred lines of duplicate try/catch logic and inconsistent error handling
- Improved UX by presenting more meaningful error messages to users

### Next Steps:

1. Complete refactoring the remaining components to use `apiFetch` (incremental approach is acceptable)
2. Clean up now-redundant error handling code that duplicates what `apiFetch` provides
3. Consider expanding `apiFetch` if specialized needs arise (file downloads, etc.)

## Progress Update (2024-08-16)

### Completed:

1.  **Defined Strategy:**
    - Created custom error classes (`NotFoundError`, `ForbiddenError`, `ValidationError`, etc.) extending `AppError` in `src/lib/server/errors.js`.
    - Implemented a shared utility function `handleApiError` in `src/routes/api/utils/handleApiError.js` to convert errors into standardized JSON responses (`{ error: { code: '...', message: '...' } }`).
2.  **Refactored Services:** Updated the following services to use custom errors and consistent error throwing:
    - `baseEntityService.js`
    - `drillService.js`
    - `practicePlanService.js`
    - `formationService.js`
    - `userService.js`
    - `skillService.js`
    - _Note: `pendingPracticePlanService.js` uses in-memory storage and doesn't throw errors directly; handling is in the API route._
3.  **Refactored API Routes:** Updated the following API routes to use the `handleApiError` utility:
    - Drills (`/drills/`, `/[id]/`, etc.)
    - Practice Plans (`/practice-plans/`, `/[id]/`, `/associate/`, `/duplicate/`)
    - Formations (`/formations/`, `/[id]/`, `/search/`, `/associate/`)
    - Users (`/users/me/`)
    - Skills (`/skills/`)
    - Comments (`/comments/`)
    - Votes (`/votes/`, `/votes/user/`)
    - Feedback (`/feedback/`, `/feedback/[id]/delete/`, `/feedback/[id]/upvote/`)
    - Poll (`/poll/`, `/poll/options/`)
    - Pending Plans (`/pending-plans/`)
    - _Note: `/drill-assets/` and `/auth-debug/` routes listed in the ticket did not have corresponding `+server.js` files._
4.  **Fixed Linter Error:** Resolved error in `src/routes/api/drills/test-migration/+server.js`.

### To Do:

1.  **Update Client-Side Handling:** Review client-side code that calls APIs to ensure it correctly handles the new standardized error response format (`{ error: { code: '...', message: '...' } }`). This involves checking `fetch` calls and their `.catch()` blocks in `.svelte` components and potentially utility functions.

---

# Ticket 11: Implement Consistent API Error Handling Strategy

**Priority:** Medium

**Description:** The error handling strategy across API routes ([`src/routes/api/**/*.js`](src/routes/api/)) is inconsistent. Some routes return generic 500 errors, others return custom JSON error payloads, and many rely on matching specific error message strings propagated from service layers to determine the appropriate HTTP status code (e.g., 404, 403). Relying on error message strings is brittle and makes refactoring services difficult.

**Affected Files:**

- All API route handlers in [`src/routes/api/`](src/routes/api/) (e.g., `/drills`, `/practice-plans`, `/formations`, `/comments`, `/votes`, etc.)
- All service layer files in [`src/lib/server/services/`](src/lib/server/services/) (as they currently throw generic `Error` objects with string messages).

**Related Notes:**

- [`code-review/holistic-summary.md`](code-review/holistic-summary.md) (Key Themes: API Design)
- [`code-review/drill-notes.md`](code-review/drill-notes.md) (API route reviews)
- [`code-review/practice-plan-notes.md`](code-review/practice-plan-notes.md) (API route reviews)
- [`code-review/formations-notes.md`](code-review/formations-notes.md) (API route reviews)
- [`code-review/service-notes.md`](code-review/service-notes.md) (Error handling in services)

**Action Required:**

1.  **Define Strategy:** Establish a consistent API error handling strategy. Recommendations:
    - Define custom error classes (e.g., `NotFoundError`, `UnauthorizedError`, `ValidationError`, `DatabaseError`) within the service layer or a shared utility. **DONE**
    - Modify service methods to throw these specific error types instead of generic `new Error('message')`. **Partially DONE (drillService)**
    - In API route handlers, use `try...catch` blocks to catch these custom errors. **Partially DONE (drill routes)**
    - Map specific error types to appropriate HTTP status codes (e.g., `NotFoundError` -> 404, `UnauthorizedError` -> 403, `ValidationError` -> 400). **DONE (via `handleApiError` helper)**
    - Return a consistent JSON error response body (e.g., `{ "error": { "code": "NOT_FOUND", "message": "Resource not found" } }`). Use SvelteKit's `error()` helper where appropriate, possibly customized for JSON responses. **DONE (via `handleApiError` helper)**
2.  **Refactor Services:** Update service methods (`drillService`, `practicePlanService`, `baseEntityService`, etc.) to throw the defined custom error classes. **DONE**
3.  **Refactor API Routes:** Update all API route handlers to catch the custom errors and return consistent, appropriate HTTP statuses and JSON responses based on the defined strategy. Remove brittle checks for specific error message strings. **DONE**
4.  **Update Client-Side Handling:** Ensure client-side code that calls APIs can handle the new consistent error response format. **In Progress**
