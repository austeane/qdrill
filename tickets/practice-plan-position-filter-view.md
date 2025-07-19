# Ticket: Add Dynamic Group-Based Filter View to Practice Plans

**Goal:** Implement a dynamic group-based filter system for practice plan viewing that automatically detects and allows filtering by parallel groups (e.g., SEEKERS, CHASERS, BEATERS) present in the plan. This addresses the UX challenge of different position groups working in parallel or together throughout practice.

**Related Files:**
- Analysis: `docs/analysis/2025_gta_may_31_practice_plan_analysis.md`
- Viewer: `src/routes/practice-plans/[id]/+page.svelte`
- Components: `src/routes/practice-plans/viewer/Section.svelte`, `src/routes/practice-plans/viewer/DrillCard.svelte`, `src/routes/practice-plans/viewer/ParallelGroup.svelte`
- Schema: `src/lib/validation/practicePlanSchema.ts`
- Database: `practice_plan_drills` table (uses `parallel_timeline` field)

### Current Code Status

The app currently implements a **PositionFilter** component (`src/lib/components/practice-plan/PositionFilter.svelte`).
This filter lets users toggle between the three preset positions **CHASERS**, **BEATERS**, and **SEEKERS**.
`+page.svelte` applies the filter using `filterSectionsByPositions()` to hide or flatten parallel groups.
Group badges on cards also use hardcoded position colors. The system does not yet detect arbitrary
`parallel_timeline` values, so custom group names are ignored.

## Problem Statement

Current practice plans show all activities linearly, making it difficult to:
1. Focus on specific group activities (e.g., just seeker drills)
2. Understand parallel activities across different groups
3. See when groups work together vs separately
4. Use on mobile devices with limited screen space

## Solution: Dynamic Group-Based Filter View

### Key Insight
Instead of hardcoding position filters, dynamically generate filter options based on the `parallel_timeline` values actually present in the practice plan. This is more flexible and future-proof.

### User Interface Design

#### Dynamic Filter Control
- **Location:** Below practice plan header, above timeline on the practice plan viewer page
- **Options:** Dynamically generated based on practice plan content:
  - "All Groups" (default) - Shows everything
  - Individual group filters (e.g., "SEEKERS", "CHASERS", "BEATERS") - Only shown if that group exists in the plan
- **Visual:** Segmented control or tab-like buttons
- **Mobile:** Horizontal scrollable tabs or dropdown
- **Behavior:** Filters update automatically as parallel groups are added/removed during editing

#### Visual Indicators
- Group badges on drill cards showing which parallel group they belong to
- Color coding for groups (dynamically assigned, ensure accessibility):
  - Each unique `parallel_timeline` gets a consistent color throughout the plan
  - Non-parallel items could be shown in neutral gray
- Clear indication when viewing filtered vs full view

### Implementation Plan

#### Phase 1: Frontend Filter Generation

1. **Create `GroupFilter.svelte` component (`src/lib/components/practice-plan/GroupFilter.svelte`):**
   ```svelte
   <script>
     import { createEventDispatcher } from 'svelte';
     
     export let sections = [];
     export let selectedFilter = 'All Groups';
     
     const dispatch = createEventDispatcher();
     
     // Dynamically generate available filters from practice plan data
     $: availableFilters = getAvailableFilters(sections);
     
     function getAvailableFilters(sections) {
       const filters = new Set(['All Groups']);
       
       sections.forEach(section => {
         section.items?.forEach(item => {
           if (item.parallel_timeline) {
             filters.add(item.parallel_timeline);
           }
         });
       });
       
       return Array.from(filters);
     }
     
     function handleFilterChange(filter) {
       selectedFilter = filter;
       dispatch('filterChange', { filter });
     }
   </script>
   
   <div class="group-filter">
     {#each availableFilters as filter}
       <button 
         class="filter-btn" 
         class:active={selectedFilter === filter}
         on:click={() => handleFilterChange(filter)}
       >
         {formatFilterName(filter)}
       </button>
     {/each}
   </div>
   ```

2. **Update Practice Plan Viewer (`src/routes/practice-plans/[id]/+page.svelte`):**
   ```javascript
   // Import the new component
   import GroupFilter from '$lib/components/practice-plan/GroupFilter.svelte';
   
   // Add filter state
   let selectedGroupFilter = 'All Groups';
   
   // Filter sections based on selected group
   $: filteredSections = filterSectionsByGroup(sections, selectedGroupFilter);
   
   function filterSectionsByGroup(sections, selectedGroup) {
     if (selectedGroup === 'All Groups') return sections;
     
     return sections.map(section => ({
       ...section,
       items: section.items.filter(item => {
         // Show items that belong to the selected group
         if (item.parallel_timeline === selectedGroup) return true;
         
         // Decision: Hide non-parallel items when filtering specific groups
         // Alternative: Show them faded or with indicator
         if (!item.parallel_timeline) return false;
         
         return false;
       })
     })).filter(section => section.items.length > 0); // Remove empty sections
   }
   ```

