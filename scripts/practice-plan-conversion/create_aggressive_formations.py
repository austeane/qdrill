#!/usr/bin/env python3
"""
Script to create aggressive defense formations for the 2025 May 31 GTA Practice Plan
"""

import requests
import json
import time
import sys

API_URL = "http://localhost:3000/api/formations"

def create_formation(formation_data):
    """Create a formation via the API"""
    print(f"\nCreating formation: {formation_data['name']}")
    print("="*50)
    
    try:
        response = requests.post(API_URL, json=formation_data, headers={'Content-Type': 'application/json'})
        response.raise_for_status()
        
        created_formation = response.json()
        
        if 'error' in created_formation:
            print(f"ERROR: {created_formation['error']}")
            return None
            
        print(f"✓ Successfully created formation with ID: {created_formation['id']}")
        return created_formation
        
    except requests.exceptions.RequestException as e:
        print(f"✗ HTTP Request failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  Status Code: {e.response.status_code}")
            print(f"  Response: {e.response.text}")
        return None
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return None

# Define all formations to create
formations_to_create = [
    {
        "name": "Aggro (2-2 but aggressive)",
        "brief_description": "More aggressive version of 2-2 defense, looking to use advantages over offense, forcing turnovers",
        "detailed_description": "An aggressive variation of the standard 2-2 defense where defenders actively look to create turnovers. Chasers play tighter marks, beaters position more aggressively to force passes, and the team uses their positional advantages to pressure the offense. This requires excellent communication and quick transitions when the offense breaks through initial pressure.",
        "formation_type": "defense",
        "tags": ["aggressive", "2-2", "defense", "advanced"],
        "visibility": "public",
        "is_editable_by_others": True
    },
    {
        "name": "Press (start in 2-2, then aggress)",
        "brief_description": "Transitional aggressive defense starting from 2-2 formation",
        "detailed_description": "Half court setup where offense beater whiffs a long beat attempt, giving defense control. The defense starts in standard 2-2 but immediately transitions to aggressive press. The defensive beater forces the quaffle carrier to pass. Chasers play tight marking defense with one chaser staying on hoops. The free beater plays zone and is ready to help beat the next pass if needed. This teaches timing and communication for transitioning from standard to aggressive defense.",
        "formation_type": "defense",
        "tags": ["aggressive", "press", "defense", "transition", "advanced"],
        "visibility": "public",
        "is_editable_by_others": True
    },
    {
        "name": "Hero (start in already aggressive defence)",
        "brief_description": "Pre-positioned aggressive defense with coordinated attack on 'fly' call",
        "detailed_description": "Half court drill where offense starts at keeper line and defense starts in 2-2 positioning but with pre-communicated marks. Upon the call of 'fly', beaters simultaneously attempt to beat both the ball carrier and the offensive loaded beater to force a pass. Meanwhile, chasers sprint to their marks trying to intercept the forced pass. This formation practices coordinated team pressure and requires excellent timing, communication, and execution. The defense must be prepared for the offense to break through if timing is off.",
        "formation_type": "defense",
        "tags": ["aggressive", "hero", "defense", "coordinated", "advanced", "timing"],
        "visibility": "public",
        "is_editable_by_others": True
    }
]

def main():
    """Main function to create all formations"""
    print("Creating aggressive defense formations for 2025 May 31 GTA Practice Plan")
    print("="*60)
    
    created_formations = []
    failed_formations = []
    
    for formation_data in formations_to_create:
        result = create_formation(formation_data)
        if result:
            created_formations.append(result)
        else:
            failed_formations.append(formation_data['name'])
        
        # Small delay between requests
        time.sleep(0.5)
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"✓ Successfully created: {len(created_formations)} formations")
    if created_formations:
        print("\nCreated formation IDs:")
        for formation in created_formations:
            print(f"  - {formation['name']}: ID {formation['id']}")
    
    if failed_formations:
        print(f"\n✗ Failed to create: {len(failed_formations)} formations")
        for name in failed_formations:
            print(f"  - {name}")
        sys.exit(1)
    else:
        print("\n✓ All formations created successfully!")
        
        # Save the mapping for later use
        id_mapping = {formation['name']: formation['id'] for formation in created_formations}
        with open('formation_id_mapping.json', 'w') as f:
            json.dump(id_mapping, f, indent=2)
        print(f"\nFormation ID mapping saved to formation_id_mapping.json")

if __name__ == "__main__":
    main()