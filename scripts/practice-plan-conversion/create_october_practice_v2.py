#!/usr/bin/env python3
"""
Script to create the East October TC Practice from practice.txt
This version creates missing drills first, then creates the practice plan
"""

import requests
import json
import sys
import re
from datetime import datetime, timedelta

API_BASE_URL = "http://localhost:3000/api"

# Map drill names from practice.txt to existing drill names in DB
drill_name_mapping = {
    "Five star": "5 point star",
    "Seeker Beating": "Bubble seeker beating",
    "Half Courts": "Half Courts: Review Offensive & Defensive Principles",
    "Scrimmage": "Full-field Scrimmage"
}

# Define new drills to create (those not in database)
new_drills = {
    "Long-short-short": {
        "name": "Long-short-short",
        "brief_description": "Chaser passing drill alternating between long and short passes",
        "detailed_description": "Chasers practice alternating between long passes and short passes to improve passing accuracy and decision making.",
        "skill_level": ["beginner", "intermediate"],
        "complexity": "Low",
        "skills_focused_on": ["passing", "catching", "communication"],
        "positions_focused_on": ["chaser"],
        "drill_type": ["warmup", "skill-focus"],
        "suggested_length_min": 5,
        "suggested_length_max": 10,
        "visibility": "public"
    },
    "Butterfly shooting drill": {
        "name": "Butterfly shooting drill",
        "brief_description": "Shooting drill with movement patterns resembling a butterfly",
        "detailed_description": "Chasers practice shooting from various angles while moving in a butterfly pattern around the hoops.",
        "skill_level": ["intermediate", "advanced"],
        "complexity": "Medium",
        "skills_focused_on": ["shooting", "movement", "agility"],
        "positions_focused_on": ["chaser"],
        "drill_type": ["skill-focus"],
        "suggested_length_min": 10,
        "suggested_length_max": 15,
        "visibility": "public"
    },
    "Close Out Oklahomas": {
        "name": "Close Out Oklahomas",
        "brief_description": "Oklahoma-style 1v1 drill focused on closing out on defense",
        "detailed_description": "Chasers practice 1v1 situations with emphasis on defensive closeouts and preventing shots.",
        "skill_level": ["intermediate", "advanced"],
        "complexity": "Medium",
        "skills_focused_on": ["defense", "1v1", "physicality"],
        "positions_focused_on": ["chaser"],
        "drill_type": ["competitive", "skill-focus"],
        "suggested_length_min": 10,
        "suggested_length_max": 15,
        "visibility": "public"
    },
    "Skill Vitamins": {
        "name": "Skill Vitamins",
        "brief_description": "Quick beater skill stations focusing on fundamentals",
        "detailed_description": "Beaters rotate through stations working on block, catch, dodge, and trade skills.",
        "skill_level": ["beginner", "intermediate"],
        "complexity": "Low",
        "skills_focused_on": ["catching", "dodging", "blocking"],
        "positions_focused_on": ["beater"],
        "drill_type": ["warmup", "skill-focus"],
        "suggested_length_min": 10,
        "suggested_length_max": 15,
        "visibility": "public"
    },
    "Beater Oklahomas": {
        "name": "Beater Oklahomas",
        "brief_description": "1v1 beater battles for ball control",
        "detailed_description": "Two beaters compete 1v1 for dodgeball control in a confined space.",
        "skill_level": ["intermediate", "advanced"],
        "complexity": "Medium",
        "skills_focused_on": ["1v1", "ball control", "physicality"],
        "positions_focused_on": ["beater"],
        "drill_type": ["competitive"],
        "suggested_length_min": 5,
        "suggested_length_max": 10,
        "visibility": "public"
    },
    "drive to danger, pass to safety": {
        "name": "Drive to danger, pass to safety",
        "brief_description": "Offensive principle drill focusing on creating space",
        "detailed_description": "Chasers practice driving towards defenders to create space for teammates, then passing to the open player.",
        "skill_level": ["intermediate", "advanced"],
        "complexity": "Medium",
        "skills_focused_on": ["passing", "spacing", "decision making"],
        "positions_focused_on": ["chaser"],
        "drill_type": ["tactical"],
        "suggested_length_min": 15,
        "suggested_length_max": 20,
        "visibility": "public"
    },
    "Carleton Pick Drill": {
        "name": "Carleton Pick Drill",
        "brief_description": "Offensive play using picks from kite formation",
        "detailed_description": "Practice executing picks from kite formation. Pass to one side, pass back to middle with a pick from the opposite side, then drive into a 2v1.",
        "skill_level": ["intermediate", "advanced"],
        "complexity": "High",
        "skills_focused_on": ["picks", "teamwork", "spacing"],
        "positions_focused_on": ["chaser"],
        "drill_type": ["tactical"],
        "suggested_length_min": 15,
        "suggested_length_max": 20,
        "visibility": "public"
    },
    "One Runs": {
        "name": "One Runs",
        "brief_description": "Fast break drill simulating transition offense",
        "detailed_description": "Teams practice fast break scenarios, transitioning quickly from defense to offense.",
        "skill_level": ["intermediate", "advanced"],
        "complexity": "Medium",
        "skills_focused_on": ["transition", "speed", "decision making"],
        "positions_focused_on": ["chaser"],
        "drill_type": ["competitive", "tactical"],
        "suggested_length_min": 15,
        "suggested_length_max": 20,
        "visibility": "public"
    },
    "Volunteers Set Up Pitch": {
        "name": "Volunteers Set Up Pitch",
        "brief_description": "Field setup activity",
        "detailed_description": "Volunteers help set up the pitch with hoops, cones, and boundaries.",
        "skill_level": ["new to sport"],
        "complexity": "Low",
        "skills_focused_on": ["teamwork"],
        "positions_focused_on": ["chaser", "beater", "keeper", "seeker"],
        "drill_type": ["other"],
        "suggested_length_min": 10,
        "suggested_length_max": 15,
        "visibility": "public"
    }
}

