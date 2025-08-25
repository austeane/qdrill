# Teams Feature - Technical Debt and Remaining Work

## Work Completed in This Session

### Team Practice Plan View (Reuse Existing Viewer)
- Reused the existing practice plan viewer in team routes (DRY)
- Added team context for permissions, navigation, and breadcrumbs
- Implemented team routes and loaders; edit path redirects to shared editor
- Files created:
  1. `/src/routes/teams/[teamId]/plans/[id]/+page.server.js` – Fetch practice plan with team context
  2. `/src/routes/teams/[teamId]/plans/[id]/+page.svelte` – Viewer reusing shared components
  3. `/src/routes/teams/[teamId]/plans/+page.server.js` – Team practice plan list loader
  4. `/src/routes/teams/[teamId]/plans/+page.svelte` – Team practice plan list view
  5. `/src/routes/teams/[teamId]/plans/[id]/edit/+page.server.js` – Redirect to main edit page

### Desktop Dialogs Created
1. **CreatePracticeDialog.svelte** - Desktop practice creation dialog with:
   - Date and time selection
   - Practice type selection
   - Season section awareness
   - Option to create and edit immediately

2. **CreateMarkerDialog.svelte** - Desktop event/marker creation dialog with:
   - Event name, type, and description
   - Single date or date range support
   - Color selection
   - Edit and delete functionality

3. **Schedule View Integration** - Updated Schedule.svelte to use desktop dialogs

### Button Component Event Forwarding Fix
**Date**: 2025-08-25 (resolved)
**Context**: Dialogs in Schedule view weren't opening when Bits UI Button components were clicked.

**Root Cause Analysis**:
1. **Primary issue**: Incorrect dialog state binding (`open={...}` instead of `bind:open={...}`) — fixed.
2. **Secondary issue**: Event forwarding limitation in our Button wrapper. 
   - Our wrapper used `<ButtonPrimitive.Root {...$$restProps} on:click>` which only forwards Svelte component events
   - If Bits UI's primitive doesn't explicitly dispatch a `click` component event, native DOM clicks from its internal element won't reach consumers
   - This meant `on:click` handlers in consumer components never fired

**Solution Implemented**:
- Updated `src/lib/components/ui/button/button.svelte` to use `asChild` pattern:
  - Renders native `<button>` or `<a>` elements through the Bits UI primitive
  - Spreads `$$restProps` directly onto the native element
  - Guarantees native DOM event propagation and ensures consumer `on:click` handlers always fire
  - Preserves styling via `buttonVariants` and loading/disabled states

**Verification Steps**:
1. Teams page (`/teams`): "Create Team" modal opens correctly with `<Button on:click>`
2. Season management pages: All action buttons trigger handlers properly
3. Schedule view (`/teams/[teamId]/season`): Practice/Event dialogs open via native buttons (can now safely use `<Button>` if desired)

### UI Improvements Completed
1. **Replaced native buttons with Button component** in Schedule.svelte for consistency
2. **Enhanced permission UI feedback** on Teams page:
   - Added role badges (Admin/Coach/Member) with icons and colors
   - Clear visual indicators for permission levels
   - Helpful messages for members with view-only access
   - Warning for unauthenticated users to sign in


## Remaining Work

### High Priority

#### 1. ✅ Practice/Event Creation Button Issue – RESOLVED
**Status**: Issue resolved (2025-08-25)
**Resolution**: 
- Fixed incorrect prop binding (changed to `bind:open`)
- Fixed Button component event forwarding by refactoring wrapper to use `asChild` pattern
- Button wrapper now renders native elements ensuring reliable event propagation
**Files Modified**: 
- `src/lib/components/ui/button/button.svelte` - Refactored to use asChild pattern
- `src/lib/components/season/views/Schedule.svelte` - Fixed dialog bindings
**Verification**: All buttons and dialogs working correctly throughout application

