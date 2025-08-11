### Phase 8: AI augment/replace integrated with season context

Scope
- Extend AI generator to take `season_id` and `scheduled_date`.
- Default mode augments union-generated drafts; optional "replace" mode.
- Context: season template, overlapping sections (notes, default sections, linked drills), team metadata, available drills/formations.

Server/services
- Extend existing AI route to compute season context
  - `src/routes/api/practice-plans/generate-ai/+server.js` (update)
- Add helper in `seasonUnionService` to assemble AI context payload

UI (Svelte)
- In draft plan editor, add "Generate with season context" button with mode toggle (augment/replace)
- File likely: `src/lib/components/practice-plan/AiPlanGenerator.svelte` and `AiPlanGeneratorModal.svelte`

Tests
- Integration: AI request includes correct season context, augmentation preserves union base unless replace chosen

