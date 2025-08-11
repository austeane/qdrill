## Ticket 007: Practice Plan Wizard UX (Stepper, Sticky Footer, Validation, Autosave)

Branch: `feat/ui-revamp-one-shot`

Objectives
- Clarify progress and make actions obvious; improve validation and save behavior

Scope of Work
- Edit: `src/routes/practice-plans/wizard/+layout.svelte` and step pages
- Add stepper across top with progress and validation states
- Sticky footer with Back/Next/Save Draft; keyboard shortcuts for step navigation
- Integrate `sveltekit-superforms` + `zod`; inline errors + error summary on submit
- Autosave drafts with toast confirmation

Acceptance Criteria
- Stepper shows current/complete/error states; cannot proceed on invalid data
- Autosave fires on changes; last saved time indicated; errors announced for screen readers

Notes
- Keep autosave resilient; debounce and handle network errors with toasts


