## Ticket 010: Command Palette (CMD+K Quick Switcher)

Branch: `feat/ui-revamp-one-shot`

Objectives
- Provide a power-user quick switcher for navigation

Scope of Work
- New: `src/lib/components/CommandPalette.svelte` using `cmdk-sv`
- Wire to `Topbar.svelte`; open on CMD+K / Ctrl+K
- Static routes initially: Drills, Plans, Formations, Whiteboard, Teams
- Optional: basic search providers for drills/plans by name (client-side)

Acceptance Criteria
- Command palette opens/closes via keyboard; Enter navigates
- Accessible and keyboard-friendly (focus trapping, aria roles)

Notes
- Keep index small; hydrate with real search later


