# QDrill - Full-Stack Sports Practice Planning Platform

## Project Summary

QDrill is a production web application I built solo for managing sports drills and creating practice plans. It serves a niche sports community with features for drill discovery, collaborative sharing, and timeline-based practice planning with drag-and-drop editing.

**Live at:** qdrill.app

## Technical Stack

- **Frontend:** SvelteKit 5, Tailwind CSS, Svelte Stores
- **Backend:** SvelteKit API routes, PostgreSQL (Neon)
- **Auth:** Auth.js with Google OAuth
- **Infrastructure:** Vercel (serverless), database migrations via node-pg-migrate
- **Testing:** Vitest (unit), Playwright & Cypress (E2E)
- **Integrations:** Excalidraw (diagramming), TinyMCE (rich text), AI SDK (Anthropic/OpenAI)

## Key Features I Built

### Drill Management System

- Full CRUD with rich metadata (skill level, duration, positions, complexity)
- Public/private visibility controls with shareable links
- Community features: upvoting, comments, drill variations
- Diagram editor integration using Excalidraw
- Client-side filtering with multi-criteria search

### Practice Plan Builder

- Wizard-based creation flow for selecting drills by criteria
- Drag-and-drop timeline editor with parallel section support
- Real-time duration tracking and visualization
- Undo/redo history with custom state management
- Share and duplicate functionality

### Architecture Highlights

- Custom Svelte store system for complex state (drag-and-drop, history tracking)
- RESTful API design with standardized error handling
- Parameterized queries throughout for SQL injection prevention
- Database schema with proper normalization and transaction support

## Technical Challenges Solved

**Complex Drag-and-Drop:** Built a multi-target drag system for practice timeline editing, managing state transitions and visual feedback across nested drop zones.

**State Management:** Implemented custom store patterns with undo/redo support for the practice plan editor, handling complex nested data structures.

**Real-time Filtering:** Optimized client-side filtering for responsive UX while maintaining code clarity for future server-side migration.

## Development Practices

- Comprehensive documentation (architecture docs, implementation guides)
- Database migrations for schema version control
- Multi-layer testing strategy (unit, integration, E2E)
- ESLint + Prettier for code quality
- CI/CD via Vercel with automatic deployments

## What This Demonstrates

- Full ownership of a production application from concept to deployment
- Modern JavaScript/TypeScript ecosystem proficiency
- Database design and API architecture decisions
- Complex UI state management in component frameworks
- Testing strategy across multiple layers
- Solo project management and technical decision-making

---

_Built as a passion project to solve a real need in a sports community I'm part of._
