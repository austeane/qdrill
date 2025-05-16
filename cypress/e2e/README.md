# Cypress E2E Testing Notes & Best Practices

This document summarizes key learnings and best practices encountered while writing E2E tests for this project, particularly regarding interactions with Svelte components.

## 1. Use `data-testid` for Element Selection

- **Why:** CSS classes, element structure, and text content can change frequently, making tests brittle. `data-testid` (or `data-cy`, `data-test`) attributes provide stable selectors specifically for testing.
- **How:** Add `data-testid="your-unique-identifier"` to elements you need to interact with (buttons, inputs, links) or assert against (list items, status indicators, specific text containers).
- **Example:**
  ```javascript
  // In component: <button data-testid="submit-button">...</button>
  // In test: cy.get('[data-testid="submit-button"]').click();
  ```

## 2. Target the Element with the Event Handler

- **Problem:** Sometimes, clicking a parent element or label (e.g., `<label data-testid="my-checkbox">...`) might not reliably trigger an `on:click` handler attached to a nested element (e.g., an inner `<div>`) in the automated Cypress context, even if it works manually.
- **Solution:** Ensure your `cy.click()` command targets the _specific_ element that has the event listener attached. You might need to add a `data-testid` to this inner element.
- **Example:**

  ```javascript
  // Instead of clicking the label:
  // cy.get('[data-testid="filter-skill-level-beginner"]').click(); // Might fail

  // Click the inner control element that has the on:click:
  // In component: <div on:click={handler} data-testid="checkbox-control-beginner">...</div>
  // In test: cy.get('[data-testid="checkbox-control-beginner"]').click(); // More reliable
  ```

## 3. Handle Asynchronous Updates and Debouncing

- **Problem:** Actions (like clicks) might trigger state changes that lead to asynchronous operations (e.g., API calls, debounced navigation updates via `goto`). Cypress might try to assert the result (e.g., check `cy.url()`) _before_ the asynchronous operation has finished.
- **Solution:** Use `cy.wait(duration)` after the action to pause the test and allow time for the asynchronous update to complete. The duration should typically be slightly longer than expected delays (e.g., longer than debounce timers).
- **Example:**
  ```javascript
  cy.get('[data-testid="filter-checkbox"]').click();
  // Wait for the debounced function (e.g., 300ms debounce) to update the URL
  cy.wait(400);
  cy.url().should('include', 'filter=active');
  ```

## 4. Stabilize Initial Page Load

- **Problem:** Occasionally, tests might interact with elements immediately after `cy.visit()` before the page or specific components have fully hydrated or finished initial rendering/state updates.
- **Solution:** Adding a short, fixed `cy.wait()` (e.g., `cy.wait(300)`) right after `cy.visit()` or before the first interaction can sometimes prevent flakiness by giving the application a moment to stabilize. Use this sparingly, as explicit waits for elements are preferred, but it can be a pragmatic solution for initial load issues.
- **Example:**
  ```javascript
  beforeEach(() => {
  	cy.visit('/drills');
  	cy.wait(300); // Allow page to settle before tests run
  });
  ```

## 5. Debugging Strategies

- **Console Logs:** Add `console.log` statements in your Svelte component logic (e.g., event handlers, state update functions) to track execution flow. Use `cy.on('window:console', ...)` in your test to pipe these logs to the Cypress Command Log for visibility.
- **`.should('exist')` vs `.should('be.visible')`:** If an element isn't found, first check if it `.should('exist')` in the DOM. If it exists but isn't visible, it points to CSS issues (`display: none`, `visibility: hidden`, zero size, opacity) or timing issues with transitions/animations.
- **`{ force: true }`:** If `.click()` fails despite the element appearing ready, `cy.click({ force: true })` can bypass Cypress's actionability checks. Use this cautiously as it might hide underlying issues, but it can overcome subtle state problems or overlays.
- **Isolate:** Simplify the test case or temporarily comment out parts of the component/related code (like global style imports) to narrow down the source of an error.
