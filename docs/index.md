# QDrill Documentation

This directory contains detailed technical documentation for the QDrill project. For project overview, architecture, and development guidelines, see [CLAUDE.md](../CLAUDE.md) in the project root.

## Documentation Structure

- **[Architecture](./architecture/)**: System design, patterns, and architectural decisions
  - Component relationships
  - Data flow
  - State management
  - API design
  - Database schema

- **[Implementation](./implementation/)**: Technical details and implementation specifics
  - [Drag and Drop System](./implementation/drag-and-drop.md)
  - [Timeline Management](./implementation/timeline-management.md)
  - [Service Layer Architecture](./implementation/service-layer.md)
  - Frontend implementation
  - Backend implementation
  - Testing strategy
  - Deployment process
  - Code patterns

## Related Documentation

- **[CLAUDE.md](../CLAUDE.md)**: Project overview, architecture, and development guidelines
  - Core features and technology stack
  - Development workflow and commands
  - Code style guidelines
  - Areas for improvement

## Documentation Workflow

When making changes to the codebase:

1. First examine this index file to understand the documentation structure
2. Navigate to the appropriate subdirectory based on the nature of your changes:
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