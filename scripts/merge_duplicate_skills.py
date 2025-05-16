import os
import psycopg2
from psycopg2 import sql

def get_db_connection():
    db_url = os.environ.get("NEON_DB_URL")
    if not db_url:
        raise ValueError("NEON_DB_URL environment variable not set.")
    return psycopg2.connect(db_url)

def fetch_duplicate_skill_groups(conn):
    """Fetches groups of skills that are duplicates when case is ignored."""
    query = """
        SELECT lower(skill) as lcase_skill, array_agg(skill) as actual_skills,
               sum(usage_count) as total_usage, sum(drills_used_in) as total_drills_used
        FROM skills
        GROUP BY lower(skill)
        HAVING count(*) > 1
        ORDER BY lcase_skill;
    """
    with conn.cursor() as cur:
        cur.execute(query)
        return cur.fetchall()

def merge_skill_group(conn, lcase_skill, actual_skills, total_usage, total_drills_used):
    """Merges one group of duplicate skills."""
    print(f"Processing group: {lcase_skill} (Actual: {actual_skills})")
    canonical_skill = lcase_skill
    # duplicate_skills will be those in actual_skills that are not the canonical_skill (lowercase version)
    # or if the canonical_skill itself was the only one (e.g. if 'Agility' existed but 'agility' did not, 
    # after update, 'agility' is the canonical and 'Agility' is the one to delete)
    duplicate_skills = [s for s in actual_skills if s.lower() == canonical_skill and s != canonical_skill]
    if not duplicate_skills and canonical_skill not in actual_skills: # e.g. actual_skills = ['Agility', 'AGILITY'], canonical = 'agility'
        duplicate_skills = actual_skills


    with conn.cursor() as cur:
        try:
            # Step 1: Update skills_focused_on in the drills table
            # Correctly build nested array_remove calls
            current_array_expression = sql.Identifier("skills_focused_on")
            built_remove_params = []

            # Create a list of unique skills to remove to avoid issues if actual_skills has duplicates (it shouldn't from DB)
            unique_actual_skills_to_remove = sorted(list(set(actual_skills)))

            for skill_to_remove in unique_actual_skills_to_remove:
                current_array_expression = sql.SQL("array_remove({}, %s)").format(current_array_expression)
                built_remove_params.append(skill_to_remove)
            
            # Final expression to add the canonical skill.
            # array_remove is used one last time to ensure canonical_skill is not duplicated if it was
            # already present in lowercase due to a previous partial merge or direct entry.
            update_drill_skills_sql = sql.SQL("""
                UPDATE drills
                SET skills_focused_on = array_append(array_remove({}, %s), %s)
                WHERE skills_focused_on && %s::text[];
            """).format(current_array_expression)
            
            # Parameters for the final array_remove and array_append part
            final_append_params = [canonical_skill, canonical_skill]
            # Parameter for the WHERE clause (check for any of the original skill variations)
            where_param_array = list(set(actual_skills)) # Use set to ensure unique skill names for the ANY check

            all_update_params = built_remove_params + final_append_params + [where_param_array]
            
            # print(f"  Updating drills table for skills: {actual_skills} to {canonical_skill}")
            # print(f"  SQL: {update_drill_skills_sql.as_string(conn)}") # For debugging SQL
            # print(f"  Params: {all_update_params}") # For debugging params

            cur.execute(update_drill_skills_sql, all_update_params)
            print(f"    Drills updated: {cur.rowcount} rows")

            # Step 2: Update the canonical skill record or insert if it doesn't exist
            # This handles the case where the canonical (lowercase) version might not yet exist as a row.
            upsert_canonical_sql = sql.SQL("""
                INSERT INTO skills (skill, usage_count, drills_used_in)
                VALUES (%s, %s, %s)
                ON CONFLICT (skill) DO UPDATE SET
                    usage_count = EXCLUDED.usage_count,
                    drills_used_in = EXCLUDED.drills_used_in;
            """)
            cur.execute(upsert_canonical_sql, (canonical_skill, total_usage, total_drills_used))
            print(f"    Canonical skill '{canonical_skill}' upserted with usage_count={total_usage}, drills_used_in={total_drills_used}.")


            # Step 3: Delete the original (non-canonical) skill records if they are different from canonical
            # Filter duplicate_skills to only include those that are not the canonical_skill itself.
            # This prevents trying to delete the skill we just updated/inserted if it was part of `actual_skills`.
            skills_to_delete = [s for s in actual_skills if s != canonical_skill]

            if skills_to_delete:
                delete_duplicates_sql = sql.SQL("DELETE FROM skills WHERE skill IN %s;")
                # Ensure skills_to_delete is not empty before executing
                cur.execute(delete_duplicates_sql, (tuple(skills_to_delete),))
                print(f"    Original variant skills {skills_to_delete} deleted: {cur.rowcount} rows")
            else:
                print(f"    No distinct original variant entries to delete for '{canonical_skill}'.")

            conn.commit()
            print(f"  Successfully merged group for '{canonical_skill}'.\n")

        except Exception as e:
            conn.rollback()
            print(f"  Error processing group for '{lcase_skill}': {e}")
            # Optionally, re-raise or log more detailed error information
            raise 

def main():
    conn = None
    try:
        conn = get_db_connection()
        duplicate_groups = fetch_duplicate_skill_groups(conn)

        if not duplicate_groups:
            print("No duplicate skill groups found to merge.")
            return

        print(f"Found {len(duplicate_groups)} skill groups to merge.\n")
        for group_data in duplicate_groups:
            lcase_skill, actual_skills, total_usage, total_drills_used = group_data
            
            # Ensure total_usage and total_drills_used are not None (coalesce to 0 if they are)
            # This might happen if a skill was added but never used, though sum() should handle it.
            current_total_usage = total_usage or 0
            current_total_drills_used = total_drills_used or 0
            
            merge_skill_group(conn, lcase_skill, actual_skills, current_total_usage, current_total_drills_used)
        
        print("Successfully merged all identified duplicate skills.")

    except Exception as e:
        print(f"An error occurred during the skill merge process: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main() 