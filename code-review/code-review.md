# Code Review

This document tracks a code review focused on identifying areas for improvement in Svelte/SvelteKit practices, component structure, state management, API design, and overall code quality to align with professional development standards. The goal is to pinpoint patterns or practices that might distinguish the codebase from that of a seasoned Svelte developer. Files are marked with ✅ as they are reviewed, with notes summarizing findings and potential issues put into their own notes files, which are created and grouped as needed, and noted at the bottom of this file.

## Project Structure

```
.
├── CLAUDE.md
├── DRAG_AND_DROP.md
├── README.md
├── code-review.md
├── coverage/
├── cypress/
│   ├── component/
│   │   └── drillitem.cy.js
│   ├── downloads/
│   ├── e2e/
│   │   ├── README.md
│   │   ├── drills_list.cy.js
│   │   ├── formation_detail.cy.js
│   │   ├── formations_list.cy.js
│   │   ├── pagination.cy.js
│   │   ├── sorting.cy.js
│   │   └── visibility.cy.js
│   ├── fixtures/
│   │   └── example.json
│   ├── screenshots/
│   └── support/
│       ├── commands.js
│       ├── component-index.html
│       ├── component.js
│       └── e2e.js
├── cypress.config.js
├── docs/
│   ├── architecture/
│   │   └── index.md
│   ├── implementation/
│   │   ├── drag-and-drop.md
│   │   ├── index.md
│   │   ├── service-layer.md
│   │   └── timeline-management.md
│   └── index.md
├── drill-banks/
│   └── canada3.csv
├── drills-speedup.txt
├── feature-planning-notes/
│   └── a_bunch.md
├── formation-implementation-plan.md
├── har_cleaner.py
├── instance/
│   └── app.db
├── jsconfig.json
├── migrations/
│   ├── 1744523609140_initial-schema.js
│   └── 1744527001396_add-performance-indexes.js
├── notes/
├── package.json
├── performance.md
├── playwright.config.js
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.cjs
├── scripts/
├── setup-auth-table.js
├── singleload_cleaned.har
├── src/
│   ├── app.css
│   ├── app.d.ts
│   ├── app.html
│   ├── components/
│   │   ├── Breadcrumb.svelte
│   │   ├── Cart.svelte
│   │   ├── Comments.svelte
│   │   ├── DeletePracticePlan.svelte
│   │   ├── ExcalidrawWrapper.svelte
│   │   ├── FeedbackButton.svelte
│   │   ├── FeedbackModal.svelte
│   │   ├── FilterPanel.svelte
│   │   ├── LoginButton.svelte
│   │   ├── Spinner.svelte
│   │   ├── ThreeStateCheckbox.svelte
│   │   ├── UpvoteDownvote.svelte
│   │   └── practice-plan/
│   │       ├── items/
│   │       │   ├── DrillItem.svelte ✅
│   │       │   ├── ParallelGroup.svelte ✅
│   │       │   └── TimelineColumn.svelte ✅
│   │       ├── modals/
│   │       │   ├── DrillSearchModal.svelte
│   │   │   │   ├── EmptyCartModal.svelte
│   │   │   │   └── TimelineSelectorModal.svelte
│   │   │   └── sections/
│   │   │   │   ├── SectionContainer.svelte ✅
│   │   │   └── wizard/
│   │   │   │   ├── +layout.svelte ✅
│   │   │   │   ├── +page.server.js ✅
│   │   │   │   ├── +page.svelte ✅
│   │   │   │   ├── basic-info/
│   │   │   │   │   └── +page.svelte ✅
│   │   │   │   ├── drills/
│   │   │   │   │   ├── +page.server.js ✅
│   │   │   │   │   └── +page.svelte ✅
│   │   │   │   ├── overview/
│   │   │   │   │   └── +page.svelte ✅
│   │   │   │   ├── sections/
│   │   │   │   │   └── +page.svelte ✅
│   │   │   │   └── timeline/
│   │   │   │   │   └── +page.svelte ✅
│   │   │   └── privacy-policy/
│   │   │   └── +page.svelte
│   │   ├── profile/
│   │   │   ├── +page.server.js
│   │   │   └── +page.svelte
│   │   └── terms-of-service/
│   │   │   └── +page.svelte
│   │   └── styles.css
│   ├── hooks.server.js
│   ├── lib/
│   │   ├── __mocks__/
│   │   │   ├── environment.js
│   │   │   ├── navigation.js
│   │   │   └── stores.js
│   │   ├── constants/
│   │   │   └── skills.js
│   │   ├── constants.js
│   │   ├── images/
│   │   │   ├── github.svg
│   │   │   ├── svelte-logo.svg
│   │   │   ├── svelte-welcome.png
│   │   │   └── svelte-welcome.webp
│   │   ├── server/
│   │   │   ├── __mocks__/
│   │   │   │   └── db.js
│   │   │   ├── __tests__/
│   │   │   │   └── mocks/
│   │   │   │       ├── authGuard.js
│   │   │   │       └── db.js
│   │   │   ├── auth.js
│   │   │   ├── authGuard.js
│   │   │   ├── db.js
│   │   │   ├── feedback.js
│   │   │   └── services/
│   │   │       ├── __tests__/
│   │   │       │   ├── baseEntityService.test.js
│   │   │       │   ├── drillService.test.js
│   │   │       │   ├── formationService.test.js
│   │   │       │   ├── practicePlanService.test.js
│   │   │       │   ├── skillService.test.js
│   │   │       │   └── userService.test.js
│   │   │       ├── baseEntityService.js ✅
│   │   │       ├── drillService.js ✅
│   │   │       ├── formationService.js ✅
│   │   │       ├── practicePlanService.js ✅
│   │   │       ├── skillService.js ✅
│   │   │       └── userService.js ✅
│   │   ├── stores/
│   │   │   ├── __tests__/
│   │   │   │   └── dragManager.test.js
│   │   │   ├── cartStore.js
│   │   │   ├── dragManager.js ✅
│   │   │   ├── dragStore.js
│   │   │   ├── drillsStore.js ✅
│   │   │   ├── feedbackStore.js
│   │   │   ├── formationsStore.js
│   │   │   ├── historyStore.js
│   │   │   ├── practicePlanStore.js ✅
│   │   │   ├── sectionsStore.js ✅
│   │   │   ├── sortStore.js
│   │   │   ├── wizardStore.js ✅
│   │   │   └── wizardValidation.js ✅
│   │   ├── utils/
│   │   │   ├── diagramMigration.js
│   │   │   └── loggerUtils.js
│   │   └── vitals.js
│   ├── routes/
│   │   ├── +layout.server.js
│   │   ├── +layout.svelte
│   │   ├── +page.js
│   │   ├── +page.svelte
│   │   ├── Counter.svelte
│   │   ├── Header.svelte
│   │   ├── about/
│   │   │   └── +page.svelte
│   │   ├── admin/
│   │   │   ├── +layout.server.js
│   │   │   └── +page.svelte
│   │   ├── api/
│   │   │   ├── __tests__/
│   │   │   │   ├── drill-id.test.js
│   │   │   │   ├── drills.test.js
│   │   │   │   ├── practice-plan-id.test.js
│   │   │   │   └── practice-plans.test.js
│   │   │   ├── auth/
│   │   │   │   ├── [...auth]/
│   │   │   │   │   └── +server.js
│   │   │   │   └── actions/
│   │   │   ├── comments/
│   │   │   │   └── +server.js
│   │   │   ├── drill-assets/
│   │   │   ├── drills/ ✅
│   │   │   │   ├── +server.js ✅
│   │   │   │   ├── [id]/ ✅
│   │   │   │   │   ├── +server.js ✅
│   │   │   │   │   ├── associate/
│   │   │   │   │   │   └── +server.js
│   │   │   │   │   ├── set-variant/
│   │   │   │   │   │   └── +server.js
│   │   │   │   │   ├── upvote/
│   │   │   │   │   │   └── +server.js
│   │   │   │   │   └── variations/
│   │   │   │   │       └── +server.js
│   │   │   │   ├── associate/
│   │   │   │   │   └── +server.js
│   │   │   │   ├── bulk-upload/
│   │   │   │   │   └── +server.js
│   │   │   │   ├── drills_table.txt
│   │   │   │   ├── filter-options/ ✅
│   │   │   │   │   └── +server.js ✅
│   │   │   │   ├── import/
│   │   │   │   │   └── +server.js
│   │   │   │   ├── migrate-diagrams/
│   │   │   │   │   └── +server.js
│   │   │   │   ├── names/
│   │   │   │   │   └── +server.js
│   │   │   │   ├── search/
│   │   │   │   │   └── +server.js
│   │   │   │   └── test-migration/
│   │   │   │       └── +server.js
│   │   │   ├── feedback/
│   │   │   │   ├── +server.js
│   │   │   │   └── [id]/
│   │   │   │       ├── delete/
│   │   │   │       │   └── +server.js
│   │   │   │       └── upvote/
│   │   │   │           └── +server.js
│   │   │   ├── formations/
│   │   │   │   ├── +server.js
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── +server.js
│   │   │   │   │   └── associate/
│   │   │   │   │       └── +server.js
│   │   │   │   └── search/
│   │   │   │       └── +server.js
│   │   │   ├── poll/
│   │   │   │   ├── +server.js
│   │   │   │   └── options/
│   │   │   │       └── +server.js
│   │   │   ├── practice-plans/ ✅
│   │   │   │   ├── +server.js ✅
│   │   │   │   └── [id]/ ✅
│   │   │   │       ├── +server.js ✅
│   │   │   │       ├── associate/ ✅
│   │   │   │       │   └── +server.js ✅
│   │   │   │       └── duplicate/ ✅
│   │   │   │           └── +server.js ✅
│   │   │   ├── skills/
│   │   │   │   └── +server.js
│   │   │   ├── users/
│   │   │   │   └── me/
│   │   │   │       └── +server.js
│   │   │   └── votes/
│   │   │       ├── +server.js
│   │   │       └── user/
│   │   │           └── +server.js
│   │   ├── auth/
│   │   │   ├── [...auth]/
│   │   │   └── error/
│   │   ├── drills/ ✅
│   │   │   ├── +page.server.js ✅
│   │   │   ├── +page.svelte ✅
│   │   │   ├── DrillForm.svelte ✅
│   │   │   ├── [id]/ ✅
│   │   │   │   ├── +page.server.js ✅
│   │   │   │   ├── +page.svelte ✅
│   │   │   │   └── edit/ ✅
│   │   │   │       ├── +page.server.js ✅
│   │   │   │       └── +page.svelte ✅
│   │   │   ├── bulk-upload/
│   │   │   │   ├── +page.server.js
│   │   │   │   └── +page.svelte
│   │   │   └── create/ ✅
│   │   │       ├── +page.server.js ✅
│   │   │       └── +page.svelte ✅
│   │   ├── feedback/
│   │   │   ├── +page.server.js
│   │   │   └── +page.svelte
│   │   ├── formations/
│   │   │   ├── +page.server.js
│   │   │   ├── +page.svelte
│   │   │   ├── FormationForm.svelte
│   │   │   ├── [id]/
│   │   │   │   ├── +page.server.js
│   │   │   │   ├── +page.svelte
│   │   │   │   └── edit/
│   │   │   │       ├── +page.server.js
│   │   │   │       └── +page.svelte
│   │   │   └── create/
│   │   │       └── +page.svelte
│   │   ├── poll/
│   │   │   ├── +page.server.js
│   │   │   └── +page.svelte
│   │   ├── practice-plans/ ✅
│   │   │   ├── +page.server.js ✅
│   │   │   ├── +page.svelte ✅
│   │   │   ├── PracticePlanForm.svelte ✅
│   │   │   ├── [id]/ ✅
│   │   │   │   ├── +page.server.js ✅
│   │   │   │   ├── +page.svelte ✅
│   │   │   │   └── edit/ ✅
│   │   │   │       ├── +page.server.js ✅
│   │   │   │       └── +page.svelte ✅
│   │   │   ├── actions/
│   │   │   ├── components/
│   │   │   ├── create/ ✅
│   │   │   │   ├── +page.server.js ✅
│   │   │   │   └── +page.svelte ✅
│   │   │   ├── stores/
│   │   │   ├── utils/
│   │   │   ├── viewer/
│   │   │   │   ├── DrillCard.svelte
│   │   │   │   ├── ParallelGroup.svelte
│   │   │   │   ├── Section.svelte
│   │   │   │   └── Timeline.svelte
│   │   │   └── wizard/
│   │   │       ├── +layout.svelte ✅
│   │   │       ├── +page.server.js ✅
│   │   │       ├── +page.svelte ✅
│   │   │       ├── basic-info/
│   │   │       │   └── +page.svelte ✅
│   │   │       ├── drills/
│   │   │       │   ├── +page.server.js ✅
│   │   │       │   └── +page.svelte ✅
│   │   │       ├── overview/
│   │   │       │   └── +page.svelte ✅
│   │   │       ├── sections/
│   │   │       │   └── +page.svelte ✅
│   │   │       └── timeline/
│   │   │           └── +page.svelte ✅
│   │   ├── privacy-policy/
│   │   │   └── +page.svelte
│   │   ├── profile/
│   │   │   ├── +page.server.js
│   │   │   └── +page.svelte
│   │   └── terms-of-service/
│   │       └── +page.svelte
│   └── styles.css
├── static/
│   ├── favicon.png
│   ├── images/
│   │   ├── black-and-white-logo.jpeg
│   │   ├── bludger.webp
│   │   ├── cone.webp
│   │   ├── drill.png
│   │   ├── favicon.png
│   │   ├── homepage-hero.jpg
│   │   ├── icons/
│   │   │   ├── b-and-w-player-b1.png
│   │   │   ├── b-and-w-player-b2.png
│   │   │   ├── b-and-w-player-c1.png
│   │   │   ├── b-and-w-player-c2.png
│   │   │   ├── b-and-w-player-c3.png
│   │   │   ├── b-and-w-player-k.png
│   │   │   ├── b-and-w-player-s.png
│   │   │   ├── bludger.png
│   │   │   ├── blue-player-b1.png
│   │   │   ├── blue-player-b2.png
│   │   │   ├── blue-player-c1.png
│   │   │   ├── blue-player-c2.png
│   │   │   ├── blue-player-c3.png
│   │   │   ├── blue-player-k.png
│   │   │   ├── blue-player-s.png
│   │   │   ├── canada-player-b1.png
│   │   │   ├── canada-player-b2.png
│   │   │   ├── canada-player-c1.png
│   │   │   ├── canada-player-c2.png
│   │   │   ├── canada-player-c3.png
│   │   │   ├── canada-player-k.png
│   │   │   ├── canada-player-s.png
│   │   │   ├── flag.png
│   │   │   ├── hoops.png
│   │   │   ├── quaffle.png
│   │   │   ├── red-black-player-b1.png
│   │   │   ├── red-black-player-b2.png
│   │   │   ├── red-black-player-c1.png
│   │   │   ├── red-black-player-c2.png
│   │   │   ├── red-black-player-c3.png
│   │   │   ├── red-black-player-k.png
│   │   │   ├── red-black-player-s.png
│   │   │   ├── red-player-b1.png
│   │   │   ├── red-player-b2.png
│   │   │   ├── red-player-c1.png
│   │   │   ├── red-player-c2.png
│   │   │   ├── red-player-c3.png
│   │   │   ├── red-player-k.png
│   │   │   ├── red-player-s.png
│   │   │   ├── ubc-player-b1.png
│   │   │   ├── ubc-player-b2.png
│   │   │   ├── ubc-player-c1.png
│   │   │   ├── ubc-player-c2.png
│   │   │   ├── ubc-player-c3.png
│   │   │   ├── ubc-player-k.png
│   │   │   ├── ubc-player-s.png
│   │   │   ├── y-and-b-player-b1.png
│   │   │   ├── y-and-b-player-b2.png
│   │   │   ├── y-and-b-player-c1.png
│   │   │   ├── y-and-b-player-c2.png
│   │   │   ├── y-and-b-player-c3.png
│   │   │   ├── y-and-b-player-k.png
│   │   │   ├── y-and-b-player-s.png
│   │   │   ├── yellow-arrow-player-b1.png
│   │   │   ├── yellow-arrow-player-b2.png
│   │   │   ├── yellow-arrow-player-c1.png
│   │   │   ├── yellow-arrow-player-c2.png
│   │   │   ├── yellow-arrow-player-c3.png
│   │   │   ├── yellow-arrow-player-k.png
│   │   │   └── yellow-arrow-player-s.png
│   │   ├── qdrill-logo-b-and-w.png
│   │   ├── qdrill-logo-colour.png
│   │   ├── qdrill-pill.png
│   │   └── quaffle.webp
│   └── robots.txt
├── svelte.config.js
├── table-info.txt
├── tailwind.config.js
├── tests/
│   ├── __pycache__/
│   │   └── test_api.cpython-312-pytest-8.3.3.pyc
│   ├── test.js
│   └── test_api.py
├── tsconfig.json
├── vercel.json
├── vite.config.js
└── vitest.config.js
```

Note files:
├── code-review.md
├── diagram-notes.md
├── drill-notes.md
├── modal-notes.md
├── practice-plan-notes.md
├── practice-plan-wizard-notes.md
├── service-notes.md
├── shared-components-notes.md

