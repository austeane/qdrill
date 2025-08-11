# Technical Debt - Season Planning Implementation

## Overview
This document tracks technical debt discovered during the season planning feature implementation. These items don't block feature development but should be addressed in batch for system health.

## Database Schema Issues

### 1. ✅ Missing 'role' column in users table [COMPLETED]
- **Issue**: The application expects a 'role' column on the users table but it doesn't exist
- **Impact**: Non-critical - gracefully falls back to 'user' role
- **Location**: `/src/hooks.server.js:36` and `/src/lib/auth.js:31`
- **Error**: `error: column "role" does not exist`
- **Fix**: Add migration to create role column with default value 'user'
- **Resolution**: Applied migration on 2025-08-11
```sql
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';
```

## Code Quality Issues

### 2. Unused export properties in Svelte components
- **Issue**: Multiple components have unused export properties
- **Examples**:
  - `/src/routes/+layout.svelte:30` - unused 'data' export
  - `/src/lib/components/ExcalidrawWrapper.svelte:12-13` - unused 'showSaveButton' and 'index' exports
- **Fix**: Convert to `export const` or remove if truly unused

### 3. Accessibility warnings
- **Issue**: Interactive elements missing proper ARIA attributes
- **Examples**:
  - `/src/routes/Header.svelte:131` - menu role needs tabindex
  - `/src/lib/components/FeedbackModal.svelte:98` - '#' is not valid href
- **Fix**: Add proper tabindex and use button elements or valid hrefs

### 4. CSS unused selectors
- **Issue**: Dead CSS code in components
- **Example**: `/src/routes/Header.svelte:553` - `.practice-plans-dropdown > div`
- **Fix**: Remove unused CSS during cleanup pass

## Package Issues

### 5. Missing Svelte exports condition
- **Issue**: `svelte-forms-lib@2.0.1` has svelte field but no exports condition
- **Impact**: Vite warning on every build
- **Fix**: Update package or find alternative

## Authentication & Environment

### 6. Missing Better Auth environment variables for local development
- **Issue**: `.env.development.local` missing BETTER_AUTH_SECRET and BETTER_AUTH_URL
- **Fix**: Add to environment setup:
```env
BETTER_AUTH_SECRET="<generate-secret>"
BETTER_AUTH_URL="http://localhost:3000"
```

## API & Service Layer

### 7. BaseEntityService complexity
- **Issue**: 1000+ line service file mixing many concerns
- **Location**: `/src/lib/server/services/baseEntityService.js`
- **Fix**: Refactor into smaller, focused modules

### 8. Error handling inconsistency
- **Issue**: Mix of try/catch patterns and error codes across services
- **Fix**: Standardize error handling with consistent error codes and messages

## Performance Considerations

### 9. Missing database indexes
- **Issue**: As we add team_id, season_id, etc., need proper indexes
- **Fix**: Add indexes during migration for foreign keys and commonly queried fields

### 10. N+1 query patterns
- **Issue**: Some list views may trigger multiple queries per item
- **Fix**: Implement eager loading where appropriate

## Migration Strategy

### 11. Better Auth migration incomplete
- **Issue**: System is mid-migration from NextAuth to Better Auth
- **Files**: Still references to AUTH_SECRET, NEXTAUTH_URL in some places
- **Fix**: Complete migration and remove old auth code

## Testing Gaps

### 12. Missing test coverage for complex features
- **Areas**: Drag-and-drop, practice plan generation, permissions
- **Fix**: Add comprehensive test suites as features are implemented

## Documentation

### 13. Inline documentation gaps
- **Issue**: Complex business logic lacks explanatory comments
- **Fix**: Add JSDoc comments and inline explanations for complex algorithms

---

## Priority Levels
- **P0**: Breaks functionality (none currently)
- **P1**: Degrades user experience (items 1, 6)
- **P2**: Code quality and maintainability (items 2-5, 7-8)
- **P3**: Performance and optimization (items 9-10)
- **P4**: Nice to have improvements (items 11-13)

## Notes
- Update this document as new technical debt is discovered
- Consider dedicated tech debt sprints between major feature releases
- Items marked P0 or P1 should be addressed before production deployment