def search_existing_drill(name):
    """Search for an existing drill by name"""
    try:
        # Try mapped name first
        search_name = drill_name_mapping.get(name, name)

        response = requests.get(f"{API_BASE_URL}/drills/names")
        all_drills = response.json()

        # Try exact match first
        for drill in all_drills:
            if drill['name'].lower() == search_name.lower():
                return drill['id']

        # Try partial match
        for drill in all_drills:
            if search_name.lower() in drill['name'].lower() or drill['name'].lower() in search_name.lower():
                return drill['id']

    except Exception as e:
        print(f"Error searching for drill '{name}': {e}")

    return None

def create_drill(drill_data):
    """Create a new drill via API"""
    try:
        response = requests.post(f"{API_BASE_URL}/drills",
                                json=drill_data,
                                headers={'Content-Type': 'application/json'})
        response.raise_for_status()
        result = response.json()
        print(f"✓ Created drill: {drill_data['name']} (ID: {result['id']})")
        return result['id']
    except requests.exceptions.RequestException as e:
        print(f"✗ Failed to create drill '{drill_data['name']}': {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  Response: {e.response.text}")
        return None

def get_or_create_drill_id(name):
    """Get existing drill ID or create new drill"""
    # Check if it exists
    drill_id = search_existing_drill(name)
    if drill_id:
        print(f"  Using existing drill: {name} (ID: {drill_id})")
        return drill_id

    # Create if it's in our new drills list
    if name in new_drills:
        print(f"  Creating new drill: {name}")
        return create_drill(new_drills[name])

    # Default to a placeholder if we don't have a definition
    print(f"  WARNING: No drill definition for '{name}', using placeholder")
    return 173  # Using existing test drill as placeholder

def parse_practice_plan():
    """Parse the practice.txt file into a structured format"""
    with open('../../practice.txt', 'r') as f:
        lines = f.readlines()

    # Extract basic info
    title = lines[0].strip()
    date_time = lines[1].strip()
    location = lines[2].strip()

    # Parse sections
    sections = []
    current_section = None
    current_items = []

    for line in lines:
        line = line.strip()

        # Check if this is a section header (starts with time in parentheses)
        time_match = re.match(r'\((\d{1,2}:\d{2})\)\s+(.*)', line)
        if time_match:
            # Save previous section if exists
            if current_section:
                sections.append({
                    'name': current_section['name'],
                    'time': current_section['time'],
                    'items': current_items
                })

            # Start new section
            time_str = time_match.group(1)
            section_name = time_match.group(2)
            current_section = {'name': section_name, 'time': time_str}
            current_items = []
        elif current_section and line:
            # Add items to current section
            if line not in ['', title, date_time, location] and not line.startswith('Please bring'):
                current_items.append(line)

    # Add last section
    if current_section:
        sections.append({
            'name': current_section['name'],
            'time': current_section['time'],
            'items': current_items
        })

    return {
        'title': title,
        'date_time': date_time,
        'location': location,
        'sections': sections
    }

