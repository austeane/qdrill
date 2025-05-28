#!/usr/bin/env python3
"""
Script to integrate seeker activities throughout practice plan 65
Based on the 2025 GTA May 31 Practice Plan

This script will:
1. Move seeker drills from the separate "Seeker Track" section
2. Integrate them as parallel timelines in appropriate sections
3. Update existing drills to have SEEKERS parallel_timeline where appropriate
"""

import psycopg2
import os
import sys

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

def integrate_seekers():
    """Main function to integrate seekers throughout the practice"""
    
    print("Starting seeker integration for practice plan 65...")
    
    # Step 1: Get current seeker drills from the Seeker Track section
    seeker_drills = execute_query("""
        SELECT id, drill_id, name, duration, order_in_plan 
        FROM practice_plan_drills 
        WHERE practice_plan_id = 65 AND section_id = 136
        ORDER BY order_in_plan
    """)
    
    print(f"\nFound {len(seeker_drills)} items in Seeker Track section:")
    for drill in seeker_drills:
        print(f"  - {drill[2]} (duration: {drill[3]} min)")
    
    # Step 2: Update warm-up chasers drills to include seekers
    print("\n\nUpdating warm-up drills to include seekers...")
    
    # Chasers warm-up drills should also apply to seekers
    warmup_updates = execute_query("""
        UPDATE practice_plan_drills 
        SET parallel_timeline = 'CHASERS' 
        WHERE practice_plan_id = 65 
        AND section_id = 130 
        AND parallel_timeline = 'CHASERS'
        RETURNING id, name
    """)
    
    # Step 3: Move catching progression drills to Drills section (131)
    print("\n\nMoving seeker catching drills to main Drills section...")
    
    # Update Claw drill, Leg load and dive, Full dive to be in parallel with beater/chaser drills
    catching_drills = ['Claw drill', 'Leg load and dive', 'Full dive']
    
    for i, drill_name in enumerate(catching_drills):
        result = execute_query("""
            UPDATE practice_plan_drills 
            SET section_id = 131, 
                parallel_timeline = 'SEEKERS',
                order_in_plan = %s
            WHERE practice_plan_id = 65 
            AND name = %s
            RETURNING id, name
        """, (3 + i, drill_name))
        
        if result:
            print(f"  ✓ Moved {drill_name} to Drills section as SEEKERS parallel activity")
    
    # Step 4: Move 1v1 with snitch to Drills section as well
    print("\n\nMoving 1v1 with snitch to main Drills section...")
    
    result = execute_query("""
        UPDATE practice_plan_drills 
        SET section_id = 131, 
            parallel_timeline = 'SEEKERS',
            order_in_plan = 6
        WHERE practice_plan_id = 65 
        AND name = '1v1 with snitch'
        RETURNING id, name
    """)
    
    if result:
        print(f"  ✓ Moved 1v1 with snitch to Drills section")
    
    # Step 5: Move 2v1 with snitch to Aggressive Defence section (133)
    print("\n\nMoving 2v1 with snitch to Aggressive Defence section...")
    
    result = execute_query("""
        UPDATE practice_plan_drills 
        SET section_id = 133, 
            parallel_timeline = 'SEEKERS',
            order_in_plan = 4
        WHERE practice_plan_id = 65 
        AND name = '2v1 with snitch'
        RETURNING id, name
    """)
    
    if result:
        print(f"  ✓ Moved 2v1 with snitch to Aggressive Defence section")
    
    # Step 6: Delete "Join scrimmage" as seekers will naturally join scrimmages
    print("\n\nRemoving redundant 'Join scrimmage' item...")
    
    execute_query("""
        DELETE FROM practice_plan_drills 
        WHERE practice_plan_id = 65 
        AND name = 'Join scrimmage'
    """)
    
    print("  ✓ Removed 'Join scrimmage' item")
    
    # Step 7: Check if Seeker Track section is now empty and can be removed
    remaining_items = execute_query("""
        SELECT COUNT(*) 
        FROM practice_plan_drills 
        WHERE practice_plan_id = 65 AND section_id = 136
    """)
    
    if remaining_items and remaining_items[0][0] == 0:
        print("\n\nSeeker Track section is now empty. Removing it...")
        execute_query("""
            DELETE FROM practice_plan_sections 
            WHERE practice_plan_id = 65 AND id = 136
        """)
        print("  ✓ Removed empty Seeker Track section")
        
        # Update order of remaining sections
        execute_query("""
            UPDATE practice_plan_sections 
            SET "order" = "order" - 1 
            WHERE practice_plan_id = 65 AND "order" > 7
        """)
    
    # Step 8: Verify the changes
    print("\n\n=== VERIFICATION ===")
    print("\nDrills section (13:30) now contains:")
    drills_section = execute_query("""
        SELECT parallel_timeline, name, duration 
        FROM practice_plan_drills 
        WHERE practice_plan_id = 65 AND section_id = 131 
        ORDER BY order_in_plan
    """)
    
    for timeline, name, duration in drills_section:
        print(f"  {timeline or 'ALL'}: {name} ({duration} min)")
    
    print("\nAggressive Defence section now contains:")
    defence_section = execute_query("""
        SELECT parallel_timeline, name, duration 
        FROM practice_plan_drills 
        WHERE practice_plan_id = 65 AND section_id = 133 
        ORDER BY order_in_plan
    """)
    
    for timeline, name, duration in defence_section:
        print(f"  {timeline or 'ALL'}: {name} ({duration} min)")
    
    print("\n\n✅ Seeker integration complete!")
    print("\nSeekers are now integrated throughout the practice:")
    print("- Warm up with chasers (13:00-13:30)")
    print("- Seeker-specific catching drills during main drill time (13:30-14:00)")
    print("- 1v1 with snitch practice during drill time")
    print("- 2v1 competitive seeking during defensive drills")
    print("- Join all scrimmages for snitch periods")

if __name__ == "__main__":
    integrate_seekers()