#### Phase 2: Visual Updates

1. **Add Group Badges to `DrillCard.svelte`:**
   ```svelte
   {#if item.parallel_timeline}
     <span class="group-badge" style="background-color: {getGroupColor(item.parallel_timeline)}">
       {formatGroupName(item.parallel_timeline)}
     </span>
   {/if}
   ```

2. **Update `ParallelGroup.svelte`:**
   - When a group filter is active, highlight the relevant timeline
   - Optionally hide or fade non-matching timelines
   - Show context: "Viewing {GroupName} activities only"

3. **Color Assignment System:**
   ```javascript
   // In a shared utility or store
   const groupColors = new Map();
   const colorPalette = [
     '#3B82F6', // Blue
     '#EF4444', // Red  
     '#F59E0B', // Amber
     '#10B981', // Green
     '#8B5CF6', // Purple
     // ... more colors
   ];
   let colorIndex = 0;
   
   export function getGroupColor(groupName) {
     if (!groupColors.has(groupName)) {
       groupColors.set(groupName, colorPalette[colorIndex % colorPalette.length]);
       colorIndex++;
     }
     return groupColors.get(groupName);
   }
   ```

#### Phase 3: Mobile Optimization

1. **Responsive Filter Design:**
   - On mobile: Convert to horizontal scroll or dropdown
   - Sticky positioning so filters remain accessible while scrolling
   - Larger tap targets for mobile

2. **Filtered View Optimization:**
   - Single column layout when viewing specific groups
   - Cleaner, more focused interface
   - Quick toggle to return to "All Groups" view

#### Phase 4: Edit Mode Integration

1. **Update editing forms to show current parallel groups**
2. **Allow creating new parallel groups on the fly**
3. **Validate group names for consistency (e.g., uppercase convention)**

### Benefits Over Preset Positions

1. **Flexibility:** Users can create custom groups like "ADVANCED_BEATERS" or "ROOKIES" without code changes
2. **Accuracy:** Only shows filters for groups actually in the plan
3. **Simplicity:** No need for `positions_involved` database column
4. **Future-proof:** New group types work automatically

### Testing Requirements

1. **Unit Tests:**
   - Filter generation from section data
   - Filtering logic with various group combinations
   - Color assignment consistency

2. **Integration Tests:**
   - Filter updates when sections change
   - Proper handling of items without parallel groups

3. **E2E Tests:**
   - Filter interaction across different screen sizes
   - Filter persistence during navigation
   - Performance with many parallel groups

### Edge Cases to Handle

1. **Mixed Activities:** 
   - Non-parallel items when group filter is active
   - Decision: Hide completely or show with indicator?

2. **Empty Filter Results:**
   - Show message: "No activities for {GroupName} in this section"
   - Provide easy way to return to all groups

3. **Group Naming:**
   - Case sensitivity (recommend case-insensitive matching)
   - Special characters in group names
   - Very long group names (UI truncation)

4. **Dynamic Updates:**
   - Filter options update when parallel groups are added/removed
   - Selected filter remains valid or falls back to "All Groups"

### Migration & Backward Compatibility

- No database migration needed! 
- Existing `parallel_timeline` field provides all needed data
- Old practice plans without parallel groups show only "All Groups" filter

### Future Enhancements

1. **Filter Combinations:**
   - Allow selecting multiple groups (e.g., "CHASERS + BEATERS")
   - Save favorite filter combinations

2. **Group Management:**
   - UI to rename groups
   - Merge similar groups (e.g., "SEEKER" vs "SEEKERS")
   - Group templates for common configurations

3. **Analytics:**
   - Track which groups are most commonly filtered
   - Understand parallel activity patterns
   - Optimize default groupings

## Success Criteria

1. Filter options dynamically reflect actual practice plan content
2. Filtering is instant and performant
3. Mobile experience is optimized
4. Visual indicators clearly show filtered state
5. No hardcoded position assumptions
6. Easy to add new parallel groups
7. Intuitive UX for both viewing and editing

## Implementation Priority

1. **High Priority:**
   - Dynamic filter generation
   - Basic filtering logic
   - Group badges on cards
   - Mobile responsive design

2. **Medium Priority:**
   - Color coding system
   - ParallelGroup visual updates
   - Empty state handling
   - Edit mode integration

3. **Low Priority:**
   - Filter combinations
   - Group management UI
   - Analytics integration
   - Advanced customization 
