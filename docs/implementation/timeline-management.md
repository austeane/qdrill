# Timeline Management Implementation

This document details the implementation of timeline features in the QDrill practice plan system, focusing on timeline configuration, color management, and duration calculations.

## Timeline Architecture

The timeline system organizes drills into parallel activity streams for different positions within a practice plan.

### Core Components

- **ParallelGroup.svelte**: Container component for organizing multiple timelines
- **TimelineColumn.svelte**: Individual timeline display for a specific position
- **TimelineSelectorModal.svelte**: Configuration interface for timeline selection and colors
- **sectionsStore.js**: Store for managing timeline data and calculations

## Timeline Data Structure

Timelines are implemented with a structured data model:

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
  groupTimelines: ["BEATERS", "CHASERS"],  // All timelines in group
  timeline_color: "bg-green-500",         // Custom color for this timeline
  group_name: "Position Work"             // Group labeling
}
```

## Color Management

The system provides customizable colors for individual timelines:

### Available Colors

```javascript
// TIMELINE_COLORS constant
export const TIMELINE_COLORS = {
  'bg-red-500': 'Red',
  'bg-orange-500': 'Orange',
  'bg-amber-500': 'Amber',
  'bg-yellow-500': 'Yellow',
  'bg-lime-500': 'Lime',
  'bg-green-500': 'Green',
  'bg-emerald-500': 'Emerald',
  'bg-teal-500': 'Teal',
  'bg-cyan-500': 'Cyan',
  'bg-sky-500': 'Sky',
  'bg-blue-500': 'Blue',
  'bg-indigo-500': 'Indigo',
  'bg-violet-500': 'Violet',
  'bg-purple-500': 'Purple',
  'bg-fuchsia-500': 'Fuchsia',
  'bg-pink-500': 'Pink',
  'bg-rose-500': 'Rose',
  'bg-gray-500': 'Gray',
  'bg-slate-500': 'Slate',
  'bg-zinc-500': 'Zinc'
};
```

### Color Retrieval and Updates

Timeline colors are managed through dedicated functions:

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
  customTimelineColors.update(colors => {
    return { ...colors, [timeline]: color };
  });
  
  // Also update all items with this timeline in the sections store
  sections.update(currentSections => {
    return currentSections.map(section => {
      const updatedItems = section.items.map(item => {
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

## Timeline Duration Calculation

The system tracks and validates timeline durations to ensure practice plan consistency:

### Duration Calculation Process

```javascript
// Calculate total duration for each timeline
export function calculateTimelineDurations(items, groupId) {
  if (!groupId) return {};
  
  // Get all items in this specific parallel group
  const groupItems = items.filter(item => item.parallel_group_id === groupId);
  if (groupItems.length === 0) return {};
  
  // Get the timelines that are actually used in this group
  const firstItem = groupItems[0];
  const groupTimelines = firstItem?.groupTimelines || [];
  
  // Calculate duration for each timeline in this group
  const durations = {};
  groupTimelines.forEach(timeline => {
    const timelineItems = groupItems.filter(item => item.parallel_timeline === timeline);
    durations[timeline] = timelineItems.reduce((total, item) => 
      total + (parseInt(item.selected_duration) || parseInt(item.duration) || 0), 0
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

  // Create a unique warning signature for this group's mismatches
  const warningSig = mismatches.map(m => `${m.timeline}:${m.difference}`).sort().join('|');
  
  // Only show warning if the signature has changed or hasn't been shown for this group
  if (mismatches.length > 0 && 
      (!lastDurationWarnings.has(groupId) || 
       lastDurationWarnings.get(groupId) !== warningSig)) {
    
    const warningMessage = mismatches
      .map(({ timeline, difference }) => 
        `${PARALLEL_TIMELINES[timeline].name} (${difference}min shorter)`
      )
      .join(', ');

    // Store the current warning signature
    lastDurationWarnings.set(groupId, warningSig);
    
    // Show the toast
    toast.push(`Timeline duration mismatch in group: ${warningMessage}`, {
      theme: {
        '--toastBackground': '#FFA500',
        '--toastColor': 'black'
      }
    });
  }

  return durations;
}
```

### Performance Optimization

To prevent excessive recalculations, the system implements memoization:

```javascript
// Only recalculate if the items actually changed
const groupItems = items.filter(item => item.parallel_group_id === groupId);
const itemsChanged = groupItems.length !== lastGroupItems.length || 
                     JSON.stringify(groupItems.map(i => i.id)) !== 
                     JSON.stringify(lastGroupItems.map(i => i.id));

if (itemsChanged) {
  cachedDurations = calculateTimelineDurations(items, groupId);
  lastGroupItems = [...groupItems];
}
```

## Timeline Selector Modal

The TimelineSelectorModal component allows users to configure timelines with a visual interface:

### Timeline Selection

```svelte
<label class="flex items-center space-x-3 flex-grow cursor-pointer">
  <input
    type="checkbox"
    checked={$selectedTimelines.has(key)}
    on:change={(e) => {
      if (e.target.checked) {
        $selectedTimelines.add(key);
      } else {
        $selectedTimelines.delete(key);
      }
      // Trigger reactivity by reassigning
      $selectedTimelines = $selectedTimelines;
    }}
    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
  />
  <span class="text-gray-700">{name}</span>
</label>
```

### Color Selection

```svelte
<div class="mt-4 p-3 border rounded bg-gray-50">
  <h5 class="text-sm font-medium mb-2">Select Color for {PARALLEL_TIMELINES[activeColorTimeline]?.name}</h5>
  <div class="grid grid-cols-5 gap-2">
    {#each Object.entries(TIMELINE_COLORS) as [colorClass, colorName]}
      <button 
        class={`w-8 h-8 rounded cursor-pointer hover:opacity-80 ${colorClass}`}
        title={colorName}
        on:click={() => selectColor(colorClass)}
      >
      </button>
    {/each}
  </div>
</div>
```

### Group Naming

```svelte
<!-- Group Name Selection -->
<div class="mb-6">
  <h4 class="text-md font-medium text-gray-800 mb-2">Select Group Type</h4>
  <div class="grid grid-cols-2 gap-2">
    {#each Object.entries(DEFAULT_PARALLEL_NAMES) as [key, name]}
      <label class="flex items-center p-2 border rounded hover:bg-blue-50 cursor-pointer {$parallelGroupName === name ? 'bg-blue-100 border-blue-400' : 'border-gray-300'}">
        <input 
          type="radio" 
          name="groupType" 
          value={name} 
          checked={$parallelGroupName === name}
          on:change={() => {
            $parallelGroupName = name;
            if (name === DEFAULT_PARALLEL_NAMES.CUSTOM) {
              isCustomSelected = true;
            } else {
              isCustomSelected = false;
            }
          }}
          class="hidden"
        />
        <span>{name}</span>
      </label>
    {/each}
  </div>
  
  <!-- Custom Group Name -->
  {#if isCustomSelected}
    <input 
      type="text" 
      bind:value={$parallelGroupName} 
      placeholder="Enter custom group name" 
      class="mt-2 p-2 w-full border border-gray-300 rounded"
    />
  {/if}
</div>
```

## Mobile Responsive Implementation

The timeline system adjusts its layout for mobile devices through media queries:

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

### Timeline Configuration Persistence

**Challenge**: Maintaining timeline configuration across page reloads and plan edits.  
**Solution**: Multiple persistent data attributes in both item objects and DOM elements.

### Timeline Duration Mismatches

**Challenge**: Timeline durations becoming unbalanced through item edits.  
**Solution**: Duration mismatch detection and warning system with toast notifications.

### Color System Integration

**Challenge**: Applying consistent colors across different views and components.  
**Solution**: Centralized color management through the sectionsStore with reactive updates.

### Performance with Large Timeline Groups

**Challenge**: Slow re-rendering with large numbers of timeline items.  
**Solution**: Memoization pattern for duration calculations to prevent unnecessary recalculations.