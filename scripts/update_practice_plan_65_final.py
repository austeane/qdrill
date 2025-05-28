#!/usr/bin/env python3
"""
Script to update practice plan 65 to match the markdown exactly
Including adding formations and updating descriptions
"""

import psycopg2
import os

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

def update_practice_plan():
    """Update practice plan 65 to match the markdown"""
    
    print("Updating practice plan 65 to match the markdown...")
    
    # Step 1: Update drill descriptions to match markdown
    print("\n1. Updating drill descriptions...")
    
    # Update Arkansas description
    execute_query("""
        UPDATE drills 
        SET detailed_description = %s
        WHERE id = 158
    """, (
        "Arkansas (like Oklahomas, but different)\n\n"
        "One defensive free beater vs one offensive engage beater, no dodgeballs. "
        "Engage beater starts a little outside keeper zone, driving with the goal of tagging a hoop. "
        "Free beater's goal is to block engage beater, preventing or delaying their tag.\n\n"
        "Learning objectives:\n"
        "- Defence: Figuring out your preferred blocking technique\n"
        "- Offence: Lateral movement/juking and driving to get through 1.5 defence"
    ,))
    print("  ✓ Updated Arkansas description")
    
    # Update 4 on 4 no beaters description
    execute_query("""
        UPDATE drills 
        SET detailed_description = %s
        WHERE id = 130
    """, (
        "4 on 4 no beaters drill for chasers\n\n"
        "- No beaters for 30 seconds. Progress to 20, 15, 10, 5 seconds\n"
        "- Defence can attempt hoop zone\n"
        "- Offence encouraged to use picks, passes, and hand-offs\n"
        "- Offence must complete 6 good long range passes against an aggressive 2-2. "
        "Once 6 passes have been completed, they must dunk on the defence."
    ,))
    print("  ✓ Updated 4 on 4 no beaters description")
    
    # Step 2: Add formations to the practice plan
    print("\n2. Adding formations to practice plan...")
    
    # First, let's check what sections we have
    sections = execute_query("""
        SELECT id, name, "order" 
        FROM practice_plan_sections 
        WHERE practice_plan_id = 65 
        ORDER BY "order"
    """)
    
    section_map = {name: id for id, name, _ in sections}
    
    # Add formations to the Half Courts section
    if 'Half Courts: Offensive & Defensive Principles' in section_map:
        section_id = section_map['Half Courts: Offensive & Defensive Principles']
        
        # Get the current max order_in_plan for this section
        max_order = execute_query("""
            SELECT COALESCE(MAX(order_in_plan), -1) 
            FROM practice_plan_drills 
            WHERE practice_plan_id = 65 AND section_id = %s
        """, (section_id,))[0][0]
        
        # Add formations at the beginning of the section
        formations_to_add = [
            ("2-2 Defense", 8, "2-2 defensive formation setup", 5),
            ("Kite Offense", 20, "Kite offensive formation", 5),
            ("Hoop Defense", 6, "Hoop defensive formation setup", 5),
            ("Box Offense", 23, "Box offensive formation", 5)
        ]
        
        current_order = 0
        for name, formation_id, description, duration in formations_to_add:
            # Check if formation already exists in this section
            exists = execute_query("""
                SELECT id FROM practice_plan_drills 
                WHERE practice_plan_id = 65 
                AND section_id = %s 
                AND formation_id = %s
            """, (section_id, formation_id))
            
            if not exists:
                execute_query("""
                    INSERT INTO practice_plan_drills (
                        practice_plan_id, section_id, name, type, formation_id, 
                        duration, order_in_plan
                    ) VALUES (%s, %s, %s, 'formation', %s, %s, %s)
                """, (65, section_id, name, formation_id, duration, current_order))
                print(f"  ✓ Added formation: {name}")
                current_order += 1
            
        # Update order of existing items to come after formations
        if current_order > 0:
            execute_query("""
                UPDATE practice_plan_drills 
                SET order_in_plan = order_in_plan + %s
                WHERE practice_plan_id = 65 
                AND section_id = %s 
                AND type != 'formation'
            """, (current_order, section_id))
    
    # Add aggressive defense formations
    if 'Aggressive Styles of Defence' in section_map:
        section_id = section_map['Aggressive Styles of Defence']
        
        # Check and add Aggro, Press, and Hero formations
        aggressive_formations = [
            ("Aggro Defense", 31, "Aggressive 2-2 formation", 3, 0),
            ("Press Defense", 32, "Press defense formation", 3, 2),
            ("Hero Defense", 33, "Hero defense formation", 3, 4)
        ]
        
        for name, formation_id, description, duration, target_order in aggressive_formations:
            # Check if formation already exists
            exists = execute_query("""
                SELECT id FROM practice_plan_drills 
                WHERE practice_plan_id = 65 
                AND section_id = %s 
                AND formation_id = %s
            """, (section_id, formation_id))
            
            if not exists:
                # Insert formation before its corresponding drill
                execute_query("""
                    UPDATE practice_plan_drills 
                    SET order_in_plan = order_in_plan + 1
                    WHERE practice_plan_id = 65 
                    AND section_id = %s 
                    AND order_in_plan >= %s
                """, (section_id, target_order))
                
                execute_query("""
                    INSERT INTO practice_plan_drills (
                        practice_plan_id, section_id, name, type, formation_id, 
                        duration, order_in_plan
                    ) VALUES (%s, %s, %s, 'formation', %s, %s, %s)
                """, (65, section_id, name, formation_id, duration, target_order))
                print(f"  ✓ Added formation: {name}")
    
    # Step 3: Update practice plan metadata
    print("\n3. Updating practice plan metadata...")
    
    execute_query("""
        UPDATE practice_plans 
        SET 
            description = %s,
            practice_goals = %s,
            start_time = '13:00:00'
        WHERE id = 65
    """, (
        "Practice plan for GTA team focusing on reviewing offensive formations (kite and box), "
        "introducing 1.5 concepts, reviewing 2-2 and hoop defense, and introducing aggressive styles of defence. "
        "Location: Iroquois Park Sports Centre - Gordon Rugby Field, 500 Victoria St W, Whitby, ON",
        ["Review offensive formations (kite and box)", "Introduce 1.5 concepts", "Review 2-2 and hoop D", "Introduce aggressive styles of defence"]
    ))
    print("  ✓ Updated practice plan metadata")
    
    # Step 4: Verify the changes
    print("\n4. Verifying changes...")
    
    # Check formations were added
    formations = execute_query("""
        SELECT ppd.name, ppd.section_id, pps.name as section_name
        FROM practice_plan_drills ppd
        JOIN practice_plan_sections pps ON ppd.section_id = pps.id
        WHERE ppd.practice_plan_id = 65 
        AND ppd.type = 'formation'
        ORDER BY ppd.section_id, ppd.order_in_plan
    """)
    
    print("\nFormations in practice plan:")
    for name, _, section in formations:
        print(f"  - {name} (in {section})")
    
    print("\n✅ Practice plan 65 has been updated to match the markdown!")
    print("\nKey updates:")
    print("- Updated drill descriptions for accuracy")
    print("- Added offensive formations (Kite, Box)")
    print("- Added defensive formations (2-2, Hoop)")
    print("- Added aggressive defense formations (Aggro, Press, Hero)")
    print("- Updated practice plan metadata")

if __name__ == "__main__":
    update_practice_plan()