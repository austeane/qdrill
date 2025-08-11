## Ticket 011: Reduce Heavy Tints and Ensure Drill Anchor Links

Branch: `feat/ui-revamp-one-shot`

Objectives
- Improve readability by replacing large tinted blocks with subtle rails/borders
- Ensure drills can be opened in new tabs and are crawlable

Scope of Work
- Replace `bg-*-50` section blocks in plan viewer and similar long pages
  - Use left-accent rails (border-l-4) or subtle borders with tokens
- Audit all drill renderings (viewer/list/related) to ensure `<a href="/drills/[id]">` exists
- Add `rel` and `title` attributes for better accessibility where appropriate

Acceptance Criteria
- Visual audit shows reduced tinted backgrounds; improved contrast
- Middle-click works on drill items everywhere; links have correct hrefs

Notes
- Keep styles token-driven to match theme


