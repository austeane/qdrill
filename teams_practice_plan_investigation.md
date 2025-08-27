# Teams Create Practice Plan Investigation Report

## Executive Summary
Investigation into issues preventing practice plan creation in the Teams feature. While practices are successfully created in the database, the API returns null, causing the frontend to display "Failed to create practice - no ID returned" error.

## Issues Found and Fixed

### 1. Button Click Handler Issue ✅ FIXED
**Problem:** The Button component wasn't forwarding `on:click` events properly, preventing button clicks from triggering actions.

**Solution:** Added `on:click` event forwarding to the Button component.

**File Changed:** `/src/lib/components/ui/button/button.svelte:57`
```svelte
<!-- Added on:click to forward click events -->
on:click
```

### 2. Missing Filter Support in PracticePlanService ✅ FIXED
**Problem:** The `getByTeamAndDate` method was passing `team_id` and `scheduled_date` filters that weren't being handled in the SQL queries.

**Solution:** Added support for these filters in both the main query and count query.

**Files Changed:** 
- `/src/lib/server/services/practicePlanService.js:129-134` - Added team_id filter
- `/src/lib/server/services/practicePlanService.js:235-240` - Added team_id to count query

### 3. Database Schema Mismatch - is_published Column ✅ FIXED
**Problem:** Code was trying to insert into `is_published` column which doesn't exist in the database.

**Solution:** 
- Removed `is_published` from insert statements
- Disabled publish/unpublish methods until schema is updated

**Files Changed:**
- `/src/lib/server/services/practicePlanService.js:1348` - Removed is_published
- `/src/lib/server/services/practicePlanService.js:1355-1361` - Updated INSERT statement
- `/src/lib/server/services/practicePlanService.js:1453, 1487` - Disabled publish/unpublish methods

### 4. PostgreSQL Array Format Issue ✅ FIXED
**Problem:** `practice_goals` was being JSON.stringified but PostgreSQL expects native array format.

**Solution:** Pass array directly instead of JSON string.

**File Changed:** `/src/lib/server/services/practicePlanService.js:1367`
```javascript
// Before: JSON.stringify(planData.practice_goals)
// After: planData.practice_goals || []
```

## Current Issue - API Returns NULL ❌ NOT FIXED

### Symptoms
1. Practice creation button shows "Creating..." then errors with "Failed to create practice - no ID returned"
2. Console logs show: `Created practice plan: NO ID null`
3. Database query confirms practice IS created (e.g., ID: 73)

### Root Cause Analysis

The issue occurs in the following call chain:

1. **API Endpoint** (`/api/seasons/[seasonId]/instantiate/+server.js`)
   - Calls `seasonUnionService.instantiatePracticePlan()`
   - Returns the result via `json(practicePlan, { status: 201 })`

2. **SeasonUnionService** (`seasonUnionService.js`)
   - Creates union structure with sections and drills
   - Calls `practicePlanService.createWithContent(unionData, userId)`
   - Returns the result

3. **PracticePlanService.createWithContent** (`practicePlanService.js`)
   - Uses `withTransaction()` to wrap all operations
   - Successfully creates practice plan (verified in DB)
   - Creates sections and drills
   - Calls `this.getByIdWithContent(plan.id)` to return full data
   - **THIS IS WHERE IT FAILS** - returns null

4. **PracticePlanService.getByIdWithContent** (`practicePlanService.js:1291`)
   - Also uses `withTransaction()` 
   - Tries to SELECT the just-created practice plan
   - **Cannot find the record** - returns null

### The Problem: Transaction Isolation

The issue is a classic transaction isolation problem:
- `createWithContent` creates the practice in Transaction A
- Before Transaction A commits, it calls `getByIdWithContent`
- `getByIdWithContent` starts its own Transaction B
- Transaction B cannot see uncommitted data from Transaction A
- Result: `getByIdWithContent` returns null

### Evidence
```sql
-- Database shows practice was created:
SELECT id, name, scheduled_date FROM practice_plans 
WHERE team_id IS NOT NULL AND scheduled_date = '2025-02-15';
-- Returns: ID 73, "Practice - 2/14/2025", 2025-02-15
```

## Proposed Solutions

### Solution 1: Fix Transaction Nesting (Recommended)
Modify `getByIdWithContent` to accept an optional transaction client:

```javascript
PracticePlanService.prototype.getByIdWithContent = async function(planId, client = null) {
  if (client) {
    // Use provided client (same transaction)
    return await this._getByIdWithContentImpl(client, planId);
  } else {
    // Create new transaction
    return await this.withTransaction(async (client) => {
      return await this._getByIdWithContentImpl(client, planId);
    });
  }
};
```

Then in `createWithContent`, pass the same client:
```javascript
return await this.getByIdWithContent(plan.id, client);
```

### Solution 2: Return Data Directly
Instead of re-fetching, build the return object directly in `createWithContent`:

```javascript
// After creating everything, return the assembled object
return {
  ...plan,
  sections: createdSections,
  drills: createdDrills
};
```

### Solution 3: Remove Nested Transaction
Simply don't use a transaction in `getByIdWithContent`:

```javascript
PracticePlanService.prototype.getByIdWithContent = async function(planId) {
  const client = await db.getClient();
  try {
    // Query without transaction
    const planResult = await client.query(...);
    // ...
  } finally {
    client.release();
  }
};
```

## Testing Checklist

- [x] Verify practices are created in database
- [x] Check button click events are firing
- [x] Confirm API endpoint is called with correct data
- [ ] Fix transaction isolation issue
- [ ] Verify API returns practice plan with ID
- [ ] Test frontend navigation to edit page
- [ ] Test with different dates (within/outside season)
- [ ] Test with overlapping season sections

## Files Modified Summary

1. `/src/lib/components/ui/button/button.svelte` - Fixed event forwarding
2. `/src/lib/server/services/practicePlanService.js` - Multiple fixes for filters and schema
3. `/src/routes/api/seasons/[seasonId]/instantiate/+server.js` - Added logging (temporary)
4. `/src/lib/server/services/seasonUnionService.js` - No changes needed

## Next Steps

1. Implement Solution 1 (fix transaction nesting) 
2. Test the fix with practice creation
3. Remove temporary console.log statements
4. Test Create Team dialog functionality
5. Verify full practice creation and editing flow

## Additional Notes

- Season date validation is working correctly
- Authentication and permission checks are functioning
- Database schema needs `is_published` column added for future publish feature
- Consider adding better error messages for user feedback