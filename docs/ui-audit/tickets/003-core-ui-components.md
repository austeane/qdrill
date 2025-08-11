## Ticket 003: Core UI Components (Buttons, Inputs, Tabs, Dialog, Card, Skeleton, Toast)

Branch: `feat/ui-revamp-one-shot`

Objectives
- Standardize UI primitives for consistent look and behavior
- Provide accessible components with clear loading/disabled states

Scope of Work
- New: `src/lib/components/ui/Button.svelte` (variants: primary, secondary, ghost, destructive; size: sm/md/lg; loading)
- New: `src/lib/components/ui/Input.svelte` (label, description, error slot)
- New: `src/lib/components/ui/Select.svelte` (Bits UI or native select styled; error state)
- New: `src/lib/components/ui/Tabs.svelte` (Bits UI tabs)
- New: `src/lib/components/ui/Dialog.svelte` (Bits UI dialog with focus trap and restore)
- New: `src/lib/components/ui/Card.svelte` (header, content, footer slots)
- New: `src/lib/components/ui/Skeleton.svelte` (rect/line variants)
- New: `src/lib/components/ui/ToastHost.svelte` + minimal store for toasts
- New: `src/lib/components/ui/icons.ts` exporting lucide icons used commonly

Acceptance Criteria
- Buttons show loading spinners and are aria-disabled when loading
- Inputs/selects surface validation errors consistently
- Tabs and Dialog pass keyboard navigation and focus trapping
- Toast host renders and can be triggered programmatically

Notes
- Keep styling token-driven; avoid hard-coded colors
- Prefer Bits UI primitives where available


