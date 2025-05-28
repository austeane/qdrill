# 2025 GTA May 31 Practice Plan - QDrill Implementation Analysis

## Overview

This document analyzes the [2025 GTA May 31 Practice Plan](../../2025%20GTA%20May%20031%20Practice%20Plan.md) and provides a comprehensive plan for implementing it in QDrill using existing API endpoints and identifying required new functionality.

**Related Files:**
- Source: `2025 GTA May 31 Practice Plan.md`
- Implementation Guides: 
  - `docs/guides/llm_creating_drills.md`
  - `docs/guides/llm_creating_practice_plans.md`
- Ticket: `tickets/llm-practice-plan-tools.md`
- Creation Scripts: `create_drill_script.py`, `create_practice_plan_script.py`

## Database Analysis Results

### Current QDrill Content

**Existing Drills (77 total):** Key drills relevant to this practice plan:
- ✅ **5 point star** (id: 62) - "Passing warmup drill"
- ✅ **Passing to cutters** (id: 131) - "Progressive drill to pass to cutting chasers"
- ✅ **Passing to cutters - 4 point** (id: 138) - "Passing to cutters from different areas"
- ✅ **4 on 4 no beaters** (id: 130) - "Need to score in set time on no bludgers"
- ✅ **Scrimmage** (id: 136) - "Full court scrimmage"
- ✅ **Dynamic Stretching** (id: 154) - "Basic dynamic warmup"
- ✅ **TC Warmup Part One** (id: 124) - "Team Canada's dynamic warmup"
- ✅ **TC Warmup Part Two** (id: 125) - "Team Canada's dynamic warmup, part two"

**Existing Practice Plans (5 total):**
- Team Canada February UBC Practice (id: 36) 
- East April TC Practice (id: 49)
- Team Canada February Toronto Practice (id: 38)
- Team Canada March UBC Practice (id: 43)
- Example plan (id: 30)

**Existing Formations (18 total):** Relevant formations already available:
- ✅ **2-2 D - 1 DB** (id: 8) - "Basic rotations for 2-2 defense with 1 DB"
- ✅ **Hoop D - 1 DB** (id: 6) - "Basic rotations for hoop D"
- ✅ **Box Offense vs 2-2 D** (ids: 21, 23) - "Box Offense vs 2-2 D"
- ✅ **Box Offense vs Hoop D** (ids: 17, 22, 26) - "Box Offense vs Hoop D"
- ✅ **Kite Offense vs 2-2 D** (ids: 20, 24, 25, 28, 29, 30) - "Kite Offense vs 2-2 D"
- ✅ **Kite Offense vs Hoop D** (ids: 14, 27) - "Kite Offense vs Hoop D"

## Practice Plan Structure Analysis

### Timeline Breakdown
- **12:30-13:00:** Arrival & Setup (30 min)
- **13:00-13:30:** Warmup (30 min)
- **13:30-14:00:** 1.5 offense/defense drills (30 min)
- **14:00-15:15:** Half Courts & Review (75 min including breaks)
- **15:15-16:15:** Aggressive Defense Styles (60 min)
- **16:15-17:00:** Scrimmages (45 min)
- **17:00-17:10:** Cool down (10 min)

**Parallel Seeker Track:** Runs alongside main practice with position-specific drills

### Areas of Focus
- Review offensive formations (kite and box)
- Introduce 1.5 concepts
- Review 2-2 and hoop D
- Introduce aggressive styles of defence

## Implementation Plan

### Phase 1: Create Missing Drills

**Warmup Drills to Create:**
1. **Walk backs** - Chaser warmup with push passes, overhead passes
   - Type: Warmup, Chaser-focused
   - Duration: 5-10 minutes
   - Skills: Passing, Movement

2. **Paired (1B) warm up throws** - Beater warmup progression
   - Type: Warmup, Beater-focused
   - Duration: 5-10 minutes
   - Skills: Bludger aim, Range progression

3. **All vs 1 skills** - Beater defensive skills
   - Type: Warmup, Beater-focused
   - Duration: 5-10 minutes
   - Skills: Dodge, Block, Catch, Exchange

**1.5 Concept Drills to Create:**
4. **Arkansas** - 1.5 offense/defense fundamentals
   - Type: Beater drill
   - Duration: 15 minutes
   - Description: "One defensive free beater, one offensive engage, no dodgeballs. Engage beater drives to tag hoop, free beater blocks."
   - Skills: Blocking technique, Lateral movement, 1.5 defense

5. **Third-Courts** - 1.5 timing and positioning
   - Type: Mixed drill
   - Duration: 15 minutes
   - Description: "Working through timing of 1.5 initiation. Two beaters without control on defense; two beaters with control + 2-3 chasers on offense (dunks only)"
   - Skills: 1.5 timing, Communication, Positioning

**Half Court Structure Drill to Create:**
6. **Half Courts: Review Offensive & Defensive Principles** - Structured formation practice
   - Type: Mixed drill
   - Duration: 60 minutes
   - Description: "Structured practice of kite and box offense against 2-2 and hoop defense with varying dodgeball counts"
   - Skills: Formation execution, Defensive rotations

