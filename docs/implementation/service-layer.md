# Service Layer Architecture

This document describes the service layer architecture implemented for QDrill. The service layer provides a clean separation between API endpoints and database operations, improving code organization, reusability, and maintainability.

## Overview

The service layer pattern centralizes business logic and data access in specialized service classes, separating these concerns from the API routes. This architecture was first implemented with the Formations feature and provides a blueprint for future development.

## Key Components

### BaseEntityService

The `BaseEntityService` class provides a foundation for entity-specific services with common CRUD operations:

```javascript
export class BaseEntityService {
  constructor(tableName, primaryKey = 'id', defaultColumns = ['*']) {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.defaultColumns = defaultColumns;
  }

  // Common operations like getAll, getById, create, update, delete
  async getAll(options = {}) { /* ... */ }
  async getById(id, columns = this.defaultColumns) { /* ... */ }
  async create(data) { /* ... */ }
  async update(id, data) { /* ... */ }
  async delete(id) { /* ... */ }
  async exists(id) { /* ... */ }
  async search(searchTerm, searchColumns, options = {}) { /* ... */ }
}
```

### Entity-Specific Services

Entity-specific services extend the BaseEntityService and implement domain-specific functionality:

```javascript
export class FormationService extends BaseEntityService {
  constructor() {
    super('formations', 'id', ['*']);
  }

  // Formation-specific methods
  async createFormation(formationData, userId = null) { /* ... */ }
  async updateFormation(id, formationData) { /* ... */ }
  async searchFormations(searchTerm, options = {}) { /* ... */ }
  
  // Helper methods
  normalizeFormationData(data) { /* ... */ }
}
```

## Benefits

1. **Code Reusability**: Common operations are defined once in the base service
2. **Consistent Error Handling**: Standardized approach across all entities
3. **Simplified API Endpoints**: Routes focus on request/response handling, not data logic
4. **Improved Testability**: Service methods can be tested in isolation
5. **Cleaner Abstractions**: Clear separation of concerns
6. **Future Extensibility**: Easy to add new entity types following the same pattern

## Implementation Details

### Database Connection

All services use a shared database connection layer (`db.js`) for consistent handling:

```javascript
// Database connection from db.js
export async function query(text, params) {
  const client = await getPool().connect();
  try {
    const res = await client.query(text, params);
    return res;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  } finally {
    client.release();
  }
}
```

### API Integration

API endpoints use service instances to handle business logic:

```javascript
// Example API endpoint using service layer
export async function GET({ url }) {
  const searchTerm = url.searchParams.get('q') || '';
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = parseInt(url.searchParams.get('limit')) || 10;
  
  try {
    const result = await formationService.searchFormations(searchTerm, {
      page, limit
    });
    
    return json(result);
  } catch (error) {
    console.error('Error searching formations:', error);
    return json(
      { error: 'An error occurred', details: error.message },
      { status: 500 }
    );
  }
}
```

## Implementation Plan

### Priority Ranking (Impact vs. Difficulty)

1. **DrillService** - ⭐⭐⭐⭐⭐
   - Impact: High (core functionality, many endpoints, complex logic)
   - Effort: 4-5 days
   - Key benefits: Centralizes complex filtering, standardizes drill operations, addresses most duplicated code

2. **PracticePlanService** - ⭐⭐⭐⭐
   - Impact: High (complex entity relationships, timeline management)
   - Effort: 5-6 days
   - Key benefits: Separates timeline logic from API, improves transaction handling

3. **UserService** - ⭐⭐⭐
   - Impact: Medium-High (auth integration, permission management)
   - Effort: 2-3 days
   - Key benefits: Consistent permission checks, simplified API endpoints

4. **SkillService** - ⭐⭐
   - Impact: Medium (simpler model but frequent usage)
   - Effort: 1-2 days
   - Key benefits: Quick win with low complexity

5. **CommentService** - ⭐⭐
   - Impact: Medium (improves consistency in comment handling)
   - Effort: 1-2 days
   - Key benefits: Standardized CRUD operations, better validation

6. **VoteService** - ⭐
   - Impact: Medium-Low (limited functionality)
   - Effort: 1-2 days
   - Key benefits: Handles race conditions, standardizes voting operations

### Implementation Status

#### DrillService

**Implementation Status: Completed**

