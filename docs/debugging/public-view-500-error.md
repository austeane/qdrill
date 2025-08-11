# Public View Page 500 Error - Debug Report

## Issue Summary
The public season view page at `/seasons/[seasonId]/view?token=[token]` was returning a 500 error when accessed with a valid token.

## Root Causes Found

### 1. Component Prop Mismatch
**File**: `/src/routes/seasons/[seasonId]/view/+page.svelte`
- **Issue**: The page was passing `{practices}` to SeasonTimeline component, but the component expected `existingPractices`
- **Also**: The page was passing `readOnly={true}` but the component expected `isPublicView={true}`

### 2. Database Column Name Mismatch
**File**: `/src/routes/seasons/[seasonId]/view/+page.server.js`
- **Issue**: Query was using `is_published = true` but the actual column is `status` with values 'draft' or 'published'
- **Database Table**: `practice_plans` uses `status VARCHAR(20)` not `is_published BOOLEAN`

## Files Touched During Investigation

### Modified Files
1. `/src/routes/seasons/[seasonId]/view/+page.svelte` - Fixed prop names
2. `/src/routes/seasons/[seasonId]/view/+page.server.js` - Fixed SQL query

### Files Examined
1. `/src/lib/components/season/SeasonTimeline.svelte` - Checked expected props
2. `/src/routes/api/seasons/[seasonId]/share/+server.js` - Verified token handling
3. `/src/lib/server/services/icsService.js` - Checked service implementation
4. `/tmp/vercel-dev.log` - Attempted to find error logs

## Debugging Steps Taken

### 1. Initial Investigation
- Navigated to the public view URL
- Observed 500 error page
- Checked browser console for errors
- Found generic 500 error with no details

### 2. Database Verification
- Tested the SQL query directly in psql:
```sql
SELECT s.*, t.name as team_name, t.timezone, t.default_start_time 
FROM seasons s 
JOIN teams t ON s.team_id = t.id 
WHERE s.id = 'bfa73012-8864-46c6-aee0-885e1de2c462' 
AND s.public_view_token = 'bde3b0c0-de64-4e38-baaf-d9857b5138e2'::uuid;
```
- **Result**: Query worked perfectly, returned 1 row
- **Conclusion**: Database and token validation were not the issue

### 3. Component Analysis
- Examined SeasonTimeline component to understand expected props
- Found it expects `existingPractices` not `practices`
- Found it expects `isPublicView` not `readOnly`
- Discovered the component references `practice.status` field

### 4. Database Schema Discovery
- Checked `practice_plans` table structure with `\d practice_plans`
- Found the table uses `status VARCHAR(20)` not `is_published BOOLEAN`
- Values are 'draft' or 'published'

## Assumptions Made

1. **Initial Assumption**: The error was related to token validation or UUID format
   - **Reality**: Token validation was working fine

2. **Second Assumption**: The database query was failing
   - **Reality**: Query worked when tested directly

3. **Third Assumption**: There might be a server-side rendering issue
   - **Reality**: It was a simple prop name mismatch

## Things Ruled Out

1. ✅ **Token validation** - The SQL query with token worked perfectly
2. ✅ **UUID format issues** - UUIDs were correctly formatted
3. ✅ **Database connection** - Queries executed successfully
4. ✅ **Missing data** - Season, team, and token data all existed
5. ✅ **Server configuration** - Other pages were working fine
6. ✅ **Authentication issues** - Public view shouldn't require auth

## Things It Could Still Be (Before Fix)

1. Component prop mismatches ✅ (This was it!)
2. Database column name differences ✅ (This was also it!)
3. Missing imports or dependencies
4. SSR/hydration issues
5. Middleware interference

## The Fix

### Change 1: Fix Component Props
```svelte
<!-- Before -->
<SeasonTimeline
  {season}
  {practices}
  {markers}
  {sections}
  readOnly={true}
/>

<!-- After -->
<SeasonTimeline
  {season}
  existingPractices={practices}
  {markers}
  {sections}
  isPublicView={true}
/>
```

### Change 2: Fix Database Query
```javascript
// Before
const practicesResult = await query(
  `SELECT * FROM practice_plans 
   WHERE season_id = $1 AND is_published = true 
   ORDER BY scheduled_date, start_time`,
  [seasonId]
);

// After
const practicesResult = await query(
  `SELECT * FROM practice_plans 
   WHERE season_id = $1 AND status = 'published' 
   ORDER BY scheduled_date, start_time`,
  [seasonId]
);
```

## Lessons Learned

1. **Always verify prop names** when passing data between components
2. **Check actual database schema** rather than assuming column names
3. **Component reuse requires careful prop mapping** - The SeasonTimeline component was designed for one context but used in another
4. **500 errors can be simple issues** - Not always complex server problems
5. **Direct SQL testing is valuable** - Quickly ruled out database issues

## Best Guess (Before Finding Solution)

My best guess was that there was a mismatch between what the component expected and what was being provided, either in terms of:
- Prop names (✅ Correct!)
- Data structure
- Database schema (✅ Also correct!)

This turned out to be exactly right - both prop names AND database column names were mismatched.

## Verification

After applying both fixes:
- ✅ Page loads successfully
- ✅ Shows "Public View" indicator
- ✅ Displays season timeline
- ✅ Shows "No practices scheduled yet" (correct since no published practices exist)
- ✅ "Add to Calendar" button is present
- ✅ No console errors

## Future Improvements

1. Add TypeScript or PropTypes to catch prop mismatches at compile time
2. Create shared constants for database column names
3. Add error boundaries with better error messages
4. Implement logging for server-side errors in development
5. Add integration tests for public view pages