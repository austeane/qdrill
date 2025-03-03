# QDrill Drag and Drop System Guide

This document provides an overview of the drag and drop functionality in QDrill practice plan editing, focusing on the implementation details and common patterns.

## Core Components

### Key Files
- **`dragManager.js`** (`/src/lib/stores/dragManager.js`) - Core state management
- **`sectionsStore.js`** (`/src/lib/stores/sectionsStore.js`) - Practice plan data structure
- **`DrillItem.svelte`** (`/src/components/practice-plan/items/DrillItem.svelte`) - Draggable items
- **`ParallelGroup.svelte`** (`/src/components/practice-plan/items/ParallelGroup.svelte`) - Timeline groups
- **`TimelineColumn.svelte`** (`/src/components/practice-plan/items/TimelineColumn.svelte`) - Drop targets
- **`SectionContainer.svelte`** (`/src/components/practice-plan/sections/SectionContainer.svelte`) - Section containers
- **`styles.css`** (`/src/routes/styles.css`) - Visual indicator styles

### Data Structure

```javascript
// Example parallel group item
{
  id: "drill-123",
  name: "Passing Drill",
  type: "drill",
  duration: 15,
  selected_duration: 15,
  
  // Parallel group properties
  parallel_group_id: "group_1234567890",  // Shared across group
  parallel_timeline: "CHASERS",           // This item's position
  groupTimelines: ["BEATERS", "CHASERS"]  // All timelines in group
}
```

### State Management

The drag state is managed via a Svelte store and contains:

```javascript
{
  isDragging: true,
  dragType: "item", // 'item', 'group', or 'section'
  
  // Source information
  sourceSection: 0,
  sourceIndex: 3,
  sourceGroupId: "group_1234567890",
  sourceTimeline: "BEATERS",
  
  // Item tracking (stable identifiers)
  itemId: 123,
  itemName: "Boston Beater Drill",
  
  // Target information
  targetSection: 0,
  targetIndex: 5,
  targetGroupId: "group_1234567890",
  targetTimeline: "CHASERS",
  
  // Position
  dropPosition: "inside", // 'before', 'after', or 'inside'
  
  // Element tracking
  draggedElementId: "item-0-3",
  dropTargetElementId: "timeline-0-group_1234567890-CHASERS"
}
```

## Drag and Drop Lifecycle

### 1. Drag Start
When a drag operation begins, the system:
1. Validates the drag source
2. Sets initial drag state with item/group/section information
3. Stores redundant data in dataTransfer for recovery
4. Adds visual indicators to the dragged element

### 2. Drag Over
As the item is dragged over potential targets:
1. Updates target information in the drag state
2. Calculates drop position (before/after/inside)
3. Updates visual indicators on potential drop targets
4. Throttles events to prevent excessive updates

### 3. Drop
When the item is dropped:
1. Identifies the source and target elements
2. Recovers drag data if needed from multiple sources
3. Makes a backup of the sections state
4. Executes the appropriate update logic
5. Records the operation in history (throttled)
6. Cleans up visual indicators

### 4. Drag End/Leave
When drag operations end or targets change:
1. Removes all visual indicators
2. Resets the drag state
3. Performs multi-phase cleanup to ensure interface consistency

## Handler Functions

### Drag Start Handlers
- `startItemDrag(event, sectionIndex, itemIndex, item, itemId)` - Items
- `startGroupDrag(event, sectionIndex, groupId)` - Parallel groups
- `startSectionDrag(event, sectionIndex)` - Sections

### Drag Over Handlers
- `handleItemDragOver(event, sectionIndex, itemIndex, item, element)` - Items
- `handleGroupDragOver(event, sectionIndex, groupId, element)` - Groups
- `handleSectionDragOver(event, sectionIndex, element)` - Sections
- `handleTimelineDragOver(event, sectionIndex, timelineName, groupId, element)` - Timelines
- `handleEmptySectionDragOver(event, sectionIndex, element)` - Empty sections

### Drop Handlers
- `handleDrop(event)` - Main drop handler
- `handleItemDrop(state)` - Item-specific logic
- `handleGroupDrop(state)` - Group-specific logic
- `handleSectionDrop(state)` - Section-specific logic
- `handleTimelineDrop(state, movedItem, sourceItemIndex)` - Timeline-specific logic
- `handleRegularDrop(state, movedItem, sourceItemIndex)` - Regular (before/after) drops

### Helper Functions
- `findSourceItem(secs, state)` - Find an item using ID, name, or index
- `isValidSectionIndex(secs, idx)` - Validate section indices
- `calculateDropPosition(event, element)` - Determine drop position
- `multiPhaseCleanup()` - Multi-stage indicator cleanup

## Item Identification and Lookup

Items are identified in multiple ways to ensure stability:

1. **ID-based lookup** (most stable):
   ```javascript
   if (state.itemId) {
     const idMatch = srcSection.items.findIndex((it) => it.id === state.itemId);
     if (idMatch !== -1) {
       idx = idMatch;
       foundItem = srcSection.items[idMatch];
     }
   }
   ```

2. **Name-based lookup** (fallback):
   ```javascript
   if (!foundItem && state.itemName) {
     const nameMatch = srcSection.items.findIndex((it) => it.name === state.itemName);
     if (nameMatch !== -1) {
       idx = nameMatch;
       foundItem = srcSection.items[nameMatch];
     }
   }
   ```

3. **Index-based lookup** (last resort):
   ```javascript
   if (!foundItem && srcSection.items[idx]) {
     foundItem = srcSection.items[idx];
   }
   ```

## Timeline Items and Reordering

Timeline reordering involves specialized handling:

1. **Same-timeline reordering**:
   ```javascript
   // Check for same-timeline reordering
   const isSameTimeline = 
     state.sourceSection === state.targetSection && 
     state.sourceGroupId === state.targetGroupId && 
     state.sourceTimeline === state.targetTimeline;
   
   // Check for explicit item drops
   const isDroppingOnItem = state.targetIndex !== null && 
     (state.dropPosition === 'before' || state.dropPosition === 'after');
   ```

2. **Target position calculation**:
   ```javascript
   if (isSameTimeline && isDroppingOnItem) {
     // Find the target item's position
     const timelineItems = sectionItems.filter(item => 
       item.parallel_group_id === state.targetGroupId && 
       item.parallel_timeline === state.targetTimeline
     );
     
     // Find specific target
     const targetItem = timelineItems[state.targetIndex];
     const targetItemIndex = sectionItems.indexOf(targetItem);
     
     // Calculate insert position
     const insertAt = state.dropPosition === 'after' ? 
       targetItemIndex + 1 : targetItemIndex;
     
     // Insert at calculated position
     sectionItems.splice(insertAt, 0, movedItem);
   }
   ```

## Visual Indicators

The system uses CSS classes for visual feedback:

- `.dragging` - Applied to elements being dragged
- `.drop-before` - For drops before an item
- `.drop-after` - For drops after an item
- `.section-drop-before` - For drops before a section
- `.section-drop-after` - For drops after a section
- `.timeline-drop-target` - For timeline drop targets
- `.empty-section-target` - For empty section targets

## Component Binding

Components use attribute-based binding:

```html
<!-- DrillItem.svelte -->
<li
  draggable="true"
  data-item-id={itemId}
  data-section-index={sectionIndex}
  data-item-index={itemIndex}
  data-item-name={item.name}
  data-timeline={item.parallel_timeline}
  data-group-id={item.parallel_group_id}
  on:dragstart={(e) => startItemDrag(e, sectionIndex, itemIndex, item, itemId)}
  on:dragover={(e) => handleItemDragOver(e, sectionIndex, itemIndex, item, e.currentTarget)}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
  on:dragend={handleDragEnd}
>
```

```html
<!-- TimelineColumn.svelte -->
<div 
  class="timeline-column"
  data-section-index={sectionIndex}
  data-timeline={timeline}
  data-group-id={parallelGroupId}
  on:dragover={(e) => handleTimelineDragOver(e, sectionIndex, timeline, parallelGroupId, e.currentTarget)}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
```

## Error Handling and Recovery

The system uses backup-and-restore for error recovery:

```javascript
// Backup before operation
const sectionsBeforeUpdate = get(sections);
let errorOccurred = false;

// Perform the update with error tracking
sections.update(secs => {
  try {
    // Operation logic...
    return newSecs;
  } catch (e) {
    errorOccurred = true;
    return secs; // Return unchanged on error
  }
});

// Restore on error
if (errorOccurred) {
  console.warn('[WARN] Restoring previous state due to error');
  sections.set(sectionsBeforeUpdate);
}
```

## Debugging Tools

The system provides several debugging aids:

1. **Window-level access**:
   ```javascript
   window.__dragManager = {
     get: () => get(dragState),
     update: (fn) => dragState.update(fn)
   };
   ```

2. **Detailed logging**:
   ```javascript
   console.log('[DEBUG] Moving item:', {
     id: movedItem.id,
     name: movedItem.name,
     from: {
       section: state.sourceSection,
       index: sourceItemIndex,
       timeline: movedItem.parallel_timeline
     },
     to: {
       section: state.targetSection,
       timeline: state.targetTimeline
     }
   });
   ```

3. **Data attributes for DOM inspection**:
   ```html
   <div
     data-section-index={sectionIndex}
     data-timeline={timeline}
     data-group-id={parallelGroupId}
   >
   ```

## Common Issues and Solutions

### Timeline Item Reordering
**Issue**: Items always move to the end of a timeline when dragged.  
**Solution**: Implement specific handling for same-timeline drags with position detection.

### Visual Indicator Cleanup
**Issue**: Blue lines persist after drop operations.  
**Solution**: Multi-phase cleanup with timeouts:
```javascript
function multiPhaseCleanup() {
  clearAllDragIndicators();
  setTimeout(() => clearAllDragIndicators(), 50);
  setTimeout(() => clearAllDragIndicators(), 200);
}
```

### Section Index 0 Handling
**Issue**: Section index 0 treated as falsy in conditionals.  
**Solution**: Proper validation function:
```javascript
function isValidSectionIndex(secs, idx) {
  return idx !== null && idx !== undefined && idx >= 0 && idx < secs.length;
}
```

### Item Identification
**Issue**: Wrong items moved during drag operations.  
**Solution**: Multi-layered item lookup (ID, name, index) using `findSourceItem` helper.

### Timeline Configuration
**Issue**: Timeline configuration lost during moves.  
**Solution**: Preserve timeline properties:
```javascript
movedItem.parallel_group_id = state.targetGroupId;
movedItem.parallel_timeline = state.targetTimeline;
movedItem.groupTimelines = [...groupTimelines]; // Preserve
```