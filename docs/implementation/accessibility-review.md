# Accessibility Review

This document summarizes the initial accessibility (A11y) audit of the QDrill frontend.

## Methodology

- Manual keyboard navigation checks
- Automated scans using Axe DevTools
- Inspection of semantic markup and ARIA usage

## Findings

- Modal components lacked `role="dialog"` and `aria-modal` attributes.
- Custom checkbox control was not keyboard accessible and lacked ARIA roles.
- Focus was not directed to modals when opened.

## Improvements Implemented

- Added proper dialog roles, `aria-modal` and focus management to major modals.
- Updated `ThreeStateCheckbox` with `role="checkbox"`, keyboard handlers and `aria-checked` state.
- Escape key now closes modals consistently.

Further audits should include color contrast testing and screen‑reader verification across all pages.
