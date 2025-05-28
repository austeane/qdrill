# QDrill Implementation

This section provides technical details and implementation specifics for the QDrill application.

## Contents

- Frontend Implementation
  - Svelte and SvelteKit
  - CSS Implementation
  - State Management
- Backend Implementation
  - API Structure
  - Authentication System
  - Database Operations
  - Service Layer ([See Separate Document](./service-layer.md))
- Testing Strategy
- Deployment Process
- Code Patterns
- [Drag and Drop System](./drag-and-drop.md)
- [Timeline Management](./timeline-management.md)
- [Converting Markdown Practice Plans](./converting-markdown-practice-plans.md)
- [Parallel Timeline Improvements](./parallel-timeline-improvements.md)
- [Position-Based Filtering](./position-filtering.md)

_(Note: A recent [code review](../code-review/holistic-summary.md) assessed the overall implementation. Key findings related to implementation include state management complexity, API scalability/authorization issues, and opportunities for component refactoring. Refer to the code review notes for detailed recommendations.)_

## Frontend Implementation

### Svelte and SvelteKit

QDrill is built with Svelte and SvelteKit, using its file-based routing system and server-side rendering capabilities.

#### Component Structure

- **Script/Markup/Style Pattern**: Components follow Svelte's structure with clear separation
- **Props Handling**: Uses Svelte's prop system with default values and validation
- **Reactivity**: Implements Svelte's reactive declarations and statements

#### CSS Implementation

- **Tailwind CSS**: Utility-first CSS framework
- **Custom Configuration**: Extended Tailwind theme in `tailwind.config.js`
  - Custom colors for brand consistency
  - Extended utilities for animations and interactions
  - Typography plugin for consistent text styling
- **Design Patterns**:
  - Mobile-first responsive design
  - Consistent hover/focus states
  - Accessible contrast ratios

### Drag and Drop System

A sophisticated custom implementation providing intuitive reordering for practice plan items. See [detailed documentation](./drag-and-drop.md) for more information.

#### Key Features

- **Multi-level Drag Support**:
  - Drills within sections
  - Drills between parallel timelines
  - Entire sections within the practice plan
  - Same-timeline reordering with position detection
- **Visual Feedback**:
  - Hover states for drop zones
  - Indicator lines for drop positions (before/after/inside)
  - Disabled states for invalid drop targets
  - Custom colors for timeline elements
- **Technical Implementation**:
  - Uses browser's native drag and drop API
  - Custom store-based state management
  - Throttled event handling for performance
  - Multi-phase error recovery mechanisms
  - Multi-layered item identification strategy

```javascript
// Example from dragManager.js
export function startItemDrag(event, sectionIndex, itemIndex, item, itemId) {
	// Set initial drag state
	dragState.set({
		isDragging: true,
		dragType: 'item',
		sourceSection: sectionIndex,
		sourceIndex: itemIndex,
		itemId: itemId,
		itemName: item.name,
		sourceGroupId: item.parallel_group_id,
		sourceTimeline: item.parallel_timeline,
		draggedElementId: `item-${sectionIndex}-${itemIndex}`
	});

	// Configure dataTransfer
	event.dataTransfer.effectAllowed = 'move';
	// Additional setup...
}
```

### State Management

The application uses Svelte's store pattern extensively.

_(Note: Refer to the [State Management section in Architecture](./../architecture/index.md#state-management) for discussion on store complexity, coupling, and duplication issues identified during the code review.)_

#### Store Implementation

- **Core Principles**:
  - Single source of truth for each domain
  - Immutable update patterns
  - Derived stores for computed values
- **Custom Store Functions**:
  - Factory functions for complex state management
  - Action creators for state modifications
  - Undo/redo capability via history snapshots

## Backend Implementation

### API Structure

SvelteKit's endpoint handlers provide RESTful API functionality.

_(Note: Refer to the [API Design section in Architecture](./../architecture/index.md#api-design) for discussion on scalability, error handling, and authorization issues identified during the code review.)_

#### Implementation Pattern

```javascript
// Example API endpoint pattern
export async function GET({ url, locals }) {
	try {
		// Authentication check
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Request processing
		const queryParams = url.searchParams;
		const results = await db.query('SELECT * FROM items WHERE user_id = $1', [locals.user.id]);

		// Response formatting
		return json({
			items: results.rows,
			total: results.rowCount
		});
	} catch (error) {
		console.error('API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
```

### Authentication System

QDrill implements authentication using SvelteKit Auth with Google OAuth:

#### Implementation Details

- **Auth Provider**: Google OAuth via `@auth/core/providers/google`
- **Database Integration**: PostgreSQL adapter for session persistence
- **Session Enhancement**: Custom session handlers for user data
- **Auth Guards**: Route protection via middleware functions

### Database Operations

PostgreSQL connection with parameterized queries for security:

#### Connection Management

- **Connection Pool**: Shared pool with proper error handling
- **Query Builder**: Parameterized query construction
- **Transaction Support**: For multi-step operations
- **Error Handling**: Comprehensive try/catch with detailed logging

## Testing Strategy

QDrill implements end-to-end testing with Cypress and Playwright:

### Cypress Tests

- **Functional Testing**: Complete user workflows
- **UI Testing**: Component rendering and interactions
- **Test Structure**:
  - Describe/it pattern for test organization
  - Before/after hooks for setup and teardown
  - Custom commands for reusable actions

```javascript
// Example Cypress test
describe('Drill Creation', () => {
	beforeEach(() => {
		cy.visit('/drills/create');
	});

	it('should create a new drill with valid inputs', () => {
		cy.get('[data-cy=drill-name]').type('Test Drill');
		cy.get('[data-cy=drill-description]').type('Test Description');
		// Additional form interactions
		cy.get('[data-cy=submit-button]').click();
		cy.url().should('include', '/drills/');
	});
});
```

### Playwright Tests

- **Cross-browser Testing**: Tests across multiple browser engines
- **Performance Testing**: Load time and responsiveness
- **Visual Testing**: UI consistency checks

## Deployment Process

The application is deployed on Vercel with automatic deployment from GitHub:

### Deployment Workflow

1. Code pushed to GitHub main branch
2. Vercel build triggered automatically
3. SvelteKit adapter builds for Vercel platform
4. Deployment to production environment
5. Environment variables configured in Vercel dashboard

### Database Deployment

- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection Pooling**: Configured for optimal performance
- **Migration Strategy**: Database schema changes via SQL scripts

## Code Patterns

### Error Handling

```javascript
try {
	// Operation that might fail
	const result = await riskyOperation();
	return result;
} catch (error) {
	// Specific error types
	if (error instanceof ValidationError) {
		console.error('Validation failed:', error.message);
		return { error: 'Invalid input data', details: error.details };
	}

	// Generic error fallback
	console.error('Operation failed:', error);
	return { error: 'An unexpected error occurred' };
}
```

### Component Patterns

#### Prop Validation

```javascript
export let item;
export let editable = false;
export let showDetails = true;

// Validation
$: if (!item || !item.id) {
	console.error('DrillItem requires a valid item prop');
}
```

#### Event Handling

```javascript
function handleAction(event) {
	// Prevent default browser behavior
	event.preventDefault();

	// Dispatch custom event
	dispatch('action', {
		id: item.id,
		value: event.target.value
	});
}
```

### Security Practices

- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Content security policies
- **Authentication**: Proper session handling
- **Authorization**: Resource ownership checks
- **Input Validation**: Client and server-side validation