#### 2. ✅ Team Practice Plan View - COMPLETED
**Location**: `/teams/[teamId]/plans/[id]`
**Status**: Completed on 2025-08-25
**Implementation**:
- Created team practice plan route that reuses the existing practice plan viewer component
- Added team context and permissions (admin/coach can edit)
- Integrated with team navigation and breadcrumbs
- Files created:
  - `/src/routes/teams/[teamId]/plans/[id]/+page.server.js` - Data loader
  - `/src/routes/teams/[teamId]/plans/[id]/+page.svelte` - View component reusing existing viewer
  - `/src/routes/teams/[teamId]/plans/+page.server.js` - Team practice plans listing loader
  - `/src/routes/teams/[teamId]/plans/+page.svelte` - Team practice plans listing page
  - `/src/routes/teams/[teamId]/plans/[id]/edit/+page.server.js` - Redirects to main edit page

#### 3. ✅ Section Editing in Practice Plans - COMPLETED
**Status**: Completed on 2025-08-25
**Implementation**:
- Section editing is handled through the main practice plan editor
- Team edit route redirects to `/practice-plans/[id]/edit` maintaining full functionality
- All section management features available: add, remove, reorder, timeline management

### Medium Priority

#### 4. ✅ Mobile Responsiveness - VERIFIED
**Status**: Completed on 2025-08-25
**Current State**: 
- Mobile views use bottom sheets (CreatePracticeSheet, EditMarkerSheet)
- Desktop views use dialogs
- Components properly detect device type and render appropriate UI
- Native buttons used in mobile sheets for reliability

#### 5. ✅ Permission System UI Feedback - ENHANCED
**Status**: Completed on 2025-08-25
**Implementation**:
- Added role badges on team cards (Admin/Coach/Member)
- Clear visual indicators with colors and icons
- Helpful messages for members with view-only access
- Warning messages for unauthenticated users
- Non-admin notice in Schedule header when actions are restricted

**Files Modified**:
- `/src/lib/components/season/views/Schedule.svelte` (permission note in header)
- `/src/routes/teams/+page.svelte` (role badges and permission indicators)

#### 6. Season Section Integration
**Work Needed**:
- Better integration between season sections and practice plans
- Auto-populate practice sections based on season sections
- Visual indicators for section overlap

**Progress (2025-08-25)**:
- Added visual indicators for season sections in Schedule view:
  - Week view: renders section name chips per day
  - Month view: shows a subtle top bar when a day intersects any section
- CreatePracticeDialog already surfaces overlapping sections with a seed defaults option

**Files Modified**:
- `src/lib/components/season/views/Schedule.svelte` (section badges and month-day indicator)

**Next**:
- Consider color-coding sections if section color metadata becomes available
- Add filtering to show/hide sections overlay in calendar

### Low Priority

#### 7. UI Polish
- Add loading states for async operations
- Improve error messaging
- Add success confirmations with better UX
- Enhance calendar view with better visual indicators

#### 8. Data Management
- Add data validation for all forms
- Implement optimistic UI updates
- Add offline support consideration

## Architectural Decisions

### Component Reuse Strategy
**Decision**: Team practice plan views reuse the existing practice plan viewer components rather than creating separate implementations.
**Rationale**: 
- Follows DRY (Don't Repeat Yourself) principle
- Ensures consistency across the application
- Reduces maintenance burden
- Allows improvements to benefit both individual and team contexts
**Implementation**: Team routes fetch the same data but add team context for permissions and navigation

**Differences in Team Context**:
- Team-specific navigation breadcrumbs
- Team-based permissions (admin/coach can edit)
- Team context in URL structure `/teams/[teamId]/plans/...`

## Technical Debt

### 1. ✅ Button Component Event Forwarding - RESOLVED
**Issue**: Dialog components were not opening when buttons were clicked in Schedule view
**Date Resolved**: 2025-08-25

**Root Cause Analysis**:
1. **Binding issue**: Used one-way `open` prop instead of two-way `bind:open` on dialogs
2. **Event forwarding limitation**: Our Button wrapper's approach to event forwarding wasn't working
   - Wrapper used `on:click` on `ButtonPrimitive.Root` which only forwards Svelte component events
   - Bits UI primitive wasn't dispatching a component event, so native DOM clicks weren't reaching consumers

**Solution Implemented**:
1. Fixed dialog bindings in Schedule.svelte (`bind:open` for both CreatePracticeDialog and CreateMarkerDialog)
2. Refactored `src/lib/components/ui/button/button.svelte`:
   - Now uses `asChild` pattern to render native `<button>`/`<a>` elements
   - Spreads `$$restProps` directly onto native elements
   - Ensures consumer `on:click` handlers attach to actual DOM elements and always fire
   - Maintains all styling and functionality (buttonVariants, loading, disabled states)

**Impact**:
- All Button components throughout the app now reliably forward click events
- Schedule view can use either native buttons or our `<Button>` component
- No need for workarounds or custom CSS for native buttons

**Lessons Learned**:
- Always use `bind:open` for Dialog components managing their own state
- Event forwarding in Svelte component wrappers requires careful handling
- The `asChild` pattern is more reliable for wrapping UI primitives when event propagation is critical

**Verification**: All dialogs and button interactions working correctly across the application.

### 2. Component Duplication
**Issue**: Separate mobile (Sheet) and desktop (Dialog) components with duplicated logic
**Impact**: Maintenance overhead, potential for inconsistencies
**Solution**: Create a unified component that adapts to device type

### 3. State Management
**Issue**: Complex state management between season, sections, markers, and practices
**Impact**: Potential for state sync issues
**Solution**: Consider using a store-based approach for team/season data

### 4. API Consistency
**Issue**: Different endpoints for similar operations (practices vs events)
**Impact**: Confusion and potential errors
**Solution**: Standardize API endpoints and response formats

### 5. Error Handling
**Issue**: Inconsistent error handling across components
**Impact**: Poor user experience when errors occur
**Solution**: Implement centralized error handling with user-friendly messages

### 6. Type Safety
**Issue**: Limited TypeScript usage
**Impact**: Runtime errors, harder debugging
**Solution**: Add TypeScript definitions for all data models

## Testing Requirements

### Unit Tests Needed
- Dialog component functionality
- Date/time validation
- Permission checks
- Season section calculations

### Integration Tests Needed
- Full practice creation flow
- Event creation and editing
- Season management operations
- Team member interactions

### E2E Tests Needed
- Complete team creation and setup
- Practice planning workflow
- Calendar navigation
- Cross-device functionality

## Database Considerations

### Schema Updates Needed
- Add indexes for team-related queries
- Consider denormalizing frequently accessed data
- Add audit fields for tracking changes

### Migration Requirements
- Ensure backward compatibility
- Add default values for new fields
- Create migration scripts

## Performance Optimizations

### Current Issues
- Multiple API calls on page load
- No caching strategy
- Large data transfers for calendar views

### Suggested Improvements
- Implement data prefetching
- Add client-side caching
- Paginate large data sets
- Use virtual scrolling for long lists

## Security Considerations

### Authentication
- Verify team membership on all operations
- Implement proper session management
- Add rate limiting for API calls

### Authorization
- Enforce role-based access control
- Validate permissions server-side
- Audit sensitive operations

## Documentation Needs

### User Documentation
- Team creation guide
- Practice planning tutorial
- Permission system explanation
- Best practices for team management

### Developer Documentation
- API endpoint documentation
- Component API documentation
- State management guide
- Deployment procedures

## Next Steps

1. ✅ ~~Immediate: Verify Practice/Event dialogs render~~ - COMPLETED (2025-08-25)
   - Fixed Button component event forwarding issue
   - All dialogs now working correctly

2. Short-term: Consider replacing native buttons in Schedule.svelte with Button component
   - Owner: Frontend
   - Now that Button wrapper is fixed, we can use it consistently
   
3. Short-term: Validate team practice plan listing and viewer flows
   - Owner: Frontend
   - Links: `/teams/[teamId]/plans`, `/teams/[teamId]/plans/[id]`
   
4. Medium-term: Unify mobile Sheet and desktop Dialog components
   - Owner: Frontend
   
5. Medium-term: Consolidate state management for season/sections/markers/practices
   - Owner: Frontend + Store
   
6. Long-term: Expand tests (unit, integration, E2E) and strengthen docs
   - Owner: QA/Dev

## Notes for Future Development

- Consider adding team templates for common sports
- Add coaching assignment features
- Implement practice attendance tracking
- Add communication features (comments, notifications)
- Consider integration with calendar apps
- Add export functionality for practice plans
- Implement analytics for team performance tracking
