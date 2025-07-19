# Converting Markdown Practice Plans to QDrill

This guide explains how to convert practice plans written in markdown format into QDrill's digital practice plan system.

## Overview

QDrill can transform traditional text-based practice plans into interactive, digital practice plans with proper timeline management, drill linking, and parallel activity support.

## Process Overview

### 1. Analyze the Markdown Practice Plan

First, analyze the structure of your markdown practice plan:

- Identify sections (warmup, main activities, cool down)
- Note timing information
- Identify parallel activities (different groups doing different things simultaneously)
- List all drills mentioned
- Note any defensive/offensive formations

### 2. Create Required Drills

Before creating the practice plan, ensure all referenced drills exist in the system:

```python
# Example: Creating drills via API
drills_to_create = [
    {
        "name": "Arkansas",
        "brief_description": "1.5 offense/defense fundamentals",
        "skill_level": ["Advanced"],
        "complexity": "High",
        "suggested_length": {"min": 15, "max": 15},
        "skills_focused_on": ["Offense", "Defense", "Blocking"],
        "positions_focused_on": ["Beater", "Chaser"],
        "number_of_people": {"min": 12, "max": 18}
    }
]

# POST to /api/drills for each drill
```

### 3. Create Required Formations

If the practice plan references tactical formations:

```python
formations_to_create = [
    {
        "name": "Aggressive Zone Defense",
        "description": "High-pressure defensive formation with beaters pushed up",
        "type": "defense",
        "positions": {
            "beaters": "Pushed high, aggressive positioning",
            "keeper": "High position, ready to intercept",
            "chasers": "Zone coverage with pressure"
        }
    }
]

# POST to /api/formations for each formation
```

### 4. Structure the Practice Plan

Convert the markdown structure into QDrill's practice plan format:

```python
practice_plan = {
    "name": "Team Practice - May 31",
    "description": "Focus on defensive formations and fast breaks",
    "practice_goals": ["Defense", "Tactics", "Conditioning"],
    "phase_of_season": "In-Season",
    "estimated_number_of_participants": 18,
    "visibility": "public",
    "sections": []
}
```

### 5. Handle Parallel Activities

QDrill supports parallel timelines for different position groups. When you have activities happening simultaneously:

```python
# Example: Beaters and Chasers doing different drills at 13:30
parallel_items = [
    {
        "type": "drill",
        "drill_id": 123,  # Beater-specific drill
        "duration": 15,
        "parallel_group_id": "group_1330",
        "parallel_timeline": "BEATERS",
        "groupTimelines": ["BEATERS"]
    },
    {
        "type": "drill",
        "drill_id": 124,  # Chaser-specific drill
        "duration": 15,
        "parallel_group_id": "group_1330",
        "parallel_timeline": "CHASERS",
        "groupTimelines": ["CHASERS"]
    }
]
```

### 6. Complete Practice Plan Structure

Here's a complete example converting a markdown practice plan:

```python
# Original Markdown:
# 13:00-13:15 - Warmup: Dodgeball
# 13:15-13:30 - Arkansas Drill (All positions)
# 13:30-13:45 - Split practice:
#   - Beaters: Beating progression
#   - Chasers: Fast break drill
# 13:45-14:00 - Formation: Aggressive Zone Defense

# Converted to QDrill:
practice_plan = {
    "name": "Team Practice - May 31",
    "sections": [
        {
            "name": "Warmup",
            "order": 0,
            "items": [
                {
                    "type": "drill",
                    "drill_id": 100,  # Dodgeball drill ID
                    "duration": 15,
                    "name": "Dodgeball Warmup"
                }
            ]
        },
        {
            "name": "Skills Development",
            "order": 1,
            "items": [
                {
                    "type": "drill",
                    "drill_id": 155,  # Arkansas drill ID
                    "duration": 15,
                    "name": "Arkansas - Full Team"
                },
                # Parallel activities
                {
                    "type": "drill",
                    "drill_id": 156,  # Beating progression ID
                    "duration": 15,
                    "parallel_group_id": "split_1330",
                    "parallel_timeline": "BEATERS",
                    "groupTimelines": ["BEATERS"],
                    "name": "Beating Progression"
                },
                {
                    "type": "drill",
                    "drill_id": 157,  # Fast break drill ID
                    "duration": 15,
                    "parallel_group_id": "split_1330",
                    "parallel_timeline": "CHASERS",
                    "groupTimelines": ["CHASERS"],
                    "name": "Fast Break Drill"
                }
            ]
        },
        {
            "name": "Tactical Work",
            "order": 2,
            "items": [
                {
                    "type": "formation",
                    "formation_id": 10,  # Aggressive Zone Defense ID
                    "duration": 15,
                    "name": "Aggressive Zone Defense Setup"
                }
            ]
        }
    ]
}
```

## API Implementation

### Creating the Practice Plan

```python
import requests

# POST to create the practice plan
response = requests.post(
    "http://localhost:3000/api/practice-plans",
    json=practice_plan
)

if response.status_code == 201:
    plan_id = response.json()['id']
    print(f"Created practice plan: {plan_id}")
```

### Supported Item Types

1. **drill**: Links to an existing drill in the database
   - Requires: `drill_id`
2. **formation**: Links to a tactical formation
   - Requires: `formation_id`
3. **break**: Water/rest break
   - No ID required
4. **activity**: One-off activity not in drill database
   - No ID required, uses `name` field

## Tips for Conversion

1. **Preserve Timing**: Maintain accurate duration for each activity
2. **Use Parallel Timelines**: When groups split, use matching `parallel_group_id`
3. **Label Timelines**: Use clear labels like "BEATERS", "CHASERS", "KEEPERS"
4. **Section Organization**: Group related activities into logical sections
5. **Maintain Order**: Items execute in the order specified within each section

## Common Patterns

### Positional Splits

```python
# When positions do different activities
items = [
    {
        "type": "drill",
        "drill_id": 101,
        "duration": 20,
        "parallel_group_id": "split_1400",
        "parallel_timeline": "BEATERS",
        "groupTimelines": ["BEATERS"]
    },
    {
        "type": "drill",
        "drill_id": 102,
        "duration": 20,
        "parallel_group_id": "split_1400",
        "parallel_timeline": "CHASERS/KEEPERS",
        "groupTimelines": ["CHASERS", "KEEPERS"]
    }
]
```

### Progressive Drills

```python
# Building complexity through a sequence
items = [
    {"type": "drill", "drill_id": 201, "duration": 10, "name": "Basic Passing"},
    {"type": "drill", "drill_id": 202, "duration": 10, "name": "Passing with Movement"},
    {"type": "drill", "drill_id": 203, "duration": 15, "name": "Passing Under Pressure"}
]
```

### Formation Practice

```python
# Combining formations with drills
items = [
    {"type": "formation", "formation_id": 10, "duration": 5, "name": "Setup Formation"},
    {"type": "drill", "drill_id": 301, "duration": 15, "name": "Practice Formation Movement"},
    {"type": "formation", "formation_id": 11, "duration": 5, "name": "Transition to New Formation"}
]
```

## Validation

After creating a practice plan, verify:

1. Total duration matches expected practice length
2. Parallel activities show in separate timelines
3. All drills and formations are properly linked
4. Section organization is logical
5. Timeline labels are clear and consistent

## Future Enhancements

The system is designed to support:

- Automated markdown parsing
- AI-assisted drill creation from descriptions
- Time optimization suggestions
- Formation diagram integration
- Export back to markdown format
