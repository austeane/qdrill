# QDrill Project Guide

## Always read AGENTS.md

## Project Overview

QDrill is a web-based application designed as a sports drill bank and practice planning tool for a niche sport. It allows users to create, manage, and share drills, as well as plan practices with timeline-based organization.

## Technology Stack

- **Frontend**: SvelteKit (Svelte 5 with runes enabled — use `$state/$derived/$effect` + `$props`)
- **Backend**: SvelteKit (API routes)
- **Database**: PostgreSQL (via Vercel Postgres/Neon) with Kysely query builder
- **Styling**: Tailwind CSS
- **Authentication**: Better Auth (Google OAuth)
- **Deployment**: Vercel
- **Diagramming**: Excalidraw
- **Testing**: Playwright, Vitest, Cypress
- **AI**: Claude Opus 4.5 for practice plan generation

## Core Features

### Drill Management

- Create, edit, view, and search drills
- Tag drills with skill level, positions, duration
- Upload diagrams/images for drills
- Upvote/downvote and comment on drills
- Create variations of existing drills

### Practice Plan Creation

- Wizard-based practice plan creation
- Section organization with parallel timelines
- Drag-and-drop editing interface
- Duration tracking and management
- Timeline visualization
- Share and duplicate practice plans

### User System

- Google OAuth authentication
- User profiles
- Permission-based access control
- Personal drill/plan management

## Development Commands

- `vercel dev --listen 3000 > /tmp/vercel-dev.log 2>&1 & echo $!` - Start development server with logging (always use this)
- Check logs: `tail -f /tmp/vercel-dev.log` or `cat /tmp/vercel-dev.log`
- `pnpm run check` - Check TypeScript + SvelteKit sync

## Package Management

- `pnpm install` - Install dependencies
- `pnpm add <package>` - Add a package

## Testing

- `pnpm run test` - Run Playwright tests
- `pnpm test -- tests/test.js` - Run a specific test
- `pnpm run test:unit` - Run Vitest unit tests in watch mode
- `pnpm run test:unit:run` - Run Vitest unit tests once
- `pnpm run test:unit:coverage` - Run Vitest unit tests with coverage
- `pnpm run test:unit --run <file-path>` - Run specific Vitest tests once (e.g., `pnpm run test:unit --run src/lib/stores/__tests__/dragManager.test.js`)

## Code Quality

- `pnpm run lint` - Run linting checks
- `pnpm run format` - Fix formatting issues

## Deployment

- Automatic deployment from GitHub main branch to Vercel

## Architecture

### Frontend Components

- Svelte components organized by feature area
- Modular design with reusable components
- Tailwind CSS for styling with custom components
- Interactive drag-and-drop interface for practice planning

### State Management

- Use runes-first state:
  - Component-local state via `$state(...)`
  - Derived values via `$derived(...)` / `$derived.by(...)`
  - Side-effects via `$effect(...)`
  - Shared state in `.svelte.js` / `.svelte.ts` modules (store-like objects/classes with `$state` fields)
- In runes mode, avoid `$store` auto-subscriptions and `svelte/store` in app code.

### API Design

- RESTful API endpoints
- SvelteKit server endpoints (+server.js)
- Standardized response formats
- Parameterized database queries

### Database

- PostgreSQL with connection pooling
- Transaction support for complex operations
- Normalized schema design

#### Database Connection

- **Connection String**: Stored in ~/.zshrc as NEON_DB_URL environment variable
- **Connection Command**: `psql "$NEON_DB_URL"`
- **Project ID**: morning-mountain-82887088
- **Database Name**: verceldb
- **Tables**: drills, practice_plans, practice_plan_sections, practice_plan_drills, users, comments, votes, etc.
- **Query Example**: `psql "$NEON_DB_URL" -c "SELECT COUNT(*) FROM drills;"`

## Key Systems

### Authentication

- Better Auth integration (replaced Auth.js)
- Google OAuth provider
- Session-based authentication via `locals.session` / `locals.user`
- Authorization middleware (`authGuard`, team permission helpers)
- User IDs are strings (TEXT), not integers

### Drag and Drop

- Complex drag-and-drop system for practice plan editing
- State management via Svelte stores
- Multiple drop targets and interactions
- Timeline-based organization
- Visual feedback during drag operations

### Data Filtering

- Client-side filtering for drills
- Multi-criteria filtering
- Performance optimization for large datasets

## Code Style Guidelines

- **AI-Readability**: Add clear comments to make code easily understood by future AI systems
- **Comments**: Include purpose explanations, input/output expectations, and logic clarifications
- **Imports**: Group imports by source (svelte, lib, components)
- **Components**: Use Svelte components with script/markup/style structure
- **Runes**: Prefer `$state/$derived/$effect` + `$props()`; prefer `$app/state` over `$app/stores`
- **Events/Slots**: Use event attributes (`onclick`, `oninput`, …) and snippet props + `{@render ...}` (no `on:` directives, no `<slot>`)
- **Error Handling**: Use try/catch with specific error messages
- **API Endpoints**: Return standardized JSON responses with proper status codes
- **Database**: Use parameterized queries to prevent SQL injection
- **Naming**: Use descriptive camelCase for variables/functions, PascalCase for components

## Areas for Improvement

### 1. Drag and Drop System Consolidation

**Impact: High**

- Currently has two parallel drag-and-drop systems
- Consolidate into a single system with consistent interface
- Implement proper state machine for drag operations
- Reduce code complexity and maintenance burden

### 2. API Data Fetching Abstraction

**Impact: High**

- Direct fetch calls scattered throughout components
- Create unified API client with standard methods
- Implement consistent error handling and retry logic
- Add caching and performance optimizations

### 3. Test Coverage Expansion

**Impact: High**

- Minimal testing despite complex UI interactions
- Add unit tests for store logic (especially drag-and-drop)
- Implement integration tests for key user flows
- Set up CI pipeline with automated testing

### 4. Store Logic Separation

**Impact: Medium**

- Store files mix different concerns (data, filtering, etc.)
- Separate into dedicated modules with single responsibilities
- Move complex logic into utility functions
- Improve maintainability and testability

### 5. Performance Optimization

**Impact: Medium**

- Filtering/sorting recalculates on every store update
- Implement memoization for expensive calculations
- Use web workers for heavy operations
- Optimize filter chains and add virtualization

## Documentation Workflow

- After completing any significant task, ALWAYS follow this documentation workflow:

1. First examine `/docs/index.md` to understand the documentation structure
2. Then navigate to the appropriate subdirectory based on the nature of your changes:
   - `/docs/architecture/` for architectural changes or patterns
   - `/docs/implementation/` for implementation details and technical references
3. Update existing documentation files or create new ones as needed
4. Update index files to reference any new documentation

## Documentation Requirements

- Create/update documentation when modifying .js/.svelte files
- Document component descriptions, usage instructions, and relationships
- Maintain documentation consistency for directory structure
- Consider component interdependencies when making changes
- Follow best practices for Svelte documentation
- Add implementation notes to `/docs/implementation/` for technical patterns
- **README Updates**: Always update the README.md file after completing substantial code edits to reflect the latest changes, features, and usage instructions

## Version Control Guidelines

- **Commit Message Standards**: Write clear, descriptive commit messages explaining what changes were made and why
- **Atomic Commits**: Keep commits focused on a single logical change
- **Pull Request Format**: Include clear descriptions of changes, impact, and testing performed
- **Code Reviews**: Request code reviews for substantial changes
- **No Automatic Commits**: Never commit changes without explicitly being asked to do so
- **Testing Before Commit**: Always run relevant tests before creating a commit
