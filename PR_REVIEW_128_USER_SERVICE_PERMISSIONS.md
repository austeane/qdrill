# PR #128: UserService Permissions - SECURITY CRITICAL REVIEW

## Overview
This PR implements user role permissions in the UserService class. However, there are **CRITICAL SECURITY ISSUES** that must be addressed before merging.

## Branch: `tme4ul-codex/update-ticket-17-update-UserService-to-check-permissions`

## Critical Security Issues Found

### 1. **No Admin Role Assignment Mechanism**
- The database migration adds a `role` column with default 'user'
- There is NO mechanism to actually assign 'admin' role to any user
- The `ensureUserExists()` method always uses default 'user' role from auth session
- Without a way to set admin roles, the entire permission system is non-functional

### 2. **Admin Route Protection is Broken**
- `/routes/admin/+layout.server.js` only checks `dev` mode, NOT user roles
- This means admin routes are completely unprotected in production
- Any authenticated user could potentially access admin functions if deployed

### 3. **No Actual Permission Checking**
- The `isAdmin()` method exists but is never called anywhere
- No middleware or route guards use this method
- Admin endpoints have no authorization checks

### 4. **Role Not Populated in Auth Session**
- The auth system (Better Auth) doesn't populate user roles
- `hooks.server.js` calls `ensureUserExists()` but doesn't fetch/populate role
- The role field is never available in `event.locals.user`

### 5. **Insufficient Test Coverage**
- No tests for the new `isAdmin()` method
- No tests for role-based access control
- No integration tests for admin route protection

## Code Analysis

### Migration File Issues
```javascript
// migrations/1752865450_add_role_column_to_users.js
export const up = async (db) => {
    await db.schema.alterTable('users', (table) => {
        table.string('role').defaultTo('user');
    });
};
```
- Only adds column, no way to populate admin roles
- No index on role column for performance

### UserService Issues
```javascript
async isAdmin(userRole) {
    return userRole === 'admin';
}
```
- This is just a string comparison
- Should verify against database
- Method is async for no reason

### Missing Auth Integration
The role needs to be:
1. Fetched from database during auth
2. Added to session/token
3. Available in `event.locals.user.role`
4. Checked in route guards

## Required Fixes Before Merging

### 1. Add Admin Role Assignment
```javascript
// Add method to UserService
async setUserRole(userId, role) {
    // Validate role is allowed
    if (!['user', 'admin'].includes(role)) {
        throw new ValidationError('Invalid role');
    }
    
    // Update user role
    const query = 'UPDATE users SET role = $1 WHERE id = $2 RETURNING *';
    const result = await db.query(query, [role, userId]);
    
    if (result.rows.length === 0) {
        throw new NotFoundError('User not found');
    }
    
    return result.rows[0];
}
```

### 2. Fix Admin Route Protection
```javascript
// src/routes/admin/+layout.server.js
import { userService } from '$lib/server/services/userService';
import { error } from '@sveltejs/kit';

export async function load({ locals }) {
    if (!locals.user) {
        throw error(401, 'Unauthorized');
    }
    
    const isAdmin = await userService.isAdmin(locals.user.role);
    if (!isAdmin) {
        throw error(403, 'Forbidden');
    }
}
```

### 3. Populate Role in Auth Session
```javascript
// In hooks.server.js after getting user
if (sessionResult && sessionResult.user) {
    // Fetch user with role from database
    const dbUser = await userService.getById(sessionResult.user.id);
    
    event.locals.session = {
        ...sessionResult.session,
        user: {
            ...sessionResult.user,
            role: dbUser.role // Add role to session
        }
    };
    event.locals.user = event.locals.session.user;
}
```

### 4. Add Permission Middleware
```javascript
// src/lib/server/auth/permissions.js
export function requireRole(role) {
    return async ({ locals }) => {
        if (!locals.user) {
            throw error(401, 'Unauthorized');
        }
        
        if (locals.user.role !== role) {
            throw error(403, 'Forbidden');
        }
    };
}

export const requireAdmin = requireRole('admin');
```

### 5. Add Comprehensive Tests
```javascript
// src/lib/server/services/__tests__/userService.test.js
describe('isAdmin', () => {
    it('should return true for admin role', async () => {
        const result = await userService.isAdmin('admin');
        expect(result).toBe(true);
    });
    
    it('should return false for user role', async () => {
        const result = await userService.isAdmin('user');
        expect(result).toBe(false);
    });
    
    it('should return false for undefined role', async () => {
        const result = await userService.isAdmin(undefined);
        expect(result).toBe(false);
    });
});

describe('setUserRole', () => {
    // Add tests for role assignment
});
```

## Additional Recommendations

1. **Add Role Management UI**: Create admin interface to manage user roles
2. **Audit Logging**: Log all role changes for security
3. **Role Hierarchy**: Consider more granular permissions beyond just admin/user
4. **Session Invalidation**: Force re-login when roles change
5. **Rate Limiting**: Add rate limiting to admin endpoints

## Files Changed
- `migrations/1752865450_add_role_column_to_users.js` - Adds role column
- `src/lib/server/services/userService.js` - Adds isAdmin() method
- Missing: Auth integration, route protection, tests

## Security Impact
**CRITICAL**: This PR introduces a permission system but doesn't actually implement any security. Admin routes remain unprotected and there's no way to assign admin roles.

## Recommendation
**DO NOT MERGE** until all security issues are addressed. This PR needs significant additional work to be production-ready.

## Next Steps
1. Implement proper admin role assignment
2. Fix admin route protection
3. Integrate roles with auth system
4. Add comprehensive tests
5. Security review after fixes