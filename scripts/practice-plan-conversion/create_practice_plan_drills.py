#!/usr/bin/env python3
"""
Script to create all drills needed for the 2025 May 31 GTA Practice Plan
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

# Define all drills to create
drills_to_create = [
    # Warmup Drills
    {
        "name": "Walk backs",
        "brief_description": "Chaser warmup with push passes, overhead passes, and movement patterns",
        "detailed_description": "A progressive passing warmup where chasers walk backwards while executing different pass types. Start with push passes, progress to overhead passes, and incorporate other passing variations as needed. Focus on accuracy and technique while moving.",
        "skill_level": ["Beginner", "Intermediate"],
        "complexity": "Low",
        "suggested_length": {"min": 5, "max": 10},
        "skills_focused_on": ["Passing", "Movement", "Catching (Chasers)"],
        "positions_focused_on": ["Chaser"],
        "drill_type": ["Warmup", "Skill-focus"],
        "visibility": "public",
        "is_editable_by_others": True
    },
    {
        "name": "Paired warm up throws",
        "brief_description": "Beater warmup progression with partner, focusing on accuracy and range",
        "detailed_description": "Paired beater warmup starting with light throws and gradually increasing intensity. Vary throw types (overhand, underhand, push). Take step backs to increase range. Focus on hitting specific targets (left shoulder, right knee, etc.) for precision practice.",
        "skill_level": ["Beginner", "Intermediate", "Advanced"],
        "complexity": "Low",
        "suggested_length": {"min": 5, "max": 10},
        "skills_focused_on": ["Throwing", "Beating", "Reaction Time"],
        "positions_focused_on": ["Beater"],
        "drill_type": ["Warmup", "Skill-focus"],
        "visibility": "public",
        "is_editable_by_others": True
    },
    {
        "name": "All vs 1 skills",
        "brief_description": "Beater defensive skills practice - dodge, block, catch, exchange",
        "detailed_description": "One beater in the middle practices defensive skills while others throw at them. Rotate through dodge, block, catch, and exchange techniques. Focus on proper form and quick reactions.",
        "skill_level": ["Beginner", "Intermediate", "Advanced"],
        "complexity": "Medium",
        "suggested_length": {"min": 5, "max": 10},
        "skills_focused_on": ["Dodging", "Dodgeball Blocks", "Catching (Beaters)", "Reaction Time"],
        "positions_focused_on": ["Beater"],
        "drill_type": ["Warmup", "Skill-focus"],
        "visibility": "public",
        "is_editable_by_others": True
    },
    
    # 1.5 Concept Drills
    {
        "name": "Arkansas",
        "brief_description": "1.5 offense/defense fundamentals - blocking technique and lateral movement",
        "detailed_description": "One defensive free beater vs one offensive engage beater, no dodgeballs. Engage beater starts outside keeper zone, driving to tag a hoop. Free beater blocks to prevent or delay the tag. Defense works on blocking technique, offense practices lateral movement/juking to get through 1.5 defense.",
        "skill_level": ["Advanced"],
        "complexity": "High",
        "suggested_length": {"min": 15, "max": 15},
        "skills_focused_on": ["Positioning", "Decision Making", "Defence", "Movement", "Communication"],
        "positions_focused_on": ["Beater"],
        "drill_type": ["Tactic-focus", "Skill-focus"],
        "visibility": "public",
        "is_editable_by_others": True
    },
    {
        "name": "Third-Courts",
        "brief_description": "1.5 timing and positioning practice with chasers",
        "detailed_description": "Working through timing of 1.5 initiation. Two beaters without control on defense; two beaters with control + 2-3 chasers on offense (dunks only). Offense practices: timing 1.5 with chaser plays, throwbacks to partner, dodgeball protection. Defense practices: 1.5 defense or contesting throwback, communication on objectives, positioning to pressure offense.",
        "skill_level": ["Advanced"],
        "complexity": "High",
        "suggested_length": {"min": 15, "max": 15},
        "skills_focused_on": ["Timing", "Communication", "Positioning", "Decision Making", "Throwbacks"],
        "positions_focused_on": ["Beater", "Chaser"],
        "drill_type": ["Tactic-focus", "Match-like situation"],
        "visibility": "public",
        "is_editable_by_others": True
    },
    
    # Half Court Structure Drill
    {
        "name": "Half Courts: Review Offensive & Defensive Principles",
        "brief_description": "Structured practice of kite and box offense against 2-2 and hoop defense",
        "detailed_description": "Comprehensive formation practice alternating between offensive formations (kite and box) and defensive structures (2-2 and hoop D) with varying dodgeball counts (1-2 DB). Each formation gets 4 reps against each defensive setup. Focus on proper rotations, spacing, and execution of plays.",
        "skill_level": ["Intermediate", "Advanced"],
        "complexity": "High",
        "suggested_length": {"min": 55, "max": 60},
        "skills_focused_on": ["Positioning", "Offence", "Defence", "Communication", "Decision Making", "2-2", "Hoops/Baylor"],
        "positions_focused_on": ["Chaser", "Beater", "Keeper"],
        "drill_type": ["Tactic-focus", "Match-like situation"],
        "visibility": "public",
        "is_editable_by_others": True
    },
    
    # Seeker-Specific Drills
    {
        "name": "Claw drill",
        "brief_description": "Seeker catching progression focusing on proper hand position",
        "detailed_description": "Progressive catching drill for seekers focusing on the 'claw' hand position. Start with stationary catches, progress to moving catches. Emphasize proper form and secure grips.",
        "skill_level": ["Beginner", "Intermediate"],
        "complexity": "Low",
        "suggested_length": {"min": 5, "max": 10},
        "skills_focused_on": ["Agility", "Reaction Time"],
        "positions_focused_on": ["Seeker"],
        "drill_type": ["Skill-focus", "Warmup"],
        "visibility": "public",
        "is_editable_by_others": True
    },
    {
        "name": "Leg load and dive",
        "brief_description": "Seeker catching technique with explosive leg drive",
        "detailed_description": "Practice loading the legs and explosive diving for catches. Focus on proper body positioning, leg drive, and safe landing technique. Progress from low dives to full extension.",
        "skill_level": ["Intermediate", "Advanced"],
        "complexity": "Medium",
        "suggested_length": {"min": 5, "max": 10},
        "skills_focused_on": ["Agility", "Speed", "Strength"],
        "positions_focused_on": ["Seeker"],
        "drill_type": ["Skill-focus"],
        "visibility": "public",
        "is_editable_by_others": True
    },
    {
        "name": "Full dive",
        "brief_description": "Advanced seeker catching with full extension dives",
        "detailed_description": "Full commitment diving practice for seekers. Work on reading the snitch's movement, timing the dive, and executing full extension catches. Emphasize safety and proper landing technique.",
        "skill_level": ["Advanced", "Expert"],
        "complexity": "High",
        "suggested_length": {"min": 5, "max": 10},
        "skills_focused_on": ["Agility", "Speed", "Timing", "Decision Making"],
        "positions_focused_on": ["Seeker"],
        "drill_type": ["Skill-focus"],
        "visibility": "public",
        "is_editable_by_others": True
    },
    {
        "name": "1v1 with snitch",
        "brief_description": "Seeker positioning and moves practice against live snitch",
        "detailed_description": "One seeker vs snitch working on: primary moves, setup moves, counter moves, off-hand moves, persistent pursuit, fast pursuit without slowing, and second chance catches. Alternate between slow deliberate practice and intense short reps.",
        "skill_level": ["Intermediate", "Advanced", "Expert"],
        "complexity": "Medium",
        "suggested_length": {"min": 10, "max": 15},
        "skills_focused_on": ["Agility", "Decision Making", "Positioning", "Speed"],
        "positions_focused_on": ["Seeker"],
        "drill_type": ["Skill-focus", "Competitive"],
        "visibility": "public",
        "is_editable_by_others": True
    },
    {
        "name": "2v1 with snitch",
        "brief_description": "Seeker competition skills - jockeying and defensive box outs",
        "detailed_description": "Two seekers compete for catches against one snitch. Practice jockeying for position, defensive box outs, and maintaining awareness of both opponent and snitch. Emphasize clean play and strategic positioning.",
        "skill_level": ["Advanced", "Expert"],
        "complexity": "High",
        "suggested_length": {"min": 10, "max": 15},
        "skills_focused_on": ["Positioning", "Defence", "Agility", "Decision Making"],
        "positions_focused_on": ["Seeker"],
        "drill_type": ["Competitive", "Skill-focus"],
        "visibility": "public",
        "is_editable_by_others": True
    },
    
    # Cool Down Activities
    {
        "name": "Cool down jog",
        "brief_description": "Post-practice recovery jog around the pitch",
        "detailed_description": "Light recovery jog, typically one lap around the pitch. Keep the pace easy and conversational. This helps with active recovery and begins the cool down process.",
        "skill_level": ["New to Sport", "Beginner", "Intermediate", "Advanced", "Expert"],
        "complexity": "Low",
        "suggested_length": {"min": 5, "max": 5},
        "skills_focused_on": ["Conditioning"],
        "positions_focused_on": ["Chaser", "Beater", "Keeper", "Seeker"],
        "drill_type": ["Cooldown"],
        "visibility": "public",
        "is_editable_by_others": True
    },
    {
        "name": "Static stretches and debrief",
        "brief_description": "Team flexibility work and practice discussion",
        "detailed_description": "Team gathers for static stretching routine covering major muscle groups. Coaches lead debrief discussion about practice highlights, areas for improvement, and upcoming plans while athletes stretch.",
        "skill_level": ["New to Sport", "Beginner", "Intermediate", "Advanced", "Expert"],
        "complexity": "Low",
        "suggested_length": {"min": 5, "max": 10},
        "skills_focused_on": ["Communication"],
        "positions_focused_on": ["Chaser", "Beater", "Keeper", "Seeker"],
        "drill_type": ["Cooldown"],
        "visibility": "public",
        "is_editable_by_others": True
    }
]

def main():
    """Main function to create all drills"""
    print("Creating drills for 2025 May 31 GTA Practice Plan")
    print("="*60)
    
    created_drills = []
    failed_drills = []
    
    for drill_data in drills_to_create:
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
        print("\n✓ All drills created successfully!")
        
        # Save the mapping for later use
        id_mapping = {drill['name']: drill['id'] for drill in created_drills}
        with open('drill_id_mapping.json', 'w') as f:
            json.dump(id_mapping, f, indent=2)
        print(f"\nDrill ID mapping saved to drill_id_mapping.json")

if __name__ == "__main__":
    main()