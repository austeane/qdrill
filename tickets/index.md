# Code Review Tickets

This index lists the tickets created based on the findings of the code review, re-prioritized based on risk and dependencies.


## P1: High Priority (Foundation & Scalability)
1.  [Ticket 14: Centralize Validation Logic](./14-refactor-validation.md)
2.  [Ticket 06: Implement Server-Side Pagination/Filtering/Sorting for Drills](./06-api-scalability-drills.md)
3.  [Ticket 07: Implement Server-Side Pagination/Filtering/Sorting for Practice Plans](./07-api-scalability-practice-plans.md)

## P2: Architectural Refactors (Maintainability & Coupling)

13. [Ticket 08: Unify Practice Plan State Management (Eliminate Wizard Section Duplication)](./08-refactor-state-unify-sections.md)
14. [Ticket 09: Refactor Bloated `practicePlanStore`](./09-refactor-state-practiceplanstore.md)
15. [Ticket 10: Simplify/Refactor Complex `sectionsStore`](./10-refactor-state-sectionsstore.md)
16. [Ticket 15: Decouple Shared Components from Stores](./15-refactor-component-coupling.md)
17. [Ticket 16: Simplify and Decouple `dragManager`](./16-refactor-dragmanager.md)
18. [Ticket 18: Refactor Complex `PracticePlanForm` Component](./18-refactor-practiceplanform.md)
19. [Ticket 17: Refactor Complex `ExcalidrawWrapper` Component](./17-refactor-excalidrawwrapper.md)
20. [Ticket 19: Refactor Complex `FilterPanel` Component](./19-refactor-filterpanel.md)
21. [Ticket 21: Review/Refactor `PracticePlanService` Update Strategy](./21-refactor-ppservice-update.md)


## P3: Nice-to-Haves / Clean-up

22. [Ticket 22: Refactor UserService Permission Logic & Profile Fetch Performance](./22-refactor-userservice-perms.md)
23. [Ticket 23: Refactor Duplicated SQL Logic (Skill Counts)](./23-refactor-sql-duplication.md)
24. [Ticket 24: Conduct Systematic Accessibility (A11y) Review](./24-accessibility-review.md)
25. [Ticket 25: Enable TypeScript Strictness Checks](./25-ts-strictness.md)
26. [Ticket 26: Investigate/Fix Reactivity Issues (e.g., TimelineSelectorModal)](./26-fix-reactivity-issues.md)
27. [Ticket 27: Remove Unused Components](./27-cleanup-dead-code-components.md)
28. [Ticket 28: Remove Unused Stores/Store Parts](./28-cleanup-dead-code-stores.md)
29. [Ticket 29: Remove Unused Services/Utils](./29-cleanup-dead-code-services.md)
30. [Ticket 30: Remove Unused API Routes and Corresponding Pages](./30-cleanup-dead-code-api.md)
31. [Ticket 31: Improve Adherence to REST Conventions / Remove Redundant Endpoints](./31-api-rest-conventions.md)
32. [Ticket 32: Consolidate Theme Definitions (Tailwind vs CSS Vars)](./32-config-theme-consistency.md)
33. [Ticket 33: Investigate/Remove Vercel Rewrites if Unnecessary](./33-config-vercel-rewrites.md) 