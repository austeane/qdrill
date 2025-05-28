# Complete Guide to Creating Practice Plans in QDrill

This guide provides step-by-step instructions for creating practice plans in QDrill, whether through the UI or API.

> **Important Update (2025)**: QDrill now supports position-based filtering with integrated parallel activities throughout the practice. This guide has been updated to reflect these changes.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Understanding Practice Plan Structure](#understanding-practice-plan-structure)
3. [Creating Plans via UI](#creating-plans-via-ui)
4. [Creating Plans via API](#creating-plans-via-api)
5. [Working with Parallel Activities](#working-with-parallel-activities)
6. [Including Formations](#including-formations)
7. [Converting from Markdown](#converting-from-markdown)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

Before creating a practice plan, ensure you have:
1. Created all necessary drills in the system
2. Created any formations you want to include
3. Decided on the practice structure and timing
4. Identified any parallel activities (different groups doing different things)

## Understanding Practice Plan Structure

A practice plan consists of:

```javascript
{
  // Metadata
  "name": "Practice Plan Name",
  "description": "What this practice focuses on",
  "practice_goals": ["Goal 1", "Goal 2"],
  "phase_of_season": "In-Season",
  "estimated_number_of_participants": 18,
  "visibility": "public",
  
  // Sections (major parts of practice)
  "sections": [
    {
      "name": "Warmup",
      "order": 0,
      "items": [
        // Individual activities
      ]
    }
  ]
}
```

### Item Types

1. **Drill** - Links to existing drill in database
   ```javascript
   {
     "type": "drill",
     "drill_id": 123,
     "duration": 15,
     "name": "Optional override name"
   }
   ```

2. **Formation** - Links to tactical formation
   ```javascript
   {
     "type": "formation",
     "formation_id": 10,
     "duration": 10,
     "name": "Formation Setup"
   }
   ```

3. **Break** - Water/rest break
   ```javascript
   {
     "type": "break",
     "duration": 5,
     "name": "Water Break"
   }
   ```

4. **Activity** - One-off activity not in database
   ```javascript
   {
     "type": "activity",
     "duration": 10,
     "name": "Custom Activity"
   }
   ```

## Creating Plans via UI

### Using the Wizard (Recommended)

1. Navigate to **Practice Plans** → **Create New**
2. Choose **Use Wizard**
3. Follow the steps:
   - **Basic Info**: Name, goals, participant count
   - **Sections**: Define major parts of practice
   - **Timeline**: Set duration for each section
   - **Drills**: Add drills to each section
   - **Review**: Verify and create

### Direct Form Creation

1. Navigate to **Practice Plans** → **Create New**
2. Fill in basic information
3. Add sections manually
4. Add items to each section
5. Save the plan

## Creating Plans via API

### Basic Example

```python
import requests

plan = {
    "name": "Tuesday Team Practice",
    "description": "Focus on defensive skills",
    "practice_goals": ["Defense", "Conditioning"],
    "phase_of_season": "In-Season",
    "estimated_number_of_participants": 18,
    "visibility": "public",
    "sections": [
        {
            "name": "Warmup",
            "order": 0,
            "items": [
                {
                    "type": "drill",
                    "drill_id": 100,  # Dodgeball
                    "duration": 15
                }
            ]
        }
    ]
}

response = requests.post(
    "http://localhost:3000/api/practice-plans",
    json=plan
)
```

### Using the Template Script

1. Copy `/scripts/practice-plan-conversion/create_practice_plan_template.py`
2. Update drill and formation IDs
3. Modify the practice structure
4. Run: `python your_practice_plan.py`

## Working with Parallel Activities

Parallel activities allow different position groups to do different drills simultaneously. With the new position-based filtering, users can view any combination of positions to see their specific activities.

### Key Concepts

1. **parallel_group_id**: Unique identifier for activities happening at the same time
2. **parallel_timeline**: Position label (must be "BEATERS", "CHASERS", or "SEEKERS")
3. **group_timelines**: Array of all positions involved in that time block

### Position-Based Filtering

The practice plan viewer now includes a position filter that allows users to:
- **Select single position**: See a linear view of just that position's activities
- **Select multiple positions**: See parallel activities when selected positions differ
- **Select all positions**: See the complete practice with all parallel activities

### Example: Integrated Position Activities

```javascript
// All three positions working in parallel during drills section
{
  "name": "Drills (13:30)",
  "items": [
    // Beaters activities
    {
      "type": "drill",
      "drill_id": 161,
      "duration": 15,
      "name": "Arkansas",
      "parallel_group_id": "drill_time_1",
      "parallel_timeline": "BEATERS",
      "group_timelines": ["BEATERS", "CHASERS", "SEEKERS"]
    },
    {
      "type": "drill",
      "drill_id": 162,
      "duration": 15,
      "name": "Third-Courts",
      "parallel_group_id": "drill_time_1",
      "parallel_timeline": "BEATERS",
      "group_timelines": ["BEATERS", "CHASERS", "SEEKERS"]
    },
    // Chasers activity (same time)
    {
      "type": "drill",
      "drill_id": 163,
      "duration": 30,
      "name": "4 on 4 no beaters",
      "parallel_group_id": "drill_time_1",
      "parallel_timeline": "CHASERS",
      "group_timelines": ["BEATERS", "CHASERS", "SEEKERS"]
    },
    // Seekers activities (same time)
    {
      "type": "drill",
      "drill_id": 164,
      "duration": 10,
      "name": "Claw drill",
      "parallel_group_id": "drill_time_1",
      "parallel_timeline": "SEEKERS",
      "group_timelines": ["BEATERS", "CHASERS", "SEEKERS"]
    },
    {
      "type": "drill",
      "drill_id": 165,
      "duration": 10,
      "name": "Leg load and dive",
      "parallel_group_id": "drill_time_1",
      "parallel_timeline": "SEEKERS",
      "group_timelines": ["BEATERS", "CHASERS", "SEEKERS"]
    },
    {
      "type": "drill",
      "drill_id": 166,
      "duration": 10,
      "name": "Full dive",
      "parallel_group_id": "drill_time_1",
      "parallel_timeline": "SEEKERS",
      "group_timelines": ["BEATERS", "CHASERS", "SEEKERS"]
    }
  ]
}
```

### Timeline Labels

**Required position labels** (use exactly these values):
- `BEATERS` - Beater-specific activities
- `CHASERS` - Chaser-specific activities
- `SEEKERS` - Seeker-specific activities

**Important**: 
- Do NOT create separate sections for individual positions (e.g., "Seeker Track")
- Instead, integrate position-specific activities as parallel timelines within main sections
- Activities without a `parallel_timeline` are assumed to be for all positions

## Including Formations

Formations represent tactical setups (defensive or offensive positions).

### Adding a Formation

```javascript
{
  "type": "formation",
  "formation_id": 10,  // ID from formations table
  "duration": 10,
  "name": "Aggressive Zone Defense"
}
```

### Typical Pattern

1. Add formation to show the setup (5-10 min)
2. Follow with drill that practices the formation (15-20 min)
3. Optionally add another formation to show transitions

## Converting from Markdown

### Step-by-Step Process

1. **Analyze the markdown plan**
   - Identify all drills mentioned
   - Note timing and duration
   - Find parallel activities (e.g., "Beaters: X, Chasers: Y")
   - List formations or tactical elements

2. **Create missing drills**
   ```python
   # Use the API or UI to create drills
   drill_data = {
       "name": "New Drill Name",
       "brief_description": "Quick description",
       "skill_level": ["Intermediate"],
       "complexity": "Medium",
       "suggested_length": {"min": 15, "max": 20}
   }
   ```

3. **Map the structure**
   - Convert time blocks to sections
   - Convert activities to appropriate item types
   - Handle splits as parallel activities

4. **Use the conversion scripts**
   - See `/scripts/practice-plan-conversion/` for examples
   - Follow the pattern in `create_practice_plan_template.py`

### Example Conversion

**Markdown:**
```
13:00-13:15 - Warmup: Dodgeball
13:15-13:30 - Arkansas Drill
13:30-14:00 - Position-specific work:
  - Beaters: Beating progression (30 min)
  - Chasers: Fast breaks (30 min)
  - Seekers: Catching drills + 1v1 (30 min)
```

**QDrill Structure:**
```javascript
{
  "sections": [
    {
      "name": "Warmup",
      "items": [
        {"type": "drill", "drill_id": 100, "duration": 15}
      ]
    },
    {
      "name": "Skills",
      "items": [
        {"type": "drill", "drill_id": 155, "duration": 15}
      ]
    },
    {
      "name": "Position-Specific Training",
      "items": [
        // All three positions work in parallel
        {
          "type": "drill",
          "drill_id": 161,
          "duration": 30,
          "name": "Beating progression",
          "parallel_group_id": "position_work_1",
          "parallel_timeline": "BEATERS",
          "group_timelines": ["BEATERS", "CHASERS", "SEEKERS"]
        },
        {
          "type": "drill",
          "drill_id": 159,
          "duration": 30,
          "name": "Fast breaks",
          "parallel_group_id": "position_work_1",
          "parallel_timeline": "CHASERS",
          "group_timelines": ["BEATERS", "CHASERS", "SEEKERS"]
        },
        {
          "type": "drill",
          "drill_id": 164,
          "duration": 15,
          "name": "Catching drills",
          "parallel_group_id": "position_work_1",
          "parallel_timeline": "SEEKERS",
          "group_timelines": ["BEATERS", "CHASERS", "SEEKERS"]
        },
        {
          "type": "drill",
          "drill_id": 165,
          "duration": 15,
          "name": "1v1 with snitch",
          "parallel_group_id": "position_work_1",
          "parallel_timeline": "SEEKERS",
          "group_timelines": ["BEATERS", "CHASERS", "SEEKERS"]
        }
      ]
    }
  ]
}
```

## Best Practices

### 1. Plan Organization
- Use clear, descriptive section names
- Order sections logically (warmup → skills → tactics → conditioning → cooldown)
- Include breaks between intense activities
- Keep total duration reasonable (90-120 minutes)

### 2. Parallel Activities
- Always use the same `parallel_group_id` for simultaneous activities
- Use only "BEATERS", "CHASERS", or "SEEKERS" for `parallel_timeline`
- Include all involved positions in `group_timelines` array
- Integrate position-specific work throughout practice (not as separate sections)
- Consider total duration when positions have different length activities

### 3. Naming Conventions
- Sections: "Warmup", "Technical Skills", "Tactical Work", "Conditioning", "Cool Down"
- Parallel group IDs: `split_<time>` or `parallel_<sequence>`
- Be consistent with timeline labels

### 4. Duration Guidelines
- Warmup: 15-20 minutes
- Main activities: 15-30 minutes each
- Breaks: 5-10 minutes
- Cool down: 10-15 minutes
- Formations: 5-10 minutes to set up

### 5. Data Management
- Keep a record of commonly used drill IDs
- Document special drills or formations
- Save successful practice plan templates

## Troubleshooting

### Common Issues

1. **Parallel activities not displaying correctly**
   - Ensure all items have the same `parallel_group_id`
   - Verify `parallel_timeline` uses exact values: "BEATERS", "CHASERS", or "SEEKERS"
   - Check that `group_timelines` array includes all positions involved
   - Don't create separate sections for individual positions

2. **Formation not appearing**
   - Verify formation exists in database
   - Ensure `type: "formation"` is set correctly
   - Check formation_id is valid

3. **API errors**
   - Check all required fields are present
   - Verify drill/formation IDs exist
   - Ensure proper JSON formatting
   - Check authentication if required

### Debug Tips

```python
# Log the structure before sending
print(json.dumps(practice_plan_data, indent=2))

# Check specific sections
for section in plan['sections']:
    print(f"Section: {section['name']}")
    for item in section['items']:
        print(f"  - {item.get('name', 'Unnamed')} ({item['type']})")
```

## Advanced Features

### Position Filter Usage

The practice plan viewer includes a position filter that enhances the viewing experience:

```javascript
// Example: How different filter selections affect the view

// With all positions selected (default):
// - Shows complete practice with parallel activities in separate timelines
// - Beaters, Chasers, and Seekers activities shown side-by-side when parallel

// With only "Chasers" selected:
// - Shows linear view of only chaser activities
// - Parallel grouping is removed - just a simple timeline
// - Other positions' activities are hidden

// With "Chasers" and "Beaters" selected:
// - Shows parallel activities when these two groups differ
// - Seeker activities are hidden
// - Useful for coaches focusing on field players
```

### Creating Position-Aware Practice Plans

When creating practice plans, consider how they'll appear with different filter combinations:

```python
def create_position_aware_section(drill_map):
    """Create a section with integrated position activities"""
    return {
        "name": "Technical Skills",
        "items": [
            # Activities for all positions (no parallel_timeline)
            {
                "type": "drill",
                "drill_id": drill_map["team_warmup"],
                "duration": 10,
                "name": "Team Warmup"
            },
            # Position-specific parallel activities
            {
                "type": "drill",
                "drill_id": drill_map["beater_drill"],
                "duration": 20,
                "parallel_group_id": "tech_1",
                "parallel_timeline": "BEATERS",
                "group_timelines": ["BEATERS", "CHASERS", "SEEKERS"]
            },
            {
                "type": "drill",
                "drill_id": drill_map["chaser_drill"],
                "duration": 20,
                "parallel_group_id": "tech_1",
                "parallel_timeline": "CHASERS",
                "group_timelines": ["BEATERS", "CHASERS", "SEEKERS"]
            },
            {
                "type": "drill",
                "drill_id": drill_map["seeker_drill"],
                "duration": 20,
                "parallel_group_id": "tech_1",
                "parallel_timeline": "SEEKERS",
                "group_timelines": ["BEATERS", "CHASERS", "SEEKERS"]
            }
        ]
    }
```

### Dynamic Duration Calculation

```python
def calculate_total_duration(plan):
    """Calculate total practice duration accounting for parallel activities"""
    total = 0
    for section in plan['sections']:
        processed_groups = set()
        for item in section['items']:
            group_id = item.get('parallel_group_id')
            if group_id:
                if group_id not in processed_groups:
                    # Only count once per parallel group
                    total += item['duration']
                    processed_groups.add(group_id)
            else:
                # Non-parallel item
                total += item['duration']
    return total
```

### Template Variables

```python
# Create reusable templates
STANDARD_WARMUP = [
    {"type": "break", "duration": 5, "name": "Dynamic Stretching"},
    {"type": "drill", "drill_id": 100, "duration": 15, "name": "Dodgeball"}
]

POSITION_SPLIT_TEMPLATE = {
    "beaters": {"drill_id": 161, "name": "Beating Progression"},
    "chasers": {"drill_id": 162, "name": "Passing Patterns"},
    "keepers": {"drill_id": 159, "name": "Keeper Movement"}
}
```

## Resources

- **Example Scripts**: `/scripts/practice-plan-conversion/`
- **API Documentation**: `/docs/implementation/`
- **Component Documentation**: `/src/lib/components/practice-plan/`
- **Example Practice Plans**: `/examples/practice-plans/`

## Next Steps

1. Start with a simple practice plan
2. Add complexity gradually (parallel activities, formations)
3. Save successful templates for reuse
4. Share plans with team for feedback
5. Iterate and improve based on actual practice results