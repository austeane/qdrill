## Ticket 008: Accessibility and Keyboard (Focus, Roles, Help Modal)

Branch: `feat/ui-revamp-one-shot`

Objectives
- Ensure keyboard-only usability and baseline WCAG AA

Scope of Work
- Ensure visible focus outlines across interactive elements using tokens
- Tabs/accordions/dialogs use ARIA roles/labels; Bits UI Dialog for focus trap and restoration
- Maintain skip link; expand keyboard navigability
- New: Help modal listing keyboard shortcuts; use ARIA live regions for dynamic updates

Acceptance Criteria
- Keyboard-only navigation works across major flows
- Modals trap focus and restore to invoking trigger; screen readers announce dynamic changes

Notes
- Add Cypress tests for tab order and focus restoration in critical dialogs if time permits


