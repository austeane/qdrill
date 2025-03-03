# QDrill Project Guide

## Development Commands
- `vercel dev` - Start development server
- `pnpm run check` - Check TypeScript + SvelteKit sync

## Package Management
- `pnpm install` - Install dependencies
- `pnpm add <package>` - Add a package

## Testing
- `pnpm run test` - Run Playwright tests
- `pnpm test -- tests/test.js` - Run a specific test

## Code Quality
- `pnpm run lint` - Run linting checks
- `pnpm run format` - Fix formatting issues

## Deployment
- Automatic deployment from GitHub main branch to Vercel

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

## Technology Stack
- SvelteKit, Tailwind CSS, Neon (PostgreSQL), Vercel