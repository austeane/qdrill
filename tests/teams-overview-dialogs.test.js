import { test, expect } from '@playwright/test';

// Use slug param; set PLAYWRIGHT_TEAM_SLUG to an existing team slug with admin access
const teamSlug = process.env.PLAYWRIGHT_TEAM_SLUG || process.env.E2E_TEAM_SLUG;
const describeFn = teamSlug ? test.describe : test.describe.skip;

describeFn('Teams — Overview desktop dialogs', () => {
	test('open and interact with Add Section and Add Event dialogs', async ({
		page,
		browserName
	}) => {
		await page.goto(`/teams/${teamSlug}/season`);

		if (page.url().includes('/login')) {
			test.skip(true, 'Authentication required to test Overview dialogs');
		}

		// Overview header
		await expect(page.getByText('Season Overview')).toBeVisible();

		// Add Section
		const addSection = page.getByRole('button', { name: /Add Section/i });
		await addSection.click();
		await expect(page.getByRole('dialog')).toBeVisible();
		// Try minimal interaction; close dialog to avoid data mutation in generic env
		await page
			.getByRole('button', { name: /Cancel|Close/i })
			.first()
			.click()
			.catch(() => {});

		// Add Event
		const addEvent = page.getByRole('button', { name: /Add Event/i });
		await addEvent.click();
		await expect(page.getByRole('dialog')).toBeVisible();
		await page
			.getByRole('button', { name: /Cancel|Close/i })
			.first()
			.click()
			.catch(() => {});
	});
});