**Seeker-Specific Drills to Create:**
7. **Claw drill** - Seeker catching progression
8. **Leg load and dive** - Seeker catching technique
9. **Full dive** - Advanced seeker catching
10. **1v1 with snitch** - Seeker positioning and moves
11. **2v1 with snitch** - Seeker competition skills

**Cool Down Activities to Create:**
12. **Cool down jog** - Post-practice recovery
13. **Static stretches and debrief** - Team discussion and flexibility

### Phase 2: Create Missing Formations

**Aggressive Defense Formations to Create:**
1. **Aggro (2-2 but aggressive)** - Aggressive 2-2 variation
   - Description: "More aggressive version of 2-2 defense, looking to use advantages over offense, forcing turnovers"
   - Duration: 10 minutes

2. **Press (start in 2-2, then aggress)** - Transitional aggressive defense
   - Description: "Half court, offense beater whiffs long beat, defense has control. Beater forces quaffle pass, chasers play tight mark D"
   - Duration: 15 minutes

3. **Hero (start in already aggressive defence)** - Pre-positioned aggressive defense
   - Description: "Defense starts in 2-2 with pre-communicated marks. On 'fly', beaters beat ball carrier and loaded beater, chasers sprint to intercept"
   - Duration: 20 minutes

### Phase 3: Assemble Practice Plan

**Practice Plan Structure:**
```json
{
  "name": "2025 May 31 GTA Practice Plan",
  "description": "Team Canada practice focusing on offensive formations (kite and box), 1.5 concepts, defensive principles (2-2 and hoop D), and aggressive defensive styles.",
  "practice_goals": [
    "Review offensive formations (kite and box)",
    "Introduce 1.5 concepts", 
    "Review 2-2 and hoop D",
    "Introduce aggressive styles of defence"
  ],
  "phase_of_season": "Mid season, skill building",
  "estimated_number_of_participants": 20,
  "start_time": "13:00:00",
  "visibility": "public",
  "is_editable_by_others": true,
  "sections": [
    {
      "name": "Arrival & Setup",
      "notes": "Get equipment on. Coaches' message. Athletes can ask coaches questions.",
      "items": [
        {
          "type": "break",
          "name": "Arrival & Equipment Setup",
          "duration": 30
        }
      ]
    },
    {
      "name": "Warmup",
      "notes": "Dynamic warmup including position-specific preparation",
      "items": [
        {
          "type": "drill",
          "name": "Dynamic Stretching",
          "duration": 15,
          "drill_id": 154
        },
        {
          "type": "drill", 
          "name": "Walk backs",
          "duration": 5,
          "drill_id": "[NEW_DRILL_ID]"
        },
        {
          "type": "drill",
          "name": "5 point star",
          "duration": 5,
          "drill_id": 62
        },
        {
          "type": "drill",
          "name": "Passing to cutters",
          "duration": 5,
          "drill_id": 131
        }
      ]
    },
    {
      "name": "1.5 Offense and Defence",
      "notes": "Introduction to 1.5 concepts for beaters",
      "items": [
        {
          "type": "drill",
          "name": "Arkansas",
          "duration": 15,
          "drill_id": "[NEW_DRILL_ID]"
        },
        {
          "type": "drill",
          "name": "Third-Courts", 
          "duration": 15,
          "drill_id": "[NEW_DRILL_ID]"
        }
      ]
    },
    {
      "name": "4 on 4 No Beaters",
      "notes": "Chaser-focused drill with time pressure",
      "items": [
        {
          "type": "drill",
          "name": "4 on 4 no beaters",
          "duration": 30,
          "drill_id": 130
        }
      ]
    },
    {
      "name": "Half Courts: Offensive & Defensive Principles",
      "notes": "Review of formations and defensive principles",
      "items": [
        {
          "type": "drill",
          "name": "Half Courts: Review Offensive & Defensive Principles",
          "duration": 55,
          "drill_id": "[NEW_DRILL_ID]"
        },
        {
          "type": "break",
          "name": "Break",
          "duration": 5
        },
        {
          "type": "drill",
          "name": "Scrimmage",
          "duration": 20,
          "drill_id": 136
        },
        {
          "type": "break", 
          "name": "Break",
          "duration": 5
        }
      ]
    },
    {
      "name": "Aggressive Styles of Defence",
      "notes": "Introduction to aggressive defensive concepts",
      "items": [
        {
          "type": "drill",
          "name": "Aggro",
          "duration": 10,
          "drill_id": "[NEW_FORMATION_DRILL_ID]"
        },
        {
          "type": "drill",
          "name": "Press",
          "duration": 15,
          "drill_id": "[NEW_FORMATION_DRILL_ID]"
        },
        {
          "type": "drill",
          "name": "Hero",
          "duration": 20,
          "drill_id": "[NEW_FORMATION_DRILL_ID]"
        }
      ]
    },
    {
      "name": "Scrimmages",
      "notes": "Game simulation with coaching breaks",
      "items": [
        {
          "type": "drill",
          "name": "Scrimmage",
          "duration": 20,
          "drill_id": 136
        },
        {
          "type": "break",
          "name": "Coaching & Team Mixing",
          "duration": 5
        },
        {
          "type": "drill",
          "name": "Scrimmage", 
          "duration": 20,
          "drill_id": 136
        }
      ]
    },
    {
      "name": "Cool Down",
      "notes": "Recovery and debrief",
      "items": [
        {
          "type": "drill",
          "name": "Cool down jog",
          "duration": 5,
          "drill_id": "[NEW_DRILL_ID]"
        },
        {
          "type": "drill",
          "name": "Static stretches and debrief",
          "duration": 5,
          "drill_id": "[NEW_DRILL_ID]"
        }
      ]
    }
  ]
}
```

