import { test, expect } from '@playwright/test';

test.describe('UI Redesign - Component Library', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/ui-demo');
		// Wait for page to be fully loaded and hydrated
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500); // Additional wait for Svelte hydration
	});

	test('should display all UI components', async ({ page }) => {
		// Check main heading
		await expect(page.locator('h1')).toContainText('UI Component Library Demo');

		// Check button variants
		await expect(page.getByRole('button', { name: 'Primary Button' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Secondary Button' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Ghost Button' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Destructive Button' })).toBeVisible();

		// Check button sizes
		await expect(page.getByRole('button', { name: 'Small' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Medium' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Large' })).toBeVisible();

		// Check form inputs
		await expect(page.locator('input[placeholder="Enter text..."]')).toBeVisible();
		await expect(page.locator('input[placeholder="email@example.com"]')).toBeVisible();
		await expect(page.locator('select')).toBeVisible();
		await expect(page.locator('textarea[placeholder="Enter multiple lines..."]')).toBeVisible();

		// Check cards
		await expect(page.locator('h3:has-text("Default Card")')).toBeVisible();
		await expect(page.locator('h3:has-text("Bordered Card")')).toBeVisible();
		await expect(page.locator('h3:has-text("Elevated Card")')).toBeVisible();

		// Check badges
		await expect(page.locator('text=Default').first()).toBeVisible();
		await expect(page.locator('text=Success')).toBeVisible();
		await expect(page.locator('text=Warning')).toBeVisible();
		await expect(page.locator('text=Error')).toBeVisible();

		// Check tabs
		await expect(page.getByRole('tab', { name: 'Tab 1' })).toBeVisible();
		await expect(page.getByRole('tab', { name: 'Tab 2' })).toBeVisible();
		await expect(page.getByRole('tab', { name: 'Tab 3' })).toBeVisible();

		// Check skeleton loaders section
		await expect(page.locator('h2:has-text("Skeleton Loaders")')).toBeVisible();
	});

	test('should handle button interactions', async ({ page }) => {
		// Test loading button
		const loadingButton = page.locator('button').filter({ hasText: /Click for Loading|Loading/ });
		await expect(loadingButton).toBeVisible();

		// Check button is not disabled initially
		await expect(loadingButton).not.toHaveAttribute('aria-disabled', 'true');
		await expect(loadingButton).not.toHaveAttribute('data-loading', 'true');

		// Click the button
		await loadingButton.click();

		// Button should show loading state
		await expect(loadingButton).toHaveAttribute('data-loading', 'true');
		await expect(loadingButton).toHaveAttribute('aria-disabled', 'true');

		// Check that loading spinner appears (it's added when loading=true)
		const spinner = loadingButton.locator('.animate-spin');
		await expect(spinner).toBeVisible();

		// Check button text changed
		await expect(loadingButton).toContainText('Loading');

		// Wait for loading to finish (takes 2 seconds)
		await page.waitForTimeout(2100);

		// Button should be enabled again
		await expect(loadingButton).not.toHaveAttribute('aria-disabled', 'true');
		await expect(loadingButton).not.toHaveAttribute('data-loading', 'true');
		await expect(spinner).not.toBeVisible();
		await expect(loadingButton).toContainText('Click for Loading');
	});

	test('should switch tabs', async ({ page }) => {
		// Initially Tab 1 should be selected (bits-ui uses data-state="active")
		const tab1 = page.getByRole('tab', { name: 'Tab 1' });
		const tab2 = page.getByRole('tab', { name: 'Tab 2' });
		const tab3 = page.getByRole('tab', { name: 'Tab 3' });

		await expect(tab1).toHaveAttribute('data-state', 'active');
		await expect(page.locator('text=Content for Tab 1')).toBeVisible();

		// Switch to Tab 2
		await tab2.click();
		await page.waitForTimeout(100); // Wait for state update
		await expect(tab2).toHaveAttribute('data-state', 'active');
		await expect(tab1).toHaveAttribute('data-state', 'inactive');
		await expect(page.locator('text=Content for Tab 2')).toBeVisible();

		// Switch to Tab 3
		await tab3.click();
		await page.waitForTimeout(100); // Wait for state update
		await expect(tab3).toHaveAttribute('data-state', 'active');
		await expect(tab2).toHaveAttribute('data-state', 'inactive');
		await expect(page.locator('text=Content for Tab 3')).toBeVisible();
	});

	test('should open dialog', async ({ page }) => {
		const dialogButton = page.getByRole('button', { name: 'Open Dialog' });
		await dialogButton.click();

		// Wait for dialog to appear - bits-ui creates the dialog with data-state
		await page.waitForTimeout(300); // Increased delay for animation

		// Check dialog is opened using role selector
		const dialog = page.getByRole('dialog');
		await expect(dialog).toBeVisible();

		// Check dialog content is visible within the dialog
		await expect(dialog.locator('text=Example Dialog')).toBeVisible();
		await expect(dialog.locator('text=This is a dialog description')).toBeVisible();
		await expect(dialog.locator('text=This is the dialog content')).toBeVisible();

		// Close dialog using Cancel button
		const cancelButton = dialog.getByRole('button', { name: 'Cancel' });
		await cancelButton.click();

		// Dialog should be closed
		await page.waitForTimeout(300); // Increased delay for animation
		await expect(dialog).not.toBeVisible();
	});
});

test.describe('UI Redesign - Theme Switching', () => {
	test('should toggle between light and dark themes', async ({ page }) => {
		await page.goto('/');

		// Get initial theme
		const htmlElement = page.locator('html');
		const initialTheme = await htmlElement.getAttribute('data-theme');

		// Click theme toggle button
		const themeToggle = page.getByRole('button', { name: 'Toggle theme' });
		await themeToggle.click();

		// Check theme changed
		const newTheme = await htmlElement.getAttribute('data-theme');
		expect(newTheme).not.toBe(initialTheme);

		// Toggle back
		await themeToggle.click();
		const finalTheme = await htmlElement.getAttribute('data-theme');
		expect(finalTheme).toBe(initialTheme);
	});

	test('should persist theme across page navigation', async ({ page }) => {
		await page.goto('/');

		// Set to dark theme
		const themeToggle = page.getByRole('button', { name: 'Toggle theme' });
		await themeToggle.click();

		const themeAfterToggle = await page.locator('html').getAttribute('data-theme');

		// Navigate to another page
		await page.goto('/drills');

		// Check theme persisted
		const themeOnNewPage = await page.locator('html').getAttribute('data-theme');
		expect(themeOnNewPage).toBe(themeAfterToggle);
	});
});

test.describe('UI Redesign - Responsive Navigation', () => {
	test('should show mobile menu on small screens', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');

		// Hamburger menu should be visible on mobile
		const menuToggle = page.getByRole('button', { name: 'Toggle menu' });
		await expect(menuToggle).toBeVisible();

		// Sidebar should not be open initially on mobile
		const sidebar = page.locator('aside.sidebar');
		const sidebarIsOpen = await sidebar.evaluate((el) => el.classList.contains('open'));
		expect(sidebarIsOpen).toBe(false);

		// Click menu toggle to open
		await menuToggle.click();
		await page.waitForTimeout(100); // Wait for animation

		// Sidebar should now be open
		const sidebarIsOpenAfterClick = await sidebar.evaluate((el) => el.classList.contains('open'));
		expect(sidebarIsOpenAfterClick).toBe(true);

		// Click close button in sidebar
		const closeButton = page.getByRole('button', { name: 'Close sidebar' });
		await closeButton.click();
		await page.waitForTimeout(100); // Wait for animation

		// Sidebar should be closed
		const sidebarIsClosedAfterClose = await sidebar.evaluate((el) => el.classList.contains('open'));
		expect(sidebarIsClosedAfterClose).toBe(false);
	});

	test('should show sidebar on desktop', async ({ page }) => {
		// Set desktop viewport
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto('/');

		// Sidebar should be visible on desktop
		const sidebar = page.locator('aside.sidebar');
		await expect(sidebar).toBeVisible();

		// Hamburger menu should NOT be visible on desktop
		const menuToggle = page.getByRole('button', { name: 'Toggle menu' });
		await expect(menuToggle).not.toBeVisible();

		// Check navigation items in sidebar
		const navItems = sidebar.locator('nav');
		await expect(navItems.getByRole('link', { name: 'Drills' })).toBeVisible();
		await expect(navItems.getByRole('link', { name: 'Practice Plans' })).toBeVisible();
		await expect(navItems.getByRole('link', { name: 'Formations' })).toBeVisible();
		await expect(navItems.getByRole('link', { name: 'Whiteboard' })).toBeVisible();
		await expect(navItems.getByRole('link', { name: 'Teams' })).toBeVisible();
	});

	test('should adapt layout at tablet breakpoint', async ({ page }) => {
		// Set tablet viewport
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.goto('/');

		// Sidebar should be visible at tablet size (768px is the breakpoint)
		const sidebar = page.locator('aside.sidebar');
		await expect(sidebar).toBeVisible();

		// Hamburger menu should NOT be visible at tablet size
		const menuToggle = page.getByRole('button', { name: 'Toggle menu' });
		await expect(menuToggle).not.toBeVisible();
	});
});

