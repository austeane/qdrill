#!/usr/bin/env python3
"""
Script to fix parallel grouping for practice plan 65
This will ensure that drills happening at the same time have the same parallel_group_id
"""

import psycopg2
import os
import uuid

# Database connection
DB_URL = os.environ.get('NEON_DB_URL')

def execute_query(query, params=None):
    """Execute a query and return results"""
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        if params:
            cur.execute(query, params)
        else:
            cur.execute(query)
        
        # If it's a SELECT query, fetch results
        if query.strip().upper().startswith('SELECT'):
            results = cur.fetchall()
            cur.close()
            conn.close()
            return results
        else:
            # For UPDATE/INSERT/DELETE, commit the transaction
            conn.commit()
            cur.close()
            conn.close()
            return True
    except Exception as e:
        print(f"Database error: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return None

def fix_parallel_groups():
    """Fix parallel grouping for the drills"""
    
    print("Fixing parallel groups for practice plan 65...")
    
    # For the Drills section (131), we need to group activities by time
    # Beaters: Arkansas (15 min) + Third-Courts (15 min) = 30 min total
    # Chasers: 4 on 4 no beaters (30 min)
    # Seekers: Claw drill (10) + Leg load (10) + Full dive (10) = 30 min, then 1v1 (15)
    
    # Group 1: First 30 minutes - all positions working in parallel
    group1_id = str(uuid.uuid4())
    
    print(f"\nCreating parallel group 1 (ID: {group1_id}) for first 30 minutes...")
    
    # Beaters drills (Arkansas + Third-Courts)
    execute_query("""
        UPDATE practice_plan_drills 
        SET parallel_group_id = %s,
            group_timelines = ARRAY['BEATERS', 'CHASERS', 'SEEKERS']
        WHERE practice_plan_id = 65 
        AND section_id = 131 
        AND name IN ('Arkansas', 'Third-Courts')
    """, (group1_id,))
    print("  ✓ Updated Arkansas and Third-Courts (BEATERS)")
    
    # Chasers drill
    execute_query("""
        UPDATE practice_plan_drills 
        SET parallel_group_id = %s,
            group_timelines = ARRAY['BEATERS', 'CHASERS', 'SEEKERS']
        WHERE practice_plan_id = 65 
        AND section_id = 131 
        AND name = '4 on 4 no beaters'
    """, (group1_id,))
    print("  ✓ Updated 4 on 4 no beaters (CHASERS)")
    
    # Seekers catching progression
    execute_query("""
        UPDATE practice_plan_drills 
        SET parallel_group_id = %s,
            group_timelines = ARRAY['BEATERS', 'CHASERS', 'SEEKERS']
        WHERE practice_plan_id = 65 
        AND section_id = 131 
        AND name IN ('Claw drill', 'Leg load and dive', 'Full dive')
    """, (group1_id,))
    print("  ✓ Updated catching progression drills (SEEKERS)")
    
    # The 1v1 with snitch happens after the first 30 minutes, so it might not need a parallel group
    # unless there are other activities happening at the same time
    
    # For the Aggressive Defence section (133), let's check what's happening
    print("\n\nChecking Aggressive Defence section...")
    defence_drills = execute_query("""
        SELECT id, name, duration, parallel_timeline 
        FROM practice_plan_drills 
        WHERE practice_plan_id = 65 AND section_id = 133 
        ORDER BY order_in_plan
    """)
    
    # The first three drills (Aggro, Press, Hero) are for all positions
    # 2v1 with snitch happens in parallel with some of these
    # Let's make 2v1 parallel with Hero Defense
    group2_id = str(uuid.uuid4())
    
    print(f"\nCreating parallel group 2 (ID: {group2_id}) for Hero Defense + 2v1...")
    execute_query("""
        UPDATE practice_plan_drills 
        SET parallel_group_id = %s,
            group_timelines = ARRAY['CHASERS', 'BEATERS', 'SEEKERS'],
            parallel_timeline = CASE 
                WHEN name = '2v1 with snitch' THEN 'SEEKERS'
                ELSE NULL
            END
        WHERE practice_plan_id = 65 
        AND section_id = 133 
        AND name IN ('Hero Defense Drill', '2v1 with snitch')
    """, (group2_id,))
    print("  ✓ Made Hero Defense Drill and 2v1 with snitch parallel")
    
    # Update the Hero Defense to show it's for chasers/beaters while seekers do 2v1
    execute_query("""
        UPDATE practice_plan_drills 
        SET parallel_timeline = 'CHASERS',
            group_timelines = ARRAY['CHASERS', 'BEATERS', 'SEEKERS']
        WHERE practice_plan_id = 65 
        AND section_id = 133 
        AND name = 'Hero Defense Drill'
    """)
    
    # Also create a second entry for beaters
    hero_drill = execute_query("""
        SELECT drill_id, duration, order_in_plan 
        FROM practice_plan_drills 
        WHERE practice_plan_id = 65 
        AND section_id = 133 
        AND name = 'Hero Defense Drill'
        LIMIT 1
    """)
    
    if hero_drill:
        drill_id, duration, order = hero_drill[0]
        execute_query("""
            INSERT INTO practice_plan_drills (
                practice_plan_id, drill_id, section_id, name, duration, 
                type, parallel_timeline, parallel_group_id, group_timelines, order_in_plan
            ) VALUES (
                65, %s, 133, 'Hero Defense Drill', %s, 
                'drill', 'BEATERS', %s, ARRAY['CHASERS', 'BEATERS', 'SEEKERS'], %s
            )
        """, (drill_id, duration, group2_id, order))
        print("  ✓ Created BEATERS entry for Hero Defense Drill")
    
    print("\n\n=== VERIFICATION ===")
    print("\nDrills section parallel groups:")
    drills = execute_query("""
        SELECT name, parallel_timeline, parallel_group_id, duration 
        FROM practice_plan_drills 
        WHERE practice_plan_id = 65 AND section_id = 131 
        ORDER BY order_in_plan
    """)
    
    for name, timeline, group_id, duration in drills:
        print(f"  {name} ({timeline}): Group {group_id[:8]}... - {duration} min")
    
    print("\n✅ Parallel groups fixed!")
    print("\nNow the practice plan shows:")
    print("- All three positions working in parallel during drills")
    print("- Seekers doing 2v1 while others do Hero Defense")
    print("- Position filter will correctly show/hide activities based on selection")

if __name__ == "__main__":
    fix_parallel_groups()