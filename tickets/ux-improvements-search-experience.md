# UX Improvement: Enhanced Search Experience

## Priority: High
**Impact**: High (Core functionality improvement)
**Effort**: Low-Medium
**Status**: Open

## Problem
Search fields now update results automatically as the user types using a 300&nbsp;ms debounce. However there is no visual indicator that a search is running and no easy way to clear the current query. Users may not realize filtering is happening in the background, especially on slow connections.

## Solution
Add visual feedback during search and provide a clear button to reset the query. The existing instant search behavior should remain.

## Files to Modify

### Primary Files
- `src/routes/drills/+page.svelte` - Main search input implementation
- `src/routes/practice-plans/+page.svelte` - Search consistency
- `src/lib/components/FilterPanel.svelte` - Contains drill search functionality

### Supporting Files
- `src/lib/stores/drillsStore.js` - Search query store management
- `src/lib/utils/loadingStates.js` - Loading states for search

## Current Implementation
```svelte
<!-- src/routes/drills/+page.svelte -->
<input
  type="text"
  placeholder="Search drills..."
  class="flex-grow p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  bind:value={$searchQuery}
  on:input={handleSearchInput}
  aria-label="Search drills"
  data-testid="search-input"
/>
```
`handleSearchInput` simply calls a debounced `applyFiltersAndNavigate` function:
```javascript
function handleSearchInput() {
  debounce(() => applyFiltersAndNavigate({ resetPage: true }));
}
```
A similar pattern exists in `practice-plans/+page.svelte` where `updateUrlParams` is debounced.

## Implementation Options

### Option A: Instant Search with Loading Indicator (Recommended)
1. Keep current debounced search behavior
2. Use `createLoadingState` or `createDebouncedLoadingState` to show a spinner while filtering
3. Add a clear-search button when text is present

### Option B: Search Button Approach
1. Remove auto-search behavior
2. Add prominent search icon button
3. Search triggers on button click or Enter key

## Acceptance Criteria
- [ ] Search behavior is intuitive and discoverable
- [ ] Visual feedback provided during search operations
- [ ] Clear search functionality available when search has content
- [ ] Consistent behavior across drills and practice plans pages
- [ ] Loading states properly managed
- [ ] Keyboard accessibility (Enter key triggers search)
- [ ] Screen reader friendly with proper ARIA labels
- [ ] Mobile-friendly touch targets

## Testing
- [ ] Test search with various input lengths
- [ ] Test search clearing functionality
- [ ] Test keyboard navigation (Enter, Escape)
- [ ] Test loading states with slow connections
- [ ] Test mobile touch interaction
- [ ] Test screen reader announcements
- [ ] Test search with no results
- [ ] Test search with network errors

## Notes
- Recommend Option A (instant search with loading) for better UX
- Consider adding search history/suggestions in future
- Ensure search is case-insensitive and handles special characters

