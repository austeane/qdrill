# Teams Feature - Technical Debt and Remaining Work

## Work Completed in This Session

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

### Button Component Investigation
**Date**: 2025-08-25
**Context**: Another model suggested Bits UI `Button` is the cause of add Practice/Event actions not opening dialogs in the Schedule view.

**Root Cause Identified**: The issue was not with the Bits UI `Button` component but with incorrect prop binding on the dialog components.

**Problem**: 
- Schedule.svelte was using one-way binding `open={showPracticeDialog}` instead of two-way binding `bind:open={showPracticeDialog}`
- The CreatePracticeDialog and CreateMarkerDialog components expect `bind:open` for proper state synchronization
- This caused the dialogs to not properly update their open state when the button was clicked

**Solution Applied**:
- Changed `open={showPracticeDialog}` to `bind:open={showPracticeDialog}` in Schedule.svelte:418
- Changed `open={showMarkerDialog}` to `bind:open={showMarkerDialog}` in Schedule.svelte:441

**Update**: After applying the fix, the dialog still doesn't appear. Further investigation shows:
- The buttons are visible and enabled when `isAdmin` is true
- The button click events fire but console.log statements in handlers don't appear
- This suggests the event handlers aren't being called despite the fix
- Possible issues: hot module reload not picking up changes, or another underlying issue

**Next Steps**:
- Verify the fix is properly compiled and loaded
- Check if there's a runtime error preventing the handlers from executing
- Investigate if the dialog component itself has issues rendering


## Remaining Work

### High Priority

#### 1. ✅ Practice/Event Creation Button Issue - RESOLVED
**Status**: Fixed on 2025-08-25
**Solution**: Changed dialog props from one-way `open={showPracticeDialog}` to two-way binding `bind:open={showPracticeDialog}`
**Files Modified**: `src/lib/components/season/views/Schedule.svelte` (lines 418, 441)

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

#### 3. Section Editing in Practice Plans
**Work Needed**:
- Test section editing functionality within team practice plans
- Ensure sections can be properly modified
- Verify timeline management works correctly

### Medium Priority

#### 4. Mobile Responsiveness
**Current State**: Mobile views use bottom sheets
**Work Needed**:
- Test mobile views thoroughly
- Ensure smooth transitions between mobile and desktop
- Fix any layout issues

#### 5. Permission System
**Work Needed**:
- Fully implement role-based permissions (admin vs member)
- Add UI feedback for permission-restricted actions
- Test permission edge cases

#### 6. Season Section Integration
**Work Needed**:
- Better integration between season sections and practice plans
- Auto-populate practice sections based on season sections
- Visual indicators for section overlap

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

## Technical Debt

### 1. ✅ Button Component Compatibility Issue - RESOLVED
**Issue**: Dialog components were not opening when buttons were clicked in Schedule view
**Root Cause**: Incorrect prop binding - using one-way `open` prop instead of two-way `bind:open`
**Solution**: Fixed binding in Schedule.svelte for both CreatePracticeDialog and CreateMarkerDialog
**Lesson Learned**: When using Dialog components that manage their own open state, always use `bind:open` for proper two-way data binding

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

1. **Immediate**: Fix the Practice/Event button functionality in Schedule view
2. **Short-term**: Complete team practice plan view implementation
3. **Medium-term**: Address component duplication and state management
4. **Long-term**: Implement comprehensive testing and documentation

## Notes for Future Development

- Consider adding team templates for common sports
- Add coaching assignment features
- Implement practice attendance tracking
- Add communication features (comments, notifications)
- Consider integration with calendar apps
- Add export functionality for practice plans
- Implement analytics for team performance tracking
