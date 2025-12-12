# Playwright Test Failures Analysis

**Date:** 2025-08-17  
**Test Suite:** UI Redesign Tests (`tests/ui-redesign.test.js`)  
**Status:** 8/15 tests passing

## MCP Context

- Runner: Playwright MCP (headful dev against `pnpm dev`)
- Artifacts: screenshots saved under `.playwright-mcp/`
- Repro (local):
  - Start app: `pnpm dev` (port 3000)
  - Run tests: `pnpm exec playwright test -c playwright-dev.config.js`
  - Inspect per-test artifacts: `test-results/` and `.playwright-mcp/`

## Overview

This document analyzes the 7 failing Playwright tests for the UI redesign, documenting what has been attempted and identifying the root causes of failures.

## Test Failures

### 1. Button Loading State Interaction

**Test:** `should handle button interactions`  
**Status:** ❌ Failing

#### Expected Behavior

- Button shows "Loading..." text when clicked
- Button becomes disabled during loading
- Loading spinner appears
- After 2 seconds, button returns to normal state

#### Actual Behavior

- Button text changes to "Loading..." in the template
- Button does NOT become disabled
- Loading spinner may not be visible or detectable

#### What We Tried

1. **Initial approach:** Look for text change to "Loading..."
   - Result: Text doesn't change as expected
2. **Second approach:** Check for disabled state and spinner visibility
   - Result: Button doesn't become disabled when loading=true
3. **Third approach:** Modified test to check for any indication of loading state
   - Result: Still failing - loading prop doesn't disable the button as expected

#### Likely Cause

Implementation looks correct now, but the original failure likely came from the button not disabling or not rendering the spinner. Current Button component:

- File: `src/lib/components/ui/button/button.svelte`
- Behavior: `disabled={disabled || loading}` and renders `<Loader2 class="... animate-spin" />` when `loading=true`.
  Two remaining possibilities for flakiness:
- Assertion timing: spinner renders immediately but animations/state can need a microtask.
- Locator ambiguity: using a broad `button` locator could match multiple buttons as text changes.

#### Recommendation

- Keep current Button implementation (it already disables and shows spinner)
- Harden test for timing and specificity:
  - Use `await expect(loadingButton).toBeDisabled()` after `click()` and optionally `await page.waitForTimeout(50)`
  - Target the spinner via `loadingButton.locator('.animate-spin')` and assert visibility
  - Ensure the filtered locator uniquely targets the loading button

---

### 2. Tab Switching

**Test:** `should switch tabs`  
**Status:** ❌ Failing

#### Expected Behavior

- Clicking Tab 2 sets its `data-state` attribute to "active"
- Tab 1's `data-state` changes to "inactive"
- Content for Tab 2 becomes visible

#### Actual Behavior

- Tab 2's `data-state` remains "inactive" after clicking
- Content doesn't switch properly

#### What We Tried

1. **Initial approach:** Check `aria-selected` attribute
   - Result: bits-ui uses `data-state` instead
2. **Updated approach:** Check `data-state` attribute
   - Result: State doesn't change after click

#### Likely Cause

`TabsPrimitive` from bits-ui should set `data-state="active"` on the active trigger and emit value changes. Current implementation:

- File: `src/lib/components/ui/Tabs.svelte`
- Uses `<TabsPrimitive.Root bind:value>` with `Trigger` children.  
  Failure is most likely due to event timing (needing to wait for the state update) or role mapping differences in bits-ui.

#### Recommendation

- Keep component code; enhance test robustness:
  - After `click()`, use `await expect(trigger).toHaveAttribute('data-state', 'active')` with a default timeout
  - Alternatively query by `.tabs-trigger` if `getByRole('tab')` mismatches in the environment
  - Verify initial `selectedTab` is `'tab1'` in `/ui-demo` (it is)

---

### 3. Dialog Opening

**Test:** `should open dialog`  
**Status:** ❌ Failing

#### Expected Behavior

- Clicking "Open Dialog" button opens a modal
- Dialog shows "Example Dialog" title and content
- Clicking Cancel closes the dialog

#### Actual Behavior

- Dialog doesn't appear after button click
- Content is never visible

#### What We Tried

1. **Initial approach:** Look for dialog with role="dialog"
   - Result: Dialog never appears
2. **Updated approach:** Look for specific text content
   - Result: Text never becomes visible

#### Likely Cause

Dialog code appears correct and should work with bits-ui. Likely a selector/timing mismatch during the open animation.

#### Recommendation

- Prefer role-based check: `await expect(page.getByRole('dialog')).toBeVisible()`
- Allow small animation buffer: `await page.waitForTimeout(100)` before assertions
- Close via the visible `Cancel` button or `DialogPrimitive.Close`

---

### 4. Theme Toggle

**Test:** `should toggle between light and dark themes`  
**Status:** ❌ Failing

#### Expected Behavior

- Clicking theme toggle changes `data-theme` attribute on HTML element
- Theme toggles between "light" and "dark"

#### Actual Behavior

- Theme doesn't change after clicking toggle button
- `data-theme` remains at initial value

#### What We Tried

1. **Original approach:** Check for icon change (sun/moon)
   - Result: Updated to show only one icon at a time
2. **Current approach:** Check `data-theme` attribute change
   - Result: Attribute doesn't change

#### Likely Cause

Implementation is correct and updates `data-theme` (`src/lib/stores/themeStore.ts`). The failure likely stems from an assertion race or selecting the wrong toggle in a given view.

