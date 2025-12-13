# Drill Deletion 500 Error

## Summary
Deleting a drill from the UI returns a 500 error with message "Failed to retrieve drill with ID [id]".

## Severity
**HIGH** - Users cannot delete their own drills

## Discovered
December 12, 2025 - Production testing via Playwright MCP browser automation (attempting to delete test drill #178)

## Error Details
```
Failed to delete drill: Failed to retrieve drill with ID 178
```

The error occurs in the `baseEntityService.getById()` catch block, wrapping an underlying database error.

## Steps to Reproduce
1. Navigate to a drill page (e.g., https://www.qdrill.app/drills/178)
2. Click the delete button (must be drill owner/admin)
3. Confirm deletion
4. Observe 500 error

## Root Cause Analysis

### Code Location
- `src/routes/api/drills/[id]/+server.js` - DELETE handler
- `src/lib/server/services/drillService.js` - `deleteDrill()` method
- `src/lib/server/services/baseEntityService.js` - `getById()` method

### The Flow
1. DELETE request hits `/api/drills/[id]`
2. Handler extracts `userId` from `locals.session?.user?.id`
3. Calls `drillService.deleteDrill(drillId, userId)`
4. Service calls `this.getById(id, columns, userId, trx)` for permission check
5. `getById` throws `DatabaseError` wrapping the actual error

### Potential Causes

1. **Session/Auth Issue**
   ```javascript
   // In +server.js
   const session = event.locals.session;
   const userId = session?.user?.id || null;
   ```
   If `locals.session` is not properly set, `userId` would be `null`, which could cause permission check failures.

2. **Permission Check Failure**
   In `baseEntityService.getById()`:
   ```javascript
   if (this.useStandardPermissions && !this.canUserView(entity, userId)) {
     throw new ForbiddenError(...);
   }
   ```
   The error message suggests the entity was found but an error occurred during the permission check.

3. **Database Connection Issue**
   The generic "Failed to retrieve" message wraps the actual database error:
   ```javascript
   throw new DatabaseError(
     `Failed to retrieve ${this.tableName.slice(0, -1)} with ID ${id}`,
     error
   );
   ```
   Need to check Sentry/logs for the actual underlying error.

### Investigation Needed
1. Check Sentry for the actual error details (the wrapped `error` object)
2. Verify `locals.session` is being set correctly in production
3. Test if the issue is specific to certain drills or all drills
4. Check if it's related to drills created by anonymous users vs. authenticated users

## Resolution Steps

### Immediate Investigation
1. Check Sentry error reports for this endpoint
2. Add more detailed logging to capture the underlying error
3. Test deletion of different types of drills (owned, public, etc.)

### Potential Fixes
1. **If auth issue**: Ensure `locals.session` is properly set in `hooks.server.js`
2. **If permission issue**: Check `drillService.permissionConfig` and `canUserView` logic
3. **If database issue**: Check connection pool, query syntax, or constraint violations

### Logging Enhancement
Add better error logging in the DELETE handler:
```javascript
} catch (err) {
  console.error(`[DELETE /api/drills/${id}] Error:`, {
    userId,
    error: err,
    stack: err.stack,
    cause: err.cause
  });
  return handleApiError(err);
}
```

## Related Files
- `src/routes/api/drills/[id]/+server.js` - DELETE handler
- `src/lib/server/services/drillService.js` - Service methods
- `src/lib/server/services/baseEntityService.js` - Base class with `getById`
- `src/hooks.server.js` - Session handling

## Notes
- Test drill #178 created during production testing is stuck and cannot be deleted
- May need database admin intervention to clean up test data
- Consider adding a "force delete" admin feature for such cases
