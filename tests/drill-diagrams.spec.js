import { test, expect } from '@playwright/test';

test.describe('Drill Diagram Functionality', () => {
    test('should add and save a diagram', async ({ page }) => {
        await page.goto('/drills/create');
        await page.fill('input[name="name"]', 'Test Drill with Diagram');
        await page.fill('textarea[name="brief_description"]', 'Test description');
        await page.click('button:has-text("Add Diagram")');
        await page.selectOption('select#template-select', 'fullCourt');
        await page.click('button:has-text("Add"):visible');
        await page.waitForSelector('.excalidraw', { timeout: 10000 });
        await page.click('button:has-text("Create Drill")');
        await expect(page).toHaveURL(/\/drills\/\d+/);
        await expect(page.locator('.excalidraw')).toBeVisible();
    });

    test('should edit diagram in fullscreen', async ({ page }) => {
        await page.goto('/drills/151/edit');
        await page.click('button:has-text("Fullscreen")');
        await expect(page.locator('.modal-overlay')).toBeVisible();
        await page.click('button:has-text("Save & Close")');
        await expect(page.locator('.modal-overlay')).not.toBeVisible();
    });
});