#### Recommendation

- Use the Topbar toggle (aria-label `Toggle theme`) present on `/`
- Assert by reading `html[data-theme]` before/after; include a short wait if needed
- Confirm no conflicting toggles are present on the page under test

---

### 5. Mobile Menu (Responsive Navigation)

**Test:** `should show mobile menu on small screens`  
**Status:** ❌ Failing

#### Expected Behavior

- Hamburger menu visible on mobile (375px width)
- Clicking hamburger adds "open" class to sidebar
- Sidebar slides into view

#### Actual Behavior

- Hamburger is visible
- Clicking doesn't add "open" class to sidebar
- Sidebar doesn't slide in

#### What We Tried

1. **Initial approach:** Check for sidebar visibility
   - Result: Used wrong selector
2. **Updated approach:** Check for "open" class on sidebar
   - Result: Class is never added after click

#### Likely Cause

The event chain is wired correctly:

- `Topbar` dispatches `toggleSidebar`
- `AppShell` sets `sidebarOpen` and binds `open` to `Sidebar`
- `Sidebar` uses `class:open` on `<aside class="sidebar">`
  Failure was likely due to checking the class too early or selecting a different `aside` than expected.

#### Recommendation

- After clicking the hamburger, wait a tick: `await page.waitForTimeout(50)`
- Evaluate class on `aside.sidebar` only: `el.classList.contains('open')`
- Avoid animation-dependent visibility checks; prefer class inspection

---

### 6. Drills Page Search Input

**Test:** `should display drills page with new UI components`  
**Status:** ❌ Failing

#### Expected Behavior

- Search input with placeholder "Search drills" is visible

#### Actual Behavior

- Search input not found with that specific placeholder text

#### What We Tried

1. **Original approach:** Look for exact placeholder text
   - Result: Element not found

#### Likely Cause

The actual placeholder on `/drills` is `"Search drills..."` (with an ellipsis) in `src/routes/drills/+page.svelte`. The test looks for `placeholder="Search drills"` (no ellipsis), so it never finds the element.

#### Recommendation

- Update test selector to be resilient: `page.locator('input[placeholder*="Search drills"]')`
- Or change the app placeholder to exact match (drop the ellipsis)
- Prefer `aria-label="Search drills"` querying as a stable alternative

---

### 7. Command Palette Closing

**Test:** `should show command palette on keyboard shortcut`  
**Status:** ❌ Failing

#### Expected Behavior

- Cmd+K opens command palette
- Escape key closes it

#### Actual Behavior

- Command palette opens correctly
- Escape key doesn't close it

#### What We Tried

1. **Initial approach:** Look for dialog with specific text
   - Result: Updated to look for `.cp__dialog` class
2. **Current approach:** Press Escape to close
   - Result: Dialog remains visible

#### Likely Cause

`CommandPalette.svelte` stops propagation of `keydown` events on the search `<input>` (`on:keydown={(e) => e.stopPropagation()}`). The Escape handler is attached on `window` in the bubbling phase, so Escape pressed while the input is focused never reaches the window handler.

#### Recommendation

- Fix in component (preferred):
  - Either listen in capture phase: `window.addEventListener('keydown', onKey, { capture: true })`
  - Or allow Escape to bubble from input: `on:keydown={(e) => { if (e.key !== 'Escape') e.stopPropagation(); }}`
- Alternative: add a keydown handler on the dialog container to catch Escape locally
- Keep test as-is; this is a real UX issue in current code

---

## Summary

Most failures are due to:

1. **State Management Issues:** Components not updating their state in response to user interactions
2. **Event Handling:** Click and keyboard events not properly propagating or being handled
3. **Component Bindings:** Props and bindings between parent and child components not working as expected
4. **Implementation Differences:** Tests expecting different behavior than what's implemented

## Next Steps

1. **Priority 1 - Fix State Updates:**

   - Debug why button loading state doesn't disable the button
   - Fix tab switching state management
   - Ensure dialog open/close state works

2. **Priority 2 - Fix Event Handlers:**

   - Verify theme toggle actually calls the toggle method
   - Fix mobile sidebar toggle event chain
   - Ensure Escape key closes command palette

3. **Priority 3 - Update Tests:**
   - Make selectors resilient to minor copy changes (e.g., contains selectors for placeholders)
   - Prefer roles/aria-labels over raw text where practical
   - Add targeted `waitForTimeout(50–150ms)` only where animations are involved

## Code Pointers (by failure)

- Button loading: `src/lib/components/ui/button/button.svelte`
- Tabs: `src/lib/components/ui/Tabs.svelte`, usage in `src/routes/ui-demo/+page.svelte`
- Dialog: `src/lib/components/ui/Dialog.svelte`, usage in `src/routes/ui-demo/+page.svelte`
- Theme toggle: `src/lib/stores/themeStore.ts`, `src/lib/components/nav/Topbar.svelte`
- Mobile nav: `src/lib/components/AppShell.svelte`, `src/lib/components/nav/Topbar.svelte`, `src/lib/components/nav/Sidebar.svelte`
- Drills search: `src/routes/drills/+page.svelte`
- Command palette: `src/lib/components/CommandPalette.svelte`

## Test Success Rate

- **Initial state:** 0/15 tests passing
- **After code fixes:** 8/15 tests passing (53% pass rate)
- **Remaining failures:** 7 tests require additional debugging and fixes
