<< this plan was created by ai, my comments are in angle brackets>>


<<The main point of the next bit is that logging in will let you modify your own drills. When you create a drill/plan, if you aren't logged in, it will be editable by anyone, but deletable by nobody. If you are logged in, it will be editable and deletable by you, and you can choose whether to allow others to edit it. 
You can also choose the visibility of drills/plans when logged in, either private to anyone with the link, or publicly findable. 

Also, logged in users can comment on drills and plans. 

Also, logged in users will be able to upvote/downvote once on each drill/plan.

Also, logged in users will be able to filter by upvoted or non-downvoted plans and drills.



Creating google oauth and the tables required has already been done. 
Log in with google will be the only option. We are not doing local accounts to start. So no password issues or creating new local users.
When you press login with google, if you don't have an account it will register you automatically.
>>

## 3. Implement Content Ownership and Permissions

### Database Schema Updates

- **Drills and Practice Plans Tables**:
  - Add a `created_by` field to track the owner (`user_id` foreign key).
  - Add a `is_editable_by_others` boolean field.
  - Add a `visibility` field (`'private'`, `'unlisted'`, `'public'`).

### Implementation Details

- **Content Creation**:
  - When a logged-in user creates a drill or practice plan, set the `created_by` field to their `user_id`.
  - Allow the user to set `is_editable_by_others` and `visibility` during creation and editing.

- **Content Editing**:
  - **Anonymous Users**:
    - Drills and plans created by anonymous users are editable by anyone.
    - Deletion is disabled for anonymous content.
  - **Logged-In Users**:
    - Only the owner can edit or delete their drills and plans.
    - If `is_editable_by_others` is `true`, allow other logged-in users to edit.

- **Routes Protection**:
  - Update the API routes for drills and practice plans (`+server.js` files) to enforce permissions.
  - Use the `authGuard` middleware to protect routes where necessary.



## 4. Implement Visibility Settings

### Implementation Details

- **Private Content**:
  - Content with `visibility` set to `'private'` is only accessible to the owner.
  - Return `403 Forbidden` for other users attempting to access.

- **Unlisted Content**:
  - Content with `visibility` set to `'unlisted'` is accessible via direct link but does not appear in public listings or search results.

- **Public Content**:
  - Content with `visibility` set to `'public'` is accessible to everyone and appears in listings and search results.

### Frontend and API Adjustments

- Modify data fetching functions to respect visibility settings.
- Update filters and search functionality to exclude `unlisted` and `private` content where appropriate.

## 5. Enable Commenting for Logged-In Users

### Database Setup

- **Comments Table**:
  - Fields: `id`, `user_id` (foreign key), `content`, `drill_id` or `plan_id` (foreign keys), `created_at`, `updated_at`.
  - Create migrations to add the comments table.

### Implementation Details

- **API Routes**:
  - Create routes for handling comments:

    ```javascript:src/routes/api/comments/+server.js
    import { json } from '@sveltejs/kit';
    import { authGuard } from '$lib/server/authGuard';
    import { query } from '$lib/server/db';

    export const GET = async ({ locals }) => {
      // Fetch comments logic
    };

    export const POST = authGuard(async ({ request, locals }) => {
      const session = await locals.getSession();
      const data = await request.json();
      // Create comment logic
    });

    // Similarly implement PUT and DELETE methods with authGuard
    ```

- **Frontend Components**:
  - **Comments Section**:
    - Create a `Comments.svelte` component to display comments and a form to add new comments.
    - Ensure only logged-in users can add comments.
  - **Integrate Comments Section**:
    - Include the `Comments` component in drills and practice plans detail pages.

## 6. Implement Voting System

### Database Setup

- **Votes Table**:
  - Fields: `id`, `user_id` (foreign key), `drill_id` or `plan_id` (foreign keys), `vote` (`1` for upvote, `-1` for downvote), `created_at`, `updated_at`.
  - Create migrations to add the votes table.
  - Enforce a unique constraint on `(user_id, drill_id)` and `(user_id, plan_id)` to prevent multiple votes by the same user on the same item.

### Implementation Details

- **API Routes**:
  - Create routes for voting:

    ```javascript:src/routes/api/votes/+server.js
    import { json } from '@sveltejs/kit';
    import { authGuard } from '$lib/server/authGuard';
    import { query } from '$lib/server/db';

    export const POST = authGuard(async ({ request, locals }) => {
      const session = await locals.getSession();
      const data = await request.json();
      // Vote logic (upvote/downvote)
    });
    ```