1. ✅ Created DrillService class extending BaseEntityService
2. ✅ Implemented drill-specific methods:
   ```javascript
   async createDrill(drillData, userId)
   async updateDrill(id, drillData, userId) 
   async deleteDrill(id, userId)
   async getDrillWithVariations(id)
   async createVariation(parentId, variationData, userId)
   async searchDrills(searchTerm, options)
   async getFilteredDrills(filters, options)
   async getDrillNames()
   async setAsPrimaryVariant(drillId, userId)
   async canUserEditDrill(drillId, userId)
   async updateSkillCounts(skillsToAdd, skillsToRemove, drillId)
   async updateSkills(skills, drillId)
   ```
3. ✅ Implemented normalizeDrillData() with comprehensive validation
4. ✅ Added transaction support for variant operations
5. ✅ Added permission checks for edit/delete actions
6. ✅ Exported singleton instance for use across API endpoints
7. ✅ Added comprehensive unit tests with Vitest

**Next Steps:**
- Refactor remaining API endpoints to use the service:
  - `/api/drills/[id]/upvote/+server.js`
  - `/api/drills/[id]/set-variant/+server.js`
  - `/api/drills/associate/+server.js`
  - `/api/drills/filter-options/+server.js`
  - `/api/drills/bulk-upload/+server.js`
  - `/api/drills/import/+server.js`
  - `/api/drills/migrate-diagrams/+server.js`

**Dependencies:**
- BaseEntityService
- SkillService (for skill updates)

#### PracticePlanService

**Implementation Status: Completed**

1. ✅ Created PracticePlanService class extending BaseEntityService
2. ✅ Implemented integrated section management rather than separate services
3. ✅ Implemented practice plan-specific methods:
   ```javascript
   async getAll(options)
   async createPracticePlan(planData, userId)
   async getPracticePlanById(id, userId)
   async updatePracticePlan(id, planData, userId)
   async deletePracticePlan(id, userId)
   async duplicatePracticePlan(id, userId)
   async validatePracticePlan(plan)
   ```
4. ✅ Implemented helper methods for data formatting and calculations:
   ```javascript
   formatDrillItem(item)
   calculateSectionDuration(items)
   ```
5. ✅ Added transaction support for section and drill management
6. ✅ Added proper permission checks for view/edit/delete operations
7. ✅ Exported singleton instance for use across API endpoints
8. ✅ Refactored API endpoints to use the service
9. ✅ Added comprehensive unit tests with Vitest

**Next Steps:**
- Further refine timeline management logic

**Dependencies:**
- BaseEntityService
- DrillService (for drill references)

#### FormationService

**Implementation Status: Completed**

1. ✅ Created FormationService class extending BaseEntityService
2. ✅ Implemented formation-specific methods:
   ```javascript
   async createFormation(formationData, userId)
   async updateFormation(id, formationData)
   async searchFormations(searchTerm, options)
   async getFormationsByUser(userId, options)
   ```
3. ✅ Implemented normalizeFormationData() with validation
4. ✅ Exported singleton instance for use across API endpoints
5. ✅ Refactored API endpoints to use the service
6. ✅ Added unit tests for formation operations

**Dependencies:**
- BaseEntityService

#### UserService

**Implementation Status: Planned**

1. Create UserService class extending BaseEntityService
2. Implement user-specific methods:
   ```javascript
   async getUserByEmail(email)
   async getUserProfile(userId)
   async isAdmin(userId)
   async canUserPerformAction(userId, actionType, entityType, entityId)
   ```
3. Create integration with Auth.js
4. Refactor user-related API endpoints to use service

**Implementation Details:**
- Use Auth.js users table structure
- Build methods for retrieving user-created content
- Add admin role checking
- Create centralized permission management

**Dependencies:**
- BaseEntityService
- Auth.js integration

#### SkillService

**Implementation Status: Planned**

1. Create SkillService class extending BaseEntityService
2. Implement skill-specific methods:
   ```javascript
   async getAllSkills(options)
   async updateSkillCounts(skillsToAdd, skillsToRemove, drillId)
   async getSkillsForDrill(drillId)
   async getMostUsedSkills(limit)
   ```
3. Refactor drill-related skill operations to use this service