test.describe('UI Redesign - Main App Integration', () => {
	test('should display drills page with new UI components', async ({ page }) => {
		await page.goto('/drills');

		// Check page title exists
		await expect(page).toHaveTitle(/Drills.*QDrill/);

		// Check page heading
		await expect(page.locator('h1')).toContainText('Drills');

		// Check action buttons
		await expect(page.getByRole('link', { name: 'Create Drill' })).toBeVisible();

		// Check filter buttons
		await expect(page.getByRole('button', { name: 'Skill Levels' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Complexity' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Reset Filters' })).toBeVisible();

		// Check search input
		await expect(page.locator('input[placeholder="Search drills"]')).toBeVisible();

		// Check drill cards are rendered (look for drill headings)
		const drillHeadings = page.locator('h2 a');
		await expect(drillHeadings.first()).toBeVisible();
	});

	test('should display practice plans page with new UI components', async ({ page }) => {
		await page.goto('/practice-plans');

		// Check page title
		await expect(page.locator('h1')).toContainText('Practice Plans');

		// Check filter buttons
		await expect(page.getByRole('button', { name: 'Phase of Season' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Practice Goals' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Reset Filters' })).toBeVisible();

		// Check search input
		await expect(page.locator('input[placeholder*="practice plans"]')).toBeVisible();

		// Check practice plan cards
		const planCards = page.locator('h2').filter({ hasText: /Practice|Plan/ });
		await expect(planCards.first()).toBeVisible();
	});

	test('should have consistent navigation across pages', async ({ page }) => {
		// Start at home
		await page.goto('/');

		// Navigate to drills using sidebar navigation (to avoid multiple matches)
		const sidebar = page.locator('aside.sidebar nav');
		await sidebar.getByRole('link', { name: 'Drills' }).click();
		await expect(page).toHaveURL('/drills');
		await expect(page.locator('h1')).toContainText('Drills');

		// Navigate to practice plans
		await sidebar.getByRole('link', { name: 'Practice Plans' }).click();
		await expect(page).toHaveURL('/practice-plans');
		await expect(page.locator('h1')).toContainText('Practice Plans');

		// Check logo returns to home
		await page.getByRole('link', { name: 'QDrill' }).first().click();
		await expect(page).toHaveURL('/');
	});

	test('should show command palette on keyboard shortcut', async ({ page }) => {
		await page.goto('/');

		// Wait for page to be ready
		await page.waitForLoadState('networkidle');

		// Press Cmd+K (or Ctrl+K on non-Mac)
		const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
		await page.keyboard.press(`${modifier}+k`);

		// Wait for command palette to appear
		await page.waitForTimeout(100);

		// Command palette should be visible with search input
		const commandPalette = page.locator('.cp__dialog');
		await expect(commandPalette).toBeVisible();

		// Check search input is focused and visible
		const searchInput = commandPalette.locator('input[placeholder*="Search"]');
		await expect(searchInput).toBeVisible();

		// Press Escape to close
		await page.keyboard.press('Escape');
		await page.waitForTimeout(100);
		await expect(commandPalette).not.toBeVisible();
	});
});

test.describe('UI Redesign - Accessibility', () => {
	test('should have proper ARIA labels and roles', async ({ page }) => {
		await page.goto('/');

		// Check navigation has proper role
		await expect(page.locator('nav[role="navigation"]')).toBeVisible();

		// Check banner role on header
		await expect(page.locator('header[role="banner"]')).toBeVisible();

		// Check sidebar exists with proper structure
		await expect(page.locator('aside.sidebar')).toBeVisible();

		// Check skip link
		await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeVisible();

		// Check main content area has proper id for skip link
		await expect(page.locator('#main-content')).toBeVisible();
	});

	test('should support keyboard navigation', async ({ page }) => {
		await page.goto('/ui-demo');

		// Tab through interactive elements
		await page.keyboard.press('Tab');

		// Should focus skip link first
		const skipLink = page.getByRole('link', { name: 'Skip to main content' });
		await expect(skipLink).toBeFocused();

		// Continue tabbing through navigation
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');

		// Should be able to activate buttons with Enter
		const firstButton = page.getByRole('button').first();
		await firstButton.focus();
		await page.keyboard.press('Enter');
	});
});
