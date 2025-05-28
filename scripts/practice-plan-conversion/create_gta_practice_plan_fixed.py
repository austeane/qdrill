#!/usr/bin/env python3
"""
Script to create the 2025 May 31 GTA Practice Plan with correct parallel structure
"""

import requests
import json
import sys

API_URL = "http://localhost:3000/api/practice-plans"

# Load the drill IDs we created
with open('drill_id_mapping.json', 'r') as f:
    drill_ids = json.load(f)

# Define the practice plan structure with correct parallel drills
practice_plan_data = {
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
    "is_editable_by_others": True,
    "sections": [
        {
            "name": "Arrival & Setup",
            "order": 0,
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
            "order": 1,
            "notes": "Dynamic warmup including position-specific preparation",
            "items": [
                {
                    "type": "drill",
                    "name": "Dynamic Stretching",
                    "duration": 15,
                    "drill_id": 154  # Existing drill
                },
                {
                    "type": "drill", 
                    "name": "Walk backs",
                    "duration": 5,
                    "drill_id": drill_ids["Walk backs"],
                    "parallel_group_id": "warmup_group",
                    "parallel_timeline": "CHASERS",
                    "groupTimelines": ["CHASERS", "BEATERS"]
                },
                {
                    "type": "drill",
                    "name": "5 point star",
                    "duration": 5,
                    "drill_id": 62,  # Existing drill
                    "parallel_group_id": "warmup_group",
                    "parallel_timeline": "CHASERS",
                    "groupTimelines": ["CHASERS", "BEATERS"]
                },
                {
                    "type": "drill",
                    "name": "Passing to cutters",
                    "duration": 5,
                    "drill_id": 131,  # Existing drill
                    "parallel_group_id": "warmup_group",
                    "parallel_timeline": "CHASERS",
                    "groupTimelines": ["CHASERS", "BEATERS"]
                },
                {
                    "type": "drill",
                    "name": "Paired warm up throws",
                    "duration": 10,
                    "drill_id": drill_ids["Paired warm up throws"],
                    "parallel_group_id": "warmup_group",
                    "parallel_timeline": "BEATERS",
                    "groupTimelines": ["CHASERS", "BEATERS"]
                },
                {
                    "type": "drill",
                    "name": "All vs 1 skills",
                    "duration": 5,
                    "drill_id": drill_ids["All vs 1 skills"],
                    "parallel_group_id": "warmup_group",
                    "parallel_timeline": "BEATERS",
                    "groupTimelines": ["CHASERS", "BEATERS"]
                }
            ]
        },
        {
            "name": "Drills (13:30)",
            "order": 2,
            "notes": "Beaters work on 1.5 concepts while Chasers do 4v4 no beaters",
            "items": [
                # Beater drills (1.5 concepts)
                {
                    "type": "drill",
                    "name": "Arkansas",
                    "duration": 15,
                    "drill_id": drill_ids["Arkansas"],
                    "parallel_group_id": "drills_1330",
                    "parallel_timeline": "BEATERS",
                    "groupTimelines": ["BEATERS", "CHASERS"]
                },
                {
                    "type": "drill",
                    "name": "Third-Courts", 
                    "duration": 15,
                    "drill_id": drill_ids["Third-Courts"],
                    "parallel_group_id": "drills_1330",
                    "parallel_timeline": "BEATERS",
                    "groupTimelines": ["BEATERS", "CHASERS"]
                },
                # Chaser drill running in parallel
                {
                    "type": "drill",
                    "name": "4 on 4 no beaters",
                    "duration": 30,
                    "drill_id": 130,  # Existing drill
                    "parallel_group_id": "drills_1330",
                    "parallel_timeline": "CHASERS",
                    "groupTimelines": ["BEATERS", "CHASERS"]
                }
            ]
        },
        {
            "name": "Half Courts: Offensive & Defensive Principles",
            "order": 3,
            "notes": "Review of formations and defensive principles (14:00)",
            "items": [
                {
                    "type": "drill",
                    "name": "Half Courts: Review Offensive & Defensive Principles",
                    "duration": 55,
                    "drill_id": drill_ids["Half Courts: Review Offensive & Defensive Principles"]
                },
                {
                    "type": "break",
                    "name": "Break",
                    "duration": 5
                },
                {
                    "type": "drill",
                    "name": "Review Session Scrimmage",
                    "duration": 20,
                    "drill_id": 136  # Existing scrimmage drill
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
            "order": 4,
            "notes": "Introduction to aggressive defensive concepts (15:15)",
            "items": [
                {
                    "type": "drill",
                    "name": "Aggro Defense Drill",
                    "duration": 10,
                    "drill_id": drill_ids["Aggro Defense Drill"]
                },
                {
                    "type": "drill",
                    "name": "Press Defense Drill",
                    "duration": 15,
                    "drill_id": drill_ids["Press Defense Drill"]
                },
                {
                    "type": "drill",
                    "name": "Hero Defense Drill",
                    "duration": 20,
                    "drill_id": drill_ids["Hero Defense Drill"]
                },
                {
                    "type": "break",
                    "name": "Break/Transition",
                    "duration": 15
                }
            ]
        },
        {
            "name": "Scrimmages",
            "order": 5,
            "notes": "Game simulation with coaching breaks (16:15)",
            "items": [
                {
                    "type": "drill",
                    "name": "Scrimmage 1",
                    "duration": 20,
                    "drill_id": 136  # Existing drill
                },
                {
                    "type": "break",
                    "name": "Coaching & Team Mixing",
                    "duration": 5
                },
                {
                    "type": "drill",
                    "name": "Scrimmage 2", 
                    "duration": 20,
                    "drill_id": 136  # Existing drill
                }
            ]
        },
        {
            "name": "Cool Down",
            "order": 6,
            "notes": "Recovery and debrief (17:00)",
            "items": [
                {
                    "type": "drill",
                    "name": "Cool down jog",
                    "duration": 5,
                    "drill_id": drill_ids["Cool down jog"]
                },
                {
                    "type": "drill",
                    "name": "Static stretches and debrief",
                    "duration": 5,
                    "drill_id": drill_ids["Static stretches and debrief"]
                }
            ]
        },
        {
            "name": "Seeker Track",
            "order": 7,
            "notes": "Seeker-specific drills running from 13:45 until first scrimmage at 15:00, then 15:15 until second scrimmage at 16:15",
            "items": [
                {
                    "type": "drill",
                    "name": "Claw drill",
                    "duration": 10,
                    "drill_id": drill_ids["Claw drill"]
                },
                {
                    "type": "drill",
                    "name": "Leg load and dive",
                    "duration": 10,
                    "drill_id": drill_ids["Leg load and dive"]
                },
                {
                    "type": "drill",
                    "name": "Full dive",
                    "duration": 10,
                    "drill_id": drill_ids["Full dive"]
                },
                {
                    "type": "drill",
                    "name": "1v1 with snitch",
                    "duration": 15,
                    "drill_id": drill_ids["1v1 with snitch"]
                },
                {
                    "type": "break",
                    "name": "Join scrimmage",
                    "duration": 20
                },
                {
                    "type": "drill",
                    "name": "2v1 with snitch",
                    "duration": 15,
                    "drill_id": drill_ids["2v1 with snitch"]
                }
            ]
        }
    ]
}

def create_practice_plan(plan_data):
    """Create the practice plan via API"""
    print("Creating 2025 May 31 GTA Practice Plan (Fixed)")
    print("="*60)
    print(f"Number of sections: {len(plan_data['sections'])}")
    
    # Print section summary
    print("\nSections:")
    for i, section in enumerate(plan_data['sections']):
        print(f"  {i+1}. {section['name']} - {len(section['items'])} items")
        if any('parallel_group_id' in item for item in section['items']):
            print(f"     (Contains parallel drills)")
    
    try:
        response = requests.post(API_URL, json=plan_data, headers={'Content-Type': 'application/json'})
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
    result = create_practice_plan(practice_plan_data)
    if result:
        print(f"\n✓ Practice plan created successfully!")
        print(f"View it at: http://localhost:3000/practice-plans/{result['id']}")
    else:
        print("\n✗ Failed to create practice plan")
        sys.exit(1)