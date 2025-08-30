# Teams ID Investigation: UUID vs Slug

## Current Situation

The codebase has an inconsistent approach to team identification:

### Database Schema
- **teams table**: 
  - `id` (UUID) - Primary key
  - `slug` (VARCHAR) - Human-readable identifier
- **team_members table**: 
  - `team_id` (UUID) - Foreign key reference

### Current Usage Patterns

1. **URL Routes**: `/teams/[teamId]/...`
   - The `[teamId]` parameter is ambiguous - could be UUID or slug
   - Currently fails when slug is used (e.g., `/teams/test-team/season`)

2. **Frontend Navigation**:
   - All `href` and `goto` calls use `team.id` (UUID)
   - Examples:
     ```svelte
     href="/teams/{team.id}/season"
     goto(`/teams/${team.id}/settings`)
     ```

3. **API Endpoints**:
   - Use `params.teamId` directly without validation
   - Pass to permission checks and database queries expecting UUID

4. **Permission System**:
   - `teamMemberService.getMember()` expects UUID for `team_id`
   - Causes PostgreSQL error when slug is passed

## Problems with Current Approach

1. **Mixed identifiers**: Database uses UUIDs but slugs exist
2. **No validation**: Routes accept any string as `teamId`
3. **Poor UX**: URLs contain UUIDs instead of readable slugs
4. **Inconsistent**: Some teams have slugs, others might not

## Recommended Solution: Use Slugs Consistently

### Why Slugs?
- **Better UX**: `/teams/awesome-team/season` vs `/teams/3017adc7-5b70-4a69-8545-b152b1957c98/season`
- **SEO friendly**: Human-readable URLs
- **Shareable**: Easier to communicate and remember

### Implementation Plan

1. **Database Changes**:
   - Ensure all teams have unique slugs
   - Add migration to populate missing slugs
   - Make slug column NOT NULL with UNIQUE constraint

2. **Route Parameter Loader**:
   - Create a `+params.js` file to resolve slugs to team data
   - Load team once at route level, pass to all child routes
   - This follows SvelteKit best practices

3. **API Updates**:
   - Update all API endpoints to accept slugs
   - Resolve slug to UUID at API boundary
   - Keep internal services using UUIDs

4. **Frontend Updates**:
   - Change all navigation to use `team.slug`
   - Update breadcrumbs and links

### Alternative: Keep UUIDs

If we want to keep UUIDs:
1. Remove slug column entirely
2. Keep URLs with UUIDs
3. Simpler but worse UX

## Recommendation

**Use slugs in URLs, UUIDs internally**. This provides:
- Clean, shareable URLs
- Type safety with UUID foreign keys
- Single source of truth for team identity
- Follows web best practices

The implementation should:
1. Add a route parameter loader to resolve slugs
2. Update navigation to use slugs
3. Keep database relationships using UUIDs
4. Validate and enforce unique slugs