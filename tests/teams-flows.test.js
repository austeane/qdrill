import { test, expect } from '@playwright/test';

// Usage: set E2E_TEAM_ID to a valid team ID in your local env when running
// Example: E2E_TEAM_ID=123 pnpm playwright test tests/teams-flows.test.js
const teamId = process.env.E2E_TEAM_ID || process.env.PLAYWRIGHT_TEAM_ID;

const describeFn = teamId ? test.describe : test.describe.skip;

describeFn('Teams - Recurrences UI', () => {
  test('recurrences page renders with redesigned UI', async ({ page }) => {
    await page.goto(`/teams/${teamId}/season/recurrences`);

    // If redirected to login, surface a helpful message
    if (page.url().includes('/login')) {
      test.skip(true, 'Authentication required for Teams routes');
    }

    // Heading and primary action should be visible
    await expect(page.locator('h1')).toContainText('Practice Recurrence Patterns');

    // Either show empty state or a table
    const emptyState = page.locator('text=No recurrence patterns configured yet');
    const table = page.locator('table');
    await expect(emptyState.or(table)).toBeVisible();
  });
});

test.describe('Teams - Public List (logged out)', () => {
  test('teams page renders read-only list and sign-in CTA', async ({ page }) => {
    await page.goto('/teams');

    // Should not be redirected away
    await expect(page).toHaveURL(/\/teams/);

    // Heading and sign-in button
    await expect(page.locator('h1')).toContainText(/Teams|My Teams/);
    // When logged out, we expect a Sign in button somewhere
    const signIn = page.getByRole('link', { name: /Sign in/i });
    await expect(signIn).toBeVisible();

    // If a team card exists, the header link should point to login with next param
    const teamHeaderLink = page.locator('h3 a').first();
    if (await teamHeaderLink.count()) {
      const href = await teamHeaderLink.getAttribute('href');
      expect(href).toMatch(/\/login\?next=/);
    }
  });
});

describeFn('Teams - Week View UI', () => {
  test('week page renders header and content state', async ({ page }) => {
    await page.goto(`/teams/${teamId}/season/week`);

    if (page.url().includes('/login')) {
      test.skip(true, 'Authentication required for Teams routes');
    }

    // Header
    await expect(page.locator('h1')).toContainText('Week View');

    // Either season content is shown, or an error/empty message
    const weekGrid = page.locator('[data-testid="week-view"]'); // add data-testid in WeekView if needed
    const noActiveSeason = page.locator('text=No active season');
    const noSeasonData = page.locator('text=No season data available');
    await expect(weekGrid.or(noActiveSeason).or(noSeasonData)).toBeVisible();
  });
});
