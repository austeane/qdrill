# Auth Implementation Plan

## 1. Implement Google OAuth Authentication

### Install and Configure Dependencies
- Install `@auth/core` and `@auth/sveltekit` packages.
- Update `package.json` to include these new dependencies.

### Configure Google OAuth
- Create a new project in the Google Developers Console.
- Set up OAuth 2.0 credentials for the application.
- Store client ID and client secret securely in environment variables.

### Implementation Details
- Create a new file: `src/lib/server/auth.ts`
  - Set up SvelteKit Auth with Google provider.
  - Configure session handling and callbacks.

- Update `src/hooks.server.ts`:
  - Implement SvelteKit Auth handle function.

- Create login and logout API routes:
  - `src/routes/api/auth/[...auth]/+server.ts`
    - Handle authentication requests.

- Update `src/routes/+layout.svelte`:
  - Add login/logout buttons in the navigation.
  - Display user information when logged in.

## 2. Set Up User Account Management

### Database Setup
- Create a new migration file: `migrations/[timestamp]_create_users_table.sql`
  - Define the `users` table schema.

### Implementation Details
- Update `src/lib/server/auth.ts`:
  - Implement callbacks to handle user creation/update in the database.

- Create `src/lib/server/db/users.ts`:
  - Implement functions for user CRUD operations.

## 3. Allow Anonymous Creation with Login Prompt on Submit

### Implementation Details
- Update drill and practice plan creation components:
  - `src/routes/drills/DrillForm.svelte`
  - `src/routes/practice-plans/create/+page.svelte`
  - Add a check before submission to verify if the user is logged in.
  - If not logged in, show a modal prompting the user to log in.
  - Store form data in local storage before redirecting to login.

- Create a new component: `src/lib/components/LoginPromptModal.svelte`
  - Implement a modal component for login prompts.

## 4. Restrict Editing and Private Access to Logged-In Users

### Implementation Details
- Update API routes for drills and practice plans:
  - `src/routes/api/drills/[id]/+server.ts`
  - `src/routes/api/practice-plans/[id]/+server.ts`
  - Add authentication checks and ownership verification for edit operations.

- Update drill and practice plan detail pages:
  - `src/routes/drills/[id]/+page.svelte`
  - `src/routes/practice-plans/[id]/+page.svelte`
  - Show edit buttons only for logged-in users who own the content.

## 5. Enable Commenting for Logged-In Users

### Database Setup
- Create a new migration file: `migrations/[timestamp]_create_comments_table.sql`
  - Define the `comments` table schema.

### Implementation Details
- Create new API routes for comments:
  - `src/routes/api/comments/+server.ts`
  - Implement CRUD operations for comments.

- Update drill and practice plan detail pages:
  - `src/routes/drills/[id]/+page.svelte`
  - `src/routes/practice-plans/[id]/+page.svelte`
  - Add a comment section with a form for logged-in users.
  - Display existing comments with user information.

## 6. Implement Favorites Functionality

### Database Setup
- Create a new migration file: `migrations/[timestamp]_create_favorites_table.sql`
  - Define the `favorites` table schema.

### Implementation Details
- Create new API routes for favorites:
  - `src/routes/api/favorites/+server.ts`
  - Implement adding and removing favorites.

- Update drill and practice plan list and detail pages:
  - `src/routes/drills/+page.svelte`
  - `src/routes/practice-plans/+page.svelte`
  - `src/routes/drills/[id]/+page.svelte`
  - `src/routes/practice-plans/[id]/+page.svelte`
  - Add favorite buttons and indicators.
  - Implement filtering based on user favorites.

## 7. Update the User Interface

### Implementation Details
- Update `src/routes/+layout.svelte`:
  - Add login/logout buttons to the navigation bar.
  - Display user avatar and name when logged in.

- Create a new component: `src/lib/components/UserMenu.svelte`
  - Implement a dropdown menu for logged-in users.

- Update all relevant pages to include authentication-required action prompts:
  - Use the `LoginPromptModal` component where necessary.

## 8. Testing and Validation

### Implementation Details
- Create new test files:
  - `tests/auth.test.js`
  - `tests/user-management.test.js`
  - `tests/comments.test.js`
  - `tests/favorites.test.js`

- Update existing test files to include authentication scenarios.

- Implement error handling and validation in all affected components and API routes.

- Update `src/hooks.server.ts` to include global error handling for authentication issues.

## Additional Considerations

- Ensure all sensitive operations are protected by server-side authentication checks.
- Implement proper CSRF protection for all forms and API endpoints.
- Use HTTPS in production to protect user data in transit.
- Regularly update dependencies to patch any security vulnerabilities.
- Implement rate limiting on authentication endpoints to prevent brute force attacks.
- Consider implementing two-factor authentication for enhanced security.