## Required New Functionality

### 1. Formation Integration in Practice Plans
- **Need:** Ability to link formations directly to practice plan items
- **Rationale:** The plan extensively references formations (kite, box, 2-2, hoop D, aggro, press, hero)
- **Implementation:** Add formation_id field to practice plan items, similar to drill_id

### 2. 1.5 Concept Support
- **Need:** New drill category or tag for "1.5 concepts"
- **Rationale:** This is a specific beater strategy that appears multiple times
- **Implementation:** Add "1.5" as a drill_type or skill tag

### 3. Defensive Style Variations as Formations
- **Need:** Create formations for Aggro, Press, and Hero defensive styles
- **Rationale:** These are tactical formations, not just drills
- **Implementation:** Create new formations with detailed positioning and movement patterns

### 4. Position-Specific Drill Categories
- **Need:** Better categorization for position-specific drills
- **Rationale:** Plan has separate tracks for seekers, chasers, beaters
- **Implementation:** Enhanced position_focused_on field with more granular options

### 5. Progressive Drill Support
- **Need:** Support for time-based progressions within drills
- **Rationale:** "4 on 4 no beaters" has progression: "30 seconds. Progress to 20, 15, 10, 5 seconds"
- **Implementation:** Add progression field to drill schema

### 6. Parallel Track Support
- **Need:** Ability to define parallel activities (seeker track)
- **Rationale:** Seeker plan runs alongside main practice
- **Implementation:** Add parallel_sections or track support to practice plans

## Implementation Commands

### Step 1: Create Missing Drills
```bash
# Update create_drill_script.py with each new drill data
# Run for each drill:
python create_drill_script.py

# Verify creation:
psql "$NEON_DB_URL" -c "SELECT id, name FROM drills WHERE name IN ('Walk backs', 'Arkansas', 'Third-Courts', 'Claw drill', 'Cool down jog');"
```

### Step 2: Create Missing Formations  
```bash
# Use formations API or create formation script for:
# - Aggro (2-2 but aggressive)
# - Press (start in 2-2, then aggress) 
# - Hero (start in already aggressive defence)

# Verify creation:
psql "$NEON_DB_URL" -c "SELECT id, name FROM formations WHERE name IN ('Aggro', 'Press', 'Hero');"
```

### Step 3: Create Practice Plan
```bash
# Update create_practice_plan_script.py with the complete plan structure
python create_practice_plan_script.py

# Verify creation:
psql "$NEON_DB_URL" -c "SELECT id, name FROM practice_plans WHERE name = '2025 May 31 GTA Practice Plan';"
```

### Step 4: Verify Complete Structure
```bash
# Check sections and items were created correctly:
psql "$NEON_DB_URL" -c "
SELECT 
  pp.name as plan_name,
  pps.name as section_name, 
  pps.\"order\" as section_order,
  ppi.name as item_name,
  ppi.type as item_type,
  ppi.duration,
  ppi.drill_id
FROM practice_plans pp
JOIN practice_plan_sections pps ON pp.id = pps.practice_plan_id  
JOIN practice_plan_items ppi ON pps.id = ppi.section_id
WHERE pp.name = '2025 May 31 GTA Practice Plan'
ORDER BY pps.\"order\", ppi.\"order\";
"
```

## Notes


- **Drill Links:** Two drills are explicitly linked in the source:
  - `https://www.qdrill.app/drills/130` (4 on 4 no beaters)
  - `https://www.qdrill.app/drills/136` (Scrimmage)
- **External References:** Plan includes links to IQA rules, Team Canada documents, and an Instagram drill video
- **Equipment List:** Comprehensive equipment requirements are specified in the source document
- **Timing:** Total practice time is 4 hours (13:00-17:00) with structured progression from warmup through scrimmages

## Success Criteria

1. All missing drills created and validated in database
2. New formations created for aggressive defensive styles  
3. Complete practice plan structure created with proper section/item relationships
4. All drill_id references correctly linked to existing or newly created drills
5. Practice plan accessible via QDrill web interface
6. Database queries confirm proper data persistence and relationships 