# Drill Variations Implementation Plan

## 1. Database Changes

### Schema Updates
    ALTER TABLE drills
    ADD COLUMN parent_drill_id integer REFERENCES drills(id),
    ADD CONSTRAINT chk_parent_drill_id CHECK (id <> parent_drill_id);

### Performance Indexes
    CREATE INDEX idx_drills_parent_drill_id ON drills(parent_drill_id);
    CREATE INDEX idx_drills_upvotes ON drills(upvotes DESC);

## 2. Frontend Components

### DrillForm.svelte Updates
- Add variation checkbox and parent drill selector to the form
- Add logic to fetch potential parent drills
- Update form submission to include variation data
- Add validation for parent_drill_id when variation is selected

### Drill Listing Page Updates
- Modify drill card to show variation count
- Update filtering logic to only show highest-voted variation
- Add variation indicator to drill cards
- Update DrillsStore to handle variation grouping

### Drill Detail Page Updates
- Add variations selector component
- Show all variations of current drill
- Display upvote counts for each variation
- Add "Create Variation" button
- Show relationship to parent drill

## 3. API Routes

### New Endpoints
1. GET /api/drills/:id/variations
   - Fetch all variations of a drill
   - Include parent and sibling variations
   - Sort by upvotes

2. POST /api/drills/:id/variations
   - Create new variation of existing drill
   - Copy relevant fields from parent
   - Set parent_drill_id

### Modified Endpoints
1. GET /api/drills
   - Add variation_count to response
   - Include only highest-voted variations in default listing
   - Add query param to include all variations

2. GET /api/drills/:id
   - Include variation metadata
   - Include references to other variations

## 4. Store Updates

### DrillsStore.js
- Add variation filtering logic
- Group variations by parent_drill_id
- Keep only highest-voted variation in filtered results
- Add derived store for variation counts

## 5. Database Queries

### Main Listing Query
    SELECT d.*
    FROM drills d
    JOIN (
        SELECT COALESCE(parent_drill_id, id) as group_id, MAX(upvotes) as max_upvotes
        FROM drills
        GROUP BY group_id
    ) gv ON COALESCE(d.parent_drill_id, d.id) = gv.group_id AND d.upvotes = gv.max_upvotes

### Variation Fetch Query
    SELECT * FROM drills 
    WHERE parent_drill_id = $1 
    OR id = $1 
    OR parent_drill_id = (SELECT parent_drill_id FROM drills WHERE id = $1)
    ORDER BY upvotes DESC

## 6. Testing Plan

### Unit Tests
- Variation creation and validation
- Upvote handling with variations
- Variation filtering logic
- Parent-child relationship validation

### Integration Tests
- Complete variation creation flow
- Variation switching in UI
- Upvoting between variations
- Listing page variation handling

## 7. Migration Plan

1. Database Updates
   - Back up existing data
   - Add new columns and indexes
   - Update existing records

2. API Updates
   - Deploy new endpoints
   - Update existing endpoints

3. Frontend Updates
   - Deploy form changes
   - Update listing pages
   - Add variation UI components

## 8. Documentation Updates

- Update API documentation with new endpoints
- Add variation creation guide
- Update database schema documentation