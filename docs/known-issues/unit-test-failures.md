# Unit Test Failures

## Issue Description

During testing of PR #127 (SQL duplication refactoring), multiple unit test failures were discovered. These failures appear to be pre-existing issues unrelated to the SQL refactoring work.

## Test Summary

- **Total Test Files**: 6 (5 failed, 1 passed)
- **Total Tests**: 167 (43 failed, 122 passed, 2 skipped)

## Failed Test Categories

### 1. UserService Tests

**File**: `src/lib/server/services/__tests__/userService.test.js`

**Key Failures**:

- `getUserByEmail` - Database error handling
- `getUserProfile` - Cannot read properties of undefined (reading 'rows')

**Root Cause**: Mock database client not properly configured for `.rows` property access

### 2. FormationService Tests

**File**: `src/lib/server/services/__tests__/formationService.test.js`

**Key Failures**:

- `updateFormation` - Cannot read properties of undefined (reading 'rows') in `canUserEdit`

**Root Cause**: Permission checking methods expect database result structure not provided by mocks

### 3. PracticePlanService Tests

**File**: `src/lib/server/services/__tests__/practicePlanService.test.js`

**Major Issues**:

- `validatePracticePlan` - Generic error messages instead of specific validation errors
- `getAll` - Cannot read properties of undefined (reading 'leftJoin')
- `createPracticePlan` - Section data validation failures
- `getPracticePlanById` - Failed to fetch practice plan details
- `updatePracticePlan` - SQL query structure validation failures
- `deletePracticePlan` - Failed deletion operations
- `duplicatePracticePlan` - Failed duplication operations

**Root Causes**:

1. Mock Knex query builder incomplete - missing `leftJoin` method
2. Validation error messages changed but tests not updated
3. Section/item data structure expectations mismatch

### 4. DrillService Tests

**File**: `src/lib/server/services/__tests__/drillService.test.js`

**Status**: Some tests passing, specific failures not detailed in output

### 5. SkillService Tests

**File**: `src/lib/server/services/__tests__/skillService.test.js`

**Status**: Tests appear to be passing (based on overall statistics)

## Common Patterns

### 1. Database Mock Issues

Many failures stem from incomplete database mocking:

- Missing `.rows` property on query results
- Incomplete Knex query builder mocks (missing methods like `leftJoin`)
- Mock structure not matching actual database response format

### 2. Validation Message Mismatches

Tests expect specific error messages but services return generic ones:

- Expected: "Name is required"
- Actual: "Practice plan validation failed"

### 3. Permission System Mocking

`canUserEdit` and similar permission methods fail due to:

- Expecting specific database result structure
- Mock not providing required fields

## Recommended Fix Approach

### Phase 1: Fix Database Mocking

1. Update all mock database clients to return proper structure:
   ```javascript
   mockDb.query.mockResolvedValue({ rows: [...] });
   ```
2. Complete Knex query builder mock implementation
3. Ensure mock responses match actual PostgreSQL response format

### Phase 2: Update Validation Tests

1. Review actual validation error messages in services
2. Update test expectations to match current error messages
3. Consider making error messages more specific if currently too generic

### Phase 3: Fix Permission Mocking

1. Review `baseEntityService.canUserEdit` implementation
2. Ensure mocks provide all required fields for permission checks
3. Consider extracting permission logic for easier testing

## Priority

High - Unit tests are critical for maintaining code quality and preventing regressions

## Testing Environment

- Test Runner: Vitest
- Test Date: 2025-07-19
- Branch: `tme4ul-codex/update-ticket-23-refactor-sql-duplication`
- Note: These failures exist in main branch, not introduced by PR #127
