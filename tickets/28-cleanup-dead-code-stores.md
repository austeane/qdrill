# Ticket 28: Remove Unused Stores/Store Parts

**Priority:** Low

**Description:** The codebase contains Svelte stores or parts of stores that are either entirely unused or have unused sections, indicating dead code or incomplete features. Removing them simplifies state management and improves clarity.

**Affected Files:**

- [`src/lib/stores/dragStore.js`](src/lib/stores/dragStore.js) (Appears completely unused)
- [`src/lib/stores/feedbackStore.js`](src/lib/stores/feedbackStore.js) (The `feedbackList` writable seems unused)
- Potentially others (e.g., `selectedItems` in [`sectionsStore.js`](src/lib/stores/sectionsStore.js) requires verification).

**Related Notes:**

- [`code-review/library-notes.md`](code-review/library-notes.md)
- [`code-review/practice-plan-notes.md`](code-review/practice-plan-notes.md) (`sectionsStore` note)
- [`code-review/holistic-summary.md`](code-review/holistic-summary.md)

**Action Required:**

1.  Verify that [`src/lib/stores/dragStore.js`](src/lib/stores/dragStore.js) has no imports or references throughout the codebase.
2.  If unused, delete the `dragStore.js` file.
3.  Verify that `$feedbackList` from [`src/lib/stores/feedbackStore.js`](src/lib/stores/feedbackStore.js) is not used. If confirmed, remove the `feedbackList` writable from the store.
4.  Investigate the usage of `$selectedItems` in [`src/lib/stores/sectionsStore.js`](src/lib/stores/sectionsStore.js). If it's unused, remove it.
5.  Conduct a broader search for other potentially unused store variables or entire store files.
