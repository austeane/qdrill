# Parallel Timeline Improvements

This document outlines the improvements made to support parallel timelines in practice plans, enabling coaches to schedule different activities for different position groups simultaneously.

## Overview

Parallel timelines allow practice plans to have multiple activities happening at the same time for different groups of players (e.g., Beaters doing one drill while Chasers do another).

## Implementation Changes

### 1. Fixed Parallel Timeline API Bug

**Problem**: The API was overwriting `parallel_timeline` values with `parallel_group_id`, causing timeline labels to be lost.

**Solution**: Modified `/api/practice-plans/+server.js` to preserve parallel_timeline values:

```javascript
// Before (incorrect)
item.parallel_timeline = item.parallel_group_id;

// After (correct)
if (!item.parallel_timeline) {
    item.parallel_timeline = item.parallel_group_id;
}
```

### 2. Added Formation Support to Practice Plans

**Problem**: Practice plans could only include drills, not tactical formations.

**Implementation**:
- Added `formation_id` column to `practice_plan_drills` table
- Updated validation schema to accept 'formation' as a valid type
- Modified practice plan service to handle formation items in all CRUD operations
- Updated `formatDrillItem` to properly format formation data

**Database Migration**:
```sql
ALTER TABLE practice_plan_drills
ADD COLUMN formation_id INTEGER REFERENCES formations(id) ON DELETE CASCADE;

ALTER TABLE practice_plan_drills
DROP CONSTRAINT IF EXISTS practice_plan_drills_type_check;

ALTER TABLE practice_plan_drills
ADD CONSTRAINT practice_plan_drills_type_check
CHECK (type IN ('drill', 'break', 'activity', 'formation'));
```

### 3. Created Parallel Activity Components

**New Components**:

#### ParallelActivityCreator.svelte
A user-friendly interface for creating parallel activities:
- Select position groups for each activity
- Choose appropriate drills for each group
- Set durations independently
- Visual feedback showing which positions are involved

#### ParallelTimelineView.svelte
A visual timeline component that clearly shows:
- Parallel activities in separate lanes
- Timeline labels with position-specific colors
- Start times and durations
- Clear distinction between parallel and sequential activities

## Usage Examples

### Creating Parallel Activities via API

```javascript
const parallelActivities = [
    {
        type: "drill",
        drill_id: 156,
        duration: 15,
        parallel_group_id: "group_1330",
        parallel_timeline: "BEATERS",
        groupTimelines: ["BEATERS"],
        name: "Beating Progression"
    },
    {
        type: "drill",
        drill_id: 157,
        duration: 15,
        parallel_group_id: "group_1330", // Same group ID
        parallel_timeline: "CHASERS",
        groupTimelines: ["CHASERS"],
        name: "Fast Break Drill"
    }
];
```

### Using the ParallelActivityCreator Component

```svelte
<script>
import ParallelActivityCreator from '$lib/components/practice-plan/ParallelActivityCreator.svelte';

function handleParallelItems(event) {
    const { items, sectionIndex } = event.detail;
    // Add items to the appropriate section
    sections[sectionIndex].items.push(...items);
}
</script>

<ParallelActivityCreator
    availableDrills={drills}
    sectionIndex={0}
    on:addParallelItems={handleParallelItems}
/>
```

### Visualizing Parallel Timelines

```svelte
<script>
import ParallelTimelineView from '$lib/components/practice-plan/ParallelTimelineView.svelte';
</script>

<ParallelTimelineView
    items={section.items}
    sectionName={section.name}
    showTimeline={true}
/>
```

## Best Practices

### 1. Consistent Group IDs
Always use the same `parallel_group_id` for activities that happen simultaneously:
```javascript
const groupId = `parallel_${Date.now()}`;
// Use this same groupId for all parallel items
```

### 2. Clear Timeline Labels
Use standardized timeline labels:
- `BEATERS` - Beater-specific activities
- `CHASERS` - Chaser-specific activities
- `KEEPERS` - Keeper-specific activities
- `SEEKERS` - Seeker-specific activities
- `CHASERS/KEEPERS` - Combined group activities
- `ALL` - Full team activities

### 3. Duration Consistency
For parallel activities, consider using the same duration to keep the practice synchronized:
```javascript
const duration = 15; // Same for all parallel activities
```

### 4. Formation Integration
Formations can be scheduled just like drills:
```javascript
{
    type: "formation",
    formation_id: 10,
    duration: 10,
    name: "Aggressive Zone Defense Setup"
}
```

## UI/UX Improvements

### Visual Indicators
- Color-coded timeline labels for different position groups
- Clear separation between parallel and sequential activities
- Visual timeline showing start times and durations

### Creation Workflow
1. Click "Create Parallel Activities" button
2. Select position groups for each activity
3. Choose appropriate drills (filtered by position)
4. Set durations
5. Save to add all activities at once

### Validation
- Requires at least 2 activities with different timelines
- Prevents saving incomplete parallel groups
- Shows only position-appropriate drills

## Future Enhancements

1. **Drag-and-Drop Support**: Enable dragging items between parallel timelines
2. **Conflict Detection**: Warn if a player position is scheduled for multiple activities
3. **Auto-Duration**: Suggest durations based on drill recommendations
4. **Timeline Templates**: Save common parallel activity patterns for reuse
5. **Mobile Optimization**: Improve timeline visualization on mobile devices

## Troubleshooting

### Common Issues

1. **Parallel activities not showing separately**
   - Ensure all items have the same `parallel_group_id`
   - Verify `parallel_timeline` is set for each item
   - Check that `groupTimelines` array matches the timeline

2. **Formation not appearing**
   - Verify formation exists in database
   - Ensure `type: "formation"` is set
   - Check that `formation_id` is valid

3. **Timeline labels missing**
   - Ensure `parallel_timeline` is not being overwritten
   - Verify the timeline value matches expected options

### Debug Tips

```javascript
// Log parallel structure
console.log('Parallel items:', items.filter(i => i.parallel_group_id));

// Verify group consistency
const groups = {};
items.forEach(item => {
    if (item.parallel_group_id) {
        groups[item.parallel_group_id] = groups[item.parallel_group_id] || [];
        groups[item.parallel_group_id].push(item);
    }
});
console.log('Parallel groups:', groups);
```