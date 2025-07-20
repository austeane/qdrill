# Drag and Drop Implementation

The drag and drop system in QDrill provides a sophisticated, intuitive interface for organizing drills within practice plans. This document details the technical implementation and design patterns used.

_(Note: A [recent code review](../code-review/holistic-summary.md) identified the `dragManager.js` store as the core of this system and noted its high complexity and tight coupling to `sectionsStore`. The reliance on mixed identifiers (indices, IDs, data attributes) and potential state synchronization issues (indicated by `window.__dragManager` usage in `TimelineColumn.svelte`) were also highlighted. Refactoring for simplification and decoupling is recommended. The old `dragStore.js` file was unused and has been removed.)_

## Architecture Overview

The drag and drop system is built on several coordinated components:

```
┌─────────────────────┐
│                     │
│    dragManager      │
│                     │
└─────────────────────┘
          ▲
          │
          │
          ▼
┌─────────────────────┐      ┌─────────────────────┐
│                     │      │                     │
│  Drag Components    │◄────►│   Drop Zones        │
│ (DrillItem, etc.)   │      │ (Section, Timeline) │
│                     │      │                     │
└─────────────────────┘      └─────────────────────┘
          ▲                            ▲
          │                            │
          │                            │
          ▼                            ▼
┌─────────────────────┐      ┌─────────────────────┐
│                     │      │                     │
│   sectionsStore     │◄────►│    historyStore     │
│                     │      │                     │
└─────────────────────┘      └─────────────────────┘
```

## Core Components

### 1. File Structure

- **`dragManager.js`** (`/src/lib/stores/dragManager.js`) - Core state management
- **`sectionsStore.js`** (`/src/lib/stores/sectionsStore.js`) - Practice plan data structure
- **`DrillItem.svelte`** (`/src/components/practice-plan/items/DrillItem.svelte`) - Draggable items
- **`ParallelGroup.svelte`** (`/src/components/practice-plan/items/ParallelGroup.svelte`) - Timeline groups
- **`TimelineColumn.svelte`** (`/src/components/practice-plan/items/TimelineColumn.svelte`) - Drop targets
- **`SectionContainer.svelte`** (`/src/components/practice-plan/sections/SectionContainer.svelte`) - Section containers
- **`styles.css`** (`/src/routes/styles.css`) - Visual indicator styles

### 2. Store Implementation

#### dragManager.js

Provides higher-level functions for drag operations:

1. **Initialization**: `startItemDrag(event, sectionIndex, itemIndex, item, itemId)`
2. **Drag Processing**: `handleItemDragOver(event, sectionIndex, itemIndex, item, element)`
3. **Drop Handling**: `handleDrop(event)`
4. **Cleanup**: `handleDragEnd()`
5. **Visual Updates**: `updateDropIndicators()`

### 3. Component Integration

#### Draggable Items

```svelte
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
	<!-- Drill content -->
</li>
```

#### Drop Zones

```svelte
<!-- TimelineColumn.svelte -->
<div
	class="timeline-column"
	data-section-index={sectionIndex}
	data-timeline={timeline}
	data-group-id={parallelGroupId}
	on:dragover={(e) =>
		handleTimelineDragOver(e, sectionIndex, timeline, parallelGroupId, e.currentTarget)}
	on:dragleave={handleDragLeave}
	on:drop={handleDrop}
>
	<!-- Timeline content -->
</div>
```

## Key Features

### 1. Multi-zone Drop Targeting

Each drop target can have multiple drop positions:

```
┌───────────────────────────────────────┐
│                TOP                     │◄── dropPosition: 'before'
├───────────────────────────────────────┤
│                                       │
│                                       │
│               MIDDLE                  │◄── dropPosition: 'inside'
│                                       │
│                                       │
├───────────────────────────────────────┤
│               BOTTOM                  │◄── dropPosition: 'after'
└───────────────────────────────────────┘
```

### 2. Visual Feedback System

