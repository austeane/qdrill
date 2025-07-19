# Ticket 28: Remove Unused Stores/Store Parts

**Priority:** Low

**Description:** Earlier reviews flagged a few stores as unused. The old `dragStore.js` file has already been removed and `feedbackStore.js` now only contains a `feedbackModalVisible` writable. The `selectedItems` store mentioned in older notes no longer exists in `sectionsStore.js`. We should ensure there are no lingering references and continue checking for other dead store code.

**Affected Files:**

- [`src/lib/stores/feedbackStore.js`](src/lib/stores/feedbackStore.js) – contains only `feedbackModalVisible`.
- Potentially others in [`src/lib/stores`](src/lib/stores/) if unused exports remain.

**Related Notes:**

- [`code-review/library-notes.md`](code-review/library-notes.md)
- [`code-review/practice-plan-notes.md`](code-review/practice-plan-notes.md) (`sectionsStore` note)
- [`code-review/holistic-summary.md`](code-review/holistic-summary.md)

**Action Required:**

1.  Search the repo for any remaining references to the deleted `dragStore` or the removed `feedbackList` variable and clean them up.
2.  Audit [`src/lib/stores`](src/lib/stores/) for any stores or exports that are never imported elsewhere.
3.  Remove any confirmed unused store files or variables.
