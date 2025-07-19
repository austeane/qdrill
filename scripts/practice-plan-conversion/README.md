# Practice Plan Conversion Scripts

This directory contains Python scripts for creating practice plans in QDrill, demonstrating how to convert traditional text-based practice plans into QDrill's digital format.

## Scripts

### create_practice_plan_template.py

**The main template for creating any practice plan.** This comprehensive template shows how to:

- Create practice plans with proper metadata
- Organize sections and items
- Implement parallel activities for different position groups
- Include formations and tactical elements
- Handle all item types (drills, formations, breaks, activities)

**Usage:**

```bash
# 1. Copy this template
cp create_practice_plan_template.py my_practice_plan.py

# 2. Update drill and formation IDs with your actual IDs
# 3. Modify the practice structure
# 4. Run the script
python my_practice_plan.py
```

### create_practice_plan_drills.py

Creates the 13 specialized drills needed for the GTA practice plan example:

- Arkansas (offensive/defensive fundamentals)
- Triangle Defense & Beater Box (aggressive defensive drills)
- Seek and Catch
- Fast breaks (keeper specific)
- Baylor shooting
- Various beating progressions
- Position-specific fitness activities

### create_aggressive_formations.py

Creates tactical formations for aggressive defensive styles:

- Aggressive Zone Defense
- Diamond Press
- High-Low Split

### create_formation_drills.py

Creates drills specifically designed to practice with formations.

### create_gta_practice_plan_fixed.py

The complete example showing how the 2025 GTA May 31 practice plan was converted, including:

- Proper parallel timeline structure for split activities
- Formation integration
- Correct timing and sections

## Quick Start Guide

To create a new practice plan:

1. **Prepare your drills and formations**

   ```python
   # First, ensure all drills exist in the system
   # Either create them via UI or use the API
   ```

2. **Use the template**

   ```python
   # Copy create_practice_plan_template.py
   # Update the drill_ids and formation_ids dictionaries
   # Modify the sections and items
   ```

3. **Handle parallel activities**

   ```python
   # For activities happening simultaneously:
   {
       "parallel_group_id": "unique_group_id",  # Same for all parallel items
       "parallel_timeline": "BEATERS",          # Timeline label
       "groupTimelines": ["BEATERS"]            # Positions involved
   }
   ```

4. **Run your script**
   ```bash
   python your_practice_plan.py
   ```

## Key Concepts

### Parallel Activities

When different position groups do different activities at the same time:

- All items must have the same `parallel_group_id`
- Each item needs a `parallel_timeline` label
- Include `groupTimelines` array for filtering

### Item Types

- `drill` - Links to existing drill (requires drill_id)
- `formation` - Links to formation (requires formation_id)
- `break` - Water/rest break
- `activity` - One-off activity not in drill database

### Timeline Labels

Standard position group labels:

- `BEATERS`
- `CHASERS`
- `KEEPERS`
- `SEEKERS`
- `CHASERS/KEEPERS` (combined)
- `ALL` (everyone)

## Related Documentation

- **Full Guide**: `/docs/guides/creating-practice-plans-guide.md`
- **Implementation Details**: `/docs/implementation/converting-markdown-practice-plans.md`
- **Original Practice Plan**: `/examples/practice-plans/2025 GTA May 31 Practice Plan.md`
- **Analysis**: `/docs/analysis/2025_gta_may_31_practice_plan_analysis.md`

## Tips

1. Always test with a simple plan first
2. Use consistent parallel_group_id naming (e.g., `split_1330` for 1:30 PM split)
3. Keep drill IDs in a separate file or database for easy reference
4. Document any custom activities for future use
5. Test the practice plan in the UI after creation to verify correct structure