- **Frontend Components**:
  - **Voting Buttons**:
    - Create an `UpvoteDownvote.svelte` component.

      ```svelte:src/components/UpvoteDownvote.svelte
      <script>
        import { onMount } from 'svelte';
        import { page } from '$app/stores';

        export let itemId;
        export let itemType; // 'drill' or 'plan'

        let userVote = 0; // -1, 0, 1
        let totalVotes = 0;

        $: user = $page.data.session?.user;

        async function fetchUserVote() {
          // Fetch user's vote for this item
        }

        async function handleVote(voteValue) {
          if (!user) {
            // Prompt user to log in
            return;
          }
          // Send vote to API
        }

        onMount(() => {
          fetchUserVote();
        });
      </script>

      <div class="flex items-center">
        <button on:click={() => handleVote(1)} class:active={userVote === 1}>
          Upvote
        </button>
        <span>{totalVotes}</span>
        <button on:click={() => handleVote(-1)} class:active={userVote === -1}>
          Downvote
        </button>
      </div>
      ```

  - **Integrate Voting Component**:
    - Include the `UpvoteDownvote` component in drills and practice plans listings and detail pages.

- **Data Aggregation**:
  - Update queries to include vote counts where necessary.
  - Consider caching vote totals for performance optimization.

## 7. Implement Filtering Based on Votes

### Implementation Details

- **Filter Panel Updates**:
  - Add options to filter drills and practice plans based on voting status:

    ```svelte:src/components/FilterPanel.svelte
    <script>
      export let showUpvoted = false;
      export let hideDownvoted = false;

      // Add these to the binding context
    </script>

    <!-- Voting Filters -->
    <div class="mt-4">
      <label>
        <input type="checkbox" bind:checked={showUpvoted} />
        Show only upvoted items
      </label>
      <label>
        <input type="checkbox" bind:checked={hideDownvoted} />
        Hide downvoted items
      </label>
    </div>
    ```

- **Frontend Adjustments**:
  - Update the `FilterPanel` component to include the new filtering options.
  - Ensure that the filters are only available to logged-in users.

- **Backend Adjustments**:
  - Modify the data fetching functions to accept voting filters.
  - Ensure the filters are applied correctly in queries.

## 8. Update User Interface and Navigation

### Implementation Details

- **User Profile and Settings**:
  - Create a `UserProfile.svelte` component to display user information and manage settings.
  - Provide options for users to view their content, comments, and votes.

- **Header and Navigation**:

  ```svelte:src/routes/Header.svelte
  startLine: 4
  endLine: 47
  ```

- **Content Cards**:
  - Update drills and practice plans listings to display ownership, vote counts, and visibility status.

    ```svelte
    <!-- src/routes/drills/+page.svelte -->
    <!-- Existing code -->
    <div class="flex items-center text-sm text-gray-500 mb-2">
      <span>By {drill.created_by_name || 'Anonymous'}</span>
      <span class="mx-2">•</span>
      <span>{drill.visibility.charAt(0).toUpperCase() + drill.visibility.slice(1)}</span>
    </div>
    <!-- Include UpvoteDownvote component -->
    <UpvoteDownvote itemId={drill.id} itemType="drill" />
    ```

## 9. Testing and Validation

### Implementation Details

- **Test Cases**:
  - Update existing tests and add new ones to cover:
    - Permission checks (edit/delete access).
    - Visibility settings enforcement.
    - Commenting functionality.
    - Voting functionality and vote limits.
    - Filtering based on votes.
    - Anonymous vs. logged-in user behaviors.

- **Error Handling**:
  - Ensure proper error messages and statuses are returned for unauthorized actions.
  - Validate user inputs on both client and server sides.

- **Security Considerations**:
  - Prevent SQL injection and other common vulnerabilities.
  - Ensure that all authentication checks are performed server-side.

## 10. Additional Considerations

- **Privacy and Data Protection**:
  - Comply with data protection regulations when handling user data.
  - Allow users to delete their account and associated data.

- **Performance Optimization**:
  - Optimize database queries, especially for filtering and aggregating votes.
  - Implement caching strategies where appropriate.

- **Scalability**:
  - Design the system to handle a growing number of users and content.

- **User Experience**:
  - Provide clear feedback to users when actions are successful or if errors occur.
  - Ensure the interface is intuitive and accessible.