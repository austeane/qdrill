# UX Improvement: Add Clear/Reset Filters Functionality for Practice Plans

## Priority: High
**Impact**: High (Major UX improvement)  
**Effort**: Low  
**Status**: Open

## Problem
The **Reset Filters** button is only rendered when `filterType` is `'drills'`. Practice plan filters share the same `resetFilters` function but lack a visible UI control. After applying practice plan filters there's no clear way to return to defaults, leading to confusion.

## Solution
Add a "Clear Filters" or "Reset" button/link specifically for the practice plans filter section that allows users to quickly reset all applied practice plan filters. The existing `resetFilters` function in `FilterPanel.svelte` already handles resetting practice plan stores when `filterType` is 'practice-plans'. The main task is to ensure the button is displayed and correctly wired up for this `filterType`.

## Files to Modify

### Primary Files
- `src/lib/components/FilterPanel.svelte` - Ensure "Reset Filters" button is correctly displayed and functional when `filterType="practice-plans"`
- `src/routes/practice-plans/+page.svelte` - Integrate clear filters action if not already handled by `FilterPanel` changes.

### Supporting Files
- `src/lib/stores/practicePlanFilterStore.js` - Verify reset functionality (already handled by existing `resetFilters` in `FilterPanel.svelte`)

## Current State Analysis

### ✅ Already Implemented
- `resetFilters` function resets both drill and practice plan filter stores.
- Practice plan filter stores (`selectedPhaseOfSeason`, `selectedPracticeGoals`, etc.) are initialized from URL parameters in `+page.svelte`.

### ❌ Missing Implementation
- Reset button only renders for `filterType === 'drills'`.
- `resetPracticePlanFilters` helper in `practicePlanFilterStore.js` is unused.

## Implementation Details

### FilterPanel.svelte Changes
1. Move the existing Reset button so it is not inside the `filterType === 'drills'` block.
2. Show the button whenever filters are active for drills **or** practice plans (consider a reactive `hasActivePracticePlanFilters` check).
3. Clicking the button should call `resetFilters()`, which already resets both sets of stores and dispatches `filterChange` for URL updates.
4. Optionally remove or repurpose the unused `resetPracticePlanFilters` helper in the store.

### Current `resetFilters` in `FilterPanel.svelte`
```javascript
// Function to reset all filters
function resetFilters() {
  // ... (resets drill filters) ...

  if (filterType === 'practice-plans') {
    selectedPhaseOfSeason.set({});
    selectedPracticeGoals.set({});
    selectedEstimatedParticipantsMin.set(1);
    selectedEstimatedParticipantsMax.set(100);
    selectedDrills = []; // This is for a specific filter type within practice plans, ensure it's reset.
  }
  closeAllFilters();
  dispatch('filterChange');
}
```

### Suggested UI (if a separate button is needed or to ensure visibility)
```svelte
<!-- In FilterPanel.svelte -->
{#if (filterType === 'drills' && hasActiveDrillFilters) || (filterType === 'practice-plans' && hasActivePracticePlanFilters)}
  <button
    class="inline-flex items-center bg-red-500 text-white border border-red-600 rounded-full px-4 py-2 cursor-pointer hover:bg-red-600 transition-colors duration-300"
    on:click={resetFilters}
  >
    Reset Filters
  </button>
{/if}
```

### Function Implementation (if a dedicated handler is preferred)
```javascript
// Potentially new reactive statement for practice plan filters
$: hasActivePracticePlanFilters = (
  Object.keys($selectedPhaseOfSeason).length > 0 ||
  Object.keys($selectedPracticeGoals).length > 0 ||
  $selectedEstimatedParticipantsMin !== 1 ||
  $selectedEstimatedParticipantsMax !== 100 ||
  selectedDrills.length > 0
);

function handleResetPracticePlanFilters() {
  // Simply call resetFilters(); the page listens for the `filterChange` event to update the URL
  resetFilters();
}
```

## Acceptance Criteria
- [ ] Clear/Reset filters button appears on the practice plans page when practice plan-specific filters are active.
- [ ] Button is easily discoverable and clearly labeled.
- [ ] Clicking clears all applied practice plan filters.
- [ ] URL is updated to remove practice plan filter parameters.
- [ ] Existing reset functionality for drills remains unaffected.
- [ ] Loading states handled appropriately.
- [ ] Accessibility: proper ARIA labels and keyboard navigation.

## Testing
- [ ] Test clearing filters on the practice plans page with various combinations applied.
- [ ] Verify that drill filters are not affected when clearing practice plan filters, and vice-versa.
- [ ] Test URL state after clearing practice plan filters.
- [ ] Test on mobile and desktop.
- [ ] Test with screen readers.
- [ ] Test browser back/forward after clearing filters.

## Notes
- The core `resetFilters` logic in `FilterPanel.svelte` seems to support practice plan filters. The main work is UI visibility and ensuring it's correctly triggered for the practice plan context.
- Maintain consistency in UI/UX for resetting filters across different sections of the site. 