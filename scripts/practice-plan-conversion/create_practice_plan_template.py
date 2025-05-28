#!/usr/bin/env python3
"""
Template for creating QDrill practice plans from markdown/text plans.

This template demonstrates all the key features:
- Basic practice plan metadata
- Section organization
- Different item types (drills, formations, breaks, activities)
- Parallel activities for different position groups
- Proper timeline labeling

Usage:
1. Update the drill_ids dictionary with actual drill IDs from your system
2. Update the formation_ids dictionary with actual formation IDs
3. Modify the practice plan structure
4. Run: python create_practice_plan_template.py
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
API_URL = "http://localhost:3000/api/practice-plans"

# Example drill and formation IDs - replace with actual IDs from your system
drill_ids = {
    "dodgeball": 100,
    "arkansas": 155,
    "triangle_defense": 156,
    "beater_box": 157,
    "seek_and_catch": 158,
    "fast_breaks_keeper": 159,
    "baylor_shooting": 160,
    "beating_progression_singles": 161,
    "beating_progression_doubles": 162,
    "beating_progression_2v1": 163,
    "beating_progression_hitters": 164,
    "fitness_seekers": 165,
    "conditioning_chasers": 166,
    "endurance_beaters": 167
}

formation_ids = {
    "aggressive_zone": 10,
    "diamond_press": 11,
    "high_low_split": 12
}

def create_practice_plan():
    """
    Example practice plan structure showing all features
    """
    practice_plan_data = {
        # Basic metadata
        "name": "Example Practice Plan - " + datetime.now().strftime("%Y-%m-%d"),
        "description": "Comprehensive practice showing all QDrill features including parallel activities and formations",
        "practice_goals": [
            "Technical Skills",
            "Tactical Understanding",
            "Physical Conditioning",
            "Team Cohesion"
        ],
        "phase_of_season": "In-Season",  # Options: Pre-Season, In-Season, Post-Season, Off-Season
        "estimated_number_of_participants": 18,
        "start_time": "18:00:00",  # Optional, format: HH:MM:SS
        "visibility": "public",  # Options: public, unlisted, private
        "is_editable_by_others": True,
        
        # Sections with various activity types
        "sections": [
            {
                "name": "Arrival & Warmup",
                "order": 0,
                "goals": ["Prepare physically", "Team building"],
                "notes": "Players arrive and get ready",
                "items": [
                    # Simple break
                    {
                        "type": "break",
                        "name": "Arrival & Equipment Check",
                        "duration": 15
                    },
                    # Regular drill
                    {
                        "type": "drill",
                        "drill_id": drill_ids["dodgeball"],
                        "duration": 15,
                        "name": "Dodgeball Warmup"
                    }
                ]
            },
            {
                "name": "Technical Skills",
                "order": 1,
                "goals": ["Improve individual skills", "Position-specific development"],
                "notes": "Focus on fundamentals",
                "items": [
                    # Full team drill
                    {
                        "type": "drill",
                        "drill_id": drill_ids["arkansas"],
                        "duration": 15,
                        "name": "Arkansas - Full Team"
                    },
                    # PARALLEL ACTIVITIES - Different drills for different positions
                    # All items with the same parallel_group_id happen simultaneously
                    {
                        "type": "drill",
                        "drill_id": drill_ids["beating_progression_singles"],
                        "duration": 20,
                        "name": "Beating Progression - Singles",
                        "parallel_group_id": "tech_split_1",  # Unique ID for this parallel group
                        "parallel_timeline": "BEATERS",  # Timeline label
                        "groupTimelines": ["BEATERS"]  # Which positions are involved
                    },
                    {
                        "type": "drill",
                        "drill_id": drill_ids["baylor_shooting"],
                        "duration": 20,
                        "name": "Baylor Shooting Drill",
                        "parallel_group_id": "tech_split_1",  # Same group ID = happens at same time
                        "parallel_timeline": "CHASERS",
                        "groupTimelines": ["CHASERS"]
                    },
                    {
                        "type": "drill",
                        "drill_id": drill_ids["fast_breaks_keeper"],
                        "duration": 20,
                        "name": "Fast Breaks - Keeper Specific",
                        "parallel_group_id": "tech_split_1",
                        "parallel_timeline": "KEEPERS",
                        "groupTimelines": ["KEEPERS"]
                    },
                    # Water break after parallel activities
                    {
                        "type": "break",
                        "name": "Water Break",
                        "duration": 5
                    }
                ]
            },
            {
                "name": "Tactical Development",
                "order": 2,
                "goals": ["Learn formations", "Practice defensive systems"],
                "notes": "Focus on team tactics",
                "items": [
                    # Formation practice
                    {
                        "type": "formation",
                        "formation_id": formation_ids["aggressive_zone"],
                        "duration": 10,
                        "name": "Aggressive Zone Defense Setup"
                    },
                    # Drill that practices the formation
                    {
                        "type": "drill",
                        "drill_id": drill_ids["triangle_defense"],
                        "duration": 15,
                        "name": "Triangle Defense Drill"
                    },
                    # Another formation
                    {
                        "type": "formation",
                        "formation_id": formation_ids["diamond_press"],
                        "duration": 10,
                        "name": "Diamond Press Formation"
                    }
                ]
            },
            {
                "name": "Conditioning",
                "order": 3,
                "goals": ["Physical fitness", "Mental toughness"],
                "notes": "Position-specific conditioning",
                "items": [
                    # Three-way parallel split for conditioning
                    {
                        "type": "drill",
                        "drill_id": drill_ids["endurance_beaters"],
                        "duration": 15,
                        "name": "Beater Endurance Circuit",
                        "parallel_group_id": "conditioning_split",
                        "parallel_timeline": "BEATERS",
                        "groupTimelines": ["BEATERS"]
                    },
                    {
                        "type": "drill",
                        "drill_id": drill_ids["conditioning_chasers"],
                        "duration": 15,
                        "name": "Chaser Sprint Series",
                        "parallel_group_id": "conditioning_split",
                        "parallel_timeline": "CHASERS/KEEPERS",  # Combined group
                        "groupTimelines": ["CHASERS", "KEEPERS"]
                    },
                    {
                        "type": "drill",
                        "drill_id": drill_ids["fitness_seekers"],
                        "duration": 15,
                        "name": "Seeker Agility Work",
                        "parallel_group_id": "conditioning_split",
                        "parallel_timeline": "SEEKERS",
                        "groupTimelines": ["SEEKERS"]
                    }
                ]
            },
            {
                "name": "Cool Down",
                "order": 4,
                "goals": ["Recovery", "Team discussion"],
                "notes": "Wrap up practice",
                "items": [
                    # One-off activity (not in drill database)
                    {
                        "type": "activity",
                        "name": "Team Stretching Circle",
                        "duration": 10
                    },
                    {
                        "type": "break",
                        "name": "Team Meeting & Announcements",
                        "duration": 10
                    }
                ]
            }
        ]
    }
    
    return practice_plan_data

def main():
    """Create the practice plan via API"""
    
    # Get the practice plan data
    plan_data = create_practice_plan()
    
    print(f"Creating practice plan: {plan_data['name']}")
    print(f"Total sections: {len(plan_data['sections'])}")
    
    # Calculate total duration
    total_duration = sum(
        item['duration'] 
        for section in plan_data['sections'] 
        for item in section['items']
        if not item.get('parallel_group_id') or 
           item['parallel_timeline'] == list(sorted(
               [i['parallel_timeline'] for i in section['items'] 
                if i.get('parallel_group_id') == item.get('parallel_group_id')]
           ))[0]
    )
    print(f"Total duration: {total_duration} minutes ({total_duration/60:.1f} hours)")
    
    # Make the API request
    try:
        response = requests.post(API_URL, json=plan_data)
        
        if response.status_code == 201:
            result = response.json()
            print(f"\n✅ Successfully created practice plan!")
            print(f"ID: {result['id']}")
            print(f"URL: http://localhost:3000/practice-plans/{result['id']}")
        else:
            print(f"\n❌ Failed to create practice plan")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"\n❌ Error creating practice plan: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()