# Cursor Rules for QDrill Project

This directory contains project-specific rules for AI assistants working on the QDrill codebase.

## Rules Files

- `development.mdc` - Core development commands and workflows

## Key Points to Remember

1. **ALWAYS use `vercel dev`** for development server (NOT pnpm run dev)
2. Use `pnpm` for package management (NOT npm)
3. Use `vercel build` for production builds
4. Use `psql "$NEON_DB_URL"` for database queries

These rules help ensure consistent development practices across all AI assistant sessions. 