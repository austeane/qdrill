# QDrill

A comprehensive web-based application for sports drill management and practice planning.

## Overview

QDrill is a web-based application designed to be a sports drill bank and practice planning tool for a niche sport. The application allows users to create, manage, and share drills, as well as plan practices. The user experience (UX) is a high priority, with an emphasis on smooth, responsive interactions and a modern design. The application is expected to handle up to a few hundred concurrent users and is built with SvelteKit for both frontend and backend.

## Technology Stack

- **Frontend**: Svelte with SvelteKit
- **Backend**: SvelteKit
- **Database**: Neon (PostgreSQL)
- **Authentication**: Auth.js (using Google OAuth)
- **Diagramming**: Excalidraw (via `@excalidraw/excalidraw`, note: includes React dependency)
- **Rich Text Editing**: TinyMCE
- **Deployment**: Hosted on Vercel
- **CSS**: Tailwind CSS
- **Testing**: Vitest (unit), Playwright and Cypress (end-to-end)

## Core Features

### 1. Drill and Formation Management

- **Form-Based Drill Creation**: Users can create new drills via a form interface. Each drill will have the following attributes:
  - Name (required)
  - Brief description (required)
  - How to teach it/detailed description
  - Skill level required (required)
  - Complexity to explain
  - Suggested length of time (required)
  - Number of people required
  - Skills focused on (required)
  - Positions focused on (required)
  - Video link to drill
  - Images of drill
- **Dynamic URL Generation**: Each drill will automatically be assigned a unique URL upon creation, allowing users to share and access drills directly.
- **Public vs. Private Drills**: Users can choose to make drills public or private. Public drills are accessible by all, while private drills require a specific link. Users can also create public versions of private drills with a different description.

### 2. Drill and Formation Filtering and Viewing

- **Client-Side Filtering**: Drills and formations are currently fetched to the client-side, where filtering occurs. While this provides a responsive feel for smaller datasets, it has been identified as a scalability limitation for larger numbers of items (code review notes).
- **Listing Views**: The main views will display lists of drills or formations, showing their name, attributes, brief description, and indications of any media (pictures/videos).
- **Detail Pages**: Each drill and formation will have a dedicated page showing all of its details. Users can comment on drills, upvote them, or create variations.
- **Formations**: A specialized system for static player positions that can be created, shared, and viewed separately from the dynamic drills.

### 3. Practice Plan Creation and Management

- **Form-Based Practice Planning**: Users can create practice plans by selecting drills based on the number of players, skill levels, practice duration, and skills to focus on. Two primary methods exist: a cart-based approach (adding drills to a cart first) and a step-by-step wizard.
- **Plan Customization**: After selecting drills, users can define additional practice details, including:
  - Practice name
  - Practice goals
  - Phase of the season
  - Number of participants suited for
  - Level of experience suited for
  - Skills focused on
  - Brief overview of practice flow
  - Time dedicated to each drill
  - Breaks between drills
  - Total practice time
- **Public vs. Private Plans**: Similar to drills, practice plans can be published either privately (accessible via link) or publicly. Users can write different overviews for public/private versions if desired.

### 4. User Interaction and Profiles

- **User Accounts**: Users can create accounts via OAuth (e.g., Google). Logged-in users can create, comment on, and upvote drills or practice plans, and create variations.
- **Anonymous Interaction**: Users who are not logged in can still view and vote on drills, and create practice plans, though publishing or saving them for future editing requires logging in.
- **User Profiles**: Profiles can include optional information such as name, team played for, country, and social media links.
- **User Access**: All users will have the same level of access. Each user will have their own private drills and practice plans, and they can save public drills and plans. Users can see the drills and plans they have saved.

### 5. Backend and Data Management

- **Vercel Postgres Database**: Used for storing all application data, including drills, practice plans, user accounts, and comments.
- **API Integration**: The SvelteKit frontend will communicate with the SvelteKit backend via RESTful APIs to manage drill creation, filtering, user management, and more.
- **Media Management**: Images will be hosted directly on the application, while videos will be linked from external sources (e.g., YouTube, cloud storage).

### 6. Deployment and Hosting

- **Frontend**: Hosted on Vercel with the custom domain (e.g., qdrill.app).
- **Backend**: Hosted on Vercel's serverless functions or as a separate service if needed, handling API requests and database interactions.

### 7. Testing and Quality Assurance

- **Vitest**: Used for unit testing the service layer and other backend functionality.
- **Playwright**: Used for end-to-end testing.
- **Cypress**: Used for additional end-to-end testing to ensure the entire user flow, from drill creation to practice plan publishing, works smoothly.

### 8. UX and Design

- **Design Aesthetic**: The design will follow a style similar to Figma, with a clean, minimalist look. The color scheme and fonts will be inspired by Figma, but with an emphasis on ensuring faster loading times and responsive filtering without noticeable delays.
- **Helpful Empty States**: Reusable `EmptyState` component guides users when searches return no results.

## Development

### Getting Started

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Run the development server**:

   ```bash
   vercel dev
   ```

3. **Check TypeScript + SvelteKit sync**:
   ```bash
   pnpm run check
   ```

### Package Management

- **Install dependencies**:

  ```bash
  pnpm install
  ```

- **Add a package**:
  ```bash
  pnpm add <package>
  ```

### Testing

- **Run Playwright tests**:

  ```bash
  pnpm run test
  ```

- **Run a specific test**:

  ```bash
  pnpm test -- tests/test.js
  ```

- **Run Vitest unit tests in watch mode**:

  ```bash
  pnpm run test:unit
  ```

- **Run Vitest unit tests once**:

  ```bash
  pnpm run test:unit:run
  ```

- **Run Vitest unit tests with coverage**:
  ```bash
  pnpm run test:unit:coverage
  ```

### Code Quality

- **Run linting checks**:

  ```bash
  pnpm run lint
  ```

- **Fix formatting issues**:
  ```bash
  pnpm run format
  ```

### Database Migrations

Database schema changes are managed using `node-pg-migrate`.

- **Create a new migration**:

  ```bash
  npx node-pg-migrate create <migration_name>
  ```

  Replace `<migration_name>` with a descriptive name (e.g., `add_user_email_column`).

- **Run migrations**:

  ```bash
  npx node-pg-migrate up
  ```

  This applies all pending migrations. Make sure your `DATABASE_URL` environment variable is set correctly (e.g., in `.env.local` or your shell environment).

- **Rollback the last migration**:
  ```bash
  npx node-pg-migrate down
  ```

### Deployment

Deployment is automatic from the GitHub main branch to Vercel.

## Documentation

Project documentation is organized in two main locations:

1. **`docs/`**: Detailed technical documentation
   - **`Architecture`**: System design, patterns, and architectural decisions
   - **`Implementation`**: Technical details and implementation specifics
     - Drag and Drop System
     - Timeline Management
     - Service Layer Architecture
2. **`code-review/`**: Contains detailed findings and notes from a comprehensive code review conducted to assess codebase health, identify areas for improvement, and align with professional development standards. See `code-review/holistic-summary.md` for an overview.

### Documentation Workflow

When making changes to the codebase:

1. First examine `/docs/index.md` to understand the documentation structure
2. Navigate to the appropriate subdirectory based on the nature of your changes:
   - `/docs/architecture/` for architectural changes or patterns
   - `/docs/implementation/` for implementation details and technical references
3. Update existing documentation files or create new ones as needed
4. Update index files to reference any new documentation

### Documentation Requirements

- Create/update documentation when modifying .js/.svelte files
- Document component descriptions, usage instructions, and relationships
- Maintain documentation consistency for directory structure
- Consider component interdependencies when making changes
- Follow best practices for Svelte documentation

## Code Style Guidelines

- **AI-Readability**: Add clear comments to make code easily understood by future AI systems
- **Comments**: Include purpose explanations, input/output expectations, and logic clarifications
- **Imports**: Group imports by source (svelte, lib, components)
- **Components**: Use Svelte components with script/markup/style structure
- **Stores**: Use reactive declarations with $ prefix for store values
- **Error Handling**: Use try/catch with specific error messages
- **API Endpoints**: Return standardized JSON responses with proper status codes
- **Database**: Use parameterized queries to prevent SQL injection
- **Naming**: Use descriptive camelCase for variables/functions, PascalCase for components
