# QDrill Architecture

This section documents the architectural design, patterns, and decisions for the QDrill application.

## Contents

- Component Architecture
- Data Flow
- State Management
- API Design
- Database Schema

## Component Architecture

The QDrill application is built using a modular component architecture focused on reusability and separation of concerns.

### Key Components

_(Note: A recent code review identified several components, such as `ExcalidrawWrapper` and `PracticePlanForm`, as having high complexity and handling multiple concerns. The use of `ExcalidrawWrapper` also introduces a React dependency into the Svelte project. Refactoring these into smaller, focused components is recommended. See `code-review/` for details.)_

#### Base Components

- **Breadcrumb**: Navigation breadcrumb component for site navigation
- **Cart**: Manages selected drills for practice plan creation
- **Comments**: Allows users to comment on drills and practice plans
- **FeedbackButton/FeedbackModal**: User feedback submission system
- **FilterPanel**: Advanced filtering interface for drills
- **LoginButton**: Authentication interface component
- **Spinner**: Loading indicator for asynchronous operations
- **ThreeStateCheckbox**: Enhanced checkbox with intermediate state
- **UpvoteDownvote**: Voting component for drills and comments

#### Practice Plan Components

**Items**:

- **DrillItem**: Individual drill representation in practice plans
- **ParallelGroup**: Container for position-specific parallel timelines
- **TimelineColumn**: Column within a parallel group for specific positions

**Modals**:

- **DrillSearchModal**: Interface for searching and selecting drills
- **EmptyCartModal**: Alert when attempting to create plan with empty cart
- **TimelineSelectorModal**: Interface for configuring parallel timelines

**Sections**:

- **SectionContainer**: Groups related drills in a practice plan
- **SectionHeader**: Section header with editing capabilities

### Component Hierarchies

1. **Practice Plan Editor Flow**:

   - SectionContainer → DrillItem/ParallelGroup
   - ParallelGroup → TimelineColumn → DrillItem
   - Modals provide user interactions for drill selection and timeline configuration

   See the [drag-and-drop implementation](/docs/implementation/drag-and-drop.md) for details on the interactive movement of these components.

2. **Drill Management Flow**:
   - FilterPanel → Drill listings
   - Cart component for collecting drills before plan creation

## Data Flow

The application follows a unidirectional data flow pattern with Svelte's reactive store system as the central state management mechanism.

### Primary Data Flows

1. **Drill Selection Flow**:

   - User browses/filters drills → Adds to cart → Creates practice plan
   - Cart persists across pages via localStorage

2. **Practice Plan Building Flow**:

   - Sections contain items (drills, breaks)
   - Items can be grouped into parallel timelines (position-specific activities)
   - Drag-and-drop system for organizing items
   - History tracking for undo/redo functionality

3. **Authentication Flow**:
   - Login via Google OAuth
   - Session management for protected operations
   - Authorization checks for content ownership

## State Management

QDrill uses Svelte's store pattern for state management with specialized stores for different application concerns.

_(Note: The code review identified significant complexity and tight coupling in several key stores, particularly `sectionsStore` and `practicePlanStore`. State duplication exists between the practice plan wizard (`wizardStore`) and the main form/cart (`practicePlanStore`, `sectionsStore`), leading to maintenance challenges. Components are often tightly coupled to specific store implementations, hindering reusability. The `dragStore` appears unused. Refactoring state management for better separation of concerns, reduced coupling, and eliminating duplication is a key recommendation. See `code-review/` for details.)_

### Key Stores

- **cartStore**: Manages selected drills using localStorage for persistence
- **dragStore/dragManager**: Implements complex drag-and-drop functionality
- **sectionsStore**: Core practice plan state management with sections, timelines, parallel groups
- **practicePlanStore**: Manages overall practice plan metadata and operations
- **wizardStore/wizardValidation**: Multi-step practice plan creation wizard state
- **drillsStore**: Drill data and filtering operations
- **historyStore**: Undo/redo functionality with state snapshots
- **feedbackStore**: User feedback submission and management

### State Management Patterns

- **Reactive Declarations**: Using Svelte's `$store` syntax for subscribing to state changes
- **Immutable Updates**: State modifications use spread operators for immutable updates
- **Local Storage Persistence**: Critical user state persists between sessions
- **History Tracking**: State snapshots for undo/redo capabilities
- **Store Interactions**: Coordinated updates between interdependent stores (e.g., dragStore, sectionsStore, and historyStore during drag operations)
- **Error Recovery**: State backups before complex operations with restoration on error

## API Design

QDrill implements a RESTful API structure with consistent patterns for operations.

_(Note: The code review highlighted several areas for improvement in the API design and implementation. Key findings include scalability bottlenecks due to reliance on client-side filtering/sorting for major entities (drills, practice plans), inconsistent error handling approaches across different endpoints, missing or inconsistent authorization checks (including risky `dev` mode bypasses), some non-standard REST conventions, and instances where API routes bypass the service layer or shared database connection pool. Addressing these issues, particularly implementing server-side pagination/filtering/sorting and strengthening authorization, is crucial for scalability and security. See `code-review/` for details.)_

### API Endpoints Structure

- **/api/drills/**

  - GET: List/search drills
  - POST: Create new drill
  - PUT/PATCH: Update drill
  - DELETE: Remove drill
  - Specialized endpoints for filtering, searching, and variations

- **/api/practice-plans/**

  - CRUD operations for practice plans
  - Specialized endpoints for duplication and sharing

- **/api/auth/**

  - Authentication endpoints for Google OAuth
  - Session management

- **/api/feedback/**

  - Feedback submission and management
  - Voting on feedback items

- **/api/votes/**
  - Voting operations for drills and comments

### API Design Patterns

- **Standardized Responses**: Consistent JSON response structure
- **Error Handling**: Proper HTTP status codes with descriptive messages
- **Authorization**: Endpoint protection for authenticated operations
- **Pagination**: Offset-based pagination for list operations

## Database Schema

The application uses PostgreSQL (Neon) with a relational schema.

### Key Tables

- **drills**: Stores drill information (name, descriptions, skill levels, etc.)
- **skills**: Tracks skills focused on in drills
- **practice_plans**: Practice plan metadata
- **sections**: Practice plan organizational sections
- **items**: Individual items within practice plan sections
- **users**: User authentication and profile information
- **feedback**: User-submitted feedback
- **votes**: Voting records for drills and feedback
