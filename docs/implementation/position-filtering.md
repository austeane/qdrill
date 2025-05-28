# Position-Based Filtering Implementation

This document describes the position-based filtering system for practice plans implemented in QDrill.

## Overview

The position filtering system allows users to view practice plans from the perspective of specific positions (Chasers, Beaters, Seekers) or any combination thereof. This enhances the user experience by providing focused views for position-specific coaching and player reference.

## Components

### 1. PositionFilter Component
**Location**: `/src/lib/components/practice-plan/PositionFilter.svelte`

A filter control that allows users to select which positions to view:
- Checkbox-style interface for selecting positions
- Dynamic detection of available positions from practice plan data
- Visual feedback with position-specific colors
- "Select All" quick action

### 2. Practice Plan Viewer Updates
**Location**: `/src/routes/practice-plans/[id]/+page.svelte`

The viewer implements filtering logic:
- `filterSectionsByPositions()` - Filters practice plan sections based on selected positions
- Single position view removes parallel grouping for linear display
- Multiple position view preserves parallel activities
- Maintains section timing calculations

### 3. Visual Indicators
**Location**: `/src/routes/practice-plans/viewer/DrillCard.svelte`

Position badges on drill cards:
- Color-coded badges (Blue: Chasers, Red: Beaters, Green: Seekers)
- Shows which position each activity is for
- Integrated into the drill card header

## Database Schema

No database changes were required. The system uses existing fields:
- `parallel_timeline` - Indicates which position the activity is for
- `parallel_group_id` - Groups simultaneous activities
- `group_timelines` - Array of all positions involved in a time block

## Position Values

Standard position identifiers:
- `CHASERS` - Chaser-specific activities
- `BEATERS` - Beater-specific activities  
- `SEEKERS` - Seeker-specific activities

Activities without a `parallel_timeline` are considered for all positions.

## Filtering Logic

### Single Position Selected
When only one position is selected:
1. Show only activities for that position or activities for all
2. Remove parallel grouping indicators
3. Display as a linear timeline
4. Hide activities for other positions

### Multiple Positions Selected
When multiple positions are selected:
1. Show activities for selected positions
2. Preserve parallel grouping where positions differ
3. Hide activities for unselected positions
4. Maintain timing relationships

### All Positions Selected (Default)
Shows the complete practice plan with all parallel activities visible.

## Implementation Details

### Filter State Management
```javascript
// Position filter state in practice plan viewer
let selectedPositions = ['CHASERS', 'BEATERS', 'SEEKERS'];

// Filter change handler
function handlePositionFilterChange(event) {
    selectedPositions = event.detail.selectedPositions;
}
```

### Filtering Algorithm
```javascript
function filterSectionsByPositions(sections, positions) {
    // If all positions selected, return original
    if (positions.length === 3) {
        return sections;
    }
    
    return sections.map(section => {
        const filteredItems = section.items.filter(item => {
            // Items without parallel_timeline are for everyone
            if (!item.parallel_timeline) {
                return true;
            }
            // Check if item's timeline matches selected positions
            return positions.includes(item.parallel_timeline);
        });
        
        // Single position view: remove parallel grouping
        if (positions.length === 1) {
            const processedItems = filteredItems.map(item => ({
                ...item,
                parallel_group_id: null,
                parallel_timeline: null,
                group_timelines: null
            }));
            return { ...section, items: processedItems };
        }
        
        return { ...section, items: filteredItems };
    }).filter(section => section.items.length > 0);
}
```

## User Experience

### Filter Control
- Located below practice plan header, above timeline
- Persists during scrolling for easy access
- Clear visual feedback for selected positions
- Informative text showing current view mode

### Visual Feedback
- Position badges on drill cards
- Color coding for quick identification
- Filtered state indication
- Smooth transitions when changing filters

### Mobile Optimization
- Responsive button layout
- Touch-friendly tap targets
- Maintains functionality on small screens

## Best Practices

### For Developers
1. Always use exact position values (CHASERS, BEATERS, SEEKERS)
2. Include all positions in group_timelines when creating parallel activities
3. Test filter combinations during development
4. Consider how activities appear in different filter states

### For Content Creators
1. Integrate position-specific activities throughout practice
2. Don't create separate sections for individual positions
3. Use parallel activities to show simultaneous position work
4. Ensure all positions have meaningful activities

## Future Enhancements

Potential improvements to consider:
1. Save filter preferences per user
2. Add keyboard shortcuts for filter toggling
3. Export filtered views for printing
4. Add position-specific timing totals
5. Include keeper-specific activities when the sport adds that position

## Migration Notes

The 2025 update integrated seekers throughout practice plans instead of having them as a separate section at the end. Scripts were created to:
1. Move seeker activities from "Seeker Track" sections
2. Set appropriate parallel_timeline values
3. Group activities with proper parallel_group_id
4. Remove empty seeker-only sections

See `/scripts/integrate_seekers_practice_plan.py` for the migration logic.