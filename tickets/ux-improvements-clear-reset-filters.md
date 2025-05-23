# UX Improvement: Add Clear/Reset Filters Functionality

## Priority: High
**Impact**: High (Major UX improvement)  
**Effort**: Low-Medium  
**Status**: Open

## Problem
Users cannot easily clear applied filters on the drills and practice plans pages. Once filters are applied, there's no obvious way to reset them back to the default state, creating a frustrating user experience.

## Solution
Add a "Clear Filters" or "Reset" button/link that allows users to quickly reset all applied filters.

## Files to Modify

### Primary Files
- `src/lib/components/FilterPanel.svelte` - Add clear filters UI and functionality
- `src/routes/drills/+page.svelte` - Integrate clear filters action 
- `src/routes/practice-plans/+page.svelte` - Integrate clear filters action

### Supporting Files
- `src/lib/stores/drillsStore.js` - Ensure reset functionality works with stores
- `src/lib/stores/practicePlanFilterStore.js` - Ensure reset functionality works with stores

## Implementation Details

### FilterPanel.svelte Changes
1. Add a "Clear Filters" button that's visible when any filters are active
2. Position it prominently in the filter section
3. Add clear visual indication when filters are active
4. Implement `clearAllFilters()` function that resets all stores

### Suggested UI
```svelte
<!-- Add to FilterPanel.svelte -->
{#if hasActiveFilters}
  <button 
    class="text-sm text-blue-600 hover:text-blue-800 underline ml-4"
    on:click={clearAllFilters}
  >
    Clear all filters
  </button>
{/if}
```

### Function Implementation
```javascript
function clearAllFilters() {
  resetFilters(); // Use existing resetFilters function
  // Navigate to clean URL without filter params
  goto(window.location.pathname);
}

// Add reactive statement to check if filters are active
$: hasActiveFilters = (
  Object.keys($selectedSkillLevels).length > 0 ||
  Object.keys($selectedComplexities).length > 0 ||
  // ... check other filter stores
);
```

## Acceptance Criteria
- [ ] Clear filters button appears when any filters are active
- [ ] Button is easily discoverable and clearly labeled
- [ ] Clicking clears all applied filters
- [ ] URL is updated to remove filter parameters
- [ ] Works on both drills and practice plans pages
- [ ] Loading states handled appropriately
- [ ] Accessibility: proper ARIA labels and keyboard navigation

## Testing
- [ ] Test clearing filters with various combinations applied
- [ ] Test URL state after clearing
- [ ] Test on mobile and desktop
- [ ] Test with screen readers
- [ ] Test browser back/forward after clearing filters

## Notes
- Consider adding individual filter "x" buttons for granular removal
- Maintain consistency between drills and practice plans filter behavior
- Ensure the clear action is discoverable but not accidentally triggered 