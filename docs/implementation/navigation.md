# Navigation Accessibility

This document outlines the improved navigation system used in QDrill. The header component provides keyboard-friendly dropdown menus, clear focus indicators, and ARIA attributes for screen reader support.

## Features

- Dropdown menus managed by a single `activeDropdown` variable
- Escape key and click-away handling to close menus
- Arrow key navigation within dropdowns
- Active page highlighting based on the current route
- Mobile menu with accessible buttons and focus management
- "Skip to main content" link for better keyboard navigation

## Related Files

- `src/routes/Header.svelte`
- `src/routes/+layout.svelte`
- `src/routes/styles.css`
