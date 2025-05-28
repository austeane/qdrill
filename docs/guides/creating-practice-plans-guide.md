# Complete Guide to Creating Practice Plans in QDrill

This guide provides step-by-step instructions for creating practice plans in QDrill, whether through the UI or API.

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

Parallel activities allow different position groups to do different drills simultaneously.

### Key Concepts

1. **parallel_group_id**: Unique identifier for activities happening at the same time
2. **parallel_timeline**: Label for the timeline (e.g., "BEATERS", "CHASERS")
3. **groupTimelines**: Array of positions involved

### Example: Split Practice

```javascript
// Beaters do beating progression
{
  "type": "drill",
  "drill_id": 161,
  "duration": 20,
  "parallel_group_id": "split_1330",
  "parallel_timeline": "BEATERS",
  "groupTimelines": ["BEATERS"]
}

// Chasers do passing drill (same time)
{
  "type": "drill",
  "drill_id": 162,
  "duration": 20,
  "parallel_group_id": "split_1330",  // Same ID
  "parallel_timeline": "CHASERS",
  "groupTimelines": ["CHASERS"]
}
```

### Timeline Labels

Standard labels to use:
- `BEATERS` - Beater-only activities
- `CHASERS` - Chaser-only activities
- `KEEPERS` - Keeper-only activities  
- `SEEKERS` - Seeker-only activities
- `CHASERS/KEEPERS` - Combined group
- `ALL` - Everyone together

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
13:30-13:45 - Split:
  - Beaters: Beating progression
  - Chasers: Fast breaks
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
        {"type": "drill", "drill_id": 155, "duration": 15},
        // Parallel activities
        {
          "type": "drill",
          "drill_id": 161,
          "duration": 15,
          "parallel_group_id": "split_1",
          "parallel_timeline": "BEATERS",
          "groupTimelines": ["BEATERS"]
        },
        {
          "type": "drill",
          "drill_id": 159,
          "duration": 15,
          "parallel_group_id": "split_1",
          "parallel_timeline": "CHASERS",
          "groupTimelines": ["CHASERS"]
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
- Ensure all position groups are accounted for
- Consider using same duration for parallel activities
- Label timelines clearly

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
   - Verify `parallel_timeline` is set for each item
   - Check that `groupTimelines` array is properly formatted

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