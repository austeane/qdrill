#!/usr/bin/env python3
"""
Script to create drills for the aggressive defense formations
"""

import requests
import json
import time
import sys

API_URL = "http://localhost:3000/api/drills"

def create_drill(drill_data):
    """Create a drill via the API"""
    print(f"\nCreating drill: {drill_data['name']}")
    print("="*50)
    
    try:
        response = requests.post(API_URL, json=drill_data, headers={'Content-Type': 'application/json'})
        response.raise_for_status()
        
        created_drill = response.json()
        
        if 'error' in created_drill:
            print(f"ERROR: {created_drill['error']}")
            return None
            
        print(f"✓ Successfully created drill with ID: {created_drill['id']}")
        return created_drill
        
    except requests.exceptions.RequestException as e:
        print(f"✗ HTTP Request failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  Status Code: {e.response.status_code}")
            print(f"  Response: {e.response.text}")
        return None
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return None

# Define formation drills
formation_drills = [
    {
        "name": "Aggro Defense Drill",
        "brief_description": "Practice aggressive 2-2 defense focusing on creating turnovers",
        "detailed_description": "Drill to practice the Aggro formation - a more aggressive version of 2-2 defense. Chasers play tighter marks, beaters position aggressively to force passes, and the team uses positional advantages to pressure offense. Focus on communication and quick transitions when offense breaks through initial pressure.",
        "skill_level": ["Advanced"],
        "complexity": "High",
        "suggested_length": {"min": 10, "max": 10},
        "skills_focused_on": ["Defence", "Communication", "Positioning", "Decision Making", "2-2"],
        "positions_focused_on": ["Chaser", "Beater", "Keeper"],
        "drill_type": ["Tactic-focus", "Match-like situation"],
        "visibility": "public",
        "is_editable_by_others": True
    },
    {
        "name": "Press Defense Drill",
        "brief_description": "Transitional defense from standard 2-2 to aggressive press",
        "detailed_description": "Half court drill practicing the Press formation. Offense beater whiffs long beat, defense has control. Beater forces quaffle pass, chasers play tight mark D with one on hoops. Free beater plays zone ready to help beat next pass. Teaches timing and communication for transitioning from standard to aggressive defense.",
        "skill_level": ["Advanced"],
        "complexity": "High",
        "suggested_length": {"min": 15, "max": 15},
        "skills_focused_on": ["Defence", "Communication", "Timing", "Positioning", "Decision Making", "2-2"],
        "positions_focused_on": ["Chaser", "Beater", "Keeper"],
        "drill_type": ["Tactic-focus", "Match-like situation"],
        "visibility": "public",
        "is_editable_by_others": True
    },
    {
        "name": "Hero Defense Drill",
        "brief_description": "Coordinated aggressive defense with simultaneous pressure on 'fly' call",
        "detailed_description": "Half court drill for Hero formation. Offense starts at keeper line, defense in 2-2 with pre-communicated marks. On 'fly', beaters beat ball carrier and loaded beater to force pass while chasers sprint to intercept. Practices coordinated team pressure requiring excellent timing, communication, and execution.",
        "skill_level": ["Advanced", "Expert"],
        "complexity": "High",
        "suggested_length": {"min": 20, "max": 20},
        "skills_focused_on": ["Defence", "Communication", "Timing", "Positioning", "Decision Making", "2-2"],
        "positions_focused_on": ["Chaser", "Beater", "Keeper"],
        "drill_type": ["Tactic-focus", "Match-like situation"],
        "visibility": "public",
        "is_editable_by_others": True
    }
]

def main():
    """Main function to create all drills"""
    print("Creating formation-linked drills")
    print("="*60)
    
    created_drills = []
    failed_drills = []
    
    for drill_data in formation_drills:
        result = create_drill(drill_data)
        if result:
            created_drills.append(result)
        else:
            failed_drills.append(drill_data['name'])
        
        # Small delay between requests
        time.sleep(0.5)
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"✓ Successfully created: {len(created_drills)} drills")
    if created_drills:
        print("\nCreated drill IDs:")
        for drill in created_drills:
            print(f"  - {drill['name']}: ID {drill['id']}")
    
    if failed_drills:
        print(f"\n✗ Failed to create: {len(failed_drills)} drills")
        for name in failed_drills:
            print(f"  - {name}")
        sys.exit(1)
    else:
        print("\n✓ All formation drills created successfully!")
        
        # Append to existing mapping
        id_mapping = {}
        try:
            with open('drill_id_mapping.json', 'r') as f:
                id_mapping = json.load(f)
        except:
            pass
            
        for drill in created_drills:
            id_mapping[drill['name']] = drill['id']
            
        with open('drill_id_mapping.json', 'w') as f:
            json.dump(id_mapping, f, indent=2)
        print(f"\nDrill ID mapping updated in drill_id_mapping.json")

if __name__ == "__main__":
    main()