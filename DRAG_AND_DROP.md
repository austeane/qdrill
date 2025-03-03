# QDrill Drag and Drop System Guide

This document provides a comprehensive overview of the drag and drop functionality in the QDrill application, focusing on practice plan editing and parallel timeline groups.

## Core Files and Components

### Main Store Files

1. **dragManager.js** - Core drag and drop state management
   - Path: `/src/lib/stores/dragManager.js`
   - Contains state management and event handlers for drag operations
   - Manages drag types: items, groups, and sections

2. **sectionsStore.js** - Practice plan data structure
   - Path: `/src/lib/stores/sectionsStore.js`
   - Manages sections, items, and parallel groups
   - Handles timeline configurations for parallel groups

### Key Components

1. **DrillItem.svelte** - Individual drill items
   - Path: `/src/components/practice-plan/items/DrillItem.svelte`
   - Represents draggable drill items

2. **ParallelGroup.svelte** - Container for parallel timelines
   - Path: `/src/components/practice-plan/items/ParallelGroup.svelte`
   - Renders multiple TimelineColumn components as a group

3. **TimelineColumn.svelte** - Individual timelines
   - Path: `/src/components/practice-plan/items/TimelineColumn.svelte`
   - Drop targets for items in parallel groups

4. **SectionContainer.svelte** - Section containers
   - Path: `/src/components/practice-plan/sections/SectionContainer.svelte`
   - Container for both standard items and parallel groups

### Styling

1. **styles.css** - Global CSS styles
   - Path: `/src/routes/styles.css`
   - Contains drag and drop visual indicators

## Data Structure

### Parallel Group Structure

```javascript
// Example of an item in a parallel group
{
  id: "drill-123",
  name: "Passing Drill",
  type: "drill",
  duration: 15,
  selected_duration: 15,
  
  // Parallel group properties
  parallel_group_id: "group_1234567890",  // Shared with all items in the group
  parallel_timeline: "CHASERS",           // Specific to this item's position
  groupTimelines: ["BEATERS", "CHASERS"]  // All timelines in this group
}
```

### Critical Properties

- `parallel_group_id` - Identifier for a parallel group, shared across all items in the group
- `parallel_timeline` - Specific timeline this item belongs to within the group
- `groupTimelines` - Array of all timeline names within this group

## Drag and Drop Logic

### Drag State

The `dragState` Svelte store contains:

```javascript
{
  isDragging: true,
  dragType: "item", // 'item', 'group', or 'section'
  
  // Source information
  sourceSection: 0,
  sourceIndex: 3,
  sourceGroupId: "group_1234567890",
  sourceTimeline: "BEATERS",
  
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

### Key Functions

#### Drag Start

- `startItemDrag`: Initialize drag state for items
- `startGroupDrag`: Initialize drag state for parallel groups 
- `startSectionDrag`: Initialize drag state for sections

#### Drag Over

- `handleItemDragOver`: Handle hovering over an item
- `handleGroupDragOver`: Handle hovering over a group
- `handleSectionDragOver`: Handle hovering over a section
- `handleTimelineDragOver`: Handle hovering over a timeline column
- `handleEmptySectionDragOver`: Handle hovering over an empty section

#### Drag End/Drop

- `handleDragLeave`: Remove visual indicators when leaving a drop target
- `handleDragEnd`: Clean up after drag operations end
- `handleDrop`: Process the drop event and updates data structure
- `handleItemDrop`: Specific logic for dropping items
- `handleGroupDrop`: Specific logic for dropping groups
- `handleSectionDrop`: Specific logic for dropping sections

## Timeline Group Operations

### Creating Parallel Groups

- `createParallelBlock` in sectionsStore.js creates a new parallel group
- Selected timelines from the `selectedTimelines` store determine which timelines are included
- Placeholder drills are created for each timeline

### Moving Items Between Timelines

When dropping an item into a timeline:

1. The item's `parallel_group_id` is set to match the target group
2. The item's `parallel_timeline` is set to the target timeline
3. The item's `groupTimelines` array is preserved from the target group
4. The item is positioned after other items in the same timeline

### Ungrouping Parallel Blocks

- `handleUngroup` removes the parallel structure from items
- Items retain their position in the section but are no longer grouped

## Visual Indicators

### CSS Classes

- `.drop-before`: Indicates an item can be dropped before another
- `.drop-after`: Indicates an item can be dropped after another
- `.timeline-drop-target`: Highlights a timeline column as a drop target
- `.empty-section-target`: Highlights an empty section as a drop target
- `.dragging`: Applied to the element being dragged

## Common Issues & Solutions

### Item Swapping Problem

When dragging items between timelines, sometimes items would unexpectedly swap positions.

**Solution:** Position new items at the end of existing items with the same timeline:
```javascript
// Find items in the same timeline and group
const sameTimelineItems = secs[state.targetSection].items.filter(item => 
  item.parallel_group_id === state.targetGroupId && 
  item.parallel_timeline === state.targetTimeline
);