def create_drill_item(name, duration, drill_id=None, parallel_group_id=None,
                      parallel_timeline=None, group_timelines=None):
    """Create a drill item for the practice plan"""
    item = {
        "type": "drill",
        "name": name,
        "duration": duration
    }

    if drill_id:
        item["drill_id"] = drill_id

    if parallel_group_id:
        item["parallel_group_id"] = parallel_group_id
        item["parallel_timeline"] = parallel_timeline
        item["groupTimelines"] = group_timelines

    return item

def create_break_item(name, duration):
    """Create a break item for the practice plan"""
    return {
        "type": "break",
        "name": name,
        "duration": duration
    }

def build_practice_plan_data(parsed_data, drill_ids):
    """Build the practice plan data structure for the API"""
    practice_plan_data = {
        "name": parsed_data['title'],
        "description": f"Team Canada practice at {parsed_data['location']}. Focus on position-specific skills, picks, and game simulation.",
        "practice_goals": [
            "Position-specific warm-ups and drills",
            "Work on Carleton pick drill",
            "Practice beater communication with seekers",
            "Game simulation with half courts and scrimmage"
        ],
        "phase_of_season": "Mid season",
        "estimated_number_of_participants": 20,
        "start_time": "09:30:00",
        "visibility": "public",
        "is_editable_by_others": True,
        "sections": []
    }

    # Process each section
    for i, section in enumerate(parsed_data['sections']):
        section_data = {
            "name": f"{section['name']} ({section['time']})",
            "order": i,
            "notes": "",
            "items": []
        }

        # Handle different sections
        if section['name'] == "Warm up":
            section_data["notes"] = "Cleats already on by 9:30am so arrive earlier! Volunteers set up pitch."
            section_data["items"] = [
                create_drill_item("Dynamic Stretching", 15, drill_ids["Dynamic Stretching"]),
                create_drill_item("Volunteers Set Up Pitch", 15, drill_ids["Volunteers Set Up Pitch"])
            ]

        elif section['name'] == "Position Specific Warm ups":
            section_data["notes"] = "Chasers and Beaters warm up in parallel groups"
            section_data["items"] = [
                # Chaser drills
                create_drill_item("Five star", 10, drill_ids["Five star"],
                                "position_warmup", "CHASERS", ["CHASERS", "BEATERS"]),
                create_drill_item("Long-short-short", 10, drill_ids["Long-short-short"],
                                "position_warmup", "CHASERS", ["CHASERS", "BEATERS"]),
                create_drill_item("Butterfly shooting drill", 10, drill_ids["Butterfly shooting drill"],
                                "position_warmup", "CHASERS", ["CHASERS", "BEATERS"]),
                create_drill_item("Close Out Oklahomas", 15, drill_ids["Close Out Oklahomas"],
                                "position_warmup", "CHASERS", ["CHASERS", "BEATERS"]),
                # Beater drills
                create_drill_item("Paired warm up throws", 10, drill_ids["Paired warm up throws"],
                                "position_warmup", "BEATERS", ["CHASERS", "BEATERS"]),
                create_drill_item("Skill Vitamins", 10, drill_ids["Skill Vitamins"],
                                "position_warmup", "BEATERS", ["CHASERS", "BEATERS"]),
                create_drill_item("Beater Oklahomas", 10, drill_ids["Beater Oklahomas"],
                                "position_warmup", "BEATERS", ["CHASERS", "BEATERS"]),
                create_drill_item("1.5 off-ball defense", 15, drill_ids.get("1.5 off-ball defense", 173),
                                "position_warmup", "BEATERS", ["CHASERS", "BEATERS"])
            ]

        elif section['name'] == "Position Specific Drills":
            section_data["notes"] = "Advanced position-specific drills with Seeker Beating"
            section_data["items"] = [
                # Chaser drills
                create_drill_item("Drive to danger, pass to safety", 15,
                                drill_ids["drive to danger, pass to safety"],
                                "position_drills", "CHASERS", ["CHASERS", "BEATERS"]),
                create_drill_item("Carleton Pick Drill", 15, drill_ids["Carleton Pick Drill"],
                                "position_drills", "CHASERS", ["CHASERS", "BEATERS"]),
                # Beater drills
                create_drill_item("Boston Beater Drill", 20, drill_ids["Boston Beater Drill"],
                                "position_drills", "BEATERS", ["CHASERS", "BEATERS"]),
                create_drill_item("Seeker Beating (with Seekers)", 10, drill_ids["Seeker Beating"],
                                "position_drills", "BEATERS", ["CHASERS", "BEATERS"])
            ]

        elif section['name'] == "Combined Drills":
            section_data["notes"] = "Carleton pick drill with beaters"
            section_data["items"] = [
                create_drill_item("Carleton pick drill with beaters", 15, drill_ids["Carleton Pick Drill"])
            ]

        elif section['name'] == "One Runs/Half Courts":
            section_data["notes"] = "Game simulation drills"
            section_data["items"] = [
                create_drill_item("One Runs", 20, drill_ids["One Runs"]),
                create_drill_item("Half Courts", 25, drill_ids["Half Courts"])
            ]

        elif section['name'] == "One Scrim":
            section_data["notes"] = "Full scrimmage"
            section_data["items"] = [
                create_drill_item("Scrimmage", 15, drill_ids["Scrimmage"])
            ]

        elif section['name'] == "End of practice":
            section_data["notes"] = "Cool down and pack up"
            section_data["items"] = [
                create_break_item("Cool down and pack up", 5)
            ]

        practice_plan_data["sections"].append(section_data)

    return practice_plan_data

def create_practice_plan(plan_data):
    """Create the practice plan via API"""
    print(f"\nCreating {plan_data['name']}")
    print("="*60)
    print(f"Number of sections: {len(plan_data['sections'])}")

    # Print section summary
    print("\nSections:")
    for i, section in enumerate(plan_data['sections']):
        print(f"  {i+1}. {section['name']} - {len(section['items'])} items")
        if any('parallel_group_id' in item for item in section['items']):
            print(f"     (Contains parallel drills)")

    try:
        response = requests.post(f"{API_BASE_URL}/practice-plans",
                                json=plan_data,
                                headers={'Content-Type': 'application/json'})
        response.raise_for_status()

        result = response.json()

        if 'error' in result:
            print(f"ERROR: {result['error']}")
            return None

        print(f"\n✓ Successfully created practice plan!")
        print(f"ID: {result.get('id')}")
        print(f"Message: {result.get('message')}")
        return result

    except requests.exceptions.RequestException as e:
        print(f"\n✗ HTTP Request failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  Status Code: {e.response.status_code}")
            print(f"  Response: {e.response.text}")
        return None
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        return None

if __name__ == "__main__":
    # Parse the practice plan from text file
    print("Parsing practice.txt...")
    parsed_data = parse_practice_plan()
    print(f"Found practice: {parsed_data['title']}")
    print(f"Sections found: {len(parsed_data['sections'])}")

    # Get or create all needed drills
    print("\n" + "="*60)
    print("STEP 1: Setting up drills")
    print("="*60)

    drill_names_needed = [
        "Dynamic Stretching",
        "Five star",
        "Long-short-short",
        "Butterfly shooting drill",
        "Close Out Oklahomas",
        "Paired warm up throws",
        "Skill Vitamins",
        "Beater Oklahomas",
        "drive to danger, pass to safety",
        "Carleton Pick Drill",
        "Boston Beater Drill",
        "Seeker Beating",
        "One Runs",
        "Half Courts",
        "Scrimmage",
        "Volunteers Set Up Pitch"
    ]

    drill_ids = {}
    for drill_name in drill_names_needed:
        drill_ids[drill_name] = get_or_create_drill_id(drill_name)

    print(f"\nDrill setup complete. Have IDs for {len(drill_ids)} drills")

    # Build the API data structure
    print("\n" + "="*60)
    print("STEP 2: Creating practice plan")
    print("="*60)
    practice_plan_data = build_practice_plan_data(parsed_data, drill_ids)

    # Create the practice plan
    result = create_practice_plan(practice_plan_data)

    if result:
        print("\n" + "="*60)
        print("✓ SUCCESS!")
        print("="*60)
        print(f"Practice plan created successfully!")
        print(f"View it at: http://localhost:3000/practice-plans/{result['id']}")
    else:
        print("\n" + "="*60)
        print("✗ FAILED")
        print("="*60)
        print("Failed to create practice plan")
        sys.exit(1)