**Implementation Details:**
- Centralize skill management across drill operations
- Create methods for tracking usage statistics
- Add skill filtering and recommendation functionality

**Dependencies:**
- BaseEntityService

### Testing Benefits

- **Isolation**: Testing business logic separate from API endpoints
- **Mocking**: Database operations can be mocked more easily
- **Edge Cases**: Better testing of validation and error handling
- **Unit Tests**: Focused tests for service functions without API overhead
- **Integration Tests**: Simpler setup with standardized service interfaces

### Unit Testing Implementation

Unit tests have been implemented for all service layer classes using Vitest:

1. **BaseEntityService Tests**:
   - Constructor and initialization tests
   - Column validation and sort order tests
   - Array field normalization tests
   - Timestamp handling tests
   - Error handling and transaction management tests

2. **DrillService Tests**:
   - Data normalization tests
   - CRUD operations tests
   - Permission checking tests
   - Drill variation management tests
   - Skill association tests
   - Search and filtering tests
   - User authorization tests

3. **PracticePlanService Tests**:
   - Duration calculation tests with parallel timelines
   - Data formatting tests
   - Plan validation tests
   - Section management tests
   - Duplication logic tests
   - Timeline organization tests

4. **FormationService Tests**:
   - Data normalization tests
   - CRUD operations tests
   - Diagram data validation tests

Additionally, API endpoint tests have been implemented to test the integration between API routes and the service layer:

1. **Drill API Tests**:
   - GET/POST/PUT/DELETE endpoint tests
   - Search functionality tests
   - Variation management tests
   - Error handling tests

2. **Practice Plan API Tests**:
   - Plan creation and retrieval tests
   - Plan update and deletion tests
   - Plan duplication tests
   - Permission and authorization tests

All tests can be run using:
- `pnpm run test:unit:run` - Run all unit tests
- `pnpm run test:unit` - Run tests in watch mode
- `pnpm run test:unit:coverage` - Run tests with coverage reporting

### Implementation Approach

1. **Incremental Migration**:
   - Implement one service at a time
   - Keep dual implementation during transition
   - Test thoroughly before removing old code

2. **Common Patterns**:
   - Use consistent method naming across services
   - Follow the same error handling pattern
   - Return standardized response objects

3. **Transaction Management**:
   - Add transaction support for multi-entity operations
   - Ensure proper rollback on errors
   - Consider adding transaction management to BaseEntityService

## Immediate Next Steps

### 1. Complete DrillService API Integration

**Priority: High**
**Effort: 1-2 days**

- Refactor remaining drill API endpoints to use DrillService
- Focus on endpoints in `/api/drills/` that still use direct DB access
- Prioritize high-traffic endpoints (upvote, search, filter)
- Ensure consistent error handling across all endpoints

### 2. Implement UserService

**Priority: High**
**Effort: 2-3 days**

- Create UserService based on Auth.js integration
- Implement profile management functionality
- Create centralized permission checking methods
- Refactor user-related API endpoints

### 3. Implement SkillService

**Priority: Medium**
**Effort: 1-2 days**

- Create SkillService with skill management methods
- Refactor DrillService to use SkillService
- Implement skill statistics and recommendations

### 4. Enhance BaseEntityService 

**Priority: Medium**
**Effort: 1-2 days**

- Add caching support for frequently accessed data
- Implement advanced filtering capabilities
- Add event emitters for entity lifecycle events
- Improve transaction management

## Future Improvements

1. **Caching Layer**: Implement caching for frequently accessed data
2. **Advanced Filtering**: Enhance query building for complex filter conditions
3. **Event System**: Add event emitters for entity lifecycle events (create, update, delete)
4. **API Documentation**: Generate OpenAPI documentation from service definitions
5. **Performance Optimization**: Add database indexing strategy and query optimization

## Best Practices

When using the service layer:

1. **Keep Services Focused**: Each service should represent a single entity type
2. **Use Dependency Injection**: Pass dependencies to services rather than creating them internally
3. **Maintain Singleton Instances**: Create a single instance of each service for better resource management
4. **Normalize Data**: Use service methods to normalize data before storing/returning
5. **Comprehensive Error Handling**: Handle and transform database errors into appropriate API responses
6. **Consistent Response Format**: Return standardized objects with pagination, metadata, and data
7. **Testable Units**: Design services to be easily testable with mock dependencies