- **Indicator Classes**: CSS classes that visually show valid drop zones
- **Position Markers**: Lines or borders indicating drop position
- **Opacity Changes**: Dragged items become partially transparent
- **State-based Classes**:
  - `.dragging` - Applied to elements being dragged
  - `.drop-before` - For drops before an item
  - `.drop-after` - For drops after an item
  - `.section-drop-before` - For drops before a section
  - `.section-drop-after` - For drops after a section
  - `.timeline-drop-target` - For timeline drop targets
  - `.empty-section-target` - For empty section targets

### 3. Timeline Reordering

The system supports special handling for reordering items within the same timeline:

```javascript
// Check for same-timeline reordering
const isSameTimeline =
	state.sourceSection === state.targetSection &&
	state.sourceGroupId === state.targetGroupId &&
	state.sourceTimeline === state.targetTimeline;

// Check for explicit item drops
const isDroppingOnItem =
	state.targetIndex !== null && (state.dropPosition === 'before' || state.dropPosition === 'after');

if (isSameTimeline && isDroppingOnItem) {
	// Find the target item's position
	const timelineItems = sectionItems.filter(
		(item) =>
			item.parallel_group_id === state.targetGroupId &&
			item.parallel_timeline === state.targetTimeline
	);

	// Find specific target
	const targetItem = timelineItems[state.targetIndex];
	const targetItemIndex = sectionItems.indexOf(targetItem);

	// Calculate insert position
	const insertAt = state.dropPosition === 'after' ? targetItemIndex + 1 : targetItemIndex;

	// Insert at calculated position
	sectionItems.splice(insertAt, 0, movedItem);
}
```

### 4. Color Management for Timelines

The system supports customizable timeline colors:

```javascript
// Helper function to get a timeline's color (custom or default)
export function getTimelineColor(timeline) {
	const customColors = get(customTimelineColors);
	if (customColors[timeline]) {
		return customColors[timeline];
	}
	return PARALLEL_TIMELINES[timeline]?.color || 'bg-gray-500';
}

// Helper function to update a timeline's color
export function updateTimelineColor(timeline, color) {
	// Update the customTimelineColors store
	customTimelineColors.update((colors) => {
		return { ...colors, [timeline]: color };
	});

	// Also update all items with this timeline in the sections store
	sections.update((currentSections) => {
		return currentSections.map((section) => {
			const updatedItems = section.items.map((item) => {
				if (item.parallel_timeline === timeline) {
					return {
						...item,
						timeline_color: color
					};
				}
				return item;
			});

			return {
				...section,
				items: updatedItems
			};
		});
	});
}
```

### 5. Validation System

Rules matrix determining valid drop operations:

| Dragged Item Type | Drop Target Type | Valid Positions     | Conditions            |
| ----------------- | ---------------- | ------------------- | --------------------- |
| drill             | section          | inside              | Always                |
| drill             | timeline         | before/after/inside | Compatible position   |
| drill             | parallel-group   | inside              | Must specify timeline |
| section           | practice-plan    | before/after        | Not self-reference    |
| timeline-column   | parallel-group   | inside              | Not self-reference    |

### 6. Performance Optimization

- **Event Throttling**: Dragover events throttled to prevent excessive updates:
  ```javascript
  // Throttle the drag over event
  if (lastDragOverTime && Date.now() - lastDragOverTime < 40) {
  	event.preventDefault();
  	return;
  }
  lastDragOverTime = Date.now();
  ```
- **Multi-phase Cleanup**: Ensures all visual indicators are removed:
  ```javascript
  function multiPhaseCleanup() {
  	clearAllDragIndicators();
  	setTimeout(() => clearAllDragIndicators(), 50);
  	setTimeout(() => clearAllDragIndicators(), 200);
  }
  ```
- **Item Identification Layers**: Multiple strategies to identify items during moves:

  ```javascript
  // ID-based lookup (most stable)
  if (state.itemId) {
  	const idMatch = srcSection.items.findIndex((it) => it.id === state.itemId);
  	if (idMatch !== -1) {
  		idx = idMatch;
  		foundItem = srcSection.items[idMatch];
  	}
  }

  // Name-based lookup (fallback)
  if (!foundItem && state.itemName) {
  	const nameMatch = srcSection.items.findIndex((it) => it.name === state.itemName);
  	if (nameMatch !== -1) {
  		idx = nameMatch;
  		foundItem = srcSection.items[nameMatch];
  	}
  }
  ```

## Error Recovery

The system implements multiple safeguards:

1. **State Backup**: State snapshot before drag operations

   ```javascript
   // Backup before operation
   const sectionsBeforeUpdate = get(sections);
   let errorOccurred = false;
   ```

2. **Operation Cancellation**: Safe cancellation path for invalid drops

   ```javascript
   // Restore on error
   if (errorOccurred) {
   	console.warn('[WARN] Restoring previous state due to error');
   	sections.set(sectionsBeforeUpdate);
   }
   ```

3. **Index Validation**: Proper validation function to handle edge cases

   ```javascript
   function isValidSectionIndex(secs, idx) {
   	return idx !== null && idx !== undefined && idx >= 0 && idx < secs.length;
   }
   ```

4. **History Integration**: Changes recorded in history store for undo

## Integration with Other Stores

### sectionsStore.js

When a valid drop occurs, sectionsStore updates the practice plan structure and handles complex operations like duration calculations:

```javascript
// Calculate total duration for each timeline
export function calculateTimelineDurations(items, groupId) {
	if (!groupId) return {};

	// Get all items in this specific parallel group
	const groupItems = items.filter((item) => item.parallel_group_id === groupId);
	if (groupItems.length === 0) return {};

	// Get the timelines that are actually used in this group
	const firstItem = groupItems[0];
	const groupTimelines = firstItem?.groupTimelines || [];

	// Calculate duration for each timeline in this group
	const durations = {};
	groupTimelines.forEach((timeline) => {
		const timelineItems = groupItems.filter((item) => item.parallel_timeline === timeline);
		durations[timeline] = timelineItems.reduce(
			(total, item) => total + (parseInt(item.selected_duration) || parseInt(item.duration) || 0),
			0
		);
	});

	// Find the maximum duration among the timelines in this group
	const maxDuration = Math.max(...Object.values(durations), 0);

	// Check for mismatches only within this group's timelines
	const mismatches = [];
	Object.entries(durations).forEach(([timeline, duration]) => {
		if (duration < maxDuration) {
			mismatches.push({
				timeline,
				difference: maxDuration - duration
			});
		}
	});

	// Show warning if the signature has changed
	if (mismatches.length > 0) {
		// Warning logic...
	}

	return durations;
}
```

### historyStore Integration

Operations are recorded in the history store for undo/redo capability.

## Mobile Responsiveness

The system includes special handling for mobile views:

```css
/* Mobile layout */
@media (max-width: 767px) {
	.grid {
		grid-template-columns: 1fr !important;
		grid-template-rows: repeat(var(--timeline-count, 2), auto);
	}
}
```

## Implementation Challenges and Solutions

### 1. Complex Hierarchy Handling

**Challenge**: Managing drag operations across nested components (sections → parallel groups → timelines)
**Solution**: Type-aware drag handling with parent reference tracking and consistent data attributes

### 2. Same-Timeline Reordering

**Challenge**: Items always move to the end of a timeline when dragged within same timeline
**Solution**: Special handling for same-timeline drags with position detection and insert index calculation

### 3. Visual Indicator Cleanup

**Challenge**: Blue lines persist after drop operations
**Solution**: Multi-phase cleanup with timeouts to ensure complete removal of visual indicators

### 4. Item Identification

**Challenge**: Wrong items moved during drag operations  
**Solution**: Multi-layered item lookup (ID, name, index) using findSourceItem helper for reliable identification

### 5. Section Index 0 Handling

**Challenge**: Section index 0 treated as falsy in conditionals  
**Solution**: Proper validation function to check index validity explicitly

## Debugging Tools

The system provides several debugging aids:

1. **Window-level access** for direct state manipulation
2. **Detailed logging** of drag operations
3. **Data attributes** for DOM inspection during interactions