if (sameTimelineItems.length > 0) {
  // Find the last item of this timeline
  const lastItem = sameTimelineItems[sameTimelineItems.length - 1];
  const lastItemIndex = secs[state.targetSection].items.indexOf(lastItem);
  
  // Insert after the last item of this timeline
  secs[state.targetSection].items.splice(lastItemIndex + 1, 0, movedItem);
} else {
  // No items in this timeline, add to end
  secs[state.targetSection].items.push(movedItem);
}
```

### "No timelines configured" Problem

When dragging an item from one timeline to another, the "No timelines configured" message would sometimes show.

**Solution:** Ensure the `groupTimelines` property is preserved when moving items:
```javascript
// Extract groupTimelines from the first item in the target group
const groupTimelines = groupItems.length > 0 ? 
  groupItems[0].groupTimelines || [] : 
  [state.targetTimeline]; // Fallback to just the target timeline

// Dropping into a timeline
movedItem.parallel_group_id = state.targetGroupId;
movedItem.parallel_timeline = state.targetTimeline;
movedItem.groupTimelines = [...groupTimelines]; // Ensure groupTimelines is preserved
```

## Key Event Handlers in Components

### TimelineColumn.svelte
```html
<div 
  class="timeline-column bg-white rounded-lg border border-gray-200 p-2 min-h-[150px] flex flex-col transition-all duration-200"
  on:dragover={(e) => handleTimelineDragOver(e, sectionIndex, timeline, parallelGroupId, e.currentTarget)}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
```

### DrillItem.svelte
```html
<li class="timeline-item relative transition-all duration-200 {isBeingDragged ? 'dragging' : ''}"
  draggable="true"
  on:dragstart={(e) => startItemDrag(e, sectionIndex, itemIndex, item)}
  on:dragover={(e) => handleItemDragOver(e, sectionIndex, itemIndex, item, e.currentTarget)}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
  on:dragend={handleDragEnd}
>
```

### ParallelGroup.svelte
```html
<div 
  class="parallel-group-container relative px-2 py-2 mb-2 bg-blue-50 border-l-4 border-blue-300 rounded {isBeingDragged ? 'dragging' : ''}"
  draggable="true"
  on:dragstart={(e) => startGroupDrag(e, sectionIndex, groupId)}
  on:dragover={(e) => handleGroupDragOver(e, sectionIndex, groupId, e.currentTarget)}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
  on:dragend={handleDragEnd}
>
```

## Debugging

Look for debug logs that provide insight into drag operations:

```javascript
console.log('[DEBUG] TimelineColumn', {
  timeline,
  parallelGroupId,
  itemCount: timelineSpecificItems.length,
  timelineItems: timelineSpecificItems.map(i => ({
    name: i.name,
    parallel_timeline: i.parallel_timeline,
    groupTimelines: i.groupTimelines
  }))
});

console.log('[DEBUG] ParallelGroup - groupTimelines:', {
  groupId,
  timelines: groupTimelines,
  firstItem: firstGroupItem ? {
    id: firstGroupItem.id,
    name: firstGroupItem.name,
    parallel_timeline: firstGroupItem.parallel_timeline,
    groupTimelines: firstGroupItem.groupTimelines
  } : null,
  itemsCount: items.filter(item => item.parallel_group_id === groupId).